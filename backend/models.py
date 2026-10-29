from pydantic import BaseModel
from typing import Any
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
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
    username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # This column is the foreign key that makes the relationship work
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


class MatchRoom(Base):
    __tablename__ = "match_rooms"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="waiting")
    game_mode = Column(String, default="1v1")
    map_name = Column(String, default="de_dust2")
    bot_quota = Column(Integer, default=0)
    server_ip = Column(String, nullable=True)
    server_port = Column(Integer, default=27015)
    created_at = Column(DateTime, default=datetime.utcnow)

    players = relationship("User", back_populates="current_room")

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