from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, EmailVerification
from app.services.user_service import (
    create_user, verify_password, create_access_token, send_email_code, verify_email_code
)
from app.core.dependencies import get_current_user
import re

router = APIRouter()

# ✅ 이메일 인증 코드 저장소 (실제 환경에서는 Redis 또는 DB 활용)
verification_codes = {}

# ✅ 이메일 인증 코드 발송 API (회원가입 전 이메일만 입력 가능)
@router.post("/auth/send-code")
def send_verification_code(payload: dict = Body(...)):
    try:
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="이메일이 필요합니다.")

        if email in verification_codes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 인증 코드가 발송되었습니다.")

        # ✅ 이메일 형식 검증 추가
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="유효한 이메일을 입력하세요.")

        code = send_email_code(email)  # ✅ 이메일로 인증 코드 전송
        verification_codes[email] = code  # ✅ 인증 코드 저장
        return {"message": "이메일로 인증 코드가 전송되었습니다!"}

    except Exception as e:
        print(f"❌ 서버 오류 발생: {e}")  # ✅ 터미널에 오류 출력
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="서버 내부 오류가 발생했습니다.")


# ✅ 회원가입 API (이메일 인증 코드 포함)
@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, code: str, db: Session = Depends(get_db)):
    if user.email not in verification_codes or verification_codes[user.email] != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="잘못된 인증 코드입니다.")

    # ✅ 인증 코드 사용 후 삭제
    del verification_codes[user.email]

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 이메일입니다.")

    new_user = create_user(db, user)
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

# ✅ 이메일 인증 코드 확인 엔드포인트 추가
@router.post("/auth/verify-email")
def verify_email(data: EmailVerification, db: Session = Depends(get_db)):
    is_valid = verify_email_code(data.email, data.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail="잘못된 인증 코드이거나 만료되었습니다.")
    return {"message": "인증이 완료되었습니다."}
