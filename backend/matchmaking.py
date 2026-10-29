from sqlalchemy.orm import Session
from models import User, MatchRoom
from rcon import apply_match_config, send_rcon_command
from rooms import manager
import json
import os


SERVER_HOST = os.getenv("GAME_SERVER_HOST", "127.0.0.1")
SERVER_PORT = int(os.getenv("GAME_SERVER_PORT", "27015"))


def build_connect_command() -> str:
    """The console command a player pastes to join the game server."""
    return f"connect {SERVER_HOST}:{SERVER_PORT}"


async def start_match(db: Session, room_id: int, map_name: str, game_mode: str, bot_quota: int) -> dict:
    """Configure the server and broadcast the connect command to players."""
    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if not room:
        return {"error": "Room not found"}

    if room.status not in ("waiting", "ready"):
        return {"error": f"Room cannot be started (status: {room.status})"}

    # 1. Persist chosen settings
    room.map_name = map_name
    room.game_mode = game_mode
    room.bot_quota = bot_quota
    room.status = "in_progress"
    db.commit()

    # 2. Push config to the game server via RCON
    rcon_results = apply_match_config(map_name, game_mode, bot_quota)

    # 3. Broadcast the connect command to everyone in the room
    connect_cmd = build_connect_command()
    await manager.broadcast(room_id, json.dumps({
        "type": "match_started",
        "map": map_name,
        "mode": game_mode,
        "bot_quota": bot_quota,
        "connect": connect_cmd,
    }))

    return {
        "status": "started",
        "connect": connect_cmd,
        "rcon": rcon_results,
    }


async def end_match(db: Session, room_id: int) -> dict:
    """Mark the room as finished, clear players, optionally reset the server."""
    room = db.query(MatchRoom).filter(MatchRoom.id == room_id).first()
    if not room:
        return {"error": "Room not found"}

    room.status = "finished"

    # Detach all players from the room
    for player in room.players:
        player.current_room_id = None
    db.commit()

    # Reset the server to a neutral state
    send_rcon_command("bot_kick")
    send_rcon_command("changelevel de_dust2")

    await manager.broadcast(room_id, json.dumps({
        "type": "match_ended",
        "room_id": room_id,
    }))

    return {"status": "finished"}