from sqlalchemy.orm import Session
from app.core.database import execute_sql
from app.models.user import User
from app.models.mylog import UserActivityLog
from datetime import datetime
from typing import List, Optional

def get_user_logs(db: Session, user_id: int) -> List[UserActivityLog]:
    """
    사용자의 활동 로그를 조회하는 함수
    """
    logs = db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id
    ).order_by(UserActivityLog.created_at.desc()).all()

    return logs if logs else []


def create_user_log(
    db: Session,
    user_id: int,
    title: str,
    content: Optional[str] = None,
    consultation_id: Optional[int] = None,
    precedent_number: Optional[int] = None,
    event_date: Optional[datetime] = None,
    notification: bool = False
) -> Optional[UserActivityLog]:
    try:
        log = UserActivityLog(
            user_id=user_id,
            title=title,
            content=content,
            consultation_id=consultation_id,
            precedent_number=precedent_number,
            event_date=event_date,
            notification=notification
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
    
    except Exception as e:
        db.rollback()
        print(f"Error creating log: {e}")
        return None


def get_user_logs_old(db: Session, user_id: int):
    """
    특정 사용자의 활동 로그를 조회하는 서비스 함수
    - 조인을 통해 상담 사례 및 판례 관련 정보도 함께 조회
    """
    # 🔥 ORM을 사용하여 사용자 존재 여부 확인
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None  # FastAPI 라우터에서 404 처리하도록 반환

    # 🔥 RAW SQL을 사용하여 user_activity_log 관련 데이터 조회
    query = """
    SELECT 
        ual.id, 
        ual.user_id, 
        ual.title, 
        ual.content, 
        ual.event_date, 
        ual.notification, 
        ual.created_at,
        lc.title AS consultation_title, 
        lc.category AS consultation_category,
        p.pre_number AS precedent_number
    FROM user_activity_log AS ual
    LEFT JOIN legal_consultation AS lc ON ual.consultation_id = lc.id
    LEFT JOIN precedent AS p ON ual.precedent_number = p.pre_number
    WHERE ual.user_id = :user_id
    ORDER BY ual.created_at DESC;
    """

    params = {"user_id": user_id}
    logs = execute_sql(query, params)

    return logs  # JSON 형태로 반환
