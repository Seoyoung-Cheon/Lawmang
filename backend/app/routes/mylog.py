from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.mylog import UserActivityLog
from app.services.mylog_service import (
    create_memo, update_notification_status,
    create_viewed_log, get_user_viewed_logs, hide_memo
)
from app.schemas.mylog import MemoCreate, MemoUpdate, ViewedLogCreate, MemoResponse, ViewedLogResponse

router = APIRouter()

# ✅ 메모 저장 (POST /api/mylog/memo)
@router.post("/memo", response_model=MemoResponse)
def create_memo_route(memo: MemoCreate, db: Session = Depends(get_db)):
    new_memo = create_memo(
        db=db,
        user_id=memo.user_id,
        title=memo.title,
        content=memo.content,
        event_date=memo.event_date if memo.event_date else None,
        notification=memo.notification,
    )
    if new_memo is None:
        raise HTTPException(status_code=500, detail="메모 저장 실패")
    return new_memo


# ✅ 특정 사용자의 삭제되지 않은 메모 조회 (GET /api/mylog/memo/{user_id})
@router.get("/memo/{user_id}", response_model=list[MemoResponse])
def get_user_memos(user_id: int, db: Session = Depends(get_db)):
    memos = db.query(UserActivityLog).filter(
        UserActivityLog.user_id == user_id,
        UserActivityLog.title.isnot(None),
        UserActivityLog.is_deleted == False
    ).all()

    return memos or []


# ✅ 메모 수정 (PUT /api/mylog/memo/{memo_id})
@router.put("/memo/{memo_id}")
def update_memo(memo_id: int, memo: MemoUpdate, db: Session = Depends(get_db)):
    existing_memo = db.query(UserActivityLog).filter(
        UserActivityLog.id == memo_id, UserActivityLog.is_deleted == False
    ).first()

    if not existing_memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")

    # ✅ 수정된 값 업데이트
    existing_memo.title = memo.title
    existing_memo.content = memo.content
    existing_memo.event_date = memo.event_date if memo.event_date else None
    existing_memo.notification = memo.notification  # ✅ 알림 설정도 업데이트

    db.commit()
    db.refresh(existing_memo)
    return existing_memo


# ✅ DELETE 요청 (메모 삭제 처리) → PATCH에서 변경
@router.delete("/memo/{memo_id}")
def delete_memo(memo_id: int, db: Session = Depends(get_db)):
    memo = db.query(UserActivityLog).filter(
        UserActivityLog.id == memo_id,
        UserActivityLog.is_deleted == False
    ).first()

    if not memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")

    memo.is_deleted = True  # ✅ 메모 삭제 처리
    db.commit()
    db.refresh(memo)

    return {"message": "메모가 삭제되었습니다.", "memo_id": memo_id}



# ✅ 열람 기록 저장 (POST /api/mylog/viewed)
@router.post("/viewed")
def create_viewed_log_route(viewed_log: ViewedLogCreate, db: Session = Depends(get_db)):
    new_log = create_viewed_log(
        db=db,
        user_id=viewed_log.user_id,
        consultation_id=viewed_log.consultation_id,
        precedent_number=viewed_log.precedent_number
    )
    if new_log is None:
        raise HTTPException(status_code=500, detail="열람 기록 저장 실패")
    return new_log


# ✅ 특정 사용자의 열람 기록 조회 (GET /api/mylog/viewed/{user_id})
@router.get("/viewed/{user_id}", response_model=list[ViewedLogResponse])
def get_user_viewed_logs_route(user_id: int, db: Session = Depends(get_db)):
    return get_user_viewed_logs(db, user_id)
