import os
import random
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
from jose import jwt  # python-jose에서 JWT import
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.models.user import User
from app.schemas.user import UserCreate
from passlib.context import CryptContext
from app.core.config import settings  # 환경 변수에서 SECRET_KEY 가져오기

# ✅ 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ✅ JWT 설정
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30분 동안 유효한 토큰

# ✅ 이메일 인증 코드 저장소 (실제 환경에서는 Redis 또는 DB 활용)
verification_codes = {}

# ✅ 비밀번호 해싱 함수
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# ✅ 비밀번호 검증 함수
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ✅ JWT 토큰 생성 함수
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})  # 만료 시간 추가
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ✅ JWT 토큰 검증 함수
def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload  # {'sub': 'user_email@example.com', 'exp': 1700000000}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")


# ✅ 환경 변수 로드 (네이버 SMTP 설정)
load_dotenv()

SMTP_USER = os.getenv("SMTP_USER")  # ✅ 네이버 이메일 계정
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # ✅ SMTP 비밀번호
SMTP_SERVER = os.getenv("SMTP_SERVER")  # ✅ 네이버 SMTP 서버 주소
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))  # ✅ 기본적으로 587 사용

# ✅ 이메일 인증 코드 생성 및 발송 (예외 처리 추가)
def send_email_code(email: str) -> str:
    try:
        code = ''.join(random.choices("0123456789", k=6))
        message = f"회원가입 인증 코드: {code}"

        msg = MIMEText(message)
        msg["Subject"] = "회원가입 인증 코드"
        msg["From"] = SMTP_USER
        msg["To"] = email

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, email, msg.as_string())

        print(f"✅ 인증 코드 {code} 이메일 발송 완료: {email}")

        # ✅ 새로운 코드가 발송될 때마다 덮어쓰기
        verification_codes[email] = {"code": code, "expires_at": datetime.utcnow() + timedelta(days=365)}

        return code

    except smtplib.SMTPAuthenticationError:
        print("❌ 네이버 SMTP 인증 실패: 이메일 또는 비밀번호가 올바르지 않습니다.")
        raise HTTPException(status_code=500, detail="이메일 서버 인증에 실패했습니다.")

    except smtplib.SMTPException as e:
        print(f"❌ 이메일 발송 실패: {e}")
        raise HTTPException(status_code=500, detail="이메일 발송 중 오류가 발생했습니다.")
    

# ✅ 이메일 인증 코드 검증 함수 (만료 기능 추가)
def verify_email_code(email: str, code: str) -> bool:
    if email in verification_codes:
        data = verification_codes[email]

        # ✅ 코드 만료 여부 확인
        if datetime.utcnow() > data["expires_at"]:
            del verification_codes[email]  # ✅ 만료된 코드 삭제
            return False

        # ✅ 코드가 일치하는지 확인
        if data["code"] == code:
            del verification_codes[email]  # ✅ 인증 코드 사용 후 삭제
            return True

    return False


# ✅ 회원 가입 로직 (이메일 인증된 사용자만 가입 가능)
def create_user(db: Session, user: UserCreate, code: str):
    if not verify_email_code(user.email, code):
        raise HTTPException(status_code=400, detail="잘못된 인증 코드이거나 만료되었습니다.")

    hashed_password = hash_password(user.password)
    new_user = User(
        email=user.email,
        password_hash=hashed_password,
        nickname=user.nickname,
        is_verified=True  # ✅ 이메일 인증이 완료된 사용자
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user