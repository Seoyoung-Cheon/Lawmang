from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, func, UniqueConstraint
from app.core.database import Base

class UserActivityLog(Base):
    """
    사용자의 상담 사례 열람, 판례 열람, 템플릿 다운로드, 메모 기록을 저장하는 테이블
    """
    __tablename__ = "user_activity_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)  # 🔥 외래 키 없이 관리

    # ✅ 메모 관련 필드
    title = Column(Text, nullable=True)  # 메모 제목
    content = Column(Text, nullable=True)  # 메모 내용
    event_date = Column(Date, nullable=True)  # 관련 날짜 (YYYY-MM-DD 형식)
    notification = Column(Boolean, default=False, server_default="false")  # 알림 설정 여부
    created_at = Column(DateTime, server_default=func.now())  # 메모 생성 시간
    is_deleted = Column(Boolean, default=False)  # 삭제 여부 (기본값: False)

    # ✅ 열람기록 관련 필드 (메모에는 필요 없음)
    consultation_id = Column(Integer, nullable=True)  # 상담사례 ID
    precedent_number = Column(String(255), nullable=True)  # 판례 번호
    viewed_at = Column(DateTime, server_default=func.now(), onupdate=func.now())  # 열람 기록 시간 - 업데이트

    # 🔥 중복 저장 방지를 위한 제약 조건 추가
    __table_args__ = (
        UniqueConstraint('user_id', 'consultation_id', name='uq_user_consultation'),
        UniqueConstraint('user_id', 'precedent_number', name='uq_user_precedent'),
    )
