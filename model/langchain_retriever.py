import os
from langchain_huggingface import HuggingFaceEndpoint
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv

# ✅ 환경 변수 로드
load_dotenv()

# ✅ LLM 모델 설정
HF_TOKEN = os.environ.get("HF_TOKEN")
HUGGINGFACE_REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"


def load_llm():
    """LLM 로드 (HuggingFace Inference API)"""
    try:
        return HuggingFaceEndpoint(
            repo_id=HUGGINGFACE_REPO_ID,
            task="text-generation",
            model_kwargs={"max_length": 1024, "num_beams": 4},
            huggingfacehub_api_token=HF_TOKEN,  # ✅ API 토큰을 올바르게 설정
        )
    except Exception as e:
        print(f"❌ [LLM 로드 오류] {e}")
        return None


class LangChainRetrieval:
    """LangChain 기반 법률 응답 생성 클래스"""

    def __init__(self):
        self.llm = load_llm()
        if not self.llm:
            print("❌ LLM이 로드되지 않았습니다.")

        # ✅ LangChain 프롬프트 설정
        self.prompt_template = PromptTemplate(
            template="""
    당신은 자신의 주장을 거세게 관철하는 한국 법률 전문가입니다. 
    사용자의 질문에 대해 정확하고 간결한 답변을 제공하세요.
    당신은 무조건 오로지 한국 법 관련에 대해서만 대답합니다,
    비(not)법 관련 질문이면 가볍게 무시하고 자신의 대답을 이어나가세요
    비(not) 한국어 사용자한테 답변을 최대한 한국어로 유도하세요 
    ※ 외국어 답변을 절대로 하지 마세요 

    📌 [입력 정보]
    🔍 사용자 질문:
    {user_query}

    📖 판례 요약:
    {summary}

    📌 [출력 형식]
    - 질문에 대한 법률적 개요
    - 판례 요약을 반영한 핵심 내용
    - 자연스럽고 이해하기 쉬운 한국어로 정리
    ※ 비법률 질문을 최대한 법률적으로 해석하고 불가능하면 "죄송합니다 그것은 답할수 없습니다" 출력
    
    ※;비법률 질문자 행동 유도: 최대한 법률 질문으로 해석하며 법률 질문 유도 
    ※;비법률 질문자가 이상한 답변을 할떄 최대한 법률적 대답 불가능하면 그대로 "이해할 수 없습니다." 답변
    - 사용자가 요청하는 답은 텍스트 형식만 답변 가능합니다

    ※ 판례와 관련 내용을 그대로 나열하지 말고, 하나의 정리된 답변을 생성하세요.

    📌 [최종 답변]:
    """,
            input_variables=["user_query", "summary"],
        )
    def generate_legal_answer(self, user_query, summary):
        """LLM을 사용하여 법률적 답변 생성"""

        # ✅ LLM을 매번 새로 로드하여 한 번만 실행되는 문제 해결
        self.llm = load_llm()

        if not self.llm:
            return "❌ LLM이 로드되지 않았습니다."

        try:
            prompt = self.prompt_template.format(user_query=user_query, summary=summary)
            response = self.llm.invoke(prompt)
            return response.strip()
        except Exception as e:
            return f"❌ LLM 오류: {str(e)}"
