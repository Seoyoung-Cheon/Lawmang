import os
import sys
import torch
import asyncio
import numpy as np
from transformers import (
    BartForConditionalGeneration,
)
from sklearn.metrics.pairwise import cosine_similarity
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from safetensors.torch import load_file
from dotenv import load_dotenv
from kobart import get_pytorch_kobart_model, get_kobart_tokenizer
from kiwipiepy import Kiwi
from backend.app.chatbot.legal_response_generator import LangChainRetrieval
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
# from app.chatbot.tool_agents.tools import search_precedents
from app.chatbot.tool_agents.tools import async_search_consultation
from app.chatbot.tool_agents.tools import async_search_precedent
from app.chatbot.tool_agents.tools import search_tavily_for_precedents

# ✅ Kiwi 객체 전역 캐싱
kiwi = Kiwi()
# ✅ 환경 변수 로드
load_dotenv()
# ✅ FAISS 벡터DB 로드
DB_FAISS_PATH = "./app/chatbot/faiss"


def load_faiss():
    """FAISS 로드"""
    try:
        embedding_model = HuggingFaceEmbeddings(
            model_name="jhgan/ko-sroberta-multitask"
        )
        return FAISS.load_local(
            DB_FAISS_PATH, embedding_model, allow_dangerous_deserialization=True
        )
    except Exception as e:
        print(f"❌ [FAISS 로드 오류] {e}")
        return None


def jaccard_similarity(set1, set2):
    """Jaccard 유사도를 이용한 키워드 비교"""
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return len(intersection) / len(union) if len(union) > 0 else 0


def extract_keywords(text, top_k=5):
    """형태소 분석을 통해 명사(NNG, NNP) 상위 키워드 추출"""
    tokens = kiwi.tokenize(text)
    nouns = [token.form for token in tokens if token.tag in ("NNG", "NNP")]

    keyword_freq = {word: nouns.count(word) for word in set(nouns)}
    sorted_keywords = sorted(keyword_freq, key=keyword_freq.get, reverse=True)[:top_k]

    print(f"✅ [키워드 추출 결과] {sorted_keywords}")
    return sorted_keywords


def filter_keywords_with_jaccard(user_keywords, faiss_keywords, threshold=0.15):
    """자카드 유사도를 활용하여 FAISS 키워드를 필터링 (유저 키워드 유지)"""
    filtered_keywords = set(user_keywords)  # ✅ 유저 입력 키워드를 무조건 포함

    for faiss_word in faiss_keywords:
        max_sim = max(
            jaccard_similarity(set(faiss_word), set(user_word))
            for user_word in user_keywords
        )

        if max_sim >= threshold:  # ✅ 일정 유사도 이상인 FAISS 키워드만 추가
            filtered_keywords.add(faiss_word)

    return list(filtered_keywords)  # ✅ 최종 키워드 반환 (유저 키워드 포함)

def filter_consultation_keywords(user_keywords, consultation_keywords, threshold=0.15):
    """🔎 Jaccard 유사도를 활용하여 법률 상담 키워드를 필터링"""
    filtered_keywords = set(user_keywords)  # ✅ 유저 입력 키워드는 무조건 포함

    for cons_word in consultation_keywords:
        cons_word_set = set(cons_word.split())  # ✅ 단어 단위로 분리
        max_sim = max(
            jaccard_similarity(cons_word_set, set(user_word.split()))
            for user_word in user_keywords
        )
        if max_sim >= threshold:  # ✅ 일정 유사도 이상이면 추가
            filtered_keywords.add(cons_word)

    return list(filtered_keywords)  # ✅ 최종 필터링된 키워드 반환


def adjust_faiss_keywords(user_input, faiss_keywords):
    """유저 입력 키워드와 FAISS 키워드를 모두 포함하여 검색"""
    user_keywords = extract_keywords(user_input, top_k=5)  # ✅ 유저 입력 키워드 추출

    # ✅ 유저 입력 키워드 + FAISS 키워드 통합 (중복 제거)
    adjusted_keywords = list(set(user_keywords + faiss_keywords))

    print(f"✅ [최종 검색 키워드]: {adjusted_keywords}")
    return adjusted_keywords


def extract_top_keywords_faiss(user_input, faiss_db, top_k=5):
    """FAISS 검색 후 상위 키워드 추출 (유저 입력 반영)"""
    print(f"🔍 [FAISS 키워드 추출] 입력: {user_input}")

    search_results = faiss_db.similarity_search(user_input, k=15)
    all_text = " ".join([doc.page_content for doc in search_results])

    faiss_keywords = extract_keywords(all_text, top_k)  # ✅ FAISS에서 추출한 키워드

    adjusted_keywords = adjust_faiss_keywords(
        user_input, faiss_keywords
    )  # ✅ 유저 키워드 반영
    print(f"✅ [FAISS 최종 검색 키워드] {adjusted_keywords}")
    return adjusted_keywords


langchain_retriever = LangChainRetrieval()

# ✅ BART 모델 경로
MODEL_PATH = "./app/chatbot/model/1_bart/checkpoint-26606"

# ✅ 전역 캐싱
bart_model = None
bart_tokenizer = None


def load_bart():
    """KoBART 모델 로드 (전역 캐싱 적용)"""
    global bart_model, bart_tokenizer
    if bart_model is None or bart_tokenizer is None:
        try:
            print("🔍 KoBART 모델 로드 중...")
            bart_model = BartForConditionalGeneration.from_pretrained(
                get_pytorch_kobart_model()
            )
            bart_tokenizer = get_kobart_tokenizer()
            bart_tokenizer.pad_token_id = bart_tokenizer.eos_token_id
            bart_tokenizer.model_max_length = 1024

            # ✅ `model.safetensors`에서 가중치 로드
            state_dict = load_file(os.path.join(MODEL_PATH, "model.safetensors"))
            bart_model.load_state_dict(state_dict, strict=False)

            # ✅ 모델 평가 모드 전환
            bart_model.eval()
            print("✅ KoBART 모델 로드 성공")
        except Exception as e:
            print(f"❌ [KoBART 로드 오류] {e}")
            bart_model, bart_tokenizer = None, None
    return bart_tokenizer, bart_model


def summarize_case(text, tokenizer, model):
    """판례 요약: 입력 텍스트가 충분히 길어야 요약을 수행하도록 함"""
    try:
        char_length = len(text)
        word_count = len(text.split())
        print(
            f"🔎 [DEBUG] 입력 텍스트 길이 (문자수): {char_length}, 단어 수: {word_count}"
        )

        if word_count < 5 or char_length < 20:
            return "입력된 텍스트가 짧아 요약을 수행할 수 없습니다."

        # ✅ 토큰화 후 인코딩된 값 확인 (clamp 제거 & padding 추가)
        input_ids = tokenizer.encode(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,  # ✅ 패딩 추가로 안정적 토큰 생성
        )
        print(f"🔎 [DEBUG] BART input_ids: {input_ids}")

        print("🚀 [INFO] `generate()` 실행 시작")

        summary_ids = model.generate(
            input_ids,
            max_length=200,  # ✅ 최대 길이 증가 (150 → 200)
            min_length=100,  # ✅ 최소 길이 줄임 (149 → 100)
            num_beams=3,  # ✅ beams 감소로 속도 증가 (5 → 3)
            early_stopping=True,
            no_repeat_ngram_size=5,  # ✅ 반복 방지 (4 → 5)
            repetition_penalty=2.5,  # ✅ 반복 최소화 (2.2 → 2.5)
            length_penalty=0.8,  # ✅ 길이 제한 완화 (1.0 → 0.8)
        )

        print(f"🔎 [DEBUG] summary_ids: {summary_ids}")

        decoded = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        print(f"🔎 [DEBUG] 요약 결과: {decoded}")

        return decoded

    except Exception as e:
        print(f"❌ [판례 요약 오류] {e}")
        return "❌ 요약 실패"



@lru_cache(maxsize=1000)
def get_bart_model():
    return load_bart()

executor = ThreadPoolExecutor(max_workers=10)



async def search(query: str):
    """FAISS + SQL + 법률 상담 & 판례 검색 최적화 (비동기 적용)"""
    print(f"\n🔎 [INFO] 검색 실행: {query}")

    # ✅ 1. FAISS 로드
    faiss_db = load_faiss()
    if not faiss_db:
        print("❌ [오류] FAISS 데이터베이스를 로드할 수 없습니다.")
        return {"error": "FAISS 데이터베이스를 로드할 수 없습니다."}

    # ✅ 2. 검색 키워드 추출 (최대 5개 사용)
    search_keywords = extract_top_keywords_faiss(query, faiss_db, top_k=5)
    print(f"✅ [최종 검색 키워드]: {search_keywords}")

    # ✅ 3. 법률 상담 데이터 검색
    (
        consultation_results,
        consultation_categories,
        consultation_titles,
    ) = await async_search_consultation(search_keywords)

    if not consultation_results:
        print("❌ [SQL 검색 실패] 해당 상담 데이터를 찾을 수 없습니다.")
        return {
            "search_result": "해당 상담 데이터를 찾을 수 없습니다.",
            "keywords_used": search_keywords,
            "consultation_result": "법률 상담 검색 실패",
            "precedent_detail": "없음",
            "summary": "BART 모델이 로드되지 않음",
            "bert_prediction": "BERT 모델이 로드되지 않음",
            "final_answer": "관련 데이터를 찾을 수 없습니다.",
        }

    # ✅ 4. 상담 기반 판례 검색
    precedent_results = await async_search_precedent(
        consultation_categories,
        consultation_titles,
        search_keywords,
    )

    if not precedent_results:
        print("❌ [SQL 검색 실패] 해당 판례를 찾을 수 없습니다.")
        return {
            "search_result": "해당 판례를 찾을 수 없습니다.",
            "keywords_used": search_keywords,
            "consultation_result": consultation_results,
            "precedent_detail": "없음",
            "summary": "BART 모델이 로드되지 않음",
            "bert_prediction": "BERT 모델이 로드되지 않음",
            "final_answer": "관련 데이터를 찾을 수 없습니다.",
        }

    # ✅ 5. 가장 연관성 높은 판례 선택
    most_relevant_precedent = precedent_results[0]
    print(f"✅ [선택된 판례]: {most_relevant_precedent}")

    # ✅ 6. Tavily 요약 검색
    tavily_result, casenote_url = await search_tavily_for_precedents(
        most_relevant_precedent
    )

    # ✅ 7. 판례 상세 정보 구성
    precedent_detail = f"""
    사건번호: {most_relevant_precedent["c_number"]}
    사건종류: {most_relevant_precedent["c_type"]}
    판결일: {most_relevant_precedent["j_date"]}
    법원: {most_relevant_precedent["court"]}
    내용요약: {tavily_result}
    원문 링크: {casenote_url}
    """

    # ✅ 8. BART 요약 생성 입력 준비
    selected_answers = "\n\n".join([c["answer"] for c in consultation_results[:2]])
    selected_consultations = "\n\n".join(
        [
            f"ID: {c['id']}, 카테고리: {c['category']}, 서브 카테고리: {c['sub_category']}, 제목: {c['title']}, 질문: {c['question']}"
            for c in consultation_results[:2]
        ]
    )
    summary_input = f"""
    [상담 답변 2개]
    {selected_answers}

    [상담 검색 데이터 2개]
    {selected_consultations}
    """

    # ✅ 9. BART 요약 수행
    summary = summarize_case(summary_input, *get_bart_model())
    print(f"✅ [BART 요약 완료] {summary[:100]}...")

    # ✅ 10. 최종 답변 생성
    final_answer = langchain_retriever.generate_legal_answer(query, summary)
    print(f"✅ [LLM 최종 답변 생성 완료] {final_answer[:100]}...")

    # ✅ 11. 결과 반환
    return {
        "search_result": precedent_results,
        "keywords_used": search_keywords,
        "consultation_result": consultation_results,
        "precedent_detail": precedent_detail,
        "summary": summary,
        "final_answer": final_answer,
        "tavily_result": tavily_result,
        "casenote_url": casenote_url,
    }


def main():
    """CLI 기반 법률 AI 실행"""
    print("✅ [시작] 법률 AI 실행")

    load_faiss()
    get_bart_model()

    while True:
        user_query = input("\n❓ 질문을 입력하세요 (종료: exit): ")
        if user_query.lower() == "exit":
            break

        # ✅ **비동기 함수 실행**
        result = asyncio.run(search(user_query))

        print("\n📌 [SQL 검색 결과]:", result["search_result"])
        print("\n📌 [사용된 키워드]:", result["keywords_used"])
        print("\n📌 [법률 상담 검색 결과]:", result["consultation_result"])
        print("\n📌 [선택된 판례 상세 정보]:", result["precedent_detail"])
        print("\n📌 [BART 요약]:", result["summary"])
        print("\n🤖 [LLM 최종 답변]:", result["final_answer"])


if __name__ == "__main__":
    main()
