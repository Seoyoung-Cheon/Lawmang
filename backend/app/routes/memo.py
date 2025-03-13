from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db, SessionLocal
from app.services.memo_service import (
    create, update_alert, remove,
    get_list, update, check_and_send_notifications
)
from app.schemas.memo import MemoCreate, MemoUpdate, MemoResponse

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import atexit

router = APIRouter()


# ✅ 메모 저장
@router.post("/{user_id}", response_model=MemoResponse)
def create_memo(user_id: int, memo: MemoCreate, db: Session = Depends(get_db)):
    result = create(
        db=db,
        user_id=memo.user_id,
        title=memo.title,
        content=memo.content,
        event_date=memo.event_date,
        notification=memo.notification
    )
    if not result:
        raise HTTPException(status_code=500, detail="메모 저장 실패")
    return result


# ✅ 사용자 메모 조회
@router.get("/{user_id}", response_model=list[MemoResponse])
def get_memos(user_id: int, db: Session = Depends(get_db)):
    return get_list(db, user_id)


# ✅ 메모 수정
@router.put("/{user_id}/{memo_id}", response_model=MemoResponse)
def update_memo(user_id: int, memo_id: int, memo: MemoUpdate, db: Session = Depends(get_db)):
    result = update(db, memo_id, user_id, memo)
    if not result:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    return result


# ✅ 메모 삭제
@router.delete("/{user_id}/{memo_id}")
def delete_memo(user_id: int, memo_id: int, db: Session = Depends(get_db)):
    if not remove(db, memo_id, user_id):
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    return {"message": "메모가 삭제되었습니다.", "memo_id": memo_id}


# ✅ 알림 설정 변경
@router.patch("/{user_id}/{memo_id}/alert")
def update_notification(
    user_id: int, memo_id: int, notification: bool, db: Session = Depends(get_db)
):
    if not update_alert(db, memo_id, user_id, notification):
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    return {
        "message": "알림 설정이 업데이트되었습니다.",
        "memo_id": memo_id,
        "notification": notification
    }


# ✅ 스케줄러에 의해 실행되는 함수
def scheduled_notification_job():
    """
    스케줄러에 의해 실행되는 함수로,
    현재 날짜 기준으로 event_date가 도래하고 notification이 활성화된 메모에 대해 이메일 알림을 전송합니다.
    """
    db = SessionLocal()
    try:
        sent_count = check_and_send_notifications(db)
        print(f"[{datetime.utcnow()}] 알림 전송: {sent_count}건")
    finally:
        db.close()


# ✅ 스케줄러 객체 생성 및 job 추가
scheduler = BackgroundScheduler()
# 예시: 매일 오전 8시(UTC 기준)에 실행되도록 설정 (원하는 시간으로 변경 가능)
trigger = CronTrigger(hour=8, minute=0)
scheduler.add_job(scheduled_notification_job, trigger)

scheduler.start()
atexit.register(lambda: scheduler.shutdown())

