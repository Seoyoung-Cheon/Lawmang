from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.user_service import create_user, verify_password

router = APIRouter()

# ✅ 회원 가입 API
@router.post("/auth/register", response_model=UserCreate)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # ✅ 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 이메일입니다.")

    # ✅ 닉네임 중복 확인
    existing_nickname = db.query(User).filter(User.nickname == user.nickname).first()
    if existing_nickname:
        raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")

    return create_user(db, user)

# ✅ 로그인 API
@router.post("/auth/login", response_model=UserResponse)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    # ✅ 이메일 존재 확인
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user:
        raise HTTPException(status_code=400, detail="존재하지 않는 이메일입니다.")

    # 비밀번호 검증
    if not verify_password(user.password, existing_user.password_hash):
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

    return existing_user