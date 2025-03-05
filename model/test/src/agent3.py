import os
import asyncio
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_community.tools import TavilySearchResults
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from langchain_teddynote import logging

# ✅ LangGraph 로깅 설정
logging.langsmith("llamaproject")
# ✅ 환경 변수 로드
load_dotenv()

# ✅ API 키 가져오기
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")

# ✅ LLM 구성 (GPT-3.5)
openai_llm = ChatOpenAI(
    model="gpt-3.5-turbo", api_key=OPENAI_API_KEY, temperature=0.7, max_tokens=1024
)

# ✅ 검색 툴 구성
search_tool = TavilySearchResults(max_results=1)

# ✅ 시스템 프롬프트 정의
system_prompt = """
You are a helpful assistant that can search the web about law information. Please answer only legal-related questions.
If the question is related to previous conversations, refer to that context in your response.
If the question is not related to law, kindly remind the user that you can only answer legal questions.
If a greeting is entered as a question, please respond in Korean with "반갑습니다. 어떤 법률을 알려드릴까요?"
Only answer in Korean.
"""

# ✅ Agent 생성 (LangGraph 스타일)
try:
    agent = create_react_agent(
        model=openai_llm,
        tools=[search_tool],
        state_modifier=system_prompt,
    )
except Exception as e:
    print("An error occurred while creating the agent:", str(e))
    raise


# ✅ LangGraph 상태 관리
class ChatState:
    def __init__(self):
        self.conversation_history = []


# ✅ LangGraph 노드: AI 응답 생성
async def process_query(state: ChatState) -> dict:
    """LangGraph에서 실행되는 챗봇 노드"""

    # ✅ 기존 대화 기록 가져오기
    conversation_history = state.conversation_history.copy()

    # ✅ 마지막 사용자 메시지 추출 (없으면 기본값 설정)
    if conversation_history:
        query = conversation_history[-1][0]  # 마지막 입력
    else:
        query = "안녕하세요"  # 기본값

    # ✅ system message 추가 (처음 한 번만)
    messages = [HumanMessage(content=system_prompt)]

    # ✅ 기존 대화 내용 추가
    for msg in conversation_history:
        messages.append(HumanMessage(content=msg[0]))  # 사용자 질문
        messages.append(AIMessage(content=msg[1]))  # AI 응답

    # ✅ 새로운 질문을 대화 내용에 저장
    messages.append(HumanMessage(content=query))

    # ✅ AI 응답 생성
    try:
        response = await agent.ainvoke(
            {"messages": messages}
        )  # ✅ 올바른 형식으로 전달

        # ✅ AI 응답이 올바르게 반환되는지 확인
        ai_message = [
            message.content
            for message in response.get("messages", [])
            if isinstance(message, AIMessage)
        ]
        answer = ai_message[-1] if ai_message else "응답을 생성할 수 없습니다."
    except Exception as e:
        answer = "AI 호출에 실패했습니다."

    # ✅ 대화 기록 업데이트
    state.conversation_history.append((query, answer))

    return {"conversation_history": state.conversation_history}


# ✅ LangGraph 그래프 생성
workflow = StateGraph(ChatState)
workflow.add_node("chatbot", process_query)  # ✅ 챗봇 노드 추가
workflow.set_entry_point("chatbot")  # ✅ 시작 지점 설정
workflow.add_edge("chatbot", END)  # ✅ 종료 지점 설정
graph_executor = workflow.compile()  # ✅ 실행기 컴파일


# ✅ LangGraph 실행 함수 (스트리밍 모드 추가)
async def main():
    state = ChatState()

    while True:
        user_input = input("💬 질문: ").strip()
        if user_input.lower() in ["q", "exit", "quit", "종료"]:
            print("프로그램을 종료합니다.")
            break

        print("🤖 AI 답변:")
        async for event in graph_executor.astream(
            {"conversation_history": state.conversation_history + [(user_input, "")]}
        ):
            for value in event.values():
                state.conversation_history = value["conversation_history"]
                print(state.conversation_history[-1][1])  # ✅ 응답 출력 (한 번만 출력)


# ✅ 실행
if __name__ == "__main__":
    asyncio.run(main())
