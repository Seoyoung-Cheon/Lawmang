from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

# ✅ 회원가입 요청 스키마
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str

# ✅ 응답용 사용자 스키마
class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None

    class Config:
        orm_mode = True

# ✅ 로그인 요청 스키마
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ✅ 이메일 인증 코드 확인을 위한 스키마 추가
class EmailVerification(BaseModel):
    email: EmailStr
    code: str