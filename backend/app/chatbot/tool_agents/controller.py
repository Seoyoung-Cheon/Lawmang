from app.chatbot.tool_agents.qualifier import run_consultation_qualifier
from app.chatbot.tool_agents.planner import (
    generate_response_template,
    run_response_strategy_with_limit,
)
from app.chatbot.tool_agents.precedent import LegalPrecedentRetrievalAgent
from app.chatbot.tool_agents.executor.normalanswer import (
    run_final_answer_generation,
    evaluate_final_answer_with_tavily,
)
from app.chatbot.tool_agents.tools import async_search_consultation
from typing import List

async def run_full_consultation(
    user_query: str, search_keywords: List[str], model: str = "gpt-4"
) -> dict:
    """
    📌 전체 플로우 실행: qualifier → planner → precedent → final answer
    """

    # 1️⃣ Qualifier 실행 (유사 상담 찾기)
    consultation_results, _, _ = await async_search_consultation(search_keywords)
  # from tools.py
    best_case = await run_consultation_qualifier(user_query, consultation_results)

    if best_case.get("status") in ["no_match", "irrelevant", "parse_error"]:
        return {
            "error": "적절한 상담 데이터를 찾을 수 없습니다.",
            "status": "fail_qualifier",
        }

    title = best_case["title"]
    question = best_case["question"]
    answer = best_case["answer"]

    # 2️⃣ Planner - 템플릿 생성
    template = await generate_response_template(title, question, answer, user_query)

    # 3️⃣ Planner - 전략 생성 + Tavily 평가 + 보완 포함
    strategy = await run_response_strategy_with_limit(
        template["explanation"], user_query, template.get("hyperlinks", [])
    )

    # 4️⃣ Precedent 에이전트 실행
    precedent_agent = LegalPrecedentRetrievalAgent()
    precedent = await precedent_agent.run(
        categories=[title],
        titles=[title],
        user_input_keywords=search_keywords,  # ✅ user_query → search_keywords
    )
    # 5️⃣ Final 응답 생성
    final_answer = run_final_answer_generation(
        template=template,
        strategy=strategy,
        precedent=precedent,
        user_query=user_query,
        model=model,
    )

    # 6️⃣ 최종 응답 평가 (Tavily 기반)
    evaluation = await evaluate_final_answer_with_tavily(final_answer, user_query)

    return {
        "user_query": user_query,
        "template": template,
        "strategy": strategy,
        "precedent": precedent,
        "final_answer": final_answer,
        "final_evaluation": evaluation,
        "status": "ok",
    }
