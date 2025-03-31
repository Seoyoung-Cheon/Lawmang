import os
import sys
import asyncio
from asyncio import Lock
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from app.chatbot.tool_agents.executor.normalanswer import run_final_answer_generation
from app.chatbot.initial_agents.controller import run_initial_controller
from app.chatbot.tool_agents.controller import run_full_consultation
from app.chatbot.tool_agents.utils.utils import faiss_kiwi

# ✅ 락: 중복 실행 방지
llm2_lock = Lock()
yes_count = 0
executed_once = False

sys.path.append(os.path.abspath("."))
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DB_FAISS_PATH = "./app/chatbot/faiss"


def load_faiss():
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
        print(f"❌ FAISS 로드 실패: {e}")
        return None
    
    
async def run_dual_pipeline(user_query: str):
    global yes_count
    print(f"\n🔍 사용자 질문 수신: {user_query}")

    faiss_db = load_faiss()
    if not faiss_db:
        return {"error": "FAISS 로드 실패"}

    # ✅ 초기 응답 먼저 실행 (판단 기반으로 분기)
    initial_result = await run_initial_controller(
        user_query, faiss_db, current_yes_count=yes_count
    )
    status = initial_result.get("status", "ok")

    # ✅ 비법률 / 차단 조건: 고급 실행 차단
    if status in ["no_triggered", "nonlegal_skipped"]:
        return {"initial": initial_result, "advanced": None}

    # ✅ YES 카운트 업데이트
    yes_count = initial_result.get("yes_count", yes_count)

    # ✅ 전력/판례 빌드 조건부 실행
    search_keywords = faiss_kiwi.extract_top_keywords_faiss(user_query, faiss_db)
    prepared_data = await run_full_consultation(
        user_query, search_keywords, build_only=True
    )
    template = prepared_data.get("template")
    strategy = prepared_data.get("strategy")
    precedent = prepared_data.get("precedent")

    if not all([template, strategy, precedent]):
        print("⚠️ 전력 또는 판례 빌드 실패. 고급 응답 생략")
        return {"initial": initial_result, "advanced": None}

    advanced_result = None
    if yes_count >= 3:
        async with llm2_lock:
            print("🚀 [YES 조건 만족 → GPT 고급 응답 생성 시작]")

            final_answer = run_final_answer_generation(
                template=template,
                strategy=strategy,
                precedent=precedent,
                user_query=user_query,
                model="gpt-4",
            )

            # ✅ 카운트 초기화 (3 → 1)
            yes_count = 1

            advanced_result = {
                "user_query": user_query,
                "template": template,
                "strategy": strategy,
                "precedent": precedent,
                "final_answer": final_answer,
                "status": "ok",
            }
    else:
        print(f"⏸️ [고급 응답 조건 미달 - 현재 yes_count: {yes_count}]")

    return {
        "initial": initial_result,
        "advanced": advanced_result,
    }


async def chatbot_loop():
    print("✅ [시작] 법률 AI 챗봇")

    while True:
        user_query = input("\n❓ 질문을 입력하세요 (종료: exit): ")
        if user_query.lower() == "exit":
            break

        if llm2_lock.locked():
            print("⚠️ [고급 응답 생성 중, 잠시만 기다리세요.]")
            continue

        result = await run_dual_pipeline(user_query)

        if "error" in result:
            print("❌ 실행 실패:", result["error"])
            continue

        initial = result["initial"]

        print("\n🟦 [초기 LLM 응답]:")
        print(initial.get("initial_response", "응답 없음"))

        followup = initial.get("followup_question")
        is_mcq = initial.get("is_mcq", False)

        if followup:
            if is_mcq and isinstance(followup, dict):
                print("\n🟨 [객관식 후속 질문 제안]:")
                print("📌 질문:", followup.get("question", "없음"))
                for key, value in followup.get("options", {}).items():
                    print(f"   {key}. {value}")
                print("✅ 정답:", followup.get("correct_answer", "없음"))
            else:
                print("\n🟨 [후속 질문 제안]:", followup)

        advanced = result.get("advanced")
        if advanced:
            if advanced.get("final_answer"):
                print("\n🚀 [고급 LLM 응답]:")
                print(
                    "📄 템플릿 요약:",
                    advanced.get("template", {}).get("summary", "없음"),
                )
                print(
                    "🧠 전략 요약:",
                    advanced.get("strategy", {}).get("final_strategy_summary", "없음"),
                )
                print(
                    "📚 판례 요약:",
                    advanced.get("precedent", {}).get("summary", "없음"),
                )
                print(
                    "🔗 링크:",
                    advanced.get("precedent", {}).get("casenote_url", "없음"),
                )
                print("\n🤖 최종 GPT 응답:\n", advanced.get("final_answer", "없음"))
            else:
                print("🔧 [전략/판례 빌드 완료 (최종 GPT 응답 생략됨)]")
        else:
            print("\n✅ 초기 응답으로 충분합니다.")


def main():
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(chatbot_loop())
    loop.close()


if __name__ == "__main__":
    main()
