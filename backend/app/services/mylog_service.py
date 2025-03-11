from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.mylog import UserActivityLog
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from app.schemas.mylog import MemoUpdate
from functools import lru_cache
from app.core.database import execute_sql

# ✅ 메모리 캐시 추가 (전역 변수)
_view_cache = {}
CACHE_DURATION = 60  # 캐시 유효 시간 (초)

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
        cache_key = f"{user_id}_{consultation_id}_{precedent_number}"
        current_time = datetime.utcnow()

        # ✅ 캐시 확인 (2초 내 중복 요청 방지)
        if cache_key in _view_cache:
            last_view, cached_result = _view_cache[cache_key]
            if (current_time - last_view).total_seconds() < CACHE_DURATION:
                print(f"⚠️ [중복 요청 감지] {cache_key}")
                return {"status": "cached", "data": cached_result}

        # ✅ 기존 데이터 확인 (중복 방지)
        existing_log = db.query(UserActivityLog).filter(
            UserActivityLog.user_id == user_id,
            (UserActivityLog.consultation_id == consultation_id) if consultation_id 
            else (UserActivityLog.precedent_number == precedent_number)
        ).first()

        result = None
        if existing_log:
            existing_log.viewed_at = current_time
            db.commit()
            db.refresh(existing_log)
            result = existing_log
        else:
            new_log = UserActivityLog(
                user_id=user_id,
                consultation_id=consultation_id,
                precedent_number=precedent_number,
                viewed_at=current_time
            )
            db.add(new_log)
            db.commit()
            db.refresh(new_log)
            result = new_log

        # ✅ 캐시 업데이트
        _view_cache[cache_key] = (current_time, result)
        cleanup_cache()

        return {"status": "success", "data": result}

    except SQLAlchemyError as e:
        print(f"🔥 [쿼리 오류] 열람기록 저장 오류: {e}")
        return {"status": "error", "message": str(e)}


# ✅ 캐시 정리 함수 추가
def cleanup_cache():
    current_time = datetime.utcnow()
    expired_keys = [
        key for key, (timestamp, _) in _view_cache.items()
        if (current_time - timestamp).total_seconds() > CACHE_DURATION
    ]
    for key in expired_keys:
        del _view_cache[key]


# ✅ 특정 사용자의 열람 기록 조회 (최근 열람한 기록이 위로 오도록 정렬)
@lru_cache(maxsize=128)
def get_user_viewed_logs(db: Session, user_id: int):
    return db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id
    ).order_by(desc(UserActivityLog.viewed_at)).all()


# ✅ 특정 열람 기록 삭제
def delete_viewed_log(db: Session, log_id: int):
    log_entry = db.query(UserActivityLog).filter(UserActivityLog.id == log_id).first()
    if not log_entry:
        return False

    db.delete(log_entry)
    db.commit()
    return True


# ✅ 특정 사용자의 열람 기록 삭제 (메모 제외)
def delete_all_viewed_logs(db: Session, user_id: int):
    logs = db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id,
        (UserActivityLog.consultation_id.isnot(None) | UserActivityLog.precedent_number.isnot(None))
    ).all()
    
    if not logs:
        return False

    for log in logs:
        db.delete(log)
    
    db.commit()
    return True


# ✅ 열람기록 판례 목록 정보 불러오기
def get_precedent_info(precedent_number: str):
    """
    특정 판례 번호에 해당하는 판례 정보를 SQL 쿼리로 가져오는 함수
    """
    sql = """
        SELECT c_name, c_number, court, j_date 
        FROM precedent 
        WHERE pre_number = :precedent_number
    """
    result = execute_sql(sql, {"precedent_number": precedent_number}, fetch_one=True)

    # print(f"📌 판례 데이터 조회 결과: {result}")  # ✅ 로그 추가

    if not result:
        return None

    return {
        "title": result["c_name"],
        "caseNumber": result["c_number"],
        "court": result["court"],
        "date": result["j_date"],
    }