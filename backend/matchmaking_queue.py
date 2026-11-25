"""Small CS:S matchmaking implementation using the project's existing SQLAlchemy models.

This module deliberately keeps queue processing explicit: POST /queue/process.
It is designed for a single matchmaking worker / local development first.
For multiple workers, use PostgreSQL row locks and a transaction/claiming strategy.
"""
from __future__ import annotations

from datetime import datetime
from itertools import combinations
import random
from typing import Optional

from sqlalchemy.orm import Session

from models import QueueEntry, User, MatchRoom, GameServer
from rcon import apply_match_config

MODE_SIZES = {"1v1": 2, "wingman": 4, "5v5": 10}
MODE_ALIASES = {"1x1": "1v1", "2v2": "wingman", "2x2": "wingman", "5x5": "5v5"}

DEFUSAL_MAPS = {
    "de_dust2", "de_dust", "de_aztec", "de_inferno", "de_nuke",
    "de_train", "de_cbble", "de_chateau", "de_piranesi", "de_prodigy",
    "de_tides",
}
HOSTAGE_MAPS = {
    "cs_assault", "cs_compound", "cs_havana", "cs_italy", "cs_militia",
    "cs_office",
}
ALL_MAPS = DEFUSAL_MAPS | HOSTAGE_MAPS
MAP_GROUPS = {
    "default": ALL_MAPS,
    "all": ALL_MAPS,
    "defusal": DEFUSAL_MAPS,
    "hostage": HOSTAGE_MAPS,
}

BASE_ELO_TOLERANCE = 200
MAX_ELO_TOLERANCE = 500
ELO_EXPANSION_PER_INTERVAL = 100
WAIT_INTERVAL_SECONDS = 30
MAX_LATENCY_SPREAD_MS = 100


def normalize_mode(mode: str) -> str:
    value = (mode or "1v1").strip().lower()
    value = MODE_ALIASES.get(value, value)
    if value not in MODE_SIZES:
        raise ValueError(f"Unsupported game mode: {mode}. Use 1v1, wingman, or 5v5.")
    return value


def _wait_seconds(entry: QueueEntry, now: Optional[datetime] = None) -> float:
    now = now or datetime.utcnow()
    joined = entry.joined_at or now
    return max(0.0, (now - joined).total_seconds())


def _elo_tolerance(entry: QueueEntry, now: Optional[datetime] = None) -> int:
    intervals = int(_wait_seconds(entry, now) // WAIT_INTERVAL_SECONDS)
    return min(BASE_ELO_TOLERANCE + intervals * ELO_EXPANSION_PER_INTERVAL,
               MAX_ELO_TOLERANCE)


def _maps_for_entry(entry: QueueEntry) -> set[str]:
    group_name = (entry.map_group or "default").strip().lower()

    # Backwards compatibility with the supplied test: map_group="de_inferno"
    # means the player wants that one map, not a named pool.
    if group_name in ALL_MAPS:
        group = {group_name}
    elif group_name in MAP_GROUPS:
        group = set(MAP_GROUPS[group_name])
    else:
        # Unknown map group should not silently broaden to every map.
        return set()

    if not entry.preferred_maps:
        return group

    requested = {m.strip().lower() for m in entry.preferred_maps.split(",") if m.strip()}
    return group & requested & ALL_MAPS


def _common_maps(entries: list[QueueEntry]) -> list[str]:
    if not entries:
        return []
    common = _maps_for_entry(entries[0])
    for entry in entries[1:]:
        common &= _maps_for_entry(entry)
    return sorted(common)


def _group_is_compatible(entries: list[QueueEntry], now: Optional[datetime] = None) -> bool:
    if not entries:
        return False

    # Fairness: each player must be within their wait-expanded tolerance of
    # the group's average rating, rather than comparing only adjacent players.
    average = sum(e.elo_at_queue or 1000 for e in entries) / len(entries)
    if any(abs((e.elo_at_queue or 1000) - average) > _elo_tolerance(e, now) for e in entries):
        return False

    known_latencies = [e.latency_ms for e in entries if e.latency_ms is not None]
    if known_latencies and max(known_latencies) - min(known_latencies) > MAX_LATENCY_SPREAD_MS:
        return False

    known_regions = {e.region.strip().lower() for e in entries if e.region and e.region.strip()}
    if len(known_regions) > 1:
        return False

    return bool(_common_maps(entries))


def _select_players(entries: list[QueueEntry], count: int) -> Optional[list[QueueEntry]]:
    now = datetime.utcnow()
    # Oldest entries are considered first. For a small starter queue, exhaustive
    # combinations are easy to understand; large queues should use a smarter index.
    for candidate_tuple in combinations(entries, count):
        candidate = list(candidate_tuple)
        if _group_is_compatible(candidate, now):
            return candidate
    return None


def _balanced_teams(entries: list[QueueEntry]) -> tuple[list[QueueEntry], list[QueueEntry]]:
    """Split an even-sized roster to minimize team total-ELO difference."""
    team_size = len(entries) // 2
    anchor, *rest = entries
    best = None
    best_diff = float("inf")
    for selected in combinations(rest, team_size - 1):
        team_a = [anchor, *selected]
        a_ids = {e.id for e in team_a}
        team_b = [e for e in entries if e.id not in a_ids]
        diff = abs(sum(e.elo_at_queue or 1000 for e in team_a) -
                   sum(e.elo_at_queue or 1000 for e in team_b))
        if diff < best_diff:
            best, best_diff = (team_a, team_b), diff
    return best or (entries[:team_size], entries[team_size:])


def _public_server(server: GameServer) -> dict:
    return {"id": server.id, "name": server.name, "ip": server.ip, "port": server.port}


def find_match(db: Session, game_mode: str = "1v1") -> dict:
    """Try to form and configure one match. Queue entries stay if no match/server is available."""
    try:
        mode = normalize_mode(game_mode)
    except ValueError as exc:
        return {"matched": False, "error": str(exc)}

    required = MODE_SIZES[mode]
    entries = (db.query(QueueEntry)
               .filter(QueueEntry.game_mode == mode)
               .order_by(QueueEntry.joined_at, QueueEntry.id)
               .all())
    if len(entries) < required:
        return {"matched": False, "message": f"Waiting for {required - len(entries)} more player(s)",
                "game_mode": mode, "queue_count": len(entries), "required_players": required}

    selected = _select_players(entries, required)
    if not selected:
        return {"matched": False, "message": "No compatible group yet", "game_mode": mode,
                "queue_count": len(entries), "required_players": required}

    maps = _common_maps(selected)
    if not maps:
        return {"matched": False, "message": "Selected players have no common map"}

    user_ids = [e.user_id for e in selected]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    if len(users) != required:
        # Stale queue rows should be cleaned up, not turned into a partial match.
        db.query(QueueEntry).filter(QueueEntry.id.in_([e.id for e in selected])).delete(synchronize_session=False)
        db.commit()
        return {"matched": False, "error": "Queue contained a missing user; stale entries removed"}
    if any(u.current_room_id is not None for u in users):
        return {"matched": False, "error": "A selected player is already assigned to a room"}

    server = (db.query(GameServer)
              .filter(GameServer.status == "available", GameServer.max_players >= required)
              .order_by(GameServer.id)
              .with_for_update()
              .first())
    if not server:
        return {"matched": False, "message": "No available server with enough slots; players remain queued"}
    if not server.ip:
        return {"matched": False, "error": f"Server {server.id} has no IP configured"}

    map_name = random.choice(maps)
    team_a, team_b = _balanced_teams(selected)
    room = MatchRoom(status="configuring", game_mode=mode, map_name=map_name,
                     bot_quota=0, game_server_id=server.id)

    # Persist a recoverable configuring state. Keep queue entries until RCON succeeds.
    try:
        db.add(room)
        db.flush()
        for user in users:
            user.current_room_id = room.id
        server.status = "in_use"
        server.current_room_id = room.id
        db.commit()
        db.refresh(room)
        db.refresh(server)
    except Exception:
        db.rollback()
        raise

    try:
        apply_match_config(server, map_name, mode, 0)
    except Exception as exc:
        # Keep room as failed for diagnosis; release server/users and retain queue rows.
        try:
            db.refresh(room)
            db.refresh(server)
            for user in users:
                db.refresh(user)
                if user.current_room_id == room.id:
                    user.current_room_id = None
            room.status = "failed"
            server.status = "available"
            server.current_room_id = None
            db.commit()
        except Exception:
            db.rollback()
        return {"matched": False, "error": f"Server configuration failed: {exc}", "room_id": room.id}

    try:
        # Only remove queue rows after configuration has returned successfully.
        db.query(QueueEntry).filter(QueueEntry.id.in_([e.id for e in selected])).delete(synchronize_session=False)
        room.status = "ready"
        db.commit()
    except Exception:
        db.rollback()
        # A room may have been configured but not finalized in the DB. This is a
        # recoverable inconsistency; production should reconcile it via a worker.
        return {"matched": False, "error": "Database finalization failed after server configuration",
                "room_id": room.id}

    return {
        "matched": True,
        "room_id": room.id,
        "status": "ready",
        "game_mode": mode,
        "map_name": map_name,
        "server": _public_server(server),
        "connect": f"connect {server.ip}:{server.port}",
        "steam_link": f"steam://connect/{server.ip}:{server.port}",
        "players": user_ids,
        "teams": {"A": [e.user_id for e in team_a], "B": [e.user_id for e in team_b]},
    }
