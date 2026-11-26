"""FastAPI queue router. Include with app.include_router(router).

This preserves the supplied UX: join users, then explicitly POST /queue/process,
and additionally supports FACEIT-style ready checks before creating a room.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import MatchReadyCheck, QueueEntry, ReadyCheckPlayer, User
from matchmaking_queue import (
    ALL_MAPS,
    MAP_GROUPS,
    MODE_SIZES,
    expire_stale_ready_checks,
    finalize_ready_check_room,
    find_match,
    normalize_mode,
    serialize_ready_check,
    try_create_ready_check,
)

router = APIRouter(tags=["queue"])


def _normalize_map_preferences(map_group: str, preferred_maps: str | None) -> tuple[str, str | None]:
    group = (map_group or "default").strip().lower()
    # Backwards-compatible single-map pool used by the supplied test.
    if group in ALL_MAPS:
        allowed = {group}
        normalized_group = group
    elif group in MAP_GROUPS:
        allowed = MAP_GROUPS[group]
        normalized_group = group
    else:
        raise HTTPException(400, "Invalid map group")

    if not preferred_maps:
        return normalized_group, None
    requested = {m.strip().lower() for m in preferred_maps.split(",") if m.strip()}
    if not requested or not requested.issubset(ALL_MAPS):
        raise HTTPException(400, "Invalid preferred maps")
    if not requested.intersection(allowed):
        raise HTTPException(400, "Preferred maps do not belong to this map group")
    return normalized_group, ",".join(sorted(requested))


@router.post("/queue/join")
def join_queue(
    user_id: int,
    game_mode: str = "1v1",
    map_group: str = "default",
    preferred_maps: str | None = None,
    latency_ms: int | None = Query(default=None, ge=0, le=5000),
    region: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        mode = normalize_mode(game_mode)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    normalized_group, normalized_maps = _normalize_map_preferences(map_group, preferred_maps)

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
        game_mode=mode,
        map_group=normalized_group,
        preferred_maps=normalized_maps,
        region=region.strip().lower() if region and region.strip() else None,
        elo_at_queue=user.stats.elo if user.stats else 1000,
        latency_ms=latency_ms,
    )
    try:
        db.add(entry)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(409, "Could not join queue; user may already be queued") from exc

    try_create_ready_check(db, mode)

    count = db.query(QueueEntry).filter(QueueEntry.game_mode == mode).count()
    return {"queued": True, "matched": False, "game_mode": mode,
            "queue_size": count, "required_players": MODE_SIZES[mode]}


@router.post("/queue/leave")
def leave_queue(user_id: int, db: Session = Depends(get_db)):
    entry = db.query(QueueEntry).filter(QueueEntry.user_id == user_id).first()
    if not entry:
        raise HTTPException(404, "Not in queue")

    pending_links = (
        db.query(ReadyCheckPlayer)
        .join(MatchReadyCheck, ReadyCheckPlayer.ready_check_id == MatchReadyCheck.id)
        .filter(ReadyCheckPlayer.user_id == user_id, MatchReadyCheck.status == "pending")
        .all()
    )
    for link in pending_links:
        link.accepted = False
        link.ready_check.status = "declined"
        link.ready_check.resolved_at = datetime.utcnow()

    db.delete(entry)
    db.commit()
    return {"left": True}


@router.get("/queue/status")
def queue_status(game_mode: str = "1v1", db: Session = Depends(get_db)):
    """Return a public roster and counts for one logical game-mode queue."""
    try:
        mode = normalize_mode(game_mode)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc

    expire_stale_ready_checks(db)

    entries = (
        db.query(QueueEntry)
        .filter(QueueEntry.game_mode == mode)
        .order_by(QueueEntry.joined_at, QueueEntry.id)
        .all()
    )
    user_ids = [entry.user_id for entry in entries]
    users_by_id = {
        user.id: user
        for user in db.query(User).filter(User.id.in_(user_ids)).all()
    } if user_ids else {}

    now = datetime.utcnow()
    required_players = MODE_SIZES[mode]
    players = []
    for entry in entries:
        user = users_by_id.get(entry.user_id)
        players.append({
            "user_id": entry.user_id,
            "username": user.username if user else None,
            "elo": entry.elo_at_queue,
            "waiting_s": max(0, int((now - entry.joined_at).total_seconds()))
                if entry.joined_at else 0,
        })

    count = len(entries)
    return {
        "game_mode": mode,
        "count": count,
        "required_players": required_players,
        "players_needed": max(0, required_players - count),
        "players": players,
    }


@router.get("/queue/ready-check")
def get_ready_check(user_id: int, db: Session = Depends(get_db)):
    """Return active or recently resolved ready check for a queued player."""
    expire_stale_ready_checks(db)

    pending = (
        db.query(MatchReadyCheck)
        .join(ReadyCheckPlayer, ReadyCheckPlayer.ready_check_id == MatchReadyCheck.id)
        .filter(ReadyCheckPlayer.user_id == user_id, MatchReadyCheck.status == "pending")
        .order_by(MatchReadyCheck.id.desc())
        .first()
    )
    if pending:
        return {"has_ready_check": True, "ready_check": serialize_ready_check(pending, user_id)}

    entry = db.query(QueueEntry).filter(QueueEntry.user_id == user_id).first()
    if entry:
        created = try_create_ready_check(db, entry.game_mode)
        if created:
            return {"has_ready_check": True, "ready_check": serialize_ready_check(created, user_id)}

    recent_cutoff = datetime.utcnow() - timedelta(seconds=8)
    recent = (
        db.query(MatchReadyCheck)
        .join(ReadyCheckPlayer, ReadyCheckPlayer.ready_check_id == MatchReadyCheck.id)
        .filter(
            ReadyCheckPlayer.user_id == user_id,
            MatchReadyCheck.resolved_at >= recent_cutoff,
            MatchReadyCheck.status.in_(["accepted", "declined", "expired"]),
        )
        .order_by(MatchReadyCheck.id.desc())
        .first()
    )
    if recent:
        if recent.status == "accepted" and recent.room_id is not None:
            user = db.query(User).filter(User.id == user_id).first()
            if user and user.current_room_id == recent.room_id:
                return {"has_ready_check": True, "ready_check": serialize_ready_check(recent, user_id)}
        elif recent.status in ("declined", "expired"):
            return {"has_ready_check": True, "ready_check": serialize_ready_check(recent, user_id)}

    return {"has_ready_check": False, "ready_check": None}


@router.post("/queue/ready-check/{ready_check_id}/respond")
def respond_ready_check(
    ready_check_id: int,
    user_id: int,
    accept: bool = True,
    db: Session = Depends(get_db),
):
    """Accept or decline a pending match ready check."""
    expire_stale_ready_checks(db)

    rc = db.query(MatchReadyCheck).filter(MatchReadyCheck.id == ready_check_id).first()
    if not rc:
        raise HTTPException(404, "Ready check not found")

    player = next((p for p in rc.players if p.user_id == user_id), None)
    if not player:
        raise HTTPException(403, "You are not a participant of this ready check")

    if rc.status != "pending":
        return {"has_ready_check": True, "ready_check": serialize_ready_check(rc, user_id)}

    if not accept:
        player.accepted = False
        rc.status = "declined"
        rc.resolved_at = datetime.utcnow()
        db.query(QueueEntry).filter(QueueEntry.user_id == user_id).delete(
            synchronize_session=False
        )
        db.commit()
        db.refresh(rc)
        return {"has_ready_check": True, "ready_check": serialize_ready_check(rc, user_id)}

    player.accepted = True
    db.commit()
    db.refresh(rc)

    if all(p.accepted is True for p in rc.players):
        finalize_ready_check_room(db, rc)
        db.refresh(rc)

    return {"has_ready_check": True, "ready_check": serialize_ready_check(rc, user_id)}


@router.post("/queue/process")
def process_queue(game_mode: str = "1v1", db: Session = Depends(get_db)):
    result = find_match(db, game_mode)
    if result.get("matched"):
        return result
    # Keep this as HTTP 200 so clients can render ordinary queue waiting states.
    return result
