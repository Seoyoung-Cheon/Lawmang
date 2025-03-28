from typing import Dict
from langchain_community.vectorstores import FAISS
from app.chatbot.initial_agents.initial_chatbot import LegalChatbot
from app.chatbot.memory.global_cache import (
    make_session_id,
    get_cached_result,
    update_cached_result,
    clear_cached_result
)


async def run_initial_controller(
    user_query: str, faiss_db: FAISS, user_id: str
) -> Dict:
    chatbot = LegalChatbot(faiss_db=faiss_db)
    result = await chatbot.generate(user_query, user_id=user_id)

    response_text = result.get("initial_response", "")
    escalate = result.get("escalate_to_advanced", False)
    last_yes_query = result.get("last_yes_query")
    query_type = result.get("query_type")
    is_no = result.get("is_no", False)
    followup_question = result.get("followup_question")

    # ✅ session_id 기준
    session_id = make_session_id(user_id)
    cached = get_cached_result(session_id)

    # ✅ ###no 직접 감지 → 고급 처리 차단
    if is_no:
        print("❌ [###NO 응답 감지 → 고급 흐름 중단]")
        return {
            "user_query": user_query,
            "initial_response": response_text,
            "escalate_to_advanced": False,
            "last_yes_query": None,
            "status": "no_triggered",
            "followup_question": followup_question,
        }

    # ✅ 논외 질문(nonlegal)은 바로 응답 종료
    if query_type == "nonlegal":
        print("🚫 [비법률 질문으로 판단됨 → 고급 처리 중단]")
        return {
            "user_query": user_query,
            "initial_response": response_text,
            "escalate_to_advanced": False,
            "last_yes_query": None,
            "status": "nonlegal_skipped",
            "followup_question": followup_question,
        }

    # ✅ escalate 상태를 캐시에 저장
    if chatbot.escalated_once:
        update_cached_result(session_id, "escalated_once", True)

    # ✅ 전략/판례 준비 확인
    if escalate:
        strategy_ok = cached.get("strategy") is not None
        precedent_ok = cached.get("precedent") is not None

        if not strategy_ok or not precedent_ok:
            print("⏳ [전략 또는 판례 미완료 → 잠시 대기]")
            return {
                "user_query": user_query,
                "initial_response": response_text,
                "escalate_to_advanced": True,
                "last_yes_query": last_yes_query,
                "status": "wait_for_building",
                "followup_question": followup_question,
            }

        print("\n📦 [고급 LLM 호출 조건 만족 → 캐시된 전략/판례 사용]")
        print("📄 전략 요약:", cached["strategy"].get("final_strategy_summary", "없음"))
        print("📚 판례 요약:", cached["precedent"].get("summary", "없음"))
        print("🔗 링크:", cached["precedent"].get("casenote_url", "없음"))

        clear_cached_result(session_id)

        return {
            "user_query": user_query,
            "initial_response": response_text,
            "escalate_to_advanced": True,
            "last_yes_query": last_yes_query,
            "cached_strategy": cached["strategy"],
            "cached_precedent": cached["precedent"],
            "cached_template": cached["template"],
            "status": "cached_advanced_returned",
            "followup_question": followup_question,
        }

    # ✅ 기본 흐름
    return {
        "user_query": user_query,
        "initial_response": response_text,
        "escalate_to_advanced": escalate,
        "last_yes_query": last_yes_query,
        "status": "ok",
        "followup_question": followup_question,
    }
