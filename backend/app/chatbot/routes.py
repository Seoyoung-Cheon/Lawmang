# from fastapi import APIRouter, HTTPException
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel
# import asyncio
# import json

# from app.chatbot.main import (
#     load_faiss,
#     llm2_lock,
#     run_initial_controller,
#     run_full_consultation,
#     run_final_answer_generation,
# )
# from app.chatbot.tool_agents.utils.utils import faiss_kiwi

# router = APIRouter()


# class QueryRequest(BaseModel):
#     query: str


# @router.post("/search/stream")
# async def chat_stream(request: QueryRequest):
#     user_query = request.query.strip()
#     if not user_query:
#         raise HTTPException(status_code=400, detail="질문이 비어 있습니다.")

#     faiss_db = load_faiss()
#     if not faiss_db:
#         raise HTTPException(status_code=500, detail="FAISS 로드 실패")

#     stop_event = asyncio.Event()
#     template_data = {}

#     # ✅ LLM1과 LLM2 병렬 실행
#     initial_task = asyncio.create_task(
#         run_initial_controller(
#             user_query=user_query,
#             faiss_db=faiss_db,
#             current_yes_count=0,
#             template_data=template_data,
#             stop_event=stop_event,
#         )
#     )

#     build_task = asyncio.create_task(
#         run_full_consultation(
#             user_query,
#             faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db),  # 위치 인자
#             "gpt-4",
#             True,
#             stop_event,
#         )
#     )

#     async def event_generator():
#         try:
#             # 🔄 먼저 LLM1 결과만 받아서 바로 yield
#             initial_result = await asyncio.shield(initial_task)  # LLM1 보호 실행

#             llm1_filtered = {
#                 "mcq_question": initial_result.get("mcq_question"),
#                 "strategy_summary": initial_result.get("strategy_summary"),
#                 "precedent_summary": initial_result.get("precedent_summary"),
#                 "yes_count": initial_result.get("yes_count"),
#             }
#             yield json.dumps({"type": "llm1", "data": llm1_filtered}) + "\n"

#             # ✅ LLM2 조건 충족 시 실행 (YES ≥ 3)
#             if initial_result.get("yes_count", 0) >= 3:
#                 # LLM2 대기
#                 prepared_data = await asyncio.shield(build_task)
#                 if not all(
#                     prepared_data.get(k) for k in ["template", "strategy", "precedent"]
#                 ):
#                     yield json.dumps({
#                         "type": "llm2",
#                         "error": "⚠️ 전략 또는 판례 생성 실패"
#                     }) + "\n"
#                     return

#                 async with llm2_lock:
#                     final_answer = run_final_answer_generation(
#                         prepared_data["template"],
#                         prepared_data["strategy"],
#                         prepared_data["precedent"],
#                         user_query,
#                         model="gpt-4",
#                     )

#                 yield json.dumps({
#                     "type": "llm2",
#                     "data": {
#                         "final_answer": final_answer,
#                         "final_summary": prepared_data["template"]["summary"],
#                         "strategy_summary": prepared_data["strategy"]["final_strategy_summary"],
#                         "precedent_summary": prepared_data["precedent"]["summary"],
#                         "casenote_url": prepared_data["precedent"]["casenote_url"],
#                     },
#                 }) + "\n"

#         except Exception as e:
#             yield json.dumps({
#                 "type": "error",
#                 "message": f"❌ 스트리밍 중 오류: {str(e)}"
#             }) + "\n" 

#     return StreamingResponse(event_generator(), media_type="text/event-stream")

# ---------------------------------

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import sys
import asyncio
from asyncio import Lock
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from app.chatbot.tool_agents.executor.normalanswer import run_final_answer_generation
from app.chatbot.initial_agents.controller import run_initial_controller
from app.chatbot.tool_agents.controller import run_full_consultation
from app.chatbot.tool_agents.utils.utils import faiss_kiwi
from fastapi import FastAPI

# ✅ 락: 중복 실행 방지 (LLM2 관련)
llm2_lock = Lock()
yes_count = 0
sys.path.append(os.path.abspath("."))
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DB_FAISS_PATH = "./app/chatbot/faiss"

app = FastAPI()

router = APIRouter()
yes_count_memory = {}  # 간단한 글로벌 YES 메모리 (세션/유저 구분 가능시 확장)


def load_faiss():
    try:
        embedding_model = OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key=OPENAI_API_KEY,
        )
        return FAISS.load_local(
            DB_FAISS_PATH,
            embedding_model,
            allow_dangerous_deserialization=True,
        )
    except Exception as e:
        # print(f"❌ FAISS 로드 실패: {e}")
        return None
class QueryRequest(BaseModel):
    query: str


# ✅ 1. LLM1: 초기 응답만
@router.post("/initial")
async def chatbot_initial(request: QueryRequest):
    user_query = request.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="질문이 비어 있습니다.")

    faiss_db = load_faiss()
    if not faiss_db:
        raise HTTPException(status_code=500, detail="FAISS 로드 실패")

    stop_event = asyncio.Event()
    template_data = {}

    result = await run_initial_controller(
        user_query=user_query,
        faiss_db=faiss_db,
        current_yes_count=0,
        template_data=template_data,
        stop_event=stop_event,
    )

    # YES 카운트 저장
    yes_count_memory[user_query] = result.get("yes_count", 0)

    # 판례/전략은 렌더링하지 않음
    return {
        "mcq_question": result.get("mcq_question"),
        "yes_count": result.get("yes_count", 0),
        # 필요시 아래 주석 해제
        # "strategy_summary": result.get("strategy_summary"),
        # "precedent_summary": result.get("precedent_summary"),
    }


# ✅ 2. LLM2 빌드 전용: 전략/판례 캐싱만 수행
@router.post("/prepare")
async def chatbot_prepare(request: QueryRequest):
    user_query = request.query.strip()
    faiss_db = load_faiss()
    if not faiss_db:
        raise HTTPException(status_code=500, detail="FAISS 로드 실패")

    keywords = faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db)
    stop_event = asyncio.Event()

    # 전략 + 판례만 생성 (GPT 호출 없이)
    await run_full_consultation(
        user_query=user_query,
        search_keywords=keywords,
        model="gpt-4",
        build_only=True,
        stop_event=stop_event,
    )

    return {"status": "ok", "message": "백그라운드 빌드 완료"}


# ✅ 3. LLM2 최종 응답: 고급 GPT 실행
@router.post("/advanced")
async def chatbot_advanced(request: QueryRequest):
    user_query = request.query.strip()
    faiss_db = load_faiss()
    if not faiss_db:
        raise HTTPException(status_code=500, detail="FAISS 로드 실패")

    keywords = faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db)
    stop_event = asyncio.Event()

    # 전략/판례 + GPT 최종 응답까지 생성
    prepared_data = await run_full_consultation(
        user_query=user_query,
        search_keywords=keywords,
        model="gpt-4",
        build_only=False,
        stop_event=stop_event,
    )

    if not all(prepared_data.get(k) for k in ["template", "strategy", "precedent"]):
        raise HTTPException(status_code=500, detail="전략 또는 판례 생성 실패")

    async with llm2_lock:
        final_answer = run_final_answer_generation(
            template=prepared_data["template"],
            strategy=prepared_data["strategy"],
            precedent=prepared_data["precedent"],
            user_query=user_query,
            model="gpt-4",
        )

    return {
        "template": prepared_data["template"],
        "strategy": prepared_data["strategy"],
        "precedent": prepared_data["precedent"],
        "final_answer": final_answer,
        "status": "ok",
    }
