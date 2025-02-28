import os
import asyncio
from typing import List, Dict, Annotated, TypedDict
from dotenv import load_dotenv
from langgraph.graph import StateGraph, END
from langchain_huggingface import HuggingFaceEndpoint
from langgraph.graph.message import add_messages
from agents_system_prompts import assistant  # 시스템 프롬프트 불러오기
from langchain_teddynote import logging
logging.langsmith("llamaproject")
# ✅ 환경 변수 로드
load_dotenv()



# ✅ LangSmith 클라이언트 인스턴스 생성



# ✅ LLM 모델 설정
HF_TOKEN = os.getenv("HF_TOKEN")

HUGGINGFACE_REPO_ID = "meta-llama/Llama-3.3-70B-Instruct"

# ✅ 시스템 프롬프트 로드
assistant_instance = assistant()
assistant_data = vars(assistant_instance)  # ✅ Pydantic 제거 후 vars() 사용
system_prompt = f"{assistant_data['system_prompt']}\n\nRole: {assistant_data['role']}\nGoal: {assistant_data['goal']}"


# ✅ LLM 로드 함수
def load_llm():
    """LLM 로드 (HuggingFace Inference API)"""
    try:
        return HuggingFaceEndpoint(
            repo_id=HUGGINGFACE_REPO_ID,
            task="text-generation",
            max_new_tokens=150,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2,
            model_kwargs={"max_length": 300, "num_beams": 2},
            huggingfacehub_api_token=HF_TOKEN,
        )
    except Exception as e:
        print(f"❌ [LLM 로드 오류] {e}")
        return None


# ✅ LLM 로드
llm = load_llm()


# ✅ LangGraph 상태 정의
class ChatState(TypedDict):
    messages: Annotated[list, add_messages]


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


def format_prompt(state: ChatState, user_query: str) -> str:
    """이전 대화 기록을 포함하여 프롬프트 생성"""

    formatted_messages = []
    for msg in state["messages"][-5:]:  # 최근 5개 대화만 포함
        if isinstance(msg, tuple) and len(msg) == 2:
            formatted_messages.append(f"{msg[0]}: {msg[1]}")
        elif isinstance(msg, str):  # ✅ 단순 문자열이면 "Unknown" 처리
            formatted_messages.append(f"Unknown: {msg}")
        elif isinstance(msg, dict) and "content" in msg:  # ✅ dict 형태 메시지 처리
            formatted_messages.append(f"AI: {msg['content']}")
        else:
            formatted_messages.append("Unknown Message Format")

    conversation_history = "\n".join(formatted_messages)

    return f"""{system_prompt}

    이전 대화 기록:
    {conversation_history}

    사용자: {user_query}
    AI:"""


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


async def chatbot(state: ChatState) -> Dict[str, ChatState]:
    if llm is None:
        return {"messages": state["messages"]}

    user_query = normalize_message(state["messages"][-1])[1]
    formatted_prompt = format_prompt(state, user_query)

    try:
        response = await llm.ainvoke(formatted_prompt)
        response_text = response if isinstance(response, str) else str(response)
        state["messages"].append(("user", user_query))
        state["messages"].append(("assistant", response_text))
        return {"messages": state["messages"]}
    except Exception as e:
        print(f"❌ [LLM 실행 오류] {e}")
        state["messages"].append(("assistant", f"❌ 오류 발생: {e}"))
        return {"messages": state["messages"]}


# ✅ LangGraph 그래프 생성
workflow = StateGraph(ChatState)

# ✅ 노드 추가 (비동기 함수 그대로 추가 가능)
workflow.add_node("chatbot", chatbot)

# ✅ 시작 및 종료 설정
workflow.set_entry_point("chatbot")
workflow.add_edge("chatbot", END)

# ✅ LangGraph 실행기 컴파일
graph_executor = workflow.compile()


# ✅ 비동기 실행 함수 정의
async def main():
    print("✅ 실행 시작: LangGraph 기반 Llama-3.3 AI 챗봇")

    state: ChatState = {"messages": []}  # ✅ ChatState 타입 유지

    while True:
        user_input = input("💬 질문: ")
        if user_input.lower() in ["exit", "quit", "종료"]:
            print("🔴 챗봇을 종료합니다.")
            break

        # ✅ LangGraph 실행 (비동기 스트리밍 적용) + state 포함
        async for event in graph_executor.astream(
            {"messages": state["messages"] + [("user", user_input)]}
        ):
            for value in event.values():
                state["messages"] = value["messages"]  # ✅ state 업데이트
                print(f"🤖 AI: {value['messages'][-1][1]}")


# ✅ 비동기 메인 함수 실행
if __name__ == "__main__":
    asyncio.run(main())