from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import asyncio, json
from app.chatbot.main import load_faiss, llm2_lock
from app.chatbot.tool_agents.utils.utils import faiss_kiwi
from app.chatbot.initial_agents.controller import run_initial_controller
from app.chatbot.tool_agents.controller import run_full_consultation,run_final_answer_generation

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

    initial_task = asyncio.create_task(
        run_initial_controller(
            user_query=user_query,
            faiss_db=faiss_db,
            current_yes_count=0,
            template_data=template_data,
            stop_event=stop_event,
        )
    )

    build_task = None
    if not llm2_lock.locked():
        build_task = asyncio.create_task(
            run_full_consultation(
                user_query,
                faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db),
                model="gpt-4",
                build_only=True,
                stop_event=stop_event,
            )
        )

    async def event_generator():
        try:
            initial_result = await initial_task
            raw_initial_response = initial_result.get("initial_response", "")
            has_yes_signal = "###yes" in raw_initial_response.lower()

            llm1_filtered = {
                "mcq_question": initial_result.get("mcq_question"),
                "strategy_summary": initial_result.get("strategy_summary"),
                "precedent_summary": initial_result.get("precedent_summary"),
                "yes_count": initial_result.get("yes_count"),
            }
            yield json.dumps({"type": "llm1", "data": llm1_filtered}) + "\n"

            if has_yes_signal:
                print("ℹ️ LLM1 신호 감지됨.")
                if not build_task:
                    build_task = asyncio.create_task(
                        run_full_consultation(
                            user_query,
                            faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db),
                            model="gpt-4",
                            build_only=False,
                            stop_event=stop_event,
                        )
                    )
                if build_task:
                    prepared_data = await build_task
                    template = prepared_data.get("template")
                    strategy = prepared_data.get("strategy")
                    precedent = prepared_data.get("precedent")
                    if template and strategy and precedent:
                        async with llm2_lock:
                            final_answer = run_final_answer_generation(
                                template, strategy, precedent, user_query, "gpt-4"
                            )
                        advanced_result = {
                            "template": template,
                            "strategy": strategy,
                            "precedent": precedent,
                            "final_answer": final_answer,
                            "status": "ok",
                        }
                        yield (
                            json.dumps({"type": "llm2", "data": advanced_result}) + "\n"
                        )
                    else:
                        yield (
                            json.dumps(
                                {
                                    "type": "llm2",
                                    "error": "⚠️ 템플릿/전략/판례 생성 실패",
                                }
                            )
                            + "\n"
                        )

        except Exception as e:
            yield (
                json.dumps(
                    {"type": "error", "message": f"스트리밍 도중 오류 발생: {str(e)}"}
                )
                + "\n"
            )

    return StreamingResponse(event_generator(), media_type="text/event-stream")
