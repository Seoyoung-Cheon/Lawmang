import os
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
from langchain.memory import ConversationBufferMemory  # ✅ LangChain 메모리 추가
from langchain_community.tools import TavilySearchResults
from langchain_teddynote import logging
from langchain_openai import ChatOpenAI
logging.langsmith("llamaproject")
import sys
import time
# "mistralai/Mistral-7B-Instruct-v0.3"
# ✅ 환경 변수 로드
load_dotenv()
# ----------------------------------------------------------#
HF_TOKEN = os.environ.get("HF_TOKEN")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
search_tool = TavilySearchResults(max_results=1)
# ----------------------------------------------------------#
HUGGINGFACE_REPO_ID = "meta-llama/Llama-3.3-70B-Instruct"
#-----------------------------------------------------------#

def load_llm(use_chatgpt=True):
    """LLM 로드 (HuggingFace Inference API)"""
    try:
        if use_chatgpt:
            print("🔹 ChatGPT-3.5-Turbo 사용")
            return ChatOpenAI(
                model="gpt-3.5-turbo",
                api_key=OPENAI_API_KEY,
                temperature=0.7,
                max_tokens=512,
                streaming=True,
            )
        else:
            print("🔹 Mistral-7B 사용")
            return HuggingFaceEndpoint(
                repo_id=HUGGINGFACE_REPO_ID,
                task="text-generation",
                max_new_tokens=512,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.2,
                huggingfacehub_api_token=HF_TOKEN,
            )
    except Exception as e:
        print(f"❌ [LLM 로드 오류] {e}")
        return None


class LangChainRetrieval:
    """LangChain 기반 법률 응답 생성 클래스"""

    def __init__(self):
        self.llm = load_llm()  # ✅ 한 번만 로드하여 유지
        if not self.llm:
            print("❌ LLM이 로드되지 않았습니다.")

        # ✅ LangChain 메모리 추가 (대화 기록 저장)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )

        # ✅ LangChain 프롬프트 설정 (불필요한 요소 제거)
        self.prompt_template = PromptTemplate(
            template="""
    You are a Korean legal expert.
    Answer the user's question concisely and clearly based on the given legal context.
    If the question is unrelated to law, reinterpret it from a legal perspective.
    
    Previous conversation history:
    {chat_history}
    
    The user's question is:
    "{user_query}"
    
    **Tavily Search Result:**
    {search_result}

    Relevant case summary:
    {summary}


Now, provide your answer in fluent, formal Korean:
""",
            input_variables=[
                "chat_history",
                "user_query",
                "search_tool",
                "search_result",
                "summary",
            ],
        )

    def generate_legal_answer(self, user_query, summary):
        """LLM을 사용하여 법률적 답변을 스트리밍 형태로 생성"""
        if not self.llm:
            return "❌ LLM이 로드되지 않았습니다."

        try:
            chat_history = self.memory.load_memory_variables({}).get("chat_history", "")
            
            search_result = search_tool.run(user_query)

            prompt = self.prompt_template.format(
                chat_history=chat_history,
                user_query=user_query,
                search_tool="https://stdict.korean.go.kr/main/main.do",
                search_result=search_result,
                summary=summary,
            )

            # ✅ LLM 스트리밍 모드 실행 (한 글자씩 출력)
            print("\nAI: ", end="", flush=True)
            response = ""
            for chunk in self.llm.stream(prompt):
                chunk_text = chunk.content if hasattr(chunk, "content") else str(chunk)
                if chunk_text:
                    sys.stdout.write(chunk_text)
                    sys.stdout.flush()
                    response += chunk_text  # ✅ 전체 응답 저장

            print("\n")  # ✅ 응답이 끝나면 개행 추가

            # ✅ 대화 기록 업데이트
            self.memory.save_context({"user_query": user_query}, {"response": response})

            return response if response else "❌ 정상적인 응답을 생성하지 못했습니다."
        except Exception as e:
            return f"❌ LLM 오류: {str(e)}"