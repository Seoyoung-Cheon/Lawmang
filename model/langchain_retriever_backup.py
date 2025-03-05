import os
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv
from langchain.memory import ConversationBufferMemory  # ✅ LangChain 메모리 추가
from langchain_teddynote import logging
logging.langsmith("llamaproject")

# ✅ 환경 변수 로드
load_dotenv()

# ✅ LLM 모델 설정 (DeepSeek 적용)
HF_TOKEN = os.environ.get("HF_TOKEN")
HUGGINGFACE_REPO_ID = "meta-llama/Llama-3.3-70B-Instruct"


def load_llm():
    """LLM 로드 (HuggingFace Inference API)"""
    try:
        return HuggingFaceEndpoint(
            repo_id=HUGGINGFACE_REPO_ID,
            task="text-generation",
            max_new_tokens=125,  # ✅ 한 번에 생성할 최대 토큰 수 설정
            temperature=0.7,  # ✅ 답변 다양성 조정 (기존 0.3 → 0.7)
            top_p=0.9,  # ✅ 다양한 출력 유도
            repetition_penalty=1.2,  # ✅ 반복 방지 추가
            model_kwargs={
                "max_length": 250,  # ✅ 출력 길이 늘리기 (기존 150 → 256)   // (입력 토큰 + 출력 토큰)값
                "num_beams": 2,  # ✅ 탐색 다양성 증가 (기존 2 → 3)
            },
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
    {chat_history}
    The user's question is:
    "{user_query}"

    Relevant case summary:
    {summary}


Now, provide your answer in fluent, formal Korean and don't use Chinese characters and interpret as korean:
""",
            input_variables=["chat_history", "user_query", "summary"],
        )

    def generate_legal_answer(self, user_query, summary):
        """LLM을 사용하여 법률적 답변 생성"""
        if not self.llm:
            return "❌ LLM이 로드되지 않았습니다."
        try:
            # ✅ 대화 기록을 불러옴 (이전 문맥 포함)
            chat_history = self.memory.load_memory_variables({}).get("chat_history", "")

            # ✅ 대화 기록 포함한 프롬프트 생성
            prompt = self.prompt_template.format(
                chat_history=chat_history, user_query=user_query, summary=summary
            )

            response = self.llm.invoke(prompt).strip()

            # ✅ 대화 기록 업데이트
            self.memory.save_context({"user_query": user_query}, {"response": response})

            return response if response else "❌ 정상적인 응답을 생성하지 못했습니다."
        except Exception as e:
            return f"❌ LLM 오류: {str(e)}"
