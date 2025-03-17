import os
import torch
import numpy as np
import ast
from transformers import AutoTokenizer, BertModel
from sklearn.metrics.pairwise import cosine_similarity
from kiwipiepy import Kiwi  # ✅ 형태소 분석기
from app.core import execute_sql

# ✅ 사용자 훈련된 모델 로드
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "20240222_best_bert_final.pth")
tokenizer = AutoTokenizer.from_pretrained("klue/bert-base")  # ✅ 한국어 지원
model = BertModel.from_pretrained("klue/bert-base")

# ✅ 모델 로딩
state_dict = torch.load(model_path, map_location="cpu")
model.load_state_dict(state_dict, strict=False)
model.eval()

# ✅ 형태소 분석기 로드
kiwi = Kiwi()


def extract_keywords(text, top_k=5):
    """형태소 분석을 통해 명사(NNG, NNP) 상위 키워드 추출"""
    tokens = kiwi.tokenize(text)
    nouns = [token.form for token in tokens if token.tag in ("NNG", "NNP")]

    keyword_freq = {word: nouns.count(word) for word in set(nouns)}
    sorted_keywords = sorted(keyword_freq, key=keyword_freq.get, reverse=True)[:top_k]

    print(f"✅ [키워드 추출 결과] {sorted_keywords}")
    return sorted_keywords  # ✅ 키워드 리스트 반환


# ✅ 개선된 BM25 기반 검색 (plainto_tsquery 적용)
def fetch_candidate_ids_bm25(table_name: str, keywords, query_text, limit=50):
    """BM25 기반 검색으로 ID 리스트 가져오기"""
    if not keywords:
        return []

    query = f"""
        SELECT id
        FROM {table_name}
        WHERE to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(question, ''))
              @@ plainto_tsquery('simple', :query_text)
           OR {" OR ".join([f"title ILIKE :kw{i} OR question ILIKE :kw{i}" for i in range(len(keywords))])}
        ORDER BY ts_rank_cd(to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(question, '')), 
                  plainto_tsquery('simple', :query_text)) DESC
        LIMIT :limit;
    """

    # ✅ SQL 인자 생성
    params = {"query_text": query_text, "limit": limit}
    params.update({f"kw{i}": f"%{kw}%" for i, kw in enumerate(keywords)})

    result = execute_sql(query, params)
    return [row["id"] for row in result] if result else []

def fetch_vectors_by_ids(table_name: str, id_list):
    """BM25 검색으로 찾은 ID 리스트를 기반으로 벡터 검색"""
    if not id_list:
        print("❌ 검색할 ID가 없습니다.")
        return []

    placeholders = ",".join(["%s"] * len(id_list))  # ✅ `%s, %s, %s, ...` 문자열 생성
    query = f"""
        SELECT id, l_id, embedding
        FROM {table_name}
        WHERE l_id IN ({placeholders});
    """  # ✅ `IN (%s, %s, %s, ...)` 수동 생성

    result = execute_sql(query, tuple(id_list))  # ✅ 리스트를 튜플로 변환하여 전달

    vectors = []
    for row in result:
        embedding_raw = row["embedding"]

        try:
            if isinstance(embedding_raw, list):
                embedding_vector = np.array(embedding_raw)
            elif isinstance(embedding_raw, str):
                embedding_vector = np.array(ast.literal_eval(embedding_raw))
            else:
                raise ValueError(f"❌ `embedding` 데이터 변환 실패: {embedding_raw}")

            vectors.append(
                {
                    "id": row["id"],
                    "l_id": row["l_id"],
                    "embedding": embedding_vector,
                }
            )

        except Exception as e:
            print(f"❌ 변환 실패: {e}, 데이터: {embedding_raw}")

    return vectors


# ✅ 사용자 입력을 벡터로 변환
def embed_user_input(user_input: str):
    """유저 입력을 형태소 분석 후 키워드만 임베딩"""
    keywords = extract_keywords(user_input)  # ✅ 키워드 추출
    keyword_text = " ".join(keywords)  # ✅ 키워드를 문자열로 변환

    inputs = tokenizer(keyword_text, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)

    embedding = outputs.last_hidden_state[:, 0, :].squeeze().numpy()  # ✅ CLS 토큰 사용
    return np.array(embedding)


# ✅ 가장 유사한 벡터 Top-K 찾기 (pgvector 기반)
def find_top_similar_vectors(
    user_vector, vector_data, top_k=3, similarity_threshold=0.1
):
    """벡터 간 유사도 계산하여 Top-K 찾기"""
    embeddings = np.array([v["embedding"] for v in vector_data])
    similarities = cosine_similarity([user_vector], embeddings)[0]

    sorted_indices = np.argsort(similarities)[::-1]  # ✅ 유사도가 높은 순서로 정렬
    top_results = []

    for idx in sorted_indices[:top_k]:
        if similarities[idx] >= similarity_threshold:
            top_results.append((vector_data[idx], similarities[idx]))

    return top_results


# ✅ 실제 법률 상담 데이터를 가져오는 함수
def fetch_consultation_content(l_id: int):
    query = """
        SELECT title, question, answer
        FROM legal_consultation
        WHERE id = :l_id;
    """
    result = execute_sql(query, {"l_id": l_id}, fetch_one=True)
    return result if result else None


# ✅ 메인 실행 함수 (pgvector + BM25 결합)
def main(user_input):
    print(f"📌 유저 입력: {user_input}")

    # ✅ 1. 키워드 추출
    keywords = extract_keywords(user_input)

    # ✅ 2. BM25 + LIKE 검색 실행
    candidate_ids = fetch_candidate_ids_bm25(
        "legal_consultation", keywords, user_input, limit=50
    )

    if not candidate_ids:
        print("❌ BM25 검색에서 후보군을 찾을 수 없습니다.")
        return

    # ✅ 3. 벡터 가져오기
    candidate_vectors = fetch_vectors_by_ids("vectorized_consultation", candidate_ids)

    if not candidate_vectors:
        print("❌ 벡터 테이블에서 유사한 데이터를 찾을 수 없습니다.")
        return

    # ✅ 4. 사용자 입력 벡터 변환
    user_vector = embed_user_input(user_input)

    # ✅ 5. 벡터 검색 수행
    top_similar_vectors = find_top_similar_vectors(
        user_vector, candidate_vectors, top_k=3, similarity_threshold=0.1
    )

    if not top_similar_vectors:
        print("❌ 벡터 검색에서 유사한 데이터를 찾을 수 없습니다.")
        return

    print("\n📌 [상담 데이터] 유사도가 높은 결과 (Top-K):")
    for i, (best_vector, similarity) in enumerate(top_similar_vectors):
        original_content = fetch_consultation_content(best_vector["l_id"])
        print(
            f"📌 제목: {original_content['title']}\n📌 질문: {original_content['question']}\n📌 답변: {original_content['answer']}"
        )

if __name__ == "__main__":
    user_input = "부동산 사기를 당했습니다 어떻게 대응할까요?"
    main(user_input)