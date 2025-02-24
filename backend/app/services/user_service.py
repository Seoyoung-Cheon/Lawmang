from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ 비밀번호 해싱 함수
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# ✅ 회원 가입 로직
def create_user(db: Session, user: UserCreate):
    hashed_password = hash_password(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        nickname=user.nickname
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

# 비밀번호 검증 함수 추가
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
