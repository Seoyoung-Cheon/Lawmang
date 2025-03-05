from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.mylog import UserActivityLog
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime


def create_memo(db: Session, user_id: int, title: str, content: str, event_date=None, notification=False):
    try:
        if event_date and isinstance(event_date, str):
            event_date = datetime.strptime(event_date, "%Y-%m-%d").date()
        new_memo = UserActivityLog(
            user_id=user_id,
            title=title,
            content=content,
            event_date=event_date,
            notification=notification,
        )
        db.add(new_memo)
        db.commit()
        db.refresh(new_memo)
        return new_memo
    except SQLAlchemyError as e:
        print(f"🔥 메모 저장 오류: {e}")
        return None


# ✅ 특정 사용자의 메모 조회 (title과 content가 있는 데이터만 반환)
def get_user_memos(db: Session, user_id: int):
    return db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id,
        UserActivityLog.title.isnot(None),
        UserActivityLog.content.isnot(None),
        UserActivityLog.is_deleted == False
    ).all()


# ✅ 열람기록 저장
def create_viewed_log(db: Session, user_id: int, consultation_id=None, precedent_number=None):
    try:
        new_log = UserActivityLog(
            user_id=user_id,
            consultation_id=consultation_id,
            precedent_number=precedent_number
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)  # ✅ 변경 사항 반영
        return new_log
    except SQLAlchemyError as e:
        print(f"🔥 열람기록 저장 오류: {e}")
        return None


# ✅ 특정 사용자의 열람 기록 조회 (판례 / 상담 사례 열람한 내역만 반환)
def get_user_viewed_logs(db: Session, user_id: int):
    logs = db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id,
        or_(
            UserActivityLog.consultation_id.isnot(None),
            UserActivityLog.precedent_number.isnot(None)
        )
    ).all()

    return logs


# ✅ 특정 메모의 알림 설정 업데이트 (변경 사항 반영)
def update_notification_status(db: Session, memo_id: int, notification: bool):
    try:
        memo = db.query(UserActivityLog).filter(UserActivityLog.id == memo_id).first()
        if not memo:
            return False
        memo.notification = notification
        db.commit()
        db.refresh(memo)  # ✅ 변경 사항 즉시 반영
        return True
    except SQLAlchemyError as e:
        print(f"🔥 알림 설정 업데이트 오류: {e}")
        return False


# ✅ 메모 삭제 (is_deleted = True로 설정)
def hide_memo(db: Session, memo_id: int):
    memo = db.query(UserActivityLog).filter(UserActivityLog.id == memo_id).first()
    if not memo:
        return None
    memo.is_deleted = True
    db.commit()
    db.refresh(memo)
    return memo