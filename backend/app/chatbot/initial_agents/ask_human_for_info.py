import os
import re
import asyncio
from typing import Optional, Dict, Any
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from app.chatbot.tool_agents.tools import LawGoKRTavilySearch

# 환경변수 로드
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
        self.llm_simple = load_llm()
        self.llm_mcq = load_llm()
        self.tavily_search = LawGoKRTavilySearch()

    def build_followup_prompt_ko(
        self, user_query: str, llm1_answer: str, yes_count: int
    ) -> str:
        return f"""
당신은 법률 보조 AI입니다. 사용자의 질문이 모호하거나 정보가 부족하여 후속 질문을 생성합니다.

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
        user_query: str,
        llm1_answer: str,
        precedent_summary: str,
        strategy_summary: str = "",
        yes_count: int = 0,
    ) -> str:
        return f"""
당신은 법률 상담 보조 AI입니다. 판례 정보를 바탕으로 객관식 질문을 생성하여 사용자의 추가 정보를 유도합니다.

❓ 사용자 질문:
{user_query}

💬 이전 AI 응답:
{llm1_answer}

📚 검색된 판례 요약:
{precedent_summary}

🧠 전략 요약 (선택적):
{strategy_summary or "해당 없음"}

📌 현재까지 확인된 ###yes 카운트: {yes_count}

🎯 작업:
아래 형식으로 객관식 질문 1개를 생성하세요.

질문: [객관식 질문 텍스트]
A. [선택지 A]
B. [선택지 B]
C. [선택지 C]
D. [선택지 D]
정답: [A/B/C/D]

조건:
- 선택지는 4개로 명확히 작성.
- 판례 내용 반드시 포함.
- 사용자의 질문과 밀접한 관련 내용 포함.
"""
    async def generate_followup_question(
        self,
        user_query: str,
        llm1_answer: str,
        current_yes_count: int = 0,
    ) -> dict:
        yes_count_detected = len(re.findall(r"###yes", llm1_answer, flags=re.IGNORECASE))
        total_yes_count = current_yes_count + yes_count_detected

        # 프롬프트 생성
        prompt = self.build_followup_prompt_ko(user_query, llm1_answer, total_yes_count)

        try:
            response = await self.llm_simple.ainvoke(prompt)
            followup_question = response.content.strip()

            load_template_signal = total_yes_count in [2, 3]

            if total_yes_count >= 3:
                total_yes_count = 0  # reset counter

            # ✅ debug_prompt 추가 반환
            return {
                "followup_question": followup_question,
                "yes_count": total_yes_count,
                "is_mcq": False,
                "load_template_signal": load_template_signal,
                "debug_prompt": prompt,  # 디버그용 프롬프트 반환
            }
        except Exception as e:
            return {
                "followup_question": "후속 질문 생성 중 오류 발생",
                "error": str(e),
                "yes_count": current_yes_count,
                "is_mcq": False,
                "load_template_signal": False,
                "debug_prompt": prompt,  # 예외 상황에서도 반환
            }

    async def generate_mcq_question(
        self,
        user_query: str,
        llm1_answer: str,
        current_yes_count: int = 0,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> dict:
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

        prompt = self.build_mcq_prompt_with_precedent(
            user_query=user_query,
            llm1_answer=llm1_answer,
            precedent_summary=precedent_summary,
            strategy_summary=strategy_summary,
            yes_count=current_yes_count,
        )

        try:
            response = await self.llm_mcq.ainvoke(prompt)
            mcq_content = response.content.strip()

            question_match = re.search(r"질문:\s*(.+?)\nA\.", mcq_content, re.DOTALL)
            options_match = re.findall(r"([ABCD])\.\s*(.+)", mcq_content)
            answer_match = re.search(r"정답:\s*([ABCD])", mcq_content)

            if question_match and options_match and answer_match:
                question_text = question_match.group(1).strip()
                options_dict = {label: option.strip() for label, option in options_match}
                correct_answer = answer_match.group(1)

                formatted_mcq = {
                    "question": question_text,
                    "options": options_dict,
                    "correct_answer": correct_answer,
                }

                load_template_signal = current_yes_count in [2, 3]

                return {
                    "followup_question": formatted_mcq,
                    "yes_count": 0 if current_yes_count >= 3 else current_yes_count,
                    "is_mcq": True,
                    "load_template_signal": load_template_signal,
                    "precedent_summary": precedent_summary,
                    "strategy_summary": strategy_summary,
                    "debug_prompt": prompt,  # ✅ MCQ 프롬프트 반환 추가
                }
            else:
                return {
                    "followup_question": "객관식 질문 생성 포맷 오류 발생",
                    "error": "응답 포맷 오류",
                    "yes_count": current_yes_count,
                    "is_mcq": True,
                    "load_template_signal": False,
                    "debug_prompt": prompt,  # ✅ 오류 발생 시에도 MCQ 프롬프트 반환
                }

        except Exception as e:
            return {
                "followup_question": "객관식 질문 생성 중 오류 발생",
                "error": str(e),
                "yes_count": current_yes_count,
                "is_mcq": True,
                "load_template_signal": False,
                "debug_prompt": prompt,  # ✅ 예외 발생 시에도 MCQ 프롬프트 반환
            }

    # 통합 메서드 (yes count에 따라 자동 선택)
    async def ask_human(
        self,
        user_query: str,
        llm1_answer: str,
        current_yes_count: int = 0,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> dict:
        yes_count_detected = len(re.findall(r"###yes", llm1_answer, flags=re.IGNORECASE))
        total_yes_count = current_yes_count + yes_count_detected

        if total_yes_count >= 2:  # ✅ YES 누적이 2 이상일 경우만 판례 기반 MCQ 호출
            return await self.generate_mcq_question(
                user_query, llm1_answer, total_yes_count, template_data
            )
        else:
            return await self.generate_followup_question(
                user_query, llm1_answer, total_yes_count
            )


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