from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.memo_service import (
    create, update_alert, remove,
    get_list, update
)
from app.schemas.memo import MemoCreate, MemoUpdate, MemoResponse

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


# 중복 요청 방지를 위한 캐시
request_cache = {}
CACHE_TIMEOUT = 2  # 2초