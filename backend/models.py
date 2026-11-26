from pydantic import BaseModel
from typing import Any
from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class MatchReport(BaseModel):
    roomId: str
    event: str
    payload: Any

class ControlSignal(BaseModel):
    roomid: str
    command: str
    args: dict = {}

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    steam_id = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)          # display name, user-editable
    avatar_url = Column(String, nullable=True)         # user-editable
    country = Column(String, nullable=True)            # ISO code, user-editable
    created_at = Column(DateTime, default=datetime.utcnow)
    last_played = Column(DateTime, nullable=True)

    current_room_id = Column(Integer, ForeignKey("match_rooms.id"), nullable=True)

    stats = relationship("PlayerStats", back_populates="user", uselist=False)
    current_room = relationship("MatchRoom", back_populates="players")


class PlayerStats(Base):
    __tablename__ = "player_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    elo = Column(Integer, default=1000)
    matches_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)

    user = relationship("User", back_populates="stats")


class MatchRoom(Base):# room where players can chat/get match ip
    __tablename__ = "match_rooms"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="waiting")
    game_mode = Column(String, default="1v1")
    map_name = Column(String, default="de_dust2")
    bot_quota = Column(Integer, default=0)
    game_server_id = Column(Integer, ForeignKey("game_servers.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    players = relationship("User", back_populates="current_room")
    game_server = relationship("GameServer", foreign_keys=[game_server_id])

class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("match_rooms.id"))
    winner_id = Column(Integer, ForeignKey("users.id"))
    loser_id = Column(Integer, ForeignKey("users.id"))
    played_at = Column(DateTime, default=datetime.utcnow)

    winner = relationship("User", foreign_keys=[winner_id])
    loser = relationship("User", foreign_keys=[loser_id])

class UserResponse(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True

class MatchReport(BaseModel):
    roomId: str
    event: str
    payload: dict

class ControlSignal(BaseModel):
    roomId: str
    command: str
    args: dict = {}

# Server Management

class GameServer(Base):
    __tablename__ = "game_servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    ip = Column(String, nullable=False)
    port = Column(Integer, default=27015)
    rcon_password = Column(String, nullable=False)
    status = Column(String, default="available")  # available, in_use, offline
    current_room_id = Column(Integer, ForeignKey("match_rooms.id"), nullable=True)
    max_players = Column(Integer, default=10)
    region = Column(String, nullable=True)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)

class QueueEntry(Base):# current queue entry
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    game_mode = Column(String, default="1v1")
    map_group = Column(String, default="default")  # e.g., "active_duty", "all"
    preferred_maps = Column(String, nullable=True)  # comma-separated
    region = Column(String, nullable=True)
    elo_at_queue = Column(Integer, default=1000)
    latency_ms = Column(Integer, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class MatchReadyCheck(Base):
    __tablename__ = "match_ready_checks"

    id = Column(Integer, primary_key=True, index=True)
    game_mode = Column(String, nullable=False, default="1v1")
    map_name = Column(String, nullable=False, default="de_dust2")
    status = Column(String, nullable=False, default="pending")  # pending, accepted, declined, expired
    room_id = Column(Integer, ForeignKey("match_rooms.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    players = relationship(
        "ReadyCheckPlayer",
        back_populates="ready_check",
        cascade="all, delete-orphan",
        order_by="ReadyCheckPlayer.id",
    )


class ReadyCheckPlayer(Base):
    __tablename__ = "ready_check_players"

    id = Column(Integer, primary_key=True, index=True)
    ready_check_id = Column(Integer, ForeignKey("match_ready_checks.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    accepted = Column(Boolean, nullable=True)  # None = waiting, True = accepted, False = declined

    ready_check = relationship("MatchReadyCheck", back_populates="players")
    user = relationship("User")