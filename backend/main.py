from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from rooms import manager
from models import MatchReport, ControlSignal, User, UserCreate, UserResponse, MatchRoom
from auth import create_user
from database import Base, engine, get_db
from sqlalchemy.orm import Session
from srcds.rcon import RconConnection
import json

app = FastAPI()

RCON_HOST = "127.0.1.1"
RCON_PORT = 27015
RCON_PASSWORD = "1111"

Base.metadata.create_all(bind=engine)

# For Sourcemod to post match data
@app.post("/api/report")
async def report_match_data(report: MatchReport):
    await manager.broadcast(report.roomId, f"{report.event}: {report.payload}")
    return {"ok": True}

# For Web app to post control signals
@app.post("/api/control")
async def send_control(signal: ControlSignal):
    await manager.broadcast(signal.roomId, f"count: {signal.command}")
    return {"ok": True}

# Debug
@app.get("/api/rooms")
async def list_rooms():
    return {room: len(clients) for room, clients in manager.rooms.items()}

# WebSocket
@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.join(room_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "invalid json"}))
                continue

            # Handle control commands from the web client
            if msg.get("type") == "control":
                command = msg.get("command")
                args = msg.get("args", {})
                response = handle_control_command(command, args)
                
                # Confirm back to the sender
                await websocket.send_text(json.dumps({
                    "type": "control_ack",
                    "command": command,
                    "response": response
                }))

            elif msg.get("type") == "chat":
                await manager.broadcast(room_id, json.dumps({
                    "type": "chat",
                    "message": msg.get("message", "")
                }))
    except WebSocketDisconnect:
        manager.leave(room_id, websocket)

def send_rcon_command(command: str) -> str:
    try:
        conn = RconConnection(RCON_HOST, port=RCON_PORT, password=RCON_PASSWORD)
        response = conn.exec_commnd(command)
        conn.close()
        return response
    except Exception as e:
        return f"RCON Error: {e}"

def handle_control_command(command: str, args: dict) -> str:
    """Map control commands to RCON commands."""
    if command == "start_match":
        map_name = args.get("map", "de_dust2")
        if not all(c.isalnum() or c == '_' for c in map_name):
            return "Invalid map name"
        return send_rcon_command(f"changelevel {map_name}")

    elif command == "restart_game":
        return send_rcon_command("mp_restartgame 1")

    elif command == "restart_round":
        return send_rcon_command("sv_restart 1")

    elif command == "end_warmup":
        return send_rcon_command("mp_warmup_end")

    elif command == "custom":
        # Allow raw RCON commands with a whitelist for safety
        cmd = args.get("cmd", "")
        allowed = ("mp_", "sv_", "sm_", "changelevel", "status")
        if not cmd.startswith(allowed):
            return "Command not allowed"
        return send_rcon_command(cmd)

    else:
        return f"Unknown control command: {command}"


# --- User endpoints ---

@app.post("/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing:
        raise HTTPException(400, "Username or email already registered")
    return create_user(db, user.username, user.email, user.password)


@app.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    from models import User
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

# --- Room endpoints ---

@app.post("/rooms/create")
def create_room(user_id: int, game_mode: str = "1v1", map_name: str = "de_dust2", db: Session = Depends(get_db)):
    from models import User, RoomPlayer
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    room = MatchRoom(game_mode=game_mode, map_name=map_name, status="waiting")
    db.add(room)
    db.commit()
    db.refresh(room)

    # Add creator to the room
    db.add(RoomPlayer(room_id=room.id, user_id=user.id))
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
    if not room or room.status != "waiting":
        raise HTTPException(400, "Room not available")

    max_players = 2 if room.game_mode == "1v1" else 10
    if len(room.players) >= max_players:
        raise HTTPException(400, "Room is full")

    user.current_room_id = room.id
    db.commit()

    if len(room.players) >= max_players:
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

    # If room becomes empty, delete it
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
        "players": [{"id": p.id, "username": p.username} for p in room.players],
    }
