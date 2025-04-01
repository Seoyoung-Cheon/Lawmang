from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from app.chatbot.initial_agents.controller import run_initial_controller
from app.chatbot.tool_agents.controller import run_full_consultation
from app.chatbot.tool_agents.executor.normalanswer import run_final_answer_generation
from app.chatbot.tool_agents.utils.utils import faiss_kiwi
from app.chatbot.main import load_faiss, llm2_lock

import asyncio
import json

router = APIRouter()


class QueryRequest(BaseModel):
    query: str


@router.post("/search/stream")
async def streaming_chat(request: QueryRequest):
    faiss_db = load_faiss()
    if not faiss_db:
        raise HTTPException(status_code=500, detail="FAISS 로드 실패")

    async def event_stream():
        try:
            keywords = faiss_kiwi.extract_top_keywords_faiss(request.query, faiss_db)

            # 🔄 LLM2 백그라운드 빌드
            llm2_task = asyncio.create_task(
                run_full_consultation(
                    user_query=request.query,
                    search_keywords=keywords,
                    build_only=True,
                    stop_event=None,
                )
            )

            # ✅ LLM1 실행
            llm1_result = await run_initial_controller(
                user_query=request.query,
                faiss_db=faiss_db,
                current_yes_count=0,
                template_data={},
                stop_event=None,
            )

            # 1️⃣ 초기 응답 빠르게 출력
            initial_response = llm1_result.get("initial_response", "").strip()
            yield (
                json.dumps({"type": "llm1", "data": {"text": initial_response}}) + "\n"
            )

            # 2️⃣ 후속 질문 (조금 나중에 append=True)
            mcq_question = llm1_result.get("mcq_question", "").strip()
            if mcq_question:
                await asyncio.sleep(2)
                yield (
                    json.dumps(
                        {"type": "llm1", "data": {"text": mcq_question, "append": True}}
                    )
                    + "\n"
                )
                # ✅ LLM2 조건 충족 시
                if llm1_result.get("yes_count", 0) >= 3:

                    # 🔹 로그 메시지: 전략 설계 시작
                    yield json.dumps({
                        "type": "log",
                        "message": "📐 전략 설계 중입니다. 잠시만 기다려 주세요..."
                    }) + "\n"

                    prepared = await llm2_task
                    template = prepared.get("template")
                    strategy = prepared.get("strategy")
                    precedent = prepared.get("precedent")

                    if not template or not strategy:
                        yield json.dumps({
                            "type": "llm2",
                            "error": "⚠️ 템플릿 또는 전략 생성 실패"
                        }) + "\n"
                        return

                    if not precedent:
                        yield json.dumps({
                            "type": "llm2",
                            "error": "⚠️ 판례 검색 실패"
                        }) + "\n"
                        return

                    # 🔹 로그 메시지: GPT 응답 시작
                    yield json.dumps({
                        "type": "log",
                        "message": "🤖 고급 응답을 생성하고 있습니다..."
                    }) + "\n"

                    async with llm2_lock:
                        final_answer = run_final_answer_generation(
                            template, strategy, precedent, request.query, model="gpt-4"
                        )

                    yield json.dumps({
                        "type": "llm2",
                        "data": {
                            "final_answer": final_answer,
                            "final_summary": template.get("summary", ""),
                            "strategy_summary": strategy.get("final_strategy_summary", ""),
                            "precedent_summary": precedent.get("summary", ""),
                            "casenote_url": precedent.get("casenote_url", ""),
                        },
                    }) + "\n"
                

        except Exception as e:
            yield (
                json.dumps(
                    {"type": "error", "message": f"스트리밍 도중 오류 발생: {str(e)}"}
                )
                + "\n"
            )

    return StreamingResponse(event_stream(), media_type="text/event-stream")
