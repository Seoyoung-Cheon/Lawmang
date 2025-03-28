from app.chatbot.tool_agents.qualifier import run_consultation_qualifier
from app.chatbot.tool_agents.planner import (
    generate_response_template,
    run_response_strategy_with_limit,
)
from app.chatbot.tool_agents.precedent import LegalPrecedentRetrievalAgent
from app.chatbot.tool_agents.executor.normalanswer import run_final_answer_generation
from app.chatbot.tool_agents.tools import async_search_consultation
from app.chatbot.memory.global_cache import (
    get_cached_result,
    update_cached_result,
    cache_intermediate_result,
)
from typing import List


async def run_full_consultation(
    user_query: str,
    search_keywords: List[str],
    model: str = "gpt-4",
) -> dict:
    session_id = user_query[:20]
    cached = get_cached_result(session_id)
    print("✅ [user_query 확인]:", user_query)
    print("✅ [search_keywords 확인]:", search_keywords)

    if not isinstance(model, str):
        raise TypeError(
            f"❌ model 인자는 문자열(str)이어야 합니다. 현재 타입: {type(model)}, 값: {model}"
        )


    # 1️⃣ Qualifier 실행
    consultation_results, _, _ = await async_search_consultation(search_keywords)
    best_case = await run_consultation_qualifier(user_query, consultation_results)
    if best_case.get("status") in ["no_match", "irrelevant", "parse_error"]:
        return {"status": "fail_qualifier", "error": "적절한 상담을 찾을 수 없습니다."}

    title = best_case["title"]
    question = best_case["question"]
    answer = best_case["answer"]

    # 2️⃣ Template 생성
    if not cached or "template" not in cached:
        template = await generate_response_template(title, question, answer, user_query)
        cache_intermediate_result(
            session_id,
            {
                "template": template,
                "strategy": None,
                "precedent": None,
                "escalated_once": False,  # 캐시에 상태도 함께 저장
            },
        )
    else:
        template = cached["template"]

    # 3️⃣ Strategy 생성
    if not cached or not cached.get("strategy"):
        strategy = await run_response_strategy_with_limit(
            template["explanation"],
            user_query,
            template.get("hyperlinks", []),
        )
        update_cached_result(session_id, "strategy", strategy)
    else:
        strategy = cached["strategy"]

    # 4️⃣ Precedent 검색
    if not cached or not cached.get("precedent"):
        precedent_agent = LegalPrecedentRetrievalAgent()
        precedent = await precedent_agent.run(
            categories=[title], titles=[title], user_input_keywords=search_keywords
        )
        update_cached_result(session_id, "precedent", precedent)
    else:
        precedent = cached["precedent"]

    print("\n🧪 [TEMPLATE 생성 완료]:", template.get("summary", "요약 없음"))
    print(
        "🧪 [STRATEGY 생성 완료]:", strategy.get("final_strategy_summary", "요약 없음")
    )
    print("🧪 [PRECEDENT 생성 완료]:", precedent.get("summary", "요약 없음"))

    # 5️⃣ YES 3회 미만이면 최종 응답 생략
    if not cached.get("escalated_once", False):
        print("⏸️ [LLM2 실행 보류] 아직 YES 카운트 3 미만이므로 최종 응답 생략")
        return {
            "user_query": user_query,
            "template": template,
            "strategy": strategy,
            "precedent": precedent,
            "final_answer": None,
            "status": "intermediate_ready",
        }

    # 6️⃣ Final Answer 생성
    final_answer = run_final_answer_generation(
        template=template,
        strategy=strategy,
        precedent=precedent,
        user_query=user_query,
        model=model,
    )

    return {
        "user_query": user_query,
        "template": template,
        "strategy": strategy,
        "precedent": precedent,
        "final_answer": final_answer,
        "status": "ok",
    }
