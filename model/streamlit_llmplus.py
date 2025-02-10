import streamlit as st
import re
from create_search import (
    load_faiss,
    load_bart,
    load_bert,
    summarize_case,
    predict_judgment,
)
from langchain_retriever import LangChainRetrieval  # ✅ LangChain 연결

# ✅ Streamlit 앱 설정
st.set_page_config(page_title="법률 AI 챗봇", layout="wide")
st.image("./data/doggo.jpg", width=300)
st.title("⚖️ 법률 AI 챗봇")
st.markdown("💡 **판례 검색, 요약 및 판결 예측을 수행하는 AI 챗봇입니다.**")

# ✅ 모델 로딩 상태 표시
with st.spinner("🔄 모델을 로드하는 중입니다. 잠시만 기다려 주세요..."):

    @st.cache_resource
    def load_models():
        db = load_faiss()
        summarizer_tokenizer, summarizer_model = load_bart()
        judgment_tokenizer, judgment_model = load_bert()
        langchain_retriever = LangChainRetrieval()

        if db is None:
            st.error("❌ FAISS 벡터 DB 로드에 실패했습니다.")

        return (
            db,
            summarizer_tokenizer,
            summarizer_model,
            judgment_tokenizer,
            judgment_model,
            langchain_retriever,
        )

    # ✅ 모델 로딩 실행
    (
        db,
        summarizer_tokenizer,
        summarizer_model,
        judgment_tokenizer,
        judgment_model,
        langchain_retriever,
    ) = load_models()

st.success("✅ 모델 로드 완료!")


# ✅ 영어 입력 차단 함수
# def contains_english(user_input):
#     """입력값에 영어가 포함되어 있는지 확인"""
#     return bool(re.search(r"[A-Za-z]", user_input))


# ✅ 사용자 입력
user_query = st.text_input(
    "📝 **질문을 입력하세요:**",
    placeholder="예: 상속권은 어떻게 결정되나요?",
    key="user_input",
)

# ✅ 검색 버튼
if st.button("🔍 검색 실행"):
    if not user_query.strip():
        st.warning("⚠️ 질문을 입력해 주세요!")

    # elif contains_english(user_query):  # ✅ 영어 입력 차단
    #     st.warning("❌ 영어 입력은 허용되지 않습니다. 한글로 입력해주세요.")

    else:
        with st.spinner("🔎 검색 중..."):
            result_text = ""

            # ✅ 1. FAISS 검색
            search_result = "검색 결과 없음"
            if db:
                try:
                    search_results = db.similarity_search(user_query, k=3)
                    search_result = "\n".join(
                        [doc.page_content for doc in search_results]
                    )
                    result_text += f"✅ **기본 검색 결과:**\n{search_result}\n"
                except Exception as e:
                    result_text += f"❌ **검색 오류:** {str(e)}\n"

            # ✅ 2. BART 판례 요약
            summary = "❌ 판례 요약 모델 로드 실패"
            if summarizer_model:
                summary = summarize_case(
                    search_result, summarizer_tokenizer, summarizer_model
                )
                result_text += f"\n✅ **판례 요약:**\n{summary}\n"

            # ✅ 3. BERT 판결 예측
            prediction = "❌ 판결 예측 모델 로드 실패"
            if judgment_model:
                prediction = predict_judgment(
                    search_result, judgment_tokenizer, judgment_model
                )
                result_text += f"\n✅ **판결 예측 결과:** {prediction}\n"

            # ✅ 4. LLM 최종 답변 생성
            final_answer = "❌ LLM 응답 생성 실패"
            if langchain_retriever:
                try:
                    final_answer = langchain_retriever.generate_legal_answer(
                        user_query, summary
                    )
                except Exception as e:
                    final_answer = f"❌ LLM 오류: {str(e)}"

            # ✅ 결과 출력 (카드 형식)
            st.markdown("---")
            st.subheader("📌 검색 결과")
            st.text_area("🔍 검색 결과", value=search_result, height=150, disabled=True)

            st.subheader("📌 판례 요약")
            st.text_area("📖 요약 결과", value=summary, height=120, disabled=True)

            st.subheader("📌 LLM 최종 답변")
            st.text_area("🤖 AI 답변", value=final_answer, height=150, disabled=True)

            st.success("✅ 검색 완료!")
            st.write("📌 [DEBUG] FAISS 검색 활성화 여부:", bool(db))
            st.write("📌 [DEBUG] LLM 활성화 여부:", bool(langchain_retriever))
