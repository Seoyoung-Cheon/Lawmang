from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.mylog_service import get_user_logs

router = APIRouter(prefix="/logs", tags=["user_logs"])

# ✅ 특정 사용자의 활동 로그 조회 API
@router.get("/{user_id}")
def get_user_logs_route(user_id: int, db: Session = Depends(get_db)):
    logs = get_user_logs(db, user_id)
    if logs is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    return logs if logs else []
