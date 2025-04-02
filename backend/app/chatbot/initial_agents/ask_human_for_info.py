import os
import json
import asyncio
from typing import Optional, Dict, Any
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from app.chatbot.tool_agents.tools import LawGoKRTavilySearch
from app.chatbot.tool_agents.utils.utils import insert_hyperlinks_into_text
from app.chatbot.memory.global_cache import memory  # ConversationBufferMemory 인스턴스
from app.chatbot.initial_agents.initial_chatbot import LegalChatbot

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

    async def build_mcq_prompt_full(
        self,
        user_query,
        llm1_answer,
        template_data,
        yes_count,
        report: Optional[str] = None,  # ✅ 보고서 추가
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
            f"- {link['label']}: {link['url']}"
            for link in template.get("hyperlinks", [])
        )
        strategy_decision_tree = "\n".join(strategy.get("decision_tree", []))
        precedent_summary = precedent.get("summary", "판례 요약 없음")
        precedent_link = precedent.get("casenote_url", "링크 없음")
        precedent_meta = f"{precedent.get('court', '')} / {precedent.get('j_date', '')} / {precedent.get('title', '')}"

        memory.load_memory_variables({}).get("chat_history", "")

        prompt = f"""
        당신은 법률 상담을 생성하는 고급 AI입니다.

        아래는 1차 판단 결과로 생성된 실시간 보고서입니다.  
        **이 보고서는 반드시 후속 상담의 핵심 근거로 삼아야 하며**,  
        요약·설명·전략 등은 모두 이 보고서를 기반으로 작성되어야 합니다.

            

    📝 [실시간 판단 보고서]
    {report.strip() if report else "보고서 없음"}

    [사용자 질문]
    {user_query}

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
 🎯 작업:
 - 반드시 [실시간 판단 보고서] 내용을 최우선 판단 근거로 삼고, 신뢰할 수 있는 법률 상담을 생성하세요.
 - 이전 대화와 이어지는 위 내용을 반영하여, 사용자가 신뢰할 수 있는 법률 상담을 생성하세요.
 - 각 항목은 실제 상황을 반영하며, 사용자가 자신의 상황에 맞는 선택지를 이해할 수 있게 구성해야 합니다.
    """
        return prompt

    async def generate_mcq_question(
        self,
        user_query,
        llm1_answer,
        yes_count=0,
        template_data=None,
        report: Optional[str] = None,
    ):
        prompt = await self.build_mcq_prompt_full(
            user_query,
            llm1_answer,
            template_data or {},
            yes_count,
            report,  # ✅ 전달
        )
        response = await self.llm.ainvoke(prompt)
        return response.content.strip()
    
        
    async def ask_human(
        self,
        user_query,
        llm1_answer,
        current_yes_count=0,
        template_data=None,
        initial_response: Optional[str] = None,  # ✅ 보고서 직접 주입
    ):
        # 캐시된 템플릿 확인
        cached_data = retrieve_template_from_memory()
        if cached_data and cached_data.get("built", False):
            template_data = cached_data

        # YES count 누적
        yes_count_detected = 1 if "###yes" in llm1_answer.lower() else 0
        total_yes_count = current_yes_count + yes_count_detected

        # 후속 질문 생성
        mcq_q = await self.generate_mcq_question(
            user_query,
            llm1_answer,
            total_yes_count,
            template_data,
            report=initial_response,  # ✅ 전달
        )

        # 템플릿 사용 표기
        if total_yes_count >= 2:
            mcq_q = f"{mcq_q}\n\n[저장된 템플릿 사용됨]"

        # ✅ 보고서가 있으면 붙여서 반환
        if initial_response:
            combined = f"{initial_response.strip()}\n\n🧩 [후속 질문 제안]\n{mcq_q.strip()}"
        else:
            combined = mcq_q.strip()

        return {
            "yes_count": total_yes_count,
            "mcq_question": combined,
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
