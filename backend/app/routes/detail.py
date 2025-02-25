from fastapi import APIRouter, HTTPException
from app.services.precedent_detail_service import fetch_external_precedent_detail
from app.services.consultation_detail_service import get_consultation_detail_by_id

router = APIRouter()

@router.get("/precedent/{pre_number}")
async def fetch_precedent_detail(pre_number: int):
    try:
        detail = await fetch_external_precedent_detail(pre_number)
        return detail
    except HTTPException as e:
        # 서비스에서 발생한 HTTPException은 그대로 전달
        raise e

@router.get("/consultation/{consultation_id}")
def fetch_consultation_detail(consultation_id: int):
    try:
        detail = get_consultation_detail_by_id(consultation_id)
        return detail
    except HTTPException as e:
        # 서비스에서 발생한 HTTPException은 그대로 전달
        raise e