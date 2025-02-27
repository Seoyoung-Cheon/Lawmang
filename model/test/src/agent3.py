import os
import asyncio
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory  # ✅ LangChain 메모리 추가
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from agents_system_prompts import assistant  # ✅ 기존 시스템 프롬프트 구조 유지




# ✅ 2. 환경 변수 로드
load_dotenv()

# ✅ 3. LLM 모델 설정
HF_TOKEN = os.environ.get("HF_TOKEN")
HUGGINGFACE_REPO_ID = "meta-llama/Llama-3.3-70B-Instruct"

# ✅ 4. 시스템 프롬프트 로드 (Pydantic 모델 적용)
assistant_instance = assistant()
assistant_data = assistant_instance.model_dump()  # Pydantic 데이터 딕셔너리 변환
system_prompt = f"{assistant_data['system_prompt']}\n\nRole: {assistant_data['role']}\nGoal: {assistant_data['goal']}"

# ✅ 5. LangChain 메모리 (대화 기록 저장)
memory = ConversationBufferMemory(memory_key="messages", return_messages=True)


def load_llm():
    """LLM 로드 (HuggingFace Inference API)"""
    try:
        return HuggingFaceEndpoint(
            repo_id=HUGGINGFACE_REPO_ID,
            task="text-generation",
            max_new_tokens=125,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2,
            model_kwargs={
                "max_length": 216,
                "num_beams": 3,
            },
            huggingfacehub_api_token=HF_TOKEN,
        )
    except Exception as e:
        print(f"❌ [LLM 로드 오류] {e}")
        return None


# ✅ 6. LLM 로드
llm = load_llm()


async def process_query(query: str, conversation_history: list):
    """사용자 입력을 받아 LLM을 실행하고, 즉시 질문을 출력"""
    if llm is None:
        return "❌ LLM을 로드할 수 없습니다."

    # ✅ 기존 대화 히스토리를 포함한 입력 메시지 생성
    messages = memory.load_memory_variables({}).get("messages", [])

    # ✅ 시스템 프롬프트를 첫 번째 메시지로 추가 (초기화 시)
    if not messages:
        messages.append(HumanMessage(content=system_prompt))

    # ✅ 사용자의 현재 질문 추가
    messages.append(HumanMessage(content=query))

    # ✅ 메시지를 문자열로 변환하여 LLM에 전달
    llm_input = "\n".join(
        [msg.content for msg in messages if isinstance(msg, HumanMessage)]
    )

    # ✅ 예외처리: 빈 입력 방지
    if not llm_input.strip():
        return "❌ 유효한 입력이 없습니다."

    try:
        # ✅ LLM 실행 (문자열 입력)
        response = await llm.ainvoke(llm_input)

        # ✅ **LLM 응답을 그대로 반환**
        return response

    except Exception as e:
        print(f"❌ [DEBUG] LLM 실행 오류 발생: {e}")
        return f"❌ [LLM 실행 오류] {e}"


# ✅ 7. 메인 실행
if __name__ == "__main__":
    print("✅ 실행 시작: Python Llama-3.3 AI 챗봇")
    while True:
        user_input = input("💬 질문: ")
        if user_input.lower() in ["exit", "quit", "종료"]:
            print("🔴 챗봇을 종료합니다.")
            break

        # ✅ 질문을 넣으면 바로 응답 출력
        answer = asyncio.run(process_query(user_input, []))
        print(f"🤖 AI: {answer}")
