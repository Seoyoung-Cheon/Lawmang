import os
import asyncio
from typing import List, Dict
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from langgraph.graph import StateGraph, END, START  # ✅ START 추가
from dotenv import load_dotenv
from agents_system_prompts import assistant  # ✅ 기존 시스템 프롬프트 유지

# ✅ 1. 환경 변수 로드
load_dotenv()

# ✅ 2. LLM 모델 설정
HF_TOKEN = os.getenv("HF_TOKEN")
HUGGINGFACE_REPO_ID = "meta-llama/Llama-3.3-70B-Instruct"

# ✅ 3. 시스템 프롬프트 로드
assistant_instance = assistant()
assistant_data = vars(assistant_instance)  # ✅ Pydantic 제거 후 vars() 사용
system_prompt = f"{assistant_data['system_prompt']}\n\nRole: {assistant_data['role']}\nGoal: {assistant_data['goal']}"


# ✅ 4. LLM 로드 함수
def load_llm():
    """LLM 로드 (HuggingFace Inference API)"""
    try:
        return HuggingFaceEndpoint(
            repo_id=HUGGINGFACE_REPO_ID,
            task="text-generation",
            max_new_tokens=250,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2,
            model_kwargs={"max_length": 512, "num_beams": 3},
            huggingfacehub_api_token=HF_TOKEN,
        )
    except Exception as e:
        print(f"❌ [LLM 로드 오류] {e}")
        return None


# ✅ 5. LLM 로드
llm = load_llm()


# ✅ 6. LangGraph 상태 직접 정의 (Pydantic 미사용)
class LegalAIState:
    """LangGraph 상태 정의"""

    def __init__(self):
        self.chat_history: List[str] = []  # ✅ 직접 리스트 정의


# ✅ 7. LangGraph 프롬프트 템플릿
prompt_template = PromptTemplate(
    input_variables=["system_prompt", "chat_history", "user_query"],
    template="""{system_prompt}

    지금까지의 대화 기록:
    {chat_history}

    사용자의 질문: {user_query}

    이 정보를 기반으로 자연스럽고 일관된 답변을 제공하세요.
    """,
)


# ✅ 8. LangGraph 노드 정의 (LLM 실행)
async def process_query(state: LegalAIState, query: str) -> Dict[str, object]:
    """LangGraph 노드: LLM 실행"""
    if llm is None:
        return {"state": state, "response": "❌ LLM이 로드되지 않았습니다."}

    # ✅ 대화 기록 로드
    chat_history = (
        "\n".join(state.chat_history[-3:]) if state.chat_history else "이전 대화 없음."
    )

    # ✅ LangGraph 상태 기반 프롬프트 생성
    formatted_prompt = prompt_template.format(
        system_prompt=system_prompt, chat_history=chat_history, user_query=query
    )

    try:
        response = await llm.ainvoke(formatted_prompt)

        # ✅ LangGraph 상태 업데이트 (대화 기록 추가)
        state.chat_history.append(f"사용자: {query}")
        state.chat_history.append(f"AI: {response}")

        return {
            "state": state,
            "response": response,
        }  # ✅ 반드시 상태(state)와 응답(response)를 분리해서 반환

    except Exception as e:
        print(f"❌ [LLM 실행 오류] {e}")
        return {"state": state, "response": f"❌ [LLM 실행 오류] {e}"}  # ✅ 상태 유지


# ✅ 9. LangGraph 워크플로우 생성 (0.3.1 버전 방식)
workflow = StateGraph(LegalAIState)  # ✅ State 직접 정의
workflow.add_node("llm_response", process_query)  # ✅ 노드 추가

# ✅ 10. LangGraph 진입점 & 종료 처리
workflow.set_entry_point("llm_response")  # ✅ START 설정
workflow.add_edge("llm_response", END)  # ✅ 실행 후 종료

# ✅ 11. LangGraph 실행기 생성
graph_executor = workflow.compile()  # ✅ 실행 전에 반드시 컴파일 필요

# ✅ 12. 메인 실행
if __name__ == "__main__":
    print("✅ 실행 시작: Python Llama-3.3 AI 챗봇 (LangGraph 0.3.1)")

    state = LegalAIState()  # ✅ 직접 정의한 State 클래스 사용

    while True:
        user_input = input("💬 질문: ")
        if user_input.lower() in ["exit", "quit", "종료"]:
            print("🔴 챗봇을 종료합니다.")
            break

        # ✅ LangGraph 실행 (비동기 방식 유지)
        for output in graph_executor.stream({"state": state, "query": user_input}):
            print(f"🤖 AI: {output['response']}")  # ✅ 응답을 출력
