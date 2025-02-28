import os
import asyncio
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory  # ✅ LangChain 메모리 추가
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv
from agents_system_prompts import assistant  # ✅ 기존 시스템 프롬프트 구조 유지

# ✅ 1. 환경 변수 로드
load_dotenv()

# ✅ 2. LLM 모델 설정
HF_TOKEN = os.environ.get("HF_TOKEN")
HUGGINGFACE_REPO_ID = "meta-llama/Llama-3.3-70B-Instruct"

# ✅ 3. 시스템 프롬프트 로드 (Pydantic 모델 적용)
assistant_instance = assistant()
assistant_data = assistant_instance.model_dump()  # Pydantic 데이터 딕셔너리 변환
system_prompt = f"{assistant_data['system_prompt']}\n\nRole: {assistant_data['role']}\nGoal: {assistant_data['goal']}"

# ✅ 4. LangChain 메모리 (대화 기록 저장)
memory = ConversationBufferMemory(memory_key="messages", return_messages=True)


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
            model_kwargs={
                "max_length": 512,
                "num_beams": 3,
            },
            huggingfacehub_api_token=HF_TOKEN,
        )
    except Exception as e:
        print(f"❌ [LLM 로드 오류] {e}")
        return None


# ✅ 5. LLM 로드
llm = load_llm()

# ✅ 6. LangChain 프롬프트 템플릿 추가
prompt_template = PromptTemplate(
    input_variables=["system_prompt", "chat_history", "user_query"],
    template="""
    {system_prompt}
    
    지금까지의 대화 기록은 다음과 같습니다:
    {chat_history}
    
    사용자의 새로운 질문: {user_query}

    이 정보를 기반으로 자연스럽고 일관된 답변을 제공하세요.
    """,
)


async def process_query(query: str):
    """사용자 입력을 받아 LLM을 실행하고, 같은 질문을 반복하지 않도록 개선"""
    if llm is None:
        return "❌ LLM을 로드할 수 없습니다."

    # ✅ 기존 대화 히스토리를 포함한 입력 메시지 생성
    messages = memory.load_memory_variables({}).get("messages", [])  # ✅ 변경됨
    chat_history = "\n".join(
        [msg.content for msg in messages if isinstance(msg, HumanMessage)]
    )  # ✅ 대화 히스토리 문자열로 변환

    # ✅ 히스토리를 요약하여 같은 대화 반복을 방지
    if len(messages) > 3:
        summary = f"지난 대화 요약: {chat_history[-3:]}"
    else:
        summary = chat_history if chat_history else "이전 대화 없음."

    # ✅ 디버깅 로그 추가 (대화 기록 정상 로딩 확인)
    print(f"🔍 [DEBUG] chat_history type: {type(chat_history)}, value: {chat_history}")

    # ✅ 시스템 프롬프트와 대화 내역을 포함한 LLM 입력 구성
    try:
        formatted_prompt = prompt_template.format(
            system_prompt=system_prompt, chat_history=summary, user_query=query
        )
    except Exception as e:
        print(f"❌ [DEBUG] 프롬프트 생성 오류: {e}")
        return f"❌ [프롬프트 생성 오류] {e}"

    # ✅ 디버깅 로그 추가 (LLM 입력값 확인)
    print(
        f"🔍 [DEBUG] llm.ainvoke() input type: {type(formatted_prompt)}, value: {formatted_prompt}"
    )

    # ✅ 예외처리: 빈 입력 방지
    if not formatted_prompt.strip():
        return "❌ 유효한 프롬프트 생성 실패 (입력이 없습니다.)"

    try:
        # ✅ LLM 실행 (BaseMessages 사용)
        response = await llm.ainvoke(formatted_prompt)

        # ✅ 디버깅 로그 추가 (LLM 응답 확인)
        print(f"🔍 [DEBUG] LLM response type: {type(response)}, value: {response}")

        # ✅ LLM 응답을 메모리에 저장 (반복 방지) ✅ 올바른 저장 방식 적용
        memory.save_context({"input": query}, {"output": response})

        # ✅ **LLM 응답을 그대로 반환**
        return response

    except Exception as e:
        print(f"❌ [DEBUG] LLM 실행 오류 발생: {e}")
        print(f"🔍 [DEBUG] LLM input at error: {formatted_prompt}")
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
        answer = asyncio.run(process_query(user_input))
        print(f"🤖 AI: {answer}")
