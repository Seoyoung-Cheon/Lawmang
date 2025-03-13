from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from app.schemas.memo import MemoUpdate
from app.models.memo import Memo


# ✅ 메모리 캐시 추가 (전역 변수)
_view_cache = {}
CACHE_DURATION = 60  # 캐시 유효 시간 (초)

# ✅ 메모 저장
def create(db: Session, user_id: int, title: str, content: str = None, 
           event_date = None, notification: bool = False):
    try:
        if event_date and isinstance(event_date, str):
            event_date = datetime.strptime(event_date, "%Y-%m-%d").date()
        new_memo = Memo(
            user_id=user_id,
            title=title,
            content=content,
            event_date=event_date,
            notification=notification
        )
        db.add(new_memo)
        db.commit()
        db.refresh(new_memo)
        return new_memo
    except SQLAlchemyError as e:
        print(f"🔥 메모 저장 오류: {e}")
        db.rollback()
        return None


# ✅ 사용자 메모 조회
def get_list(db: Session, user_id: int):
    return db.query(Memo).filter(
        Memo.user_id == user_id
    ).order_by(Memo.created_at.desc()).all()


# ✅ 메모 수정
def update(db: Session, memo_id: int, user_id: int, memo_data: MemoUpdate):
    try:
        memo = db.query(Memo).filter(
            Memo.id == memo_id,
            Memo.user_id == user_id
        ).first()

        if not memo:
            return None

        for field, value in memo_data.dict(exclude_unset=True).items():
            setattr(memo, field, value)

        db.commit()
        db.refresh(memo)
        return memo
    except SQLAlchemyError as e:
        print(f"🔥 메모 업데이트 오류: {e}")
        db.rollback()
        return None


# ✅ 알림 상태 수정
def update_alert(db: Session, memo_id: int, user_id: int, notification: bool):
    try:
        memo = db.query(Memo).filter(
            Memo.id == memo_id,
            Memo.user_id == user_id
        ).first()

        if not memo:
            return False

        memo.notification = notification
        db.commit()
        return True
    except SQLAlchemyError as e:
        print(f"🔥 알림 설정 업데이트 오류: {e}")
        db.rollback()
        return False


# ✅ 캐시 정리 함수 추가
def cleanup_cache():
    current_time = datetime.utcnow()
    expired_keys = [
        key for key, (timestamp, _) in _view_cache.items()
        if (current_time - timestamp).total_seconds() > CACHE_DURATION
    ]
    for key in expired_keys:
        del _view_cache[key]


# ✅ 메모 삭제
def remove(db: Session, memo_id: int, user_id: int):
    try:
        memo = db.query(Memo).filter(
            Memo.id == memo_id,
            Memo.user_id == user_id
        ).first()

        if not memo:
            return False

        db.delete(memo)
        db.commit()
        return True
    except SQLAlchemyError as e:
        print(f"🔥 메모 삭제 오류: {e}")
        db.rollback()
        return False