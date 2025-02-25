from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.user_service import (
    create_user, verify_password, create_access_token, send_email_code
)
from app.services.user_service import (
    save_verification_code, verify_email_code, delete_verification_code
)
from app.core.dependencies import get_current_user
import re

router = APIRouter()

# ✅ 이메일 인증 코드 발송 API (PostgreSQL 저장)
@router.post("/auth/send-code")
def send_verification_code(payload: dict = Body(...), db: Session = Depends(get_db)):
    email = payload.get("email")

    if not email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="이메일이 필요합니다.")

    # ✅ 이메일 형식 검증
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="유효한 이메일을 입력하세요.")

    # ✅ 이메일 인증 코드 발송
    code = send_email_code(email, db)
    save_verification_code(db, email, code, expiry_minutes=5)  # ✅ PostgreSQL에 저장
    return {"message": "이메일로 인증 코드가 전송되었습니다!"}


# ✅ 회원가입 API (이메일 인증 코드 포함, PostgreSQL 사용)
@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """회원가입 API (이메일 인증 코드 포함)"""
    
    if not verify_email_code(db, user.email, user.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="잘못된 인증 코드입니다.")

    # ✅ 이메일 중복 확인
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 이메일입니다.")

    new_user = create_user(db=db, user=user)

    # ✅ 회원가입 성공 후 인증 코드 삭제
    delete_verification_code(db, user.email)

    return new_user


# ✅ 로그인 API (JWT 토큰 반환)
@router.post("/auth/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="존재하지 않는 이메일입니다.")

    if not verify_password(user.password, existing_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="비밀번호가 일치하지 않습니다.")

    # ✅ JWT 토큰 생성
    access_token = create_access_token(data={"sub": existing_user.email})

    return {"access_token": access_token, "token_type": "Bearer"}


@router.get("/auth/me")
def read_users_me(current_user: dict = Depends(get_current_user)):
    return {"email": current_user["sub"]}


# ✅ 이메일 인증 코드 확인 엔드포인트 (PostgreSQL 사용)
@router.post("/auth/verify-email")
def verify_email(payload: dict = Body(...), db: Session = Depends(get_db)):
    """이메일 인증 코드 검증 (PostgreSQL 사용)"""
    email = payload.get("email")
    code = payload.get("code")

    if not email or not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이메일과 인증 코드가 필요합니다.")

    if not verify_email_code(db, email, code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="잘못된 인증 코드입니다.")

    return {"message": "이메일 인증이 완료되었습니다!"}
