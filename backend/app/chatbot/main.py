import os
import sys
import asyncio
from asyncio import Lock
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
# ✅ 컨트롤러 및 유틸
from app.chatbot.memory.global_cache import get_cached_result
from app.chatbot.initial_agents.controller import run_initial_controller
from app.chatbot.tool_agents.controller import run_full_consultation
from app.chatbot.tool_agents.utils.utils import faiss_kiwi

# ✅ 락: 고급 응답 생성 중 중복 실행 방지
llm2_lock = Lock()

# ✅ PYTHONPATH 설정
sys.path.append(os.path.abspath("."))

# ✅ 환경변수 로드
load_dotenv()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
DB_FAISS_PATH = "./app/chatbot/faiss"
executor = ThreadPoolExecutor(max_workers=10)


def load_faiss():
    """FAISS 벡터 DB 로드"""
    try:
        embedding_model = OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key=OPENAI_API_KEY,
        )
        return FAISS.load_local(
            DB_FAISS_PATH,
            embedding_model,
            allow_dangerous_deserialization=True,
        )
    except Exception as e:
        print(f"❌ [FAISS 로드 실패]: {e}")
        return None

async def run_dual_pipeline(user_query: str):
    print(f"\n🔍 [INFO] 사용자 질문 수신: {user_query}")

    faiss_db = load_faiss()
    if not faiss_db:
        return {"error": "FAISS 로드 실패"}

    # ✅ LLM1 먼저 실행
    initial_result = await run_initial_controller(
        user_query=user_query, faiss_db=faiss_db
    )

    # ✅ ###NO 또는 비법률 질문인 경우: 고급 처리 중단
    if initial_result.get("status") in ["nonlegal_skipped", "no_triggered"]:
        print("🚫 [고급 응답 생략됨] 이유:", initial_result.get("status"))
        return {
            "initial": initial_result,
            "advanced": None,
        }

    # ✅ 캐시에서 YES 3회 확인 → 고급 전략 실행
    last_query = initial_result.get("last_yes_query") or user_query
    session_id = last_query[:20]
    print("\n📦 [캐시 로드] session_id =", session_id)

    cached = get_cached_result(session_id)

    # 전체 캐시 상태 출력
    for k, v in cached.items():
        print(f"🔑 {k}: {v}")

    # 개별 중요 키도 강조
    print("🧪 [캐시 yes_count] =", cached.get("yes_count"))
    print("🧪 [캐시 escalated_once] =", cached.get("escalated_once"))
    print("🧪 [캐시 template 존재 여부] =", "O" if cached.get("template") else "X")
    print("🧪 [캐시 strategy 존재 여부] =", "O" if cached.get("strategy") else "X")
    print("🧪 [캐시 precedent 존재 여부] =", "O" if cached.get("precedent") else "X")


<<<<<<< HEAD
    if cached.get("escalated_once", False):
        if llm2_lock.locked():
            print("⚠️ [중복 실행 방지] 고급 응답 생성 중입니다.")
            return {
                "initial": initial_result,
                "advanced": None,
            }

        print("🚀 [YES 카운트 3회 도달 → 고급 응답 생성 시작]")
        search_keywords = faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db)

        async with llm2_lock:
            advanced_result = await run_full_consultation(
                user_query=user_query,
                search_keywords=search_keywords,
            )
    else:
        print("⏸️ [YES 누적 중 → 고급 응답 생략]")
        advanced_result = None

    return {
        "initial": initial_result,
        "advanced": advanced_result,
    }


async def chatbot_loop():
    print("✅ [시작] 법률 AI 챗봇 (초기 응답 + 고급 응답 병렬 처리)")
=======
async def search(query: str):
    """🔍 검색 실행 (FastAPI에서 호출)"""
    try:
        result = await run_search_pipeline(query)
        return result if "error" not in result else {"error": result["error"]}
    except Exception as e:
        return {"error": f"검색 중 오류 발생: {str(e)}"}


def main():
    """CLI 기반 법률 AI"""
    print("✅ [시작] 법률 AI 검색기")
>>>>>>> 7ccd73896e28bc0fccc7f9ab1fe81e838a44836b

    while True:
        user_query = input("\n❓ 질문을 입력하세요 (종료: exit): ")

        if user_query.lower() == "exit":
            break

        if llm2_lock.locked():
            print("⚠️ 고급 AI 응답 생성 중입니다. 잠시만 기다려주세요.")
            continue

<<<<<<< HEAD
        result = await run_dual_pipeline(user_query)

        if "error" in result:
            print("❌ 실행 실패:", result["error"])
            continue

        # ✅ 초기 응답 출력
        initial = result["initial"]
        print("\n🟦 [초기 응답]:")
        print(initial.get("initial_response", "응답 없음"))

        # ✅ 후속 질문 (ask_human)
        if initial.get("followup_question"):
            print("\n🟨 [후속 질문 제안]:")
            print(initial["followup_question"])

        # ✅ 고급 응답 출력
        advanced = result.get("advanced")
        if advanced and advanced.get("final_answer"):
            print("\n🚀 [고급 응답 시작]")
            print(
                "📄 템플릿 요약:", advanced.get("template", {}).get("summary", "없음")
            )
            print(
                "🧠 전략 요약:",
                advanced.get("strategy", {}).get("final_strategy_summary", "없음"),
            )
            print("📚 판례 요약:", advanced.get("precedent", {}).get("summary", "없음"))
            print("🔗 링크:", advanced.get("precedent", {}).get("casenote_url", "없음"))
            print("🤖 최종 GPT 응답:\n", advanced.get("final_answer", "응답 없음"))
        else:
            print(
                "\n✅ 초기 응답으로 충분하다고 판단됨. 고급 LLM 응답은 생략되었습니다."
            )


def main():
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(chatbot_loop())
    except KeyboardInterrupt:
        print("\n🛑 사용자 종료")
    finally:
        loop.close()
=======
        print("\n📌 [최종 결과 요약]")  
        print("🟦 사용자 질문:", result.get("user_query"))
        print("📄 템플릿 요약:", result.get("template", {}).get("summary", "없음"))
        print("🧠 전략 요약:", result.get("strategy", {}).get("final_strategy_summary", "없음"))
        print("📚 판례 요약:", result.get("precedent", {}).get("summary", "없음"))
        print("🔗 링크:", result.get("precedent", {}).get("casenote_url", "없음"))
        print("🤖 최종 GPT 응답:\n", result.get("final_answer", "응답 생성 실패"))
        print("🧪 평가 결과:", result.get("final_evaluation", {}).get("reason", "없음"))
>>>>>>> 7ccd73896e28bc0fccc7f9ab1fe81e838a44836b


if __name__ == "__main__":
    main()
