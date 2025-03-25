# planner.py

import json
import openai
from tools import LawGoKRTavilySearch

openai.api_key = "YOUR_OPENAI_API_KEY"


async def generate_response_template(
    title: str,
    question: str,
    answer: str,
    user_query: str,
    model: str = "gpt-3.5-turbo",
) -> dict:
    """
    📌 선택된 상담(title, question, answer)을 바탕으로,
    LLM이 쉽게 활용할 수 있는 응답 템플릿(summary, explanation, 링크 등)을 구성.
    """

    prompt = f"""
당신은 법률 상담 응답 템플릿을 구성하는 AI입니다.

사용자의 질문:
"{user_query}"

상담 주제(title):
"{title}"

상담 질문(question):
"{question}"

상담 답변(answer):
"{answer}"

--- 작업 지시 ---
1. 사용자가 이해하기 쉽게 핵심 내용을 요약하세요 (summary).
2. 요약을 바탕으로, 상담 답변의 내용을 일반인이 이해할 수 있도록 풀어서 설명하세요 (explanation).
3. 답변과 관련된 법령/판례가 있다면 하이퍼링크 형태로 제공하세요. label과 url을 포함한 리스트 형식 (hyperlinks).
4. 그리고 이 상담에서 사용된 `question`은 참고용 질문이므로 'ref_question'이라는 key로 반환하세요.

--- 응답 예시 ---
{{
  "summary": "...",
  "explanation": "...",
  "hyperlinks": [{{"label": "...", "url": "..."}}], 
  "ref_question": "..."
}}

반드시 위 JSON 형식 그대로 응답하세요.
"""

    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "당신은 법률 응답 템플릿을 생성하는 전문가입니다.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )

    result_text = response.choices[0].message["content"]
    print("✅ [응답 템플릿 결과]:", result_text)


    try:
        return json.loads(result_text)
    except Exception as e:
        print("❌ JSON 파싱 오류:", e)
        return {"error": "GPT 응답 파싱 실패"}

# planner.py 내부

async def evaluate_strategy_with_tavily(
    strategy: dict, tavily_results: list, model: str = "gpt-3.5-turbo"
) -> dict:
    """
    📌 Tavily에서 가져온 여러 요약과 전략을 비교하여,
    전략이 부실하면 needs_revision: True로 판단
    """

    if not tavily_results or not isinstance(tavily_results, list):
        return {
            "needs_revision": False,
            "reason": "Tavily 결과가 없거나 유효하지 않아 전략 평가를 건너뜁니다.",
            "tavily_snippets": [],
        }

    # 최대 3개의 요약 추출
    tavily_snippets = []
    for result in tavily_results[:3]:
        text = result.get("content") or result.get("snippet") or result.get("text")
        if text:
            tavily_snippets.append(text.strip())

    if not tavily_snippets:
        return {
            "needs_revision": False,
            "reason": "Tavily에서 유의미한 요약 텍스트를 추출할 수 없습니다.",
            "tavily_snippets": [],
        }

    # Tavily 요약 내용 하나로 합치기
    combined_snippets = "\n\n".join(
        [f"[요약 {i + 1}]\n{text}" for i, text in enumerate(tavily_snippets)]
    )

    prompt = f"""
당신은 법률 상담 전략을 평가하는 AI입니다.

[GPT 전략 요약]
{strategy.get("final_strategy_summary", "")}

[Tavily 요약 결과들]
{combined_snippets}

--- 작업 지시 ---
Tavily 요약 1~3개를 모두 참고하여, GPT 전략이 부실하거나 중요한 정보를 누락했는지 평가하세요.  

- Tavily 요약들이 법령/조항/핵심 문장을 담고 있는데 전략에서 이를 다루지 않으면 부실합니다.
- 전략이 너무 추상적이거나 애매하면 보완이 필요합니다.

아래 JSON 형식으로 답변하세요:

{{
  "needs_revision": true or false,
  "reason": "...",
  "tavily_snippets": [...]
}}
"""

    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "당신은 GPT 전략과 법률 요약의 질적 차이를 평가하는 법률 분석가입니다.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    result_text = response.choices[0].message["content"]
    print("✅ [Tavily 기반 전략 평가 결과]:", result_text)

    try:
        return json.loads(result_text)
    except Exception as e:
        print("❌ JSON 파싱 실패:", e)
        return {
            "needs_revision": False,
            "reason": "GPT 응답 파싱 실패",
            "tavily_snippets": tavily_snippets,
        }


async def revise_strategy_with_feedback(
    original_strategy: dict,
    tavily_snippets: list,
    model: str = "gpt-3.5-turbo",
) -> dict:
    """
    📌 전략이 부족하다고 판단되었을 경우, Tavily 요약을 참고해 전략을 보완
    """
    combined_snippets = "\n\n".join(
        [
            f"[Tavily 요약 {i + 1}]\n{snippet}"
            for i, snippet in enumerate(tavily_snippets)
        ]
    )

    prompt = f"""
GPT가 만든 기존 전략이 너무 모호하거나 핵심 정보를 누락한 것으로 판단됩니다.  
아래 Tavily 요약을 참고하여 전략을 보완하세요.

[Tavily 요약들]
{combined_snippets}

[기존 전략 요약]
{original_strategy.get("final_strategy_summary", "")}

--- 작업 지시 ---
- 기존 전략을 기반으로 하되, Tavily의 법령 요약을 반영하여 더 명확하게 수정하세요.
- 전체 전략 JSON 구조는 유지하세요.

응답 형식 (JSON):
{{
  "tone": "...",
  "structure": "...",
  "decision_tree": ["..."],
  "final_strategy_summary": "...",
  "recommended_links": [{{"label": "...", "url": "..."}}]
}}
"""

    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "당신은 전략을 보완하는 법률 응답 전문가입니다.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    result_text = response.choices[0].message["content"]
    print("✅ [전략 보완 결과]:", result_text)

    try:
        return json.loads(result_text)
    except Exception as e:
        print("❌ 전략 보완 파싱 실패:", e)
        return {"error": "GPT 전략 보완 실패"}

async def generate_response_strategy(
    explanation: str,
    user_query: str,
    hyperlinks: list = None,
    model: str = "gpt-3.5-turbo",
) -> dict:
    """
    📌 설명 초안을 기반으로 전략 설계 + Tavily 평가까지 자동 수행
    """
    hyperlinks = hyperlinks or []

    hyperlink_text = (
        "\n".join([f"- {item['label']}: {item['url']}" for item in hyperlinks])
        if hyperlinks
        else "없음"
    )

    # 1️⃣ 전략 설계 프롬프트
    prompt = f"""
당신은 법률 응답 전략을 설계하는 전문가입니다.

[사용자 질문]
"{user_query}"

[설명 초안]
"{explanation}"

[관련 법률 링크]
{hyperlink_text}

--- 작업 지시 ---
1. 사용자 경험을 고려해 적절한 말투(tone/style)를 설계하세요.  
2. 응답 흐름 구조를 설명하세요.  
3. 조건/예외 흐름이 있다면 decision_tree 형식으로 만드세요.  
4. 전체 전략을 요약하세요.  
5. 추천 링크를 리스트로 정리하세요.

응답 형식 (JSON):
{{
  "tone": "...",
  "structure": "...",
  "decision_tree": ["..."],
  "final_strategy_summary": "...",
  "recommended_links": [{{"label": "...", "url": "..."}}]
}}
"""

    # 2️⃣ 전략 생성
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": "당신은 법률 상담 전략을 설계하는 AI입니다."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
    )

    strategy_raw = response.choices[0].message["content"]
    print("✅ [전략 설계 결과]:", strategy_raw)

    try:
        strategy = json.loads(strategy_raw)
    except Exception as e:
        print("❌ 전략 파싱 실패:", e)
        return {"error": "GPT 전략 파싱 실패"}


    # 3️⃣ Tavily 평가 자동 포함
    search_tool = LawGoKRTavilySearch(max_results=3)
    tavily_results = search_tool.run(user_query)

    evaluation = await evaluate_strategy_with_tavily(strategy, tavily_results)

    # 평가 결과 추가
    strategy["evaluation"] = evaluation

    return strategy


async def run_response_strategy_with_limit(
    explanation, user_query, hyperlinks, model="gpt-3.5-turbo"
):
    """
    📌 전략 생성 후, Tavily 평가 → 필요시 1회 보완만 허용
    """
    # 1️⃣ 전략 생성
    strategy = await generate_response_strategy(
        explanation, user_query, hyperlinks, model
    )

    evaluation = strategy.get("evaluation", {})
    if evaluation.get("needs_revision") is True:
        print("⚠️ 전략 보완 요청 감지 → 1회에 한해 보완합니다.")
        revised = await revise_strategy_with_feedback(
            original_strategy=strategy,
            tavily_snippets=evaluation.get("tavily_snippets", []),
        )
        revised["evaluation"] = {"revised": True}
        return revised

    return strategy
