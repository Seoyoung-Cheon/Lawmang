import os
import asyncio
from typing import Dict, Annotated, TypedDict
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_huggingface import HuggingFaceEndpoint
from langgraph.graph.message import add_messages
from agents_system_prompts import assistant
from langchain_teddynote import logging

# ✅ LangGraph 로깅 설정
logging.langsmith("llamaproject")

# ✅ 환경 변수 로드
load_dotenv()

# ✅ Hugging Face API 설정
HF_TOKEN = os.getenv("HF_TOKEN")
HUGGINGFACE_REPO_ID = "meta-llama/Llama-3.3-70B-Instruct"

# ✅ 시스템 프롬프트 로드 (role & goal 제거)
assistant_instance = assistant()
SYSTEM_PROMPT = assistant_instance.system_prompt


# ✅ LLM 로드 함수
def load_llm():
    """LLM 로드 (HuggingFace Inference API)"""
    return HuggingFaceEndpoint(
        repo_id=HUGGINGFACE_REPO_ID,
        task="text-generation",
        max_new_tokens=300,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.5,  # ✅ 반복 최소화
        model_kwargs={"max_length": 500, "num_beams": 2},  # ✅ 과도한 생성 방지
        huggingfacehub_api_token=HF_TOKEN,
    )


# ✅ LLM 로드
llm = load_llm()


# ✅ LangGraph 상태 정의
class ChatState(TypedDict):
    messages: Annotated[list, add_messages]


# ✅ 메시지 정규화 함수 (중복 처리 제거)
def normalize_message(message):
    """메시지를 (role, message) 튜플로 변환"""
    if isinstance(message, tuple) and len(message) == 2:
        return message
    elif isinstance(message, dict) and "content" in message:
        return (
            "assistant" if message.get("type") == "ai" else "user",
            message["content"],
        )
    return ("unknown", str(message))


# ✅ 프롬프트 포맷팅 함수 (SYSTEM_PROMPT 중복 방지)
def format_prompt(state: ChatState, user_query: str) -> str:
    return f"""{SYSTEM_PROMPT}
사용자: {user_query}
previous_history:
AI:"""


# ✅ 챗봇 노드
async def chatbot(state: ChatState) -> Dict[str, ChatState]:
    """LangGraph에서 실행되는 챗봇 노드"""
    if llm is None:
        return {"messages": state["messages"]}

    user_query = normalize_message(state["messages"][-1])[1]
    formatted_prompt = format_prompt(state, user_query)

    try:
        response = await llm.ainvoke(formatted_prompt)
        response_text = response if isinstance(response, str) else str(response)

        # ✅ 상태 업데이트
        state["messages"].extend([("user", user_query), ("assistant", response_text)])
        return {"messages": state["messages"]}

    except Exception as e:
        print(f"❌ [LLM 실행 오류] {e}")
        state["messages"].append(("assistant", f"❌ 오류 발생: {e}"))
        return {"messages": state["messages"]}


# ✅ LangGraph 그래프 생성
workflow = StateGraph(ChatState)
workflow.add_node("chatbot", chatbot)  # ✅ 챗봇 노드 추가
workflow.set_entry_point("chatbot")  # ✅ 시작 지점 설정
workflow.add_edge("chatbot", END)  # ✅ 종료 지점 설정
graph_executor = workflow.compile()  # ✅ 실행기 컴파일


# ✅ LangGraph 실행 함수
async def main():
    print("✅ 실행 시작: LangGraph 기반 Llama-3.3 AI 챗봇")

    state: ChatState = {"messages": []}

    while True:
        user_input = input("💬 질문: ")
        if user_input.lower() in ["exit", "quit", "종료"]:
            print("🔴 챗봇을 종료합니다.")
            break

        async for event in graph_executor.astream(
            {"messages": state["messages"] + [("user", user_input)]}
        ):
            for value in event.values():
                state["messages"] = value["messages"]
                print(f"🤖 AI: {value['messages'][-1][1]}")


# ✅ 실행
if __name__ == "__main__":
    asyncio.run(main())
