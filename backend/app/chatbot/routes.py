from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncio
from backend.app.chatbot import main


router = APIRouter()

class QueryRequest(BaseModel):
    query: str

@router.post("/search")
async def run_search(request: QueryRequest):
    query = request.query
    print(f"🔍 [INFO] 검색 실행: {query}")

    try:
        # create_search.search가 이미 비동기 함수이므로 직접 await
        result = await main.search(query)
        
        if isinstance(result, dict) and "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return {
            "status": "success",
            "data": result
        }

    except Exception as e:
        print(f"❌ [ERROR] 검색 실행 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))
