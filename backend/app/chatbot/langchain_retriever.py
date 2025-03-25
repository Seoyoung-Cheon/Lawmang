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
    
class LawGoKRTavilySearch:
    """
    Tavily를 사용하여 law.go.kr에서만 검색하도록 제한하는 클래스
    """
    def __init__(self, max_results=1):  # ✅ 검색 결과 개수 조정 가능
        self.search_tool = TavilySearchResults(max_results=max_results)

    def run(self, query):
        """
        Tavily를 사용하여 특정 URL(law.go.kr)에서만 검색 실행
        """
        # ✅ 특정 사이트(law.go.kr)에서만 검색하도록 site 필터 적용
        site_restrict_query = f"site:law.go.kr {query}"

        try:
            # ✅ Tavily 검색 실행
            results = self.search_tool.run(site_restrict_query)

            # ✅ 결과 출력 (디버깅용)
            print("🔍 Tavily 응답:", results)

            # ✅ 응답이 리스트인지 확인
            if not isinstance(results, list):
                return (
                    f"❌ Tavily 검색 오류: 결과가 리스트가 아닙니다. ({type(results)})"
                )

            # ✅ `law.go.kr`이 포함된 결과만 필터링
            filtered_results = [
                result
                for result in results
                if isinstance(result, dict)
                and "url" in result
                and "law.go.kr" in result["url"]
            ]

            # ✅ 검색 결과가 없을 경우 처리
            if not filtered_results:
                return "❌ 관련 법률 정보를 찾을 수 없습니다."

            return filtered_results
        except Exception as e:
            return f"❌ Tavily 검색 오류: {str(e)}"


search_tool = LawGoKRTavilySearch(max_results=1)


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

   **AI-generated case summary **
    {summary}

    Now, based on both the Tavily search result and the AI-generated summary, provide a refined legal answer in fluent, formal Korean:
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

            prompt = self.prompt_template.format(
                chat_history=chat_history,
                user_query=user_query,
                search_tool="Tavily Legal Search",
                search_result=search_tool.run(user_query),
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

class COD_Agent:
    """보조 CoD(Chain of Draft) AI"""

    def __init__(self):
        self.llm = load_llm()
        if not self.llm:
            print("❌ LLM이 로드되지 않았습니다.")

        self.memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )

        self.prompt_template = PromptTemplate(
            template="""
    Think step by step, but only keep minimum draft for each thinking step, with 5 words at most.
    Return the "Yes" or "No" at the end of the response after a separator ####.
    
    Format: |
    Q: {question}
    A: {answer}
    
    Few-shot Examples:
    - Q: Is the following sentence plausible? “Kyle Palmieri was called for slashing.”
      A: Kyle: hockey; slashing: hockey. #### Yes
    - Q: Is the following sentence plausible? “Joao Moutinho caught the screen pass in the NFC championship.”
      A: Joao: soccer; NFC: football. #### No

""",
            input_variables=["question", "answer"],  
        )

    def generate_COD_Agent(self, question):
        """CoD AI Response"""
        if not self.llm:
            return "COD AI Not responding."

        try:
            prompt = self.prompt_template.format(
                question=question,
                answer="",  # TODO: 조금 수정 
            )

            response = self.llm.invoke(prompt).content  # 

            #  대화 기록 업데이트
            self.memory.save_context({"question": question}, {"answer": response})

            return response if response else "❌ 정상적인 응답을 생성하지 못했습니다."
        except Exception as e:
            return f"❌ LLM 오류: {str(e)}"
        
        
class summary_agent:
    """관련 모든 판례 상세 요약"""

    def __init__(self):
        self.llm = load_llm()
        if not self.llm:
            print("❌ LLM이 로드되지 않았습니다.")

        self.memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )

        self.prompt_template = PromptTemplate(
            template=""" Inspect "sorted_keywords:{sorted_keywords}" 
            Use"user_query:{user_query}" to identify and sub_category:{sub_category} to identify True or False
            Return the "True" or "False" at the end of the response after a separator ####.
                Calculation = jaccard_similarity(sorted_keywords + [True, False])
                
                False will only return #### False
                True will return #### True 
                
        Few-shot Examples:
        - sorted_keywords: '경우', '수산물', '식품위생법', '보관', '식품'
        - user_query: 참치 마요 
        - sub_category: 계약의 해지 해제
        - #### False
        
        Few-shot Examples:
        - sorted_keywords: '파산', '빚', '걱정'
        - user_query: 파산할것 같습니다 어떻게 해야할까요
        - sub_category: '파산신청' 
        - #### True 
    """,
            input_variables=["sorted_keywords", "user_query", "sub_category"],
        )

    def generate_summary_agent(self, question):
        """CoD AI Response"""
        if not self.llm:
            return "COD AI Not responding."

        try:
            prompt = self.prompt_template.format(
                question=question,
                answer="",  # TODO: 조금 수정
            )

            response = self.llm.invoke(prompt).content  #

            #  대화 기록 업데이트
            self.memory.save_context({"question": question}, {"answer": response})

            return response if response else "❌ 정상적인 응답을 생성하지 못했습니다."
        except Exception as e:
            return f"❌ LLM 오류: {str(e)}"


# class summary_agent:
#     """관련 모든 판례 상세 요약"""

#     def __init__(self):
#         self.llm = load_llm()
#         if not self.llm:
#             print("❌ LLM이 로드되지 않았습니다.")

#         self.memory = ConversationBufferMemory(
#             memory_key="chat_history", return_messages=True
#         )

#         self.prompt_template = PromptTemplate(
#             template="""
#     Think step by step, but only keep minimum draft for each thinking step, with 5 words at most.
#     Return the "Yes" or "No" at the end of the response after a separator ----.
    
#     Format: |
#     Q: {question}
#     A: {answer}
    
#     Few-shot Examples:
#     - Q: Is the following sentence plausible? “Kyle Palmieri was called for slashing.”
#       A: Kyle: hockey; slashing: hockey. #### Yes
#     - Q: Is the following sentence plausible? “Joao Moutinho caught the screen pass in the NFC championship.”
#       A: Joao: soccer; NFC: football. #### No

#     Now, provide your brief analysis in Korean:
# """,
#             input_variables=["question", "answer", "sub_category"],
#         )

#     def generate_summary_agent(self, question):
#         """CoD AI Response"""
#         if not self.llm:
#             return "COD AI Not responding."

#         try:
#             prompt = self.prompt_template.format(
#                 question=question,
#                 answer="",  # TODO: 조금 수정
#             )

#             response = self.llm.invoke(prompt).content  #

#             #  대화 기록 업데이트
#             self.memory.save_context({"question": question}, {"answer": response})

#             return response if response else "❌ 정상적인 응답을 생성하지 못했습니다."
#         except Exception as e:
#             return f"❌ LLM 오류: {str(e)}"

