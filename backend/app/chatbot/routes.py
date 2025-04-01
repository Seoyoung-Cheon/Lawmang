from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import asyncio
import json

from app.chatbot.main import (
    load_faiss,
    llm2_lock,
    run_initial_controller,
    run_full_consultation,
    run_final_answer_generation,
)
from app.chatbot.tool_agents.utils.utils import faiss_kiwi

router = APIRouter()


class QueryRequest(BaseModel):
    query: str


@router.post("/search/stream")
async def chat_stream(request: QueryRequest):
    user_query = request.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="질문이 비어 있습니다.")

    faiss_db = load_faiss()
    if not faiss_db:
        raise HTTPException(status_code=500, detail="FAISS 로드 실패")

    stop_event = asyncio.Event()
    template_data = {}

    # ✅ LLM1과 LLM2 병렬 실행
    initial_task = asyncio.create_task(
        run_initial_controller(
            user_query=user_query,
            faiss_db=faiss_db,
            current_yes_count=0,
            template_data=template_data,
            stop_event=stop_event,
        )
    )

    build_task = asyncio.create_task(
        run_full_consultation(
            user_query,
            faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db),  # 위치 인자
            "gpt-4",
            True,
            stop_event,
        )
    )

    async def event_generator():
        try:
            # ✅ 먼저 LLM1 응답을 기다려서 즉시 전송
            initial_result = await initial_task

            # 외부 출력 제한
            llm1_filtered = {
                "mcq_question": initial_result.get("mcq_question"),
                "strategy_summary": initial_result.get("strategy_summary"),
                "precedent_summary": initial_result.get("precedent_summary"),
                "yes_count": initial_result.get("yes_count"),
            }
            yield json.dumps({"type": "llm1", "data": llm1_filtered}) + "\n"

            # ✅ 조건 판단 후 LLM2 빌드 완료 시 결과 전송
            if initial_result.get("yes_count", 0) >= 3 and build_task:
                prepared_data = await build_task
                if not all(
                    [
                        prepared_data.get(k)
                        for k in ["template", "strategy", "precedent"]
                    ]
                ):
                    yield (
                        json.dumps(
                            {"type": "llm2", "error": "⚠️ 전략 또는 판례 생성 실패"}
                        )
                        + "\n"
                    )
                    return

                async with llm2_lock:
                    final_answer = run_final_answer_generation(
                        prepared_data["template"],
                        prepared_data["strategy"],
                        prepared_data["precedent"],
                        user_query,
                        model="gpt-4",
                    )

                yield (
                    json.dumps(
                        {
                            "type": "llm2",
                            "data": {
                                "final_answer": final_answer,
                                "final_summary": prepared_data["template"]["summary"],
                                "strategy_summary": prepared_data["strategy"][
                                    "final_strategy_summary"
                                ],
                                "precedent_summary": prepared_data["precedent"][
                                    "summary"
                                ],
                                "casenote_url": prepared_data["precedent"][
                                    "casenote_url"
                                ],
                            },
                        }
                    )
                    + "\n"
                )

        except Exception as e:
            yield (
                json.dumps(
                    {"type": "error", "message": f"❌ 스트리밍 중 오류: {str(e)}"}
                )
                + "\n"
            )

    return StreamingResponse(event_generator(), media_type="text/event-stream")
