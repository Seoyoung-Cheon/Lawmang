import os
import json
import sys
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from app.chatbot.tool_agents.tools import LawGoKRTavilySearch
from app.chatbot.tool_agents.utils.utils import (
    insert_hyperlinks_into_text,
    extract_json_from_text
)
from langchain.memory import ConversationBufferMemory
from langchain_teddynote import logging

logging.langsmith("llamaproject")

# ✅ LangChain ChatOpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

memory = ConversationBufferMemory(
    memory_key="chat_history", max_token_limit=1000, return_messages=True
)


def build_final_answer_prompt(
    template: dict, strategy: dict, precedent: dict, user_query: str
) -> str:
    precedent_summary = precedent.get("summary", "")
    precedent_link = precedent.get("casenote_url", "")
    precedent_meta = f"{precedent.get('court', '')} / {precedent.get('j_date', '')} / {precedent.get('title', '')}"

    summary_with_links = insert_hyperlinks_into_text(
        template["summary"], template.get("hyperlinks", [])
    )
    explanation_with_links = insert_hyperlinks_into_text(
        template["explanation"], template.get("hyperlinks", [])
    )
    hyperlinks_text = "\n".join(
        [f"- {link['label']}: {link['url']}" for link in template.get("hyperlinks", [])]
    )
    strategy_decision_tree = "\n".join(strategy.get("decision_tree", []))

    chat_history = memory.load_memory_variables({}).get("chat_history", "")

    prompt = f"""
당신은 법률 상담을 생성하는 고급 AI입니다.

[대화 히스토리]
{chat_history}

[사용자 질문]
{user_query}

[요약]
{summary_with_links}

[설명]
{explanation_with_links}

[참고 질문]
{template["ref_question"]}

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

💡 위 내용을 반영하여, 사용자가 신뢰할 수 있는 법률 상담을 생성하세요.
"""
    return prompt.strip()


def run_final_answer_generation(
    template: dict,
    strategy: dict,
    precedent: dict,
    user_query: str,
    model: str = "gpt-4",
) -> str:
    final_prompt = build_final_answer_prompt(template, strategy, precedent, user_query)

    print("\n🤖 AI 답변:")
    final_answer = ""

    # ✅ LangChain ChatOpenAI (Streaming)
    llm = ChatOpenAI(
        model=model,
        api_key=OPENAI_API_KEY,
        temperature=0.4,
        streaming=True
    )

    messages = [
        SystemMessage(
            content="당신은 고급 법률 응답을 생성하는 AI입니다. 사용자의 신뢰를 얻을 수 있는 정확하고 자연스러운 상담을 생성하세요."
        ),
        HumanMessage(content=final_prompt),
    ]

    # ✅ 스트리밍 응답 처리
    for chunk in llm.stream(messages):
        if hasattr(chunk, "content") and chunk.content:
            sys.stdout.write(chunk.content)
            sys.stdout.flush()
            final_answer += chunk.content

    print("\n✅ [최종 LLM 응답 완료]")

    # ✅ 메모리에 저장
    memory.save_context(
        {"user_query": user_query}, {"response": precedent.get("summary", "")}
    )

    return final_answer


async def evaluate_final_answer_with_tavily(
    final_answer: str, user_query: str, model="gpt-4"
) -> dict:
    search_tool = LawGoKRTavilySearch(max_results=3)
    tavily_results = search_tool.run(user_query)

    tavily_snippets = []
    for result in tavily_results:
        content = result.get("content") or result.get("snippet") or result.get("text")
        if content:
            tavily_snippets.append(content.strip())

    combined_snippets = "\n\n".join(
        [f"[요약 {i + 1}]\n{snippet}" for i, snippet in enumerate(tavily_snippets)]
    )

    prompt = f"""
당신은 법률 상담 응답을 평가하는 AI입니다.

[사용자 질문]
{user_query}

[GPT 최종 응답]
{final_answer}

[Tavily 요약 결과들]
{combined_snippets}

--- 작업 지시 ---
1. GPT 응답이 Tavily 요약과 비교했을 때 논리적으로 부실하거나 오류가 있다면 알려주세요.
2. 보완이 필요하다면 "needs_fix": true 또는 false 로 작성하세요.

⚠️ 반드시 아래와 같은 **JSON** 형태로만 응답하세요. 설명 없이 JSON만 출력해야 합니다.

예시:
{{
  "needs_fix": true,
  "reason": "응답에 핵심 법령이 빠져 있습니다.",
  "fix_suggestion": "교통사고처리특례법 제3조를 포함하여 설명을 보완하세요."
}}
"""
    llm = ChatOpenAI(
        model=model,
        api_key=OPENAI_API_KEY,
        temperature=0.2,
        streaming=False
    )

    messages = [
        SystemMessage(content="너는 법률 응답 검토 전문가 AI입니다."),
        HumanMessage(content=prompt),
    ]

    response = llm.invoke(messages)
    result_text = response.content
    print("✅ [최종 응답 평가 결과]:", result_text)

    try:
        extracted_json = extract_json_from_text(result_text)
        if not extracted_json:
            raise ValueError("응답에서 JSON을 찾을 수 없습니다.")

        return json.loads(extracted_json)

    except Exception as e:
        print("❌ JSON 파싱 실패:", e)
        return {
            "needs_fix": False,
            "reason": "GPT 응답 파싱 실패",
            "fix_suggestion": "",
        }
