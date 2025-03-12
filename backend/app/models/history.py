from sqlalchemy import Column, Integer, DateTime, UniqueConstraint, CheckConstraint, func
from app.core.database import Base

class History(Base):
    """
    사용자의 상담 사례 및 판례 열람 기록을 저장하는 테이블
    """
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)  # 🔥 외래 키 없이 관리
    consultation_id = Column(Integer, nullable=True)  # 상담 사례 ID
    precedent_id = Column(Integer, nullable=True)  # 판례 ID
    viewed_at = Column(DateTime, server_default=func.now(), onupdate=func.now())  # 열람 기록 시간 - 업데이트

    # 🔥 중복 저장 방지를 위한 제약 조건 추가
    __table_args__ = (
        CheckConstraint(
            'consultation_id IS NOT NULL OR precedent_id IS NOT NULL',
            name='check_consultation_or_precedent_not_both_null'
        ),
        UniqueConstraint('user_id', 'consultation_id', 'precedent_id', name='unique_user_consultation_precedent'),
    )
