from fastapi import APIRouter, HTTPException
from app.core.database import execute_sql
from langchain_openai import ChatOpenAI
import os
from app.services.precedent_detail_service import fetch_external_precedent_detail
from app.services.consultation_detail_service import get_consultation_detail_by_id
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

router = APIRouter()

# ✅ API 호출 시점에 OpenAI 객체 생성 (런타임 오류 방지)
def get_openai_llm():
    return ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.7, openai_api_key=OPENAI_API_KEY)


# ✅ 판례 상세 정보 조회
@router.get("/precedent/{pre_number}")
async def fetch_precedent_detail(pre_number: int):
    try:
        detail = await fetch_external_precedent_detail(pre_number)
        return detail
    except HTTPException as e:
        # 서비스에서 발생한 HTTPException은 그대로 전달
        raise e


# ✅ 상담 상세 정보 조회
@router.get("/consultation/{consultation_id}")
def fetch_consultation_detail(consultation_id: int):
    try:
        detail = get_consultation_detail_by_id(consultation_id)
        return detail
    except HTTPException as e:
        # 서비스에서 발생한 HTTPException은 그대로 전달
        raise e


# ✅ 판례 요약 생성
@router.get("/precedent/summary/{pre_number}")
async def get_precedent_summary(pre_number: int):
    """판례 번호를 받아 해당 판례의 요약을 반환하는 API"""

    if pre_number <= 0:
        raise HTTPException(status_code=400, detail="유효하지 않은 판례 번호입니다.")

    # 판례 정보 조회
    query = """
    SELECT c_name, court, j_date, c_number, pre_number, c_type, d_link
    FROM precedent
    WHERE pre_number = :pre_number;
    """
    params = {"pre_number": pre_number}
    results = execute_sql(query, params)

    if not results:
        raise HTTPException(status_code=404, detail="해당 판례를 찾을 수 없습니다.")

    precedent = dict(results[0])
    precedent_text = f"판례명: {precedent['c_name']}\n법원: {precedent['court']}\n선고일자: {precedent['j_date']}\n판례번호: {precedent['pre_number']}\n판례 유형: {precedent['c_type']}"

    try:
        # OpenAI 요약 호출
        llm = get_openai_llm()
        summary_prompt = f"""
        다음 판례 내용을 바탕으로 상세한 요약을 생성해주세요. 
        주요 판결 이유, 사건 개요 및 법률적 쟁점을 포함하여 5~7문장 이상의 요약을 작성해 주세요.
        
        판례 내용:
        {precedent_text}
        """
        summary = llm.invoke(summary_prompt)

        return {"pre_number": pre_number, "summary": summary.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"요약 생성에 실패했습니다. 오류: {str(e)}")