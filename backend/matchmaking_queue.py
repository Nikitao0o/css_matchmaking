from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import QueueEntry, User, MatchRoom, GameServer
from rcon import apply_match_config
import json

ELO_TOLERANCE_BASE = 200
ELO_TOLERANCE_MAX = 500
WAIT_TIME_ELO_EXPANSION = 100  # per wait time interval
WAIT_TIME_INTERVAL = 20


def _elo_tolerance(wait_seconds: int) -> int:
    expansion = (wait_seconds // WAIT_TIME_INTERVAL) * WAIT_TIME_ELO_EXPANSION
    return min(ELO_TOLERANCE_BASE + expansion, ELO_TOLERANCE_MAX)


def find_match(db: Session, game_mode: str = "1v1") -> dict | None:
    entries = db.query(QueueEntry).filter(QueueEntry.game_mode == game_mode).order_by(QueueEntry.joined_at).all()
    if len(entries) < 2:
        return None

    for i, e1 in enumerate(entries):
        wait_seconds = (datetime.utcnow() - e1.joined_at).seconds
        tolerance = _elo_tolerance(wait_seconds)

        for e2 in entries[i + 1:]:
            elo_diff = abs(e1.elo_at_queue - e2.elo_at_queue)
            if elo_diff > tolerance:
                continue

            # Latency check
            if e1.latency_ms is not None and e2.latency_ms is not None:
                if abs(e1.latency_ms - e2.latency_ms) > 100:
                    continue

            return _create_match(db, e1, e2, game_mode)

    return None


def _create_match(db: Session, e1: QueueEntry, e2: QueueEntry, game_mode: str) -> dict:
    # Find an available server
    server = db.query(GameServer).filter(GameServer.status == "available").first()
    if not server:
        return {"error": "No available game server"}

    room = MatchRoom(
        status="ready",
        game_mode=game_mode,
        map_name=e1.preferred_maps.split(",")[0] if e1.preferred_maps else "de_dust2",
        bot_quota=0,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    server.status = "in_use"
    server.current_room_id = room.id
    db.commit()

    u1 = db.query(User).filter(User.id == e1.user_id).first()
    u2 = db.query(User).filter(User.id == e2.user_id).first()
    u1.current_room_id = room.id
    u2.current_room_id = room.id
    db.commit()

    # Remove from queue
    db.delete(e1)
    db.delete(e2)
    db.commit()

    # Configure game server
    apply_match_config(room.map_name, game_mode, 0)

    return {
        "room_id": room.id,
        "server_ip": room.server_ip,
        "server_port": room.server_port,
        "connect": f"connect {room.server_ip}:{room.server_port}",
        "players": [u1.id, u2.id],
    }