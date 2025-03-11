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
from app.models.langchain_retriever import LangChainRetrieval
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from app.models.tool_agents.tools import search_precedents
from app.models.tool_agents.tools import search_consultations

# ✅ Kiwi 객체 전역 캐싱
kiwi = Kiwi()
# ✅ 환경 변수 로드
load_dotenv()
# ✅ FAISS 벡터DB 로드
DB_FAISS_PATH = "./app/models/vectorstore/db_faiss"


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


def adjust_faiss_keywords(user_input, faiss_keywords):
    """유저 입력 키워드와 FAISS 키워드를 모두 포함하여 검색"""
    user_keywords = extract_keywords(user_input, top_k=5)  # ✅ 유저 입력 키워드 추출

    # ✅ 유저 입력 키워드 + FAISS 키워드 통합 (중복 제거)
    adjusted_keywords = list(set(user_keywords + faiss_keywords))

    print(f"✅ [최종 검색 키워드]: {adjusted_keywords}")
    return adjusted_keywords


def extract_top_keywords_faiss(user_input, faiss_db, top_k=8):
    """FAISS 검색 후 상위 키워드 추출 (유저 입력 반영)"""
    print(f"🔍 [FAISS 키워드 추출] 입력: {user_input}")

    search_results = faiss_db.similarity_search(user_input, k=16)
    all_text = " ".join([doc.page_content for doc in search_results])

    faiss_keywords = extract_keywords(all_text, top_k)  # ✅ FAISS에서 추출한 키워드

    adjusted_keywords = adjust_faiss_keywords(
        user_input, faiss_keywords
    )  # ✅ 유저 키워드 반영
    print(f"✅ [FAISS 최종 검색 키워드] {adjusted_keywords}")
    return adjusted_keywords


def find_most_relevant_case(query, cases):
    """가장 연관성이 높은 판례 선택"""
    try:
        embedding_model = HuggingFaceEmbeddings(
            model_name="jhgan/ko-sroberta-multitask"
        )
        query_vector = embedding_model.embed_query(query)
        case_vectors = [embedding_model.embed_query(case["c_name"]) for case in cases]
        similarities = cosine_similarity([query_vector], case_vectors)[0]
        most_relevant_index = np.argmax(similarities)
        return cases[most_relevant_index]
    except Exception as e:
        print(f"❌ [유사도 계산 오류] {e}")
        return cases[0]


langchain_retriever = LangChainRetrieval()

# ✅ BART 모델 경로
MODEL_PATH = "./app/models/model/1_bart/checkpoint-26606"

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


async def async_search_precedent(keyword):
    """비동기 SQL 판례 검색 (멀티스레딩 활용)"""
    loop = asyncio.get_running_loop()  # ✅ Python 3.10+에서는 get_running_loop() 사용
    return await loop.run_in_executor(executor, search_precedents, keyword)


async def async_search_consultation(keyword):
    """비동기 법률 상담 검색 (멀티스레딩 활용)"""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, search_consultations, keyword)


async def search(query: str):
    """FAISS + SQL + 법률 상담 검색 최적화 (비동기 적용)"""
    print(f"\n🔎 [INFO] 검색 실행: {query}")

    faiss_db = load_faiss()
    if not faiss_db:
        print("❌ [오류] FAISS 데이터베이스를 로드할 수 없습니다.")
        return {"error": "FAISS 데이터베이스를 로드할 수 없습니다."}

    # ✅ **FAISS 키워드 추출**
    keywords = extract_top_keywords_faiss(query, faiss_db, 5)
    print(f"✅ [FAISS 키워드 추출] {keywords}")

    # ✅ **각 키워드별 판례 검색을 병렬 실행**
    search_tasks = [
        asyncio.create_task(async_search_precedent(keyword)) for keyword in keywords
    ]
    results_list = await asyncio.gather(*search_tasks)

    # 😉 알아서 조정
    all_results = [item for sublist in results_list for item in sublist]
    unique_results = {r["pre_number"]: r for r in all_results}.values()
    results_sql = list(unique_results)[:2]
    print(f"✅ [SQL 최종 검색 결과] 총 {len(results_sql)}개 판례 선택")

    if not results_sql:
        print("❌ [SQL 검색 실패] 해당 판례를 찾을 수 없습니다.")
        return {
            "search_result": "해당 판례를 찾을 수 없습니다.",
            "keywords_used": keywords,
            "consultation_result": "법률 상담 검색 실패",
            "precedent_detail": "없음",
            "summary": "BART 모델이 로드되지 않음",
            "bert_prediction": "BERT 모델이 로드되지 않음",
            "final_answer": "관련 데이터를 찾을 수 없습니다.",
        }

    # ✅ **가장 연관성 높은 판례 선택**
    most_relevant_precedent = find_most_relevant_case(query, results_sql)
    print(f"✅ [선택된 판례] {most_relevant_precedent['c_name']}")

    # ✅ **판례 상세 정보**
    precedent_detail = f"""
     사건번호: {most_relevant_precedent["c_number"]}
     사건종류: {most_relevant_precedent["c_type"]}
     판결일: {most_relevant_precedent["j_date"]}
     법원: {most_relevant_precedent["court"]}
     내용요약: {most_relevant_precedent["c_name"]}
     원문 링크: {most_relevant_precedent["d_link"]}
    """

    # ✅ **법률 상담 검색 키워드 추출**
    consultation_keywords = extract_keywords(most_relevant_precedent["c_name"])

    # ✅ **법률 상담 검색을 비동기 실행 (완전한 병렬화)**
    consultation_tasks = [
        asyncio.create_task(async_search_consultation(keyword))
        for keyword in consultation_keywords
    ]
    consultation_results_list = await asyncio.gather(*consultation_tasks)

    # ✅ **법률 상담 결과 병합 및 중복 제거**
    all_consultations = [
        item for sublist in consultation_results_list for item in sublist
    ]
    unique_consultations = {r["id"]: r for r in all_consultations}.values()
    consultation_results = list(unique_consultations)[:5]  # ✅ 최대 5개 선택
    print(f"✅ [법률 상담 검색 결과] 개수: {len(consultation_results)}")

    # ✅ **법률 상담 결과를 `BART` 요약에 입력**
    consultation_text = "\n\n".join(
        [c["answer"] for c in consultation_results]  # ✅ 답변만 사용
    )

    # ✅ **BART 요약 수행**
    summary = summarize_case(consultation_text, *get_bart_model())
    print(f"✅ [BART 요약 완료] {summary[:100]}...")

    # ✅ **LangChain을 활용한 최종 답변 생성**
    final_answer = langchain_retriever.generate_legal_answer(query, summary)
    print(f"✅ [LLM 최종 답변 생성 완료] {final_answer[:100]}...")

    return {
        "search_result": results_sql,
        "keywords_used": keywords,
        "consultation_result": consultation_results,
        "precedent_detail": precedent_detail,
        "summary": summary,
        "final_answer": final_answer,
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
