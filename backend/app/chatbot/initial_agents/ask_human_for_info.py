import os
import re
import time
import asyncio
from typing import Optional, Dict, Any
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from app.chatbot.tool_agents.tools import LawGoKRTavilySearch

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def load_llm():
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        api_key=OPENAI_API_KEY,
        temperature=0.6,
        max_tokens=1024,
    )

class AskHumanAgent:
    def __init__(self):
        self.llm = load_llm()
        self.tavily_search = LawGoKRTavilySearch()

    def build_followup_prompt_ko(self, user_query, llm1_answer, yes_count):
        return f"""
당신은 법률 보조 AI입니다...

❓ 사용자 질문:
{user_query}

💬 이전 AI 응답:
{llm1_answer}

📌 현재까지 확인된 ###yes 카운트: {yes_count}

🎯 작업:
사용자가 더 명확한 질문을 할 수 있도록 돕는 후속 질문을 생성하세요.

형식:
후속 질문: [질문]
"""

    def build_mcq_prompt_with_precedent(
        self,
        user_query,
        llm1_answer,
        precedent_summary,
        strategy_summary="",
        yes_count=0,
    ):
        return f"""
당신은 법률 상담 보조 AI입니다.

아래 내용을 참고하여 사용자가 이해하기 쉬운 **관련 사례 4가지**를 제시하세요.

❓ 사용자 질문:
{user_query}

💬 이전 AI 응답:
{llm1_answer}

📚 검색된 판례 요약:
{precedent_summary}

🧠 전략 요약:
{strategy_summary or "해당 없음"}

📌 현재 ###yes 카운트: {yes_count}

🎯 작업:
- 각 사례를 A, B, C, D 형식으로 정리하세요.
- 선택지처럼 보이되, 실제로는 관련 사례 안내입니다.
- 각 항목은 구체적이고 실질적인 상황이어야 합니다.
"""

    async def generate_followup_question(self, user_query, llm1_answer, yes_count=0):
        prompt = self.build_followup_prompt_ko(user_query, llm1_answer, yes_count)
        response = await self.llm.ainvoke(prompt)
        return response.content.strip()

    async def generate_mcq_question(
        self, user_query, llm1_answer, yes_count=0, template_data=None
    ):
        tavily_results = await asyncio.to_thread(self.tavily_search.run, user_query)
        precedent_summary = (
            tavily_results[0].get("content", "판례 요약 없음")
            if isinstance(tavily_results, list) and tavily_results
            else "관련 판례를 찾을 수 없습니다."
        )
        strategy_summary = (
            template_data.get("strategy", {}).get("final_strategy_summary", "")
            if template_data
            else ""
        )
        precedent_summary = (
            template_data.get("precedent", {}).get("summary", precedent_summary)
            if template_data
            else precedent_summary
        )
        prompt = self.build_mcq_prompt_with_precedent(
            user_query, llm1_answer, precedent_summary, strategy_summary, yes_count
        )
        response = await self.llm.ainvoke(prompt)
        return response.content.strip()

    async def ask_human(
        self, user_query, llm1_answer, current_yes_count=0, template_data=None
    ):
        yes_count_detected = 1 if "###yes" in llm1_answer.lower() else 0
        total_yes_count = current_yes_count + yes_count_detected

        print("\n🤖 AI: 더 명확한 정보를 위해 후속 질문을 준비 중입니다...\n")
        await asyncio.sleep(2)

        followup_q = await self.generate_followup_question(
            user_query, llm1_answer, total_yes_count
        )
        print("🟢 일반 후속 질문:")
        print(followup_q)
        await asyncio.sleep(2)

        print("\n📡 [판례 정보를 찾는 중입니다...]\n")
        await asyncio.sleep(2)
        print("🧠 [전략 요약을 생성 중입니다...]\n")
        await asyncio.sleep(2)
        print("📘 [사례를 정리하여 객관식 질문을 구성 중입니다...]\n")
        await asyncio.sleep(2)

        mcq_q = await self.generate_mcq_question(
            user_query, llm1_answer, total_yes_count, template_data
        )
        print("🟦 사례 기반 객관식 질문:")
        print(mcq_q)

        return {
            "yes_count": total_yes_count,
            "followup_question": followup_q,
            "mcq_question": mcq_q,
            "is_mcq": True,
            "load_template_signal": total_yes_count in [2, 3],
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
