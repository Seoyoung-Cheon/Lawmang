from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.mylog import UserActivityLog
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from app.schemas.mylog import MemoUpdate


# ✅ 메모 저장
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


# ✅ 특정 사용자의 삭제되지 않은 메모 조회
def get_user_memos(db: Session, user_id: int):
    return db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id,
        UserActivityLog.title.isnot(None),
        UserActivityLog.content.isnot(None),
        UserActivityLog.is_deleted == False
    ).all()


# ✅ 메모 수정 (프론트 요청 처리 유지)
def update_memo(db: Session, memo_id: int, memo_data: MemoUpdate):
    try:
        existing_memo = db.query(UserActivityLog).filter(
            UserActivityLog.id == memo_id, UserActivityLog.is_deleted == False
        ).first()

        if not existing_memo:
            return None  # 메모가 존재하지 않으면 None 반환

        # 🔥 None이 아닌 값만 업데이트
        if memo_data.title is not None:
            existing_memo.title = memo_data.title
        if memo_data.content is not None:
            existing_memo.content = memo_data.content
        if memo_data.event_date is not None:
            existing_memo.event_date = memo_data.event_date
        if memo_data.notification is not None:
            existing_memo.notification = memo_data.notification

        db.commit()
        db.refresh(existing_memo)
        return existing_memo

    except SQLAlchemyError as e:
        print(f"🔥 메모 업데이트 오류: {e}")
        return None


# ✅ 메모 삭제 (is_deleted = True 처리)
def hide_memo(db: Session, memo_id: int):
    memo = db.query(UserActivityLog).filter(
        UserActivityLog.id == memo_id,
        UserActivityLog.is_deleted == False
    ).first()

    if not memo:
        return None

    memo.is_deleted = True
    db.commit()
    db.refresh(memo)
    return memo


# ✅ 특정 메모의 알림 설정 업데이트
def update_notification_status(db: Session, memo_id: int, notification: bool):
    try:
        memo = db.query(UserActivityLog).filter(
            UserActivityLog.id == memo_id,
            UserActivityLog.title.isnot(None)  # 🔥 메모가 존재하는지 확인
        ).first()

        if not memo:
            return None  # 메모가 없으면 None 반환

        memo.notification = notification
        db.commit()
        db.refresh(memo)
        return True
    except SQLAlchemyError as e:
        print(f"🔥 알림 설정 업데이트 오류: {e}")
        return False


# ✅ 열람 기록 저장 (중복 방지)
def create_or_update_viewed_log(db: Session, user_id: int, consultation_id=None, precedent_number=None):
    try:
        print(f"📌 [쿼리 실행] user_id={user_id}, consultation_id={consultation_id}, precedent_number={precedent_number}")

        # 기존 기록이 있는지 확인
        existing_log = db.query(UserActivityLog).filter(
            UserActivityLog.user_id == user_id,
            (UserActivityLog.consultation_id == consultation_id) if consultation_id else (UserActivityLog.precedent_number == precedent_number)
        ).first()

        if existing_log:
            # 🔥 기존 기록이 있으면 `viewed_at` 갱신 (created_at은 변경되지 않음)
            print(f"🔄 기존 기록 업데이트: {existing_log.id}")
            existing_log.viewed_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_log)
            return existing_log

        # 🔥 새로운 기록 저장
        new_log = UserActivityLog(
            user_id=user_id,
            consultation_id=consultation_id,
            precedent_number=precedent_number,
            viewed_at=datetime.utcnow()
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        
        print(f"✅ [쿼리 성공] 새로운 열람 기록 추가됨: {new_log.id}")
        return new_log

    except SQLAlchemyError as e:
        print(f"🔥 [쿼리 오류] 열람기록 저장 오류: {e}")
        return None


# ✅ 특정 사용자의 열람 기록 조회 (최근 열람한 기록이 위로 오도록 정렬)
def get_user_viewed_logs(db: Session, user_id: int):
    return db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id
    ).order_by(desc(UserActivityLog.viewed_at)).all()