import os
import sys
import asyncio
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from concurrent.futures import ThreadPoolExecutor
from app.chatbot.tool_agents.controller import run_full_consultation
from app.chatbot.tool_agents.utils.utils import faiss_kiwi

# ✅ PYTHONPATH 설정
sys.path.append(os.path.abspath("."))

# ✅ 환경 및 전역 객체 초기화
load_dotenv()
executor = ThreadPoolExecutor(max_workers=10)
DB_FAISS_PATH = "./app/chatbot/faiss"


def load_faiss():
    """FAISS 벡터 DB 로드"""
    try:
        embedding_model = HuggingFaceEmbeddings(
            model_name="jhgan/ko-sroberta-multitask"
        )
        return FAISS.load_local(
            DB_FAISS_PATH,
            embedding_model,
            allow_dangerous_deserialization=True,
        )
    except Exception as e:
        print(f"❌ [FAISS 로드 실패] {e}")
        return None

async def run_search_pipeline(query: str):
    """
    전체 파이프라인 실행: FAISS → 키워드 추출 → SQL 상담/판례 → LLM 실행
    """
    print(f"\n🔍 [INFO] 검색 실행 시작: {query}")

    # ✅ 1. FAISS 로드
    faiss_db = load_faiss()
    if not faiss_db:
        return {"error": "FAISS 로드 실패"}

    # ✅ 2. 키워드 추출 및 정제 (유틸 적용)
    search_keywords = faiss_kiwi.extract_top_keywords_faiss(query, faiss_db, top_k=5)
    print(f"✅ [키워드 최종]: {search_keywords}")

    # ✅ 3. controller 전체 흐름 실행
    result = await run_full_consultation(
        user_query=query, search_keywords=search_keywords
    )

    return result


def main():
    """CLI 기반 법률 AI"""
    print("✅ [시작] 법률 AI 검색기")

    while True:
        user_query = input("\n❓ 질문을 입력하세요 (종료: exit): ")
        if user_query.lower() == "exit":
            break

        result = asyncio.run(run_search_pipeline(user_query))

        print("\n📌 [최종 결과 요약]")
        print("🟦 사용자 질문:", result.get("user_query"))
        print("📄 템플릿 요약:", result.get("template", {}).get("summary", "없음"))
        print(
            "🧠 전략 요약:",
            result.get("strategy", {}).get("final_strategy_summary", "없음"),
        )
        print("📚 판례 요약:", result.get("precedent", {}).get("summary", "없음"))
        print("🔗 링크:", result.get("precedent", {}).get("casenote_url", "없음"))
        print("🤖 최종 GPT 응답:\n", result.get("final_answer", "응답 생성 실패"))
        print("🧪 평가 결과:", result.get("final_evaluation", {}).get("reason", "없음"))


if __name__ == "__main__":
    main()