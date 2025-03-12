import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import create_search  # create_search.py 불러오기
import uvicorn

# ✅ FastAPI 앱 생성
app = FastAPI()

# ✅ 환경 변수 (HF_TOKEN 검증)
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    raise ValueError("❌ 환경 변수 HF_TOKEN이 설정되지 않았습니다!")

print("✅ HF_TOKEN이 올바르게 설정되었습니다.")


# ✅ API 입력 데이터 모델 정의
class QueryRequest(BaseModel):
    query: str


# ✅ 검색 API (create_search의 search 실행)
@app.post("/search")
async def run_search(request: QueryRequest):
    query = request.query
    print(f"🔍 [INFO] 검색 실행: {query}")

    try:
        # ✅ create_search.py의 `search()` 함수 실행
        result = create_search.search(query)

        # ✅ 결과 반환
        return result

    except Exception as e:
        print(f"❌ [ERROR] 검색 실행 오류: {e}")
        raise HTTPException(status_code=500, detail="검색 실행 중 오류 발생")


# ✅ 기본 루트
@app.get("/")
def read_root():
    return {"message": "Kobort Legal AI API is running 🚀"}


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8080, reload=True)