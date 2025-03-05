from typing import Annotated
from typing_extensions import TypedDict
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_huggingface import HuggingFaceEndpoint
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from dotenv import load_dotenv
import json
import os
import asyncio
from langchain_teddynote import logging

# ✅ 환경 변수 로드 및 LangGraph 로깅 설정
load_dotenv()
logging.langsmith("llamaproject")


# ✅ 상태(State) 정의 (무조건 tools 실행)
class State(TypedDict):
    messages: Annotated[list, add_messages]


# ✅ LangGraph 초기화
graph_builder = StateGraph(State)

# ✅ Tavily 검색 툴 설정
tool = TavilySearchResults(max_results=2)


# ✅ LLM (Hugging Face) 설정
def initialize_llm():
    HF_TOKEN = os.getenv("HF_TOKEN")
    return HuggingFaceEndpoint(
        repo_id="meta-llama/Llama-3.3-70B-Instruct",
        task="text-generation",
        max_new_tokens=300,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.5,
        model_kwargs={"max_length": 500, "num_beams": 2},
        huggingfacehub_api_token=HF_TOKEN,
    )


llm = initialize_llm()  # ✅ LLM 객체를 한 번만 생성하여 사용


# ✅ 챗봇 노드 (LLM 호출)
def chatbot(state: State):
    response = llm.invoke(state["messages"])
    return {"messages": [{"role": "assistant", "content": response}]}


graph_builder.add_node("chatbot", chatbot)


# ✅ Tavily 검색 실행 노드 (무조건 실행)
def run_tavily_tool(state: State):
    latest_query = state["messages"][-1]["content"]  # ✅ 사용자의 마지막 입력 가져오기
    tool_result = tool.invoke({"query": latest_query})  # ✅ Tavily 검색 실행

    return {"messages": [{"role": "tool", "content": json.dumps(tool_result)}]}


graph_builder.add_node("tools", run_tavily_tool)


# ✅ 툴을 무조건 실행하도록 설정
def tools_execution(state: State):
    return "tools"  # ✅ 모든 입력에서 tools 실행


# ✅ LangGraph 흐름 설정 (무조건 `tools` 실행 후 `chatbot` 실행)
graph_builder.add_conditional_edges(
    "chatbot", tools_execution, {"tools": "tools"}
)
graph_builder.add_edge("tools", "chatbot")  # ✅ 검색 결과를 다시 챗봇으로 전달
graph_builder.add_edge(START, "chatbot")
graph_builder.set_entry_point("chatbot")
graph_builder.set_finish_point("chatbot")
graph = graph_builder.compile()


# ✅ LangGraph 실행 및 사용자 입력 처리 함수
def stream_graph_updates(user_input: str):
    for event in graph.stream({"messages": [{"role": "user", "content": user_input}]}):
        for value in event.values():
            print("Assistant:", value["messages"][-1]["content"])


# ✅ 챗봇 실행
if __name__ == "__main__":
    while True:
        try:
            user_input = input("User: ")
            if user_input.lower() in ["quit", "exit", "q"]:
                print("Goodbye!")
                break
            stream_graph_updates(user_input)
        except Exception as e:
            print(f"Error: {e}")
            break
