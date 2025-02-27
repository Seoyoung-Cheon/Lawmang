import os
from langchain_openai import ChatOpenAI
from langchain_community.tools import TavilySearchResults
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent
from agents_system_prompts import assistant

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

load_dotenv()


openai_llm = ChatOpenAI(
    api_key=OPENAI_API_KEY,
    model_name="gpt-3.5-turbo",
    temperature=0.9,
    max_tokens=100,
)

search_tool = TavilySearchResults(max_results=1) # 1개 찾기 

# 시스템 프롬프트 수정
assistant_instance = assistant()

system_prompt = f"{assistant_instance.system_prompt}\n\nRole: {assistant_instance.role}\nGoal: {assistant_instance.goal}"

# agent 생성 부분을 try-except로 감싸기

try:
    agent = create_react_agent(
        model=openai_llm,
        tools=[search_tool],
        state_modifier=system_prompt  # 작동 코드 3개
    )
except Exception as e:
    print("Agent 생성 중 오류 발생:", str(e))
    raise






async def process_query(query, conversation_history):  # 쿼리를 넣고 non 이면 노응답
    # 시스템 메시지를 먼저 추가
    messages = [HumanMessage(content=system_prompt)]

    # 전역 변수인 conversation_history 사용
    for msg in conversation_history:
        if isinstance(msg, tuple):
            messages.append(HumanMessage(content=msg[0]))
            messages.append(AIMessage(content=msg[1]))

    # 현재 질문 추가
    messages.append(HumanMessage(content=query))

    state = {"messages": messages}

    response = await agent.ainvoke(state)
    ai_messages = [
        message.content
        for message in response.get("messages", [])
        if isinstance(message, AIMessage)
    ]

    # 응답을 conversation_history에 추가
    answer = ai_messages[-1] if ai_messages else "응답을 생성할 수 없습니다."
    conversation_history.append((query, answer))

    return answer