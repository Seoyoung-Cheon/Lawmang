import os
import json
import asyncio
from typing import Optional, Dict, Any
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from app.chatbot.tool_agents.tools import LawGoKRTavilySearch
from app.chatbot.tool_agents.utils.utils import insert_hyperlinks_into_text
from app.chatbot.memory.global_cache import memory  # ConversationBufferMemory 인스턴스
from app.chatbot.tool_agents.tools import async_ES_search

# 글로벌 캐시 기능: 템플릿을 시스템 메시지로 저장하고 조회하는 함수들
from app.chatbot.memory.global_cache import (
    retrieve_template_from_memory,
)

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def load_llm():
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        api_key=OPENAI_API_KEY,
        temperature=0.3,
        max_tokens=1024,
    )


class AskHumanAgent:
    def __init__(self):
        self.llm = load_llm()
        self.tavily_search = LawGoKRTavilySearch()

# def build_mcq_prompt_full(self, user_query, llm1_answer, template_data, yes_count):
#     # 저장된 중간 데이터가 있을 경우 이를 사용하여 프롬프트를 구성
#     template = template_data.get("template", {}) if template_data else {}
#     strategy = template_data.get("strategy", {}) if template_data else {}
#     precedent = template_data.get("precedent", {}) if template_data else {}

#     summary_with_links = insert_hyperlinks_into_text(
#         template.get("summary", ""), template.get("hyperlinks", [])
#     )
#     explanation_with_links = insert_hyperlinks_into_text(
#         template.get("explanation", ""), template.get("hyperlinks", [])
#     )
#     hyperlinks_text = "\n".join(
#         f"- {link['label']}: {link['url']}" for link in template.get("hyperlinks", [])
#     )
#     strategy_decision_tree = "\n".join(strategy.get("decision_tree", []))
#     precedent_summary = precedent.get("summary", "판례 요약 없음")
#     precedent_link = precedent.get("casenote_url", "링크 없음")
#     precedent_meta = f"{precedent.get('court', '')} / {precedent.get('j_date', '')} / {precedent.get('title', '')}"

#     # 🔍 ES 결과가 있을 경우 프롬프트에 포함
#     es_results = template_data.get("es_results", [])
#     es_context = ""
#     if es_results:
#         es_context += "\n[ES 유사 상담]\n"
#         for i, item in enumerate(es_results, start=1):
#             es_context += f"\n📌 [{i}번 상담]\n"
#             es_context += f"- 제목(title): {item.get('title', '')}\n"
#             es_context += f"- 질문(question): {item.get('question', '')}\n"
#             es_context += f"- 답변(answer): {item.get('answer', '')}\n"

#     # ConversationBufferMemory 내 대화 히스토리 조회
#     memory.load_memory_variables({}).get("chat_history", "")

#     prompt = f"""
# 당신은 법률 상담을 생성하는 고급 AI입니다.

# [사용자 질문]
# {user_query}

# {es_context}

# [요약]
# {summary_with_links}

# [설명]
# {explanation_with_links}

# [참고 질문]
# {template.get("ref_question", "해당 없음")}

# [하이퍼링크]
# {hyperlinks_text}

# [전략 요약]
# {strategy.get("final_strategy_summary", "")}

# [응답 구성 전략]
# - 말투: {strategy.get("tone", "")}
# - 흐름: {strategy.get("structure", "")}
# - 조건 흐름도:
# {strategy_decision_tree}

# [추천 링크]
# {json.dumps(strategy.get("recommended_links", []), ensure_ascii=False)}

# [추가된 판례 요약]
# - {precedent_summary}
# - 링크: {precedent_link}
# - 정보: {precedent_meta}

# 🎯 작업:
# - 이전 대화와 이어지는 위 내용을 반영하여, 사용자가 신뢰할 수 있는 법률 상담을 생성하세요.
# - 각 항목은 실제 상황을 반영하며, 사용자가 자신의 상황에 맞는 선택지를 이해할 수 있게 구성해야 합니다.
# """
#     return prompt


    async def build_mcq_prompt_full(
        self, user_query, llm1_answer, template_data, yes_count
    ):
        template = template_data.get("template", {}) if template_data else {}
        strategy = template_data.get("strategy", {}) if template_data else {}
        precedent = template_data.get("precedent", {}) if template_data else {}

        summary_with_links = insert_hyperlinks_into_text(
            template.get("summary", ""), template.get("hyperlinks", [])
        )
        explanation_with_links = insert_hyperlinks_into_text(
            template.get("explanation", ""), template.get("hyperlinks", [])
        )
        hyperlinks_text = "\n".join(
            f"- {link['label']}: {link['url']}" for link in template.get("hyperlinks", [])
        )
        strategy_decision_tree = "\n".join(strategy.get("decision_tree", []))
        precedent_summary = precedent.get("summary", "판례 요약 없음")
        precedent_link = precedent.get("casenote_url", "링크 없음")
        precedent_meta = f"{precedent.get('court', '')} / {precedent.get('j_date', '')} / {precedent.get('title', '')}"

        # ✅ es_results가 없으면 검색 실행
        es_results = template_data.get("es_results", [])
        if not es_results:
            es_results = await async_ES_search([user_query])

        es_context = ""
        if es_results:
            es_context += "\n[ES 유사 상담]\n"
            for i, item in enumerate(es_results, start=1):
                es_context += f"\n📌 [{i}번 상담]\n"
                es_context += f"- 제목(title): {item.get('title', '')}\n"
                es_context += f"- 질문(question): {item.get('question', '')}\n"
                es_context += f"- 답변(answer): {item.get('answer', '')}\n"

        memory.load_memory_variables({}).get("chat_history", "")

        prompt = f"""
    당신은 법률 상담을 생성하는 고급 AI입니다.

    [사용자 질문]
    {user_query}
    [가장 정확한 상담사례]
    {es_context}

    [요약]
    {summary_with_links}

    [설명]
    {explanation_with_links}

    [참고 질문]
    {template.get("ref_question", "해당 없음")}

    [하이퍼링크]
    {hyperlinks_text}

    [전략 요약]
    {strategy.get("final_strategy_summary", "")}

    [응답 구성 전략]
    - 말투: {strategy.get("tone", "")}
    - 흐름: {strategy.get("structure", "")}
    - 조건 흐름도:
    {strategy_decision_tree}

    [추천 링크]
    {json.dumps(strategy.get("recommended_links", []), ensure_ascii=False)}

    [추가된 판례 요약]
    - {precedent_summary}
    - 링크: {precedent_link}
    - 정보: {precedent_meta}
    ------------------------------------------------
    🎯 작업:
    - 반드시 [가장 정확한 상담사례]의 질문 및 답변 내용을 기반으로 응답을 생성하세요.
    - 그 외의 정보(요약, 설명, 전략)는 모두 이 상담사례에 맞춰 정리해야 합니다.
    - 나머지 항목들은 참고일 뿐이며, 오직 해당 상담사례가 진짜 상황이라고 가정하세요.
    """
        return prompt

    async def generate_mcq_question(
        self, user_query, llm1_answer, yes_count=0, template_data=None
    ):
        prompt = await self.build_mcq_prompt_full(
            user_query, llm1_answer, template_data or {}, yes_count
        )
        response = await self.llm.ainvoke(prompt)
        return response.content.strip()

    async def ask_human(
        self, user_query, llm1_answer, current_yes_count=0, template_data=None
    ):
        # 캐시된 중간 데이터 조회: ConversationBufferMemory에서 저장된 템플릿 데이터 사용
        cached_data = retrieve_template_from_memory()
        # 빌드가 완료된 경우에만 (built 플래그가 True) 캐시 사용
        if cached_data and cached_data.get("built", False):
            # print("✅ [캐시된 중간 데이터 사용]")
            template_data = cached_data

        # llm1의 초기 응답에서 "###yes" 시그널을 검출하여 yes_count 증가
        yes_count_detected = 1 if "###yes" in llm1_answer.lower() else 0
        total_yes_count = current_yes_count + yes_count_detected

        # print("\n🤖 AI: 후속 질문을 준비 중입니다...")
        mcq_q = await self.generate_mcq_question(
            user_query, llm1_answer, total_yes_count, template_data
        )

        # 두 번째 이후 답변에서는 저장된 템플릿 반영
        if total_yes_count >= 2:
            mcq_q = f"{mcq_q}\n\n[저장된 템플릿 사용됨]"

        return {
            "yes_count": total_yes_count,
            "mcq_question": mcq_q,
            "is_mcq": True,
            "load_template_signal": total_yes_count >= 2,
        }


def check_user_wants_advanced_answer(user_query: str) -> bool:
    keywords = [
        "고급 답변",
        "상세한 설명",
        "자세히 알려줘",
        "gpt-4",
        "판례까지",
        "전략도",
        "고급 AI",
    ]
    return any(k in user_query.lower() for k in keywords)
