from typing import Annotated
from typing_extensions import TypedDict
from langchain.memory import ConversationBufferMemory  # ✅ LangChain 메모리 추가
from langchain_core.prompts import PromptTemplate  # ✅ LangChain 프롬프트 템플릿 추가
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_huggingface import HuggingFaceEndpoint
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import interrupt
from langchain_core.tools import tool
from langchain_core.messages import AIMessage, HumanMessage
from dotenv import load_dotenv
import json
import os
import asyncio
from langchain_teddynote import logging
from langchain.tools import BaseTool
from typing import Dict


# ✅ 환경 변수 로드 및 LangGraph 로깅 설정
load_dotenv()
logging.langsmith("llamaproject")

# ✅ LangChain 메모리 추가 (대화 기록 저장)
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)


# ✅ LangChain 법률 응답 생성 클래스
class LangChainRetrieval:
    """LangChain 기반 법률 응답 생성 클래스"""

    def __init__(self, llm):
        self.llm = llm  # ✅ LLM을 인자로 받아 한 번만 로드하여 유지
        if not self.llm:
            print("❌ LLM이 로드되지 않았습니다.")

        # ✅ LangChain 메모리 추가 (대화 기록 저장)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )

        # ✅ LangChain 프롬프트 설정 (법률 문맥 반영)
        self.prompt_template = PromptTemplate(
            template="""
            당신은 한국 법률 전문가입니다.
            주어진 법률 문맥을 바탕으로 사용자의 질문에 간결하고 명확하게 답변하세요.
            질문이 법과 관련이 없다면 법적 관점에서 재해석하여 답변하세요.

            {chat_history}

            사용자의 질문:
            "{user_query}"

            관련 판례 요약:
            {summary}

            이제, 한국어로 정중하고 정확하게 답변을 제공하세요. 한자는 사용하지 마십시오.
            """,
            input_variables=["chat_history", "user_query", "summary"],
        )

    def generate_response(self, user_query: str, summary: str):
        """✅ LLM을 호출하여 법률 응답 생성"""
        chat_history = self.memory.load_memory_variables({})[
            "chat_history"
        ]  # ✅ 이전 대화 기록 로드
        prompt_text = self.prompt_template.format(
            chat_history=chat_history,
            user_query=user_query,
            summary=summary,
        )
        response = self.llm.invoke(prompt_text)  # ✅ LLM 호출
        self.memory.save_context(
            {"user_query": user_query}, {"response": response}
        )  # ✅ 메모리에 대화 저장
        return response


# ✅ 상태(State) 정의
class State(TypedDict):
    messages: Annotated[list, add_messages]


# ✅ LangGraph 초기화
graph_builder = StateGraph(State)

# ✅ Tavily 검색 툴 설정
tool = TavilySearchResults(max_results=1)
tools = [tool]


def human_assistance(query: str) -> str:
    """Request assistance from a human."""
    human_response = interrupt({"query": query})
    return human_response["data"]


class HumanAssistanceTool(BaseTool):
    name: str = "human_assistance"
    description: str = "Request assistance from a human."

    def _invoke(self, query: str):
        """LangChain 최신 버전에서 _invoke()을 구현"""
        return human_assistance(query)

    def _run(self, query: str):
        """LangChain 최신 버전에서 _run()을 구현해야 함"""
        return human_assistance(query)    


# ✅ 정상적으로 인스턴스화 가능
human_assistance_tool = HumanAssistanceTool()


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


llm = initialize_llm()

law_chatbot = LangChainRetrieval(llm)  # ✅ LangChain 기반 법률 챗봇 인스턴스 생성


# ✅ Tavily 검색 실행 함수
def run_tool(state):
    query = state["messages"][-1].content  # 최신 사용자 입력 가져오기
    tool_result = tool.invoke(query)
    return {"messages": [{"role": "tool", "content": json.dumps(tool_result)}]}


graph_builder.add_node("tools", run_tool)


# ✅ LLM 실행 노드 (Chatbot)
async def chatbot(state: State) -> Dict[str, list]:
    """
    비동기 방식으로 LLM을 실행하여 응답을 생성하는 함수.
    단, Memory 저장은 동기 방식으로 유지함.

    Args:
        state (State): LangGraph 상태 객체

    Returns:
        Dict[str, list]: AI 응답을 포함하는 상태 딕셔너리
    """

    # ✅ 사용자의 최신 질문 가져오기
    user_query = state["messages"][-1].content

    # ✅ law_chatbot 상태 확인
    if law_chatbot is None:
        print("❌ law_chatbot이 초기화되지 않았습니다.")
        return {
            "messages": [
                {"role": "assistant", "content": "❌ LLM이 로드되지 않았습니다."}
            ]
        }

    # ✅ 이전 대화 기록 불러오기 (비동기 X → 동기 방식 사용)
    chat_history = memory.load_memory_variables({})

    # ✅ 비동기 LLM 호출
    response = await law_chatbot.generate_response(user_query, summary="")

    # ✅ 응답을 문자열(`str`)로 변환
    response_text = str(response)

    # ✅ LangChain 메모리에 대화 저장 (비동기 X → 동기 방식 사용)
    memory.save_context({"input": user_query}, {"output": response_text})

    # ✅ AI 응답 반환
    return {"messages": [{"role": "assistant", "content": response_text}]}


graph_builder.add_node("chatbot", chatbot)


# ✅ LLM과 Tavily 검색을 분리하는 실행 흐름
def route_execution(state: State):
    if state["messages"][-1].content.startswith("search:"):
        return "tools"  # ✅ "search:"로 시작하면 Tavily 검색 실행
    return "chatbot"  # ✅ 그 외의 경우 LLM 실행


# ✅ LangGraph 실행 흐름 설정
graph_builder.add_conditional_edges(
    START, route_execution, {"tools": "tools", "chatbot": "chatbot"}
)
graph_builder.add_edge("tools", "chatbot")  # ✅ Tavily 검색 후 다시 챗봇 실행
graph_builder.add_edge("chatbot", END)  # ✅ LLM 실행 후 LangGraph 종료
graph_builder.set_entry_point("chatbot")  # ✅ LLM(Chatbot) 시작점으로 설정
graph_builder.set_finish_point("chatbot")  # ✅ LangGraph가 정상 종료되도록 설정
graph = graph_builder.compile()


# ✅ LangGraph 실행 및 사용자 입력 처리 함수
async def stream_graph_updates(user_input: str):
    async for event in graph.astream(
        {"messages": [{"role": "user", "content": user_input}]}
    ):
        for value in event.values():
            print("Assistant:", value["messages"][-1]["content"])


# ✅ 비동기 실행 (Python 스크립트 실행 시)
if __name__ == "__main__":

    async def main():
        while True:
            user_input = input("User: ")
            if user_input.lower() in ["quit", "exit", "q"]:
                print("Goodbye!")
                break
            await stream_graph_updates(user_input)

    asyncio.run(main())