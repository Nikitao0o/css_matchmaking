import os
from fastapi import FastAPI, Depends, HTTPException, Request
from models import MatchReport, ControlSignal, User, UserResponse, MatchRoom
from database import Base, engine, get_db
from sqlalchemy.orm import Session
from srcds.rcon import RconConnection
from matchmaking import start_match, end_match, build_connect_command
from fastapi_steam import SteamAuth, SteamUser
from rcon import send_rcon_command, RCON_HOST, RCON_PORT, RCON_PASSWORD

app = FastAPI()
Base.metadata.create_all(bind=engine)

steam = SteamAuth(
    api_key=os.getenv("STEAM_API_KEY"),
    redirect_uri=os.getenv("STEAM_REDIRECT_URI", "http://localhost:8000/auth/callback"),
)

def apply_match_config(map_name: str, game_mode: str, bot_quota: int) -> dict:
    """Configure the server with one connection to avoid IP bans from rapid reconnects."""
    results = {}
    try:
        conn = RconConnection(RCON_HOST, port=RCON_PORT, password=RCON_PASSWORD)
        try:
            results["bot_quota"] = str(conn.exec_command(f"bot_quota {bot_quota}"))
            results["bot_quota_mode"] = str(conn.exec_command("bot_quota_mode fill"))

            mode_cfg = {"1v1": "1v1.cfg", "5v5": "5v5.cfg"}.get(game_mode, "default.cfg")
            results["mode"] = str(conn.exec_command(f"exec {mode_cfg}"))

            conn.exec_command(f"changelevel {map_name}")
            results["map"] = f"changelevel {map_name} issued"
        finally:
            conn.close()
    except Exception as e:
        results["error"] = f"RCON Error: {e}"
    return results


def handle_control_command(command: str, args: dict) -> str:
    """Map control commands to RCON commands."""
    if command == "start_match":
        map_name = args.get("map", "de_dust2")
        if not all(c.isalnum() or c == "_" for c in map_name):
            return "Invalid map name"
        return send_rcon_command(f"changelevel {map_name}")

    elif command == "restart_game":
        return send_rcon_command("mp_restartgame 1")

    elif command == "restart_round":
        return send_rcon_command("sv_restart 1")

    elif command == "end_warmup":
        return send_rcon_command("mp_warmup_end")

    elif command == "custom":
        cmd = args.get("cmd", "")
        allowed = ("mp_", "sv_", "sm_", "changelevel", "status")
        if not cmd.startswith(allowed):
            return "Command not allowed"
        return send_rcon_command(cmd)

    else:
        return f"Unknown control command: {command}"


# ---------- Sourcemod reporting ----------

@app.post("/api/report")
async def report_match_data(report: MatchReport):
    # No WebSocket broadcast anymore; just log or persist as needed.
    return {"ok": True, "roomId": report.roomId, "event": report.event}


# ---------- Control signals ----------

@app.post("/api/control")
async def send_control(signal: ControlSignal):
    response = handle_control_command(signal.command, signal.payload or {})
    return {"ok": True, "command": signal.command, "response": response}


# ---------- Debug ----------

@app.get("/api/rooms")
async def list_rooms():
    # manager.rooms is no longer used for WebSockets; return DB-backed info instead.
    return {"note": "WebSocket rooms removed; use /rooms/{id}"}


# ---------- Match lifecycle (HTTP) ----------

@app.post("/rooms/{room_id}/start")
async def start_match_endpoint(
    room_id: int,
    map_name: str = "de_dust2",
    game_mode: str = "1v1",
    bot_quota: int = 0,
    db: Session = Depends(get_db),
):
    result = await start_match(
        db=db,
        room_id=room_id,
        map_name=map_name,
        game_mode=game_mode,
        bot_quota=bot_quota,
    )
    # Optionally apply RCON config here:
    # rcon_results = apply_match_config(map_name, game_mode, bot_quota)
    return {"ok": True, "result": result}


@app.post("/rooms/{room_id}/end")
async def end_match_endpoint(room_id: int, db: Session = Depends(get_db)):
    result = await end_match(db, room_id)
    return {"ok": True, "result": result}


@app.get("/rooms/{room_id}/connect")
async def connect_command(room_id: int):
    return {"connect": build_connect_command()}


# ---------- Auth ----------

@app.get("/login")
async def login(request: Request):
    token = steam.generate_state()
    request.session["steam_state"] = token
    return steam.redirect(state=token)


@app.get("/auth/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    user: SteamUser = await steam.authenticate(
        request,
        state=request.session["steam_state"],
    )
    existing = db.query(User).filter(User.steam_id == user.steam_id).first()
    if not existing:
        new_user = User(steam_id=user.steam_id, username=user.persona_name)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        existing = new_user
    return {"steam_id": existing.steam_id, "user_id": existing.id}


@app.post("/dev/create-user")
async def dev_create_user(username: str = "DevPlayer", db: Session = Depends(get_db)):
    if os.getenv("ENV", "dev") == "production":
        raise HTTPException(403, "Dev endpoint disabled")
    fake_steam_id = f"7656119{int.from_bytes(os.urandom(5), 'big') % 10**10:010d}"
    existing = db.query(User).filter(User.steam_id == fake_steam_id).first()
    if existing:
        return {"steam_id": existing.steam_id, "user_id": existing.id}
    user = User(steam_id=fake_steam_id, username=username)
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
    return {
        "id": user.id,
        "username": user.username,
        "elo": user.stats.elo,
        "matches_played": user.stats.matches_played,
        "wins": user.stats.wins,
        "losses": user.stats.losses,
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

    return {
        "id": room.id,
        "status": room.status,
        "game_mode": room.game_mode,
        "map_name": room.map_name,
        "bot_quota": room.bot_quota,
        "players": [{"id": p.id, "username": p.username} for p in room.players],
    }