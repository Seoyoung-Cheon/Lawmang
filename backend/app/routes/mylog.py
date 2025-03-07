from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.mylog_service import (
    create_memo, update_notification_status, create_or_update_viewed_log, 
    get_user_viewed_logs, hide_memo, get_user_memos, update_memo, delete_viewed_log, delete_all_viewed_logs
)
from app.schemas.mylog import MemoCreate, MemoUpdate, ViewedLogCreate, MemoResponse, ViewedLogResponse
import time

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
    if not new_memo:
        raise HTTPException(status_code=500, detail="메모 저장 실패")
    return new_memo


# ✅ 특정 사용자의 삭제되지 않은 메모 조회 (GET /api/mylog/memo/{user_id})
@router.get("/memo/{user_id}", response_model=list[MemoResponse])
def get_user_memos_route(user_id: int, db: Session = Depends(get_db)):
    memos = get_user_memos(db, user_id)
    return memos


# ✅ 메모 수정 (PUT /api/mylog/memo/{memo_id})
@router.put("/memo/{memo_id}", response_model=MemoResponse)
def update_memo_route(memo_id: int, memo: MemoUpdate, db: Session = Depends(get_db)):
    updated_memo = update_memo(db, memo_id, memo)
    if not updated_memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    return updated_memo


# ✅ 메모 삭제 (DELETE /api/mylog/memo/{memo_id})
@router.delete("/memo/{memo_id}")
def delete_memo_route(memo_id: int, db: Session = Depends(get_db)):
    deleted_memo = hide_memo(db, memo_id)
    if not deleted_memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    
    return {"message": "메모가 삭제되었습니다.", "memo_id": memo_id}


# ✅ 특정 메모의 알림 설정 변경 (PATCH /api/mylog/memo/{memo_id}/notification)
@router.patch("/memo/{memo_id}/notification")
def update_notification_route(memo_id: int, notification: bool, db: Session = Depends(get_db)):
    success = update_notification_status(db, memo_id, notification)
    if not success:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    
    return {"message": "알림 설정이 업데이트되었습니다.", "memo_id": memo_id, "notification": notification}


# 중복 요청 방지를 위한 캐시
request_cache = {}
CACHE_TIMEOUT = 2  # 2초

# ✅ 열람 기록 저장 (POST /api/mylog/viewed/{user_id})
@router.post("/viewed/{user_id}")
def create_viewed_log_route(user_id: int, viewed_log: ViewedLogCreate, db: Session = Depends(get_db)):
    result = create_or_update_viewed_log(
        db=db,
        user_id=user_id,
        consultation_id=viewed_log.consultation_id,
        precedent_number=viewed_log.precedent_number,
    )

    if result["status"] == "cached":
        # 캐시된 결과 반환
        return result["data"]
    elif result["status"] == "success":
        # 새로운 결과 반환
        return result["data"]
    else:
        # 오류 처리
        raise HTTPException(
            status_code=500,
            detail=result.get("message", "열람 기록 저장 중 오류가 발생했습니다.")
        )


# ✅ 특정 사용자의 열람 기록 조회 (GET /api/mylog/viewed/{user_id})
@router.get("/viewed/{user_id}", response_model=list[ViewedLogResponse])
def get_user_viewed_logs_route(user_id: int, db: Session = Depends(get_db)):
    logs = get_user_viewed_logs(db, user_id)

    if logs is None:
        raise HTTPException(status_code=404, detail="열람 기록을 찾을 수 없습니다.")

    return logs


# ✅ 특정 열람 기록 삭제 (DELETE /api/mylog/viewed/{log_id})
@router.delete("/viewed/{log_id}")
def delete_viewed_log_route(log_id: int, db: Session = Depends(get_db)):
    success = delete_viewed_log(db, log_id)
    if not success:
        raise HTTPException(status_code=404, detail="열람 기록을 찾을 수 없습니다.")
    return {"message": "열람 기록이 삭제되었습니다.", "log_id": log_id}


# ✅ 특정 사용자의 모든 열람 기록 삭제 (DELETE /api/mylog/viewed/user/{user_id})
@router.delete("/viewed/user/{user_id}")
def delete_all_viewed_logs_route(user_id: int, db: Session = Depends(get_db)):
    success = delete_all_viewed_logs(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="삭제할 열람 기록이 없습니다.")
    return {"message": "모든 열람 기록이 삭제되었습니다.", "user_id": user_id}