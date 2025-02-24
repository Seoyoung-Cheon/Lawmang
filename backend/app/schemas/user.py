from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    nickname: str

class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    is_verified: bool
    created_at: datetime
    reset_token: Optional[str] = None
    reset_token_expires: Optional[datetime] = None

    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
