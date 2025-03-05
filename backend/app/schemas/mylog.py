from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

# ✅ 메모 생성 스키마
class MemoCreate(BaseModel):
    user_id: int
    title: str
    content: Optional[str] = None
    event_date: Optional[date] = None
    notification: bool = False

# ✅ 메모 수정 스키마
class MemoUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    event_date: Optional[date] = None
    notification: Optional[bool] = None

    class Config:
        from_attributes = True

# ✅ 메모 응답 스키마
class MemoResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: Optional[str]
    event_date: Optional[date]
    notification: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ 열람기록 생성 스키마
class UserActivityLogBase(BaseModel):
    user_id: int
    precedent_id: Optional[int] = None
    activity_type: str
    created_at: datetime = Field(default_factory=datetime.now)

# ✅ 열람기록 생성 스키마
class UserActivityLogCreate(UserActivityLogBase):
    pass

class UserActivityLogResponse(UserActivityLogBase):
    id: int

    class Config:
        from_attributes = True

# ✅ 열람기록 생성 스키마
class ViewedLogCreate(BaseModel):
    user_id: int
    precedent_id: Optional[int] = None
    viewed_at: date = Field(default_factory=lambda: datetime.now().date())

# ✅ 열람기록 응답 스키마
class ViewedLogResponse(BaseModel):
    id: int
    user_id: int
    consultation_id: Optional[int] = None
    precedent_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ✅ 모든 스키마 내보내기
__all__ = [
    'MemoCreate',
    'MemoResponse',
    'UserActivityLogBase',
    'UserActivityLogCreate',
    'UserActivityLogResponse',
    'ViewedLogCreate',
    'ViewedLogResponse'
]
