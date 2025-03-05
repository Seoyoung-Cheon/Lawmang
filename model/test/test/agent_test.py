from typing import Annotated
from typing_extensions import TypedDict
from langchain_huggingface import HuggingFaceEndpoint
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_teddynote.graphs import visualize_graph
from dotenv import load_dotenv
import os
import asyncio
from langchain_teddynote import logging
from builder import graph_to_png
# ✅ LangGraph 로깅 설정
logging.langsmith("llamaproject")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")


load_dotenv()


class State(TypedDict):
    messages: Annotated[list, add_messages]
    # 상태정의 
    # State = 타입 저장 
    # message: 대화기록 저장하는 리스트 
    # add_messages = 랭그래프에 메시지를 자동 추가 

# 랭그래프 초기화 
graph_builder = StateGraph(State)


def llm():
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

# 챗봇 노드 LLM 호출 
def chatbot(state: State):
    model = llm() # LLM 객체 생성 
    response = model.invoke(state["messages"])  # response는 문자열(str) # message 받고 호출 
    # response 는 문자열로 반환 == 그러니까 response 받으면 list 는 문자열이 된다는 건가? 

    # LLM 응답을 메시지 리스트에 저장할수 있도록 변환  ( 왜? )
    return {"messages": [{"role": "assistant", "content": response}]}


graph_builder.add_node("chatbot", chatbot)
graph_builder.set_entry_point("chatbot")
graph_builder.set_finish_point("chatbot")
graph = graph_builder.compile()
visualize_graph(graph)
# 랭그래프 실행 및 사용자 입력 처리 함수 
def stream_graph_updates(user_input: str):
    for event in graph.stream({"messages": [{"role": "user", "content": user_input}]}):
        for value in event.values():
            # 메시지 리스트에서 가장 마지막 응답 content 를 출력 
            print("Assistant:", value["messages"][-1]["content"])


graph_image = visualize_graph(graph)  # 그래프를 인자로 전달
print("🔍 graph_image 타입:", type(graph_image))  # ✅ 디버깅용 출력

if graph_image:
    graph_to_png(graph_image)  # ✅ PNG 파일로 저장
else:
    print("❌ Error: visualize_graph() did not return an image.")

# 그래프 빌드 및 실행
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
            user_input = "What do you know about LangGraph?"
            print("User: " + user_input)
            stream_graph_updates(user_input)
            break
