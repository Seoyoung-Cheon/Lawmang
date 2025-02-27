from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, func
from app.core.database import Base

class UserActivityLog(Base):
    """
    사용자의 상담 사례 열람, 판례 열람, 템플릿 다운로드, 메모 기록을 저장하는 테이블
    """
    __tablename__ = "user_activity_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users_account.id", ondelete="CASCADE"), nullable=False)  # users_account 테이블 참조
    consultation_id = Column(Integer, ForeignKey("legal_consultation.id", ondelete="SET NULL"), nullable=True)  # 상담사례 ID
    precedent_number = Column(Integer, ForeignKey("precedent.pre_number", ondelete="SET NULL"), nullable=True)  # 판례 번호
    title = Column(String(255), nullable=False)  # 제목
    content = Column(Text, nullable=True)  # 본문 (메모 내용, 다운로드한 템플릿 파일명 등)
    event_date = Column(Date, nullable=True)  # 관련 날짜 (재판 일정, 상담 일정 등)
    notification = Column(Boolean, default=False)  # 알림 설정 여부
    created_at = Column(DateTime, server_default=func.now())  # 기록 생성 시간

    def __repr__(self):
        return f"<UserActivityLog(id={self.id}, user_id={self.user_id}, title={self.title}, event_date={self.event_date})>"
