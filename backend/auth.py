from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User, PlayerStats

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_user(db: Session, username: str, email: str, password: str) -> User:
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create initial stats row
    stats = PlayerStats(user_id=user.id)
    db.add(stats)
    db.commit()
    db.refresh(user)
    return user