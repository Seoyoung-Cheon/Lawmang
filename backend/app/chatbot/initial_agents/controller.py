# ✅ controller.py
import asyncio
from typing import Dict, Optional
from langchain_community.vectorstores import FAISS
from app.chatbot.initial_agents.initial_chatbot import LegalChatbot
from app.chatbot.initial_agents.ask_human_for_info import AskHumanAgent

async def run_initial_controller(
    user_query: str,
    faiss_db: FAISS,
    current_yes_count: int = 0,
    template_data: Optional[Dict[str, any]] = None,
    stop_event: Optional[asyncio.Event] = None,  # ✅ 추가됨
) -> Dict:
    chatbot = LegalChatbot(faiss_db=faiss_db)
    ask_human_agent = AskHumanAgent()

    initial_result = await chatbot.generate(
        user_query=user_query,
        current_yes_count=current_yes_count,
    )

    initial_response = initial_result.get("initial_response", "")
    is_no = initial_result.get("is_no", False)
    query_type = initial_result.get("query_type", "legal")

    updated_yes_count = initial_result.get("yes_count", current_yes_count)
    escalate_directly = initial_result.get("escalate_to_advanced", False)


    # ✅ 중단 신호 보내기
    if is_no and stop_event:
        stop_event.set()
        template_data["no_flag"] = True  # ✅ optional: ask_human()에서 참고용
        # ❌ return 하지 않고 계속 진행

    # 이후 반드시 실행됨
    ask_result = await ask_human_agent.ask_human(
        user_query=user_query,
        llm1_answer=initial_response,
        current_yes_count=updated_yes_count,
        template_data=template_data,
    )

    if query_type == "nonlegal":
        return {"status": "nonlegal_skipped", "initial_response": initial_response}

    if template_data is None:
        template_data = {}

    ask_result = await ask_human_agent.ask_human(
        user_query=user_query,
        llm1_answer=initial_response,
        current_yes_count=updated_yes_count,
        template_data=template_data,
    )
    print("✅ ask_result keys:", ask_result.keys())
    print("✅ mcq_question 내용:", ask_result.get("mcq_question"))
    final_yes_count = ask_result.get("yes_count", updated_yes_count)
    escalate_to_advanced = escalate_directly or final_yes_count >= 3

    status = "ok"
    if escalate_to_advanced:
        status = "advanced_triggered"
    elif ask_result.get("load_template_signal"):
        status = "template_load_triggered"

    return {
        "initial_response": initial_response,
        "escalate_to_advanced": escalate_to_advanced,
        "yes_count": final_yes_count,
        "load_template_signal": ask_result.get("load_template_signal"),
        "status": status,
        "mcq_question": ask_result.get("mcq_question"),
        "is_mcq": ask_result.get("is_mcq"),
        "precedent_summary": ask_result.get("precedent_summary"),
        "strategy_summary": ask_result.get("strategy_summary"),
        "debug_prompt": ask_result.get("debug_prompt"),
    }
