from fastapi import APIRouter
from app.services.precedent_service import search_precedents

router = APIRouter()

# 판례 검색 API (사건명, 법원명, 사건번호 포함)
@router.get("/precedents/{keyword}")
def fetch_precedents(keyword: str):
    return search_precedents(keyword)