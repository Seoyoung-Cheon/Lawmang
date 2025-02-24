import random
import string
import smtplib
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

# ✅ 이메일 인증 코드 생성 및 발송
def send_email_code(email: str) -> str:
    code = ''.join(random.choices(string.digits, k=6))  # 6자리 숫자 생성
    message = f"회원가입 인증 코드: {code}"

    msg = MIMEText(message)
    msg["Subject"] = "회원가입 인증 코드"
    msg["From"] = "noreply@yourapp.com"
    msg["To"] = email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("your_email@gmail.com", "your_email_password")  # ✅ 환경 변수로 관리 필요
        server.sendmail("noreply@yourapp.com", email, msg.as_string())

    print(f"✅ 인증 코드 {code} 이메일 발송 완료: {email}")
    verification_codes[email] = code  # ✅ 인증 코드 저장
    return code

# ✅ 이메일 인증 코드 검증 함수
def verify_email_code(email: str, code: str) -> bool:
    if email in verification_codes and verification_codes[email] == code:
        del verification_codes[email]  # ✅ 인증 코드 사용 후 삭제
        return True
    return False

# ✅ 회원 가입 로직 (이메일 인증된 사용자만 가입 가능)
def create_user(db: Session, user: UserCreate, code: str):
    if not verify_email_code(user.email, code):
        raise HTTPException(status_code=400, detail="잘못된 인증 코드입니다.")

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
