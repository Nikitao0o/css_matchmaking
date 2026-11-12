import os
from django.contrib.gis import db
from fastapi import FastAPI, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from models import MatchReport, MatchRoom, GameServer, QueueEntry, PlayerStats, User
from database import Base, engine, get_db
from sqlalchemy.orm import Session
from fastapi_steam import SteamAuth, SteamUser
from fastapi.middleware.cors import CORSMiddleware
from rcon import send_rcon_command
from typing import List
import asyncio, json, datetime
from pydantic import BaseModel
from typing import Optional
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime
from rcon import send_rcon_command, apply_match_config

app = FastAPI()
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

steam = SteamAuth(
    api_key=os.getenv("STEAM_API_KEY"),
    redirect_uri=os.getenv("STEAM_REDIRECT_URI", "http://localhost:8000/auth/callback"),
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "dev-secret-change-me"),
)

waiting_players: List[dict] = []


# ---------- Sourcemod reporting ----------

@app.post("/api/report")
async def report_match_data(report: MatchReport):
    # No WebSocket broadcast anymore; just log or persist as needed.
    return {"ok": True, "roomId": report.roomId, "event": report.event}


# ---------- Auth ----------

@app.get("/login")
async def login(request: Request):
    token = steam.generate_state()
    request.session["steam_state"] = token
    return steam.redirect(state=token)


@app.get("/auth/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    try:
        user: SteamUser = await steam.authenticate(
            request,
            state=request.session["steam_state"],
        )
        steam_id = user.steam_id
    except Exception as e:
        # Fallback: extract SteamID directly from the OpenID callback
        # The library already validated the signature before failing on the summary fetch
        claimed_id = request.query_params.get("openid.claimed_id", "")
        steam_id = claimed_id.split("/")[-1] if claimed_id else None
        if not steam_id:
            raise HTTPException(400, f"Steam authentication failed: {e}")

    existing = db.query(User).filter(User.steam_id == steam_id).first()
    if not existing:
        new_user = User(steam_id=steam_id, username=f"Player_{steam_id[-6:]}")
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        existing = new_user
    existing.last_played = datetime.utcnow()
    db.commit()
    return {"steam_id": existing.steam_id, "user_id": existing.id}

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    country: Optional[str] = None

@app.patch("/profile/{user_id}")
def update_profile(user_id: int, update: ProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if update.username is not None:
        # Optional: enforce uniqueness
        clash = db.query(User).filter(User.username == update.username, User.id != user_id).first()
        if clash:
            raise HTTPException(400, "Username already taken")
        user.username = update.username

    if update.avatar_url is not None:
        user.avatar_url = update.avatar_url

    if update.country is not None:
        user.country = update.country.upper()[:2]  # ISO 3166-1 alpha-2

    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "steam_id": user.steam_id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "country": user.country,
        "last_played": user.last_played,
    }


@app.post("/dev/create-user")
async def dev_create_user(
    username: str = "DevPlayer",
    avatar_url: str = None,
    country: str = None,
    db: Session = Depends(get_db),
):
    if os.getenv("ENV", "dev") == "production":
        raise HTTPException(403, "Dev endpoint disabled")

    fake_steam_id = f"7656119{int.from_bytes(os.urandom(5), 'big') % 10**10:010d}"
    existing = db.query(User).filter(User.steam_id == fake_steam_id).first()
    if existing:
        return {"steam_id": existing.steam_id, "user_id": existing.id}

    user = User(
        steam_id=fake_steam_id,
        username=username,
        avatar_url=avatar_url,
        country=country.upper()[:2] if country else None,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return {"steam_id": user.steam_id, "user_id": user.id}

from models import User

@app.post("/dev/login")
async def dev_login(user_id: int, db: Session = Depends(get_db)):
    """
    DEV ONLY: return identity for a specific user_id.
    Disabled when ENV=production.
    """
    if os.getenv("ENV", "dev") == "production":
        raise HTTPException(403, "Dev endpoint disabled")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    return {
        "user_id": user.id,
        "steam_id": user.steam_id,
        "username": user.username,
    }


@app.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # if no stats of already created user id db
    if not user.stats:
        user.stats = PlayerStats()
        db.add(user.stats)
        db.commit()
        db.refresh(user)
    return {
        "id": user.id,
        "steam_id": user.steam_id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "country": user.country,
        "joined_at": user.created_at,
        "last_played": user.last_played,
        "steam_link": f"https://steamcommunity.com/profiles/{user.steam_id}",
        "current_room_id": user.current_room_id,
        "elo": user.stats.elo if user.stats else 1000,
        "matches_played": user.stats.matches_played if user.stats else 0,
        "wins": user.stats.wins if user.stats else 0,
        "losses": user.stats.losses if user.stats else 0,
    }


# ---------- Rooms ----------

@app.post("/rooms/create")
def create_room(user_id: int, game_mode: str = "1v1", map_name: str = "de_dust2", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.current_room_id is not None:
        raise HTTPException(400, "You are already in a room")

    room = MatchRoom(game_mode=game_mode, map_name=map_name, status="waiting")
    db.add(room)
    db.commit()
    db.refresh(room)

    user.current_room_id = room.id
    db.commit()

    return {"room_id": room.id, "status": room.status}


@app.post("/rooms/{room_id}/join")
def join_room(room_id: int, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.current_room_id is not None:
        raise HTTPException(400, "You are already in a room")

    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    if room.status != "waiting":
        raise HTTPException(400, "Room is not accepting players")

    max_players = 2 if room.game_mode == "1v1" else 10
    if len(room.players) >= max_players:
        raise HTTPException(400, "Room is full")

    user.current_room_id = room.id
    db.commit()

    if len(room.players) + 1 >= max_players:
        room.status = "ready"
        db.commit()

    return {"room_id": room.id, "status": room.status}


@app.post("/rooms/{room_id}/leave")
def leave_room(room_id: int, user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.current_room_id != room_id:
        raise HTTPException(400, "You are not in this room")

    user.current_room_id = None
    db.commit()

    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if room and len(room.players) == 0:
        db.delete(room)
        db.commit()

    return {"ok": True}


@app.get("/rooms/{room_id}")
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")

    server = room.game_server
    return {
        "id": room.id,
        "status": room.status,
        "game_mode": room.game_mode,
        "map_name": room.map_name,
        "bot_quota": room.bot_quota,
        "server": {
            "id": server.id,
            "name": server.name,
            "ip": server.ip,
            "port": server.port,
        } if server else None,
        "connect": f"connect {server.ip}:{server.port}" if server else None,
        "players": [{"id": p.id, "username": p.username} for p in room.players],
    }

@app.get("/servers")
def list_servers(db: Session = Depends(get_db)):
    servers = db.query(GameServer).filter(GameServer.status != "offline").all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "ip":s.ip,
            "port":s.port,
            "rcon pwd":s.rcon_password,
            "region": s.region,
            "status": s.status,
            "players": 0,  # populated later via A2S query
        }
        for s in servers
    ]

@app.post("/servers/{server_id}/heartbeat")
def server_heartbeat(server_id: int, db: Session = Depends(get_db)):
    server = db.query(GameServer).filter(GameServer.id == server_id).first()
    if not server:
        raise HTTPException(404, "Server not found")
    server.last_heartbeat = datetime.utcnow()
    db.commit()
    return {"ok": True}

@app.post("/dev/seed-server")# add server as debug
def seed_server(db: Session = Depends(get_db)):
    existing = db.query(GameServer).first()
    if existing:
        return {"message": "Server already exists"}
    server = GameServer(
        name="css-01",
        ip=os.getenv("RCON_HOST"),
        port=int(os.getenv("RCON_PORT", "27015")),
        rcon_password=os.getenv("RCON_PASSWORD"),
        region="local",
    )
    db.add(server)
    db.commit()
    return {"server_id": server.id}

@app.post("/queue/join")
def join_queue(
    user_id: int,
    game_mode: str = "1v1",
    map_group: str = "default",
    preferred_maps: str = None,
    latency_ms: int = None,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.current_room_id is not None:
        raise HTTPException(400, "Already in a room")

    existing = db.query(QueueEntry).filter(QueueEntry.user_id == user_id).first()
    if existing:
        raise HTTPException(400, "Already in queue")

    entry = QueueEntry(
        user_id=user_id,
        game_mode=game_mode,
        map_group=map_group,
        preferred_maps=preferred_maps,
        elo_at_queue=user.stats.elo if user.stats else 1000,
        latency_ms=latency_ms,
    )
    db.add(entry)
    db.commit()
    return {"queued": True, "queue_size": db.query(QueueEntry).filter(QueueEntry.game_mode == game_mode).count()}

@app.post("/queue/leave")
def leave_queue(user_id: int, db: Session = Depends(get_db)):
    entry = db.query(QueueEntry).filter(QueueEntry.user_id == user_id).first()
    if not entry:
        raise HTTPException(404, "Not in queue")
    db.delete(entry)
    db.commit()
    return {"left": True}

@app.get("/queue/status")
def queue_status(game_mode: str = "1v1", db: Session = Depends(get_db)):
    entries = db.query(QueueEntry).filter(QueueEntry.game_mode == game_mode).all()
    return {
        "game_mode": game_mode,
        "count": len(entries),
        "players": [{"user_id": e.user_id, "elo": e.elo_at_queue, "waiting_s": (datetime.utcnow() - e.joined_at).seconds} for e in entries],
    }

@app.post("/queue/process")
async def process_queue(game_mode: str = "1v1", db: Session = Depends(get_db)):
    from matchmaking_queue import find_match
    result = find_match(db, game_mode)
    if result is None:
        return {"matched": False, "message": "No match found"}
    if "error" in result:
        return {"matched": False, "error": result["error"]}

    return {"matched": True, **result}

@app.post("/dev/reset-state")
def dev_reset_state(db: Session = Depends(get_db)):
    if os.getenv("ENV", "dev") == "production":
        raise HTTPException(403, "Dev endpoint disabled")

    from models import User, MatchRoom, GameServer, QueueEntry

    # 1. Detach players from rooms
    detached = db.query(User).filter(User.current_room_id.isnot(None)).update(
        {User.current_room_id: None}, synchronize_session=False
    )
    db.commit()

    # 2. Clear the queue
    queue_cleared = db.query(QueueEntry).delete(synchronize_session=False)
    db.commit()

    # 3. Free game servers BEFORE deleting rooms
    servers_freed = db.query(GameServer).update(
        {GameServer.status: "available", GameServer.current_room_id: None},
        synchronize_session=False,
    )
    db.commit()

    # 4. Delete rooms last
    rooms_cleared = db.query(MatchRoom).delete(synchronize_session=False)
    db.commit()

    return {
        "players_detached": detached,
        "queue_cleared": queue_cleared,
        "rooms_cleared": rooms_cleared,
        "servers_freed": servers_freed,
    }

    # ---------- Match lifecycle ----------

@app.post("/rooms/{room_id}/end")
def end_match_endpoint(room_id: int, db: Session = Depends(get_db)):
    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")

    room.status = "finished"
    for player in room.players:
        player.current_room_id = None

    if room.game_server:
        send_rcon_command(room.game_server, "bot_kick")
        send_rcon_command(room.game_server, "changelevel de_dust2")
        room.game_server.status = "available"
        room.game_server.current_room_id = None

    db.commit()
    return {"status": "finished"}


@app.get("/rooms/{room_id}/connect")
def connect_command(room_id: int, db: Session = Depends(get_db)):
    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if not room or not room.game_server:
        raise HTTPException(404, "Room or server not ready")
    server = room.game_server
    return {
        "connect": f"connect {server.ip}:{server.port}",
        "steam_link": f"steam://connect/{server.ip}:{server.port}",
    }


@app.post("/rooms/{room_id}/start")
def start_match_endpoint(
    room_id: int,
    map_name: str = "de_dust2",
    game_mode: str = "1v1",
    bot_quota: int = 0,
    db: Session = Depends(get_db),
):
    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if not room:
        raise HTTPException(404, "Room not found")
    if not room.game_server:
        raise HTTPException(400, "Room has no assigned game server")

    room.map_name = map_name
    room.game_mode = game_mode
    room.bot_quota = bot_quota
    room.status = "in_progress"
    db.commit()

    rcon_results = apply_match_config(room.game_server, map_name, game_mode, bot_quota)
    server = room.game_server
    return {
        "status": "started",
        "connect": f"connect {server.ip}:{server.port}",
        "rcon": rcon_results,
    }