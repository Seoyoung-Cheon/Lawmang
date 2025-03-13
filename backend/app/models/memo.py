from sqlalchemy import Column, Integer, Text, Boolean, Date, DateTime, func
from app.core.database import Base

class Memo(Base):
    """
    사용자의 메모 기록을 저장하는 테이블
    """
    __tablename__ = "memo"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)  # 🔥 외래 키 없이 관리
    title = Column(Text, nullable=True)  # 메모 제목
    content = Column(Text, nullable=True)  # 메모 내용
    event_date = Column(Date, nullable=True)  # 관련 날짜 (YYYY-MM-DD 형식)
    notification = Column(Boolean, default=False, server_default="false")  # 알림 설정 여부
    created_at = Column(DateTime, server_default=func.now())  # 메모 생성 시간
    is_deleted = Column(Boolean, default=False)  # 삭제 여부 (기본값: False)
