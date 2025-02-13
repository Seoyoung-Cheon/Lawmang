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
            repo_id="mistralai/Mistral-7B-Instruct-v0.3",
            task="text-generation",
            temperature=0.3,  # ✅ 랜덤성 줄이고 일관성 높이기
            top_p=0.85,  # ✅ 모델이 좀 더 정밀한 출력을 하도록 조정
            model_kwargs={
                "max_length": 1024,  # ✅ 충분한 길이 보장
                "num_beams": 2,  # ✅ 너무 높은 beam search 방지
            },
            huggingfacehub_api_token=HF_TOKEN,
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

        # ✅ LangChain 프롬프트 설정 (최적화)
        self.prompt_template = PromptTemplate(
            template="""
    당신은 한국 법률 전문가입니다. 
    사용자의 질문에 대해 명확하고 간결한 답변을 제공하세요.
    법률과 관련되지 않은 질문은 "죄송합니다, 법률과 관련된 질문만 답변할 수 있습니다."라고 답변하세요.

    📌 [입력 정보]
    🔍 사용자 질문:
    {user_query}

    📖 판례 요약:
    {summary}

    📌 [출력 형식]
    - 질문에 대한 법률적 개요
    - 판례 요약을 반영한 핵심 내용
    - 자연스럽고 이해하기 쉬운 한국어로 정리
    - **비정상적인 단어, 무의미한 출력, 외국어 혼합 사용을 절대 하지 마세요.**
    
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
            response = self.llm.invoke(prompt).strip()

            # ✅ 응답이 비정상적인 경우, 재요청 (1회)
            if not response or len(response) < 10 in response:
                print("⚠️ [경고] 비정상적인 응답 감지 → LLM 재요청")
                response = self.llm.invoke(prompt).strip()

            # ✅ 여전히 비정상적인 경우, 오류 메시지 반환
            return response if response else "❌ 정상적인 응답을 생성하지 못했습니다."
        except Exception as e:
            return f"❌ LLM 오류: {str(e)}"
