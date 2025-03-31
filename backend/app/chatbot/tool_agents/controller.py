from typing import List
from app.chatbot.tool_agents.qualifier import run_consultation_qualifier
from app.chatbot.tool_agents.planner import (
    generate_response_template,
    run_response_strategy_with_limit,
)
from app.chatbot.tool_agents.precedent import LegalPrecedentRetrievalAgent
from app.chatbot.tool_agents.executor.normalanswer import run_final_answer_generation
from app.chatbot.tool_agents.tools import async_search_consultation


async def run_full_consultation(
    user_query: str,
    search_keywords: List[str],
    model: str = "gpt-4",
    build_only: bool = False,
) -> dict:
    print("✅ [user_query 확인]:", user_query)
    print("✅ [search_keywords 확인]:", search_keywords)

    # 1️⃣ Qualifier 실행
    consultation_results, _, _ = await async_search_consultation(search_keywords)
    best_case = await run_consultation_qualifier(user_query, consultation_results)
    if not consultation_results:
        print("❌ [run_full_consultation] 검색된 상담 결과 없음")
        return {"template": None, "strategy": None, "precedent": None}
    if not all(k in best_case for k in ["title", "question", "answer"]):
        print("⚠️ [run_full_consultation] 일부 필드 누락 → fallback으로 진행")
        title = best_case.get("title", "법률상담")
        question = best_case.get("question", user_query)
        answer = best_case.get("answer", "일반적인 법률 정보에 기반하여 응답을 생성합니다.")
    else:
        title = best_case["title"]
        question = best_case["question"]
        answer = best_case["answer"]
        title = best_case["title"]
        question = best_case["question"]
        answer = best_case["answer"]

    # 2️⃣ Planner - 템플릿 생성
    template = await generate_response_template(title, question, answer, user_query)

    # 3️⃣ Planner - 전략 생성 + Tavily 평가 + 보완
    strategy = await run_response_strategy_with_limit(
        template["explanation"], user_query, template.get("hyperlinks", [])
    )

    # 4️⃣ Precedent 에이전트 실행
    precedent_agent = LegalPrecedentRetrievalAgent()
    precedent = await precedent_agent.run(
        categories=[title],
        titles=[title],
        user_input_keywords=search_keywords,
    )

    # ✅ 중간 빌드 데이터를 캐시 저장 (세션 단위)
    from app.chatbot.memory.global_cache import cache_intermediate_result

    session_id = user_query[:20]
    intermediate_data = {
        "template": template,
        "strategy": strategy,
        "precedent": precedent,
    }
    cache_intermediate_result(session_id, intermediate_data)

    # ✅ 빌드만 수행하는 경우 GPT 호출 없이 여기서 종료
    if build_only:
        return {
            "user_query": user_query,
            "template": template,
            "strategy": strategy,
            "precedent": precedent,
            "status": "build_only",
        }

    # 5️⃣ Final 응답 생성 (GPT 고급 응답 호출)
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
