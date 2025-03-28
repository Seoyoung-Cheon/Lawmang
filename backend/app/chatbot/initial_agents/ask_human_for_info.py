import os
import re
from typing import Optional
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
from app.chatbot.memory.templates import get_default_strategy_template

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def load_llm():
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        api_key=OPENAI_API_KEY,
        temperature=0.6,
        max_tokens=512,
    )


def build_followup_prompt_ko(user_query: str, llm1_answer: str) -> str:
    return f"""
당신은 법률 보조 AI입니다. 다음 사용자 질문은 모호하거나 정보가 부족하여,
당신은 사용자가 좀 더 구체적인 정보를 제공할 수 있도록 유도 질문을 만들어야 합니다.

❓ 사용자 질문:
{user_query}

💬 AI 응답:
{llm1_answer}

---

🎯 요청 작업:
사용자가 더 명확한 질문을 할 수 있도록 도와주는 “후속 질문” 1개를 생성하세요.
- 질문은 명확하고 구체적이어야 합니다.
- 사용자가 실제 사건 정보를 더 많이 드러내도록 유도해야 합니다.

출력:
후속 질문: [작성된 질문]
"""


def build_mcq_prompt_ko(
    user_query: str,
    llm1_answer: str,
    strategy_summary: str = "",
    precedent_summary: str = "",
) -> str:
    return f"""
당신은 법률 상담 보조 AI입니다. 사용자의 질문이 다소 모호하거나 추가 정보가 필요한 경우,
해당 질문을 **객관식 문제** 형태로 재구성하여 사용자가 자신의 의도를 더 명확히 하도록 도와주세요.

다음은 사용자의 원래 질문입니다:
❓ {user_query}

다음은 이전 AI 응답입니다 (불완전하거나 단편적일 수 있음):
💬 {llm1_answer}

[선택적 참고 요약]
- 🧠 전략 요약: {strategy_summary or "해당 없음"}
- 📚 판례 요약: {precedent_summary or "해당 없음"}

---

🎯 요청 작업:
위 정보를 참고하여, **사용자의 의도를 더 명확히 하기 위한 객관식 질문 1개를 생성**해주세요.
다음 조건을 반드시 지켜주세요:

- 질문은 명확하고 사실에 근거해야 함
- 선택지는 반드시 4개 (A~D), 정답은 하나
- 법률 또는 실생활 사례와 관련된 맥락 포함
- 판례, 법령, 교과서 등 신뢰 가능한 근거에 기반할 것
- 너무 쉬운 보기는 피하고, 실제로 고민하게 만드는 보기 포함

📄 출력 형식은 다음과 같아야 합니다:

질문: [객관식 질문 텍스트]  
A. [선택지 A]  
B. [선택지 B]  
C. [선택지 C]  
D. [선택지 D]  
정답: [A/B/C/D]

※ 질문은 반드시 **원래 질문과 관련성**이 있어야 하며,
   전략이나 판례 요약이 있다면 이를 적극 활용해주세요.
"""


async def ask_human_for_information(
    user_query: str, llm1_answer: str, llm=None, user_id: Optional[str] = None
) -> dict:
    if not llm:
        llm = load_llm()

    yes_count = len(re.findall(r"###yes", llm1_answer, flags=re.IGNORECASE))
    no_count = len(re.findall(r"###no", llm1_answer, flags=re.IGNORECASE))

    is_clear = yes_count > 0
    is_ambiguous = no_count > 0 or yes_count == 0

    prompt = ""
    if is_ambiguous:
        prompt = build_followup_prompt_ko(user_query, llm1_answer)
    else:
        prompt = build_mcq_prompt_ko(
            user_query=user_query,
            llm1_answer=llm1_answer,
            strategy_summary="",  # 필요하면 strategy 전달 가능
            precedent_summary="",  # 필요하면 precedent 전달 가능
        )

    try:
        response = await llm.ainvoke(prompt)
        followup_question = response.content.strip()

        # yes_count 관리 (누적 방식, 3이상이면 3으로 고정)
        total_yes_count = yes_count if yes_count < 3 else 3

        return {
            "followup_question": followup_question,
            "yes_count": total_yes_count,
            "is_mcq": not is_ambiguous,
        }

    except Exception as e:
        return {
            "followup_question": "질문 생성 중 오류가 발생했습니다.",
            "error": str(e),
            "yes_count": 0,
            "is_mcq": False,
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
