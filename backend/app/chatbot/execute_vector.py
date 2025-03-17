import os
import torch
import numpy as np
from transformers import AutoTokenizer, BertModel
from app.core import execute_sql

# ✅ 사용자 훈련된 BERT 모델 로드
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "20240222_best_bert_final.pth")

# ✅ KLUE-BERT 토크나이저 및 모델
tokenizer = AutoTokenizer.from_pretrained("klue/bert-base")
model = BertModel.from_pretrained("klue/bert-base")

# ✅ 모델 로드 (사용자 훈련된 모델 적용)
state_dict = torch.load(model_path, map_location="cpu")
model.load_state_dict(state_dict, strict=False)
model.eval()


def preprocess_query_for_bm25(query_text: str):
    """BM25 검색을 위한 to_tsquery() 변환"""
    query_terms = query_text.split()  # 공백 기준 단어 분리
    return " & ".join(query_terms)  # ✅ '단어1 & 단어2 & 단어3' 형식 변환


def search_bm25(table_name: str, user_query: str, limit=5):
    """BM25 기반 검색 (자연어 입력을 to_tsquery() 형식으로 변환)"""
    processed_query = preprocess_query_for_bm25(user_query)  # ✅ 변환 적용

    query = f"""
        SELECT id, title, question, answer
        FROM {table_name}
        WHERE to_tsvector('korean', COALESCE(title, '') || ' ' || COALESCE(question, ''))
              @@ to_tsquery('korean', :query)
        ORDER BY ts_rank_cd(to_tsvector('korean', COALESCE(title, '') || ' ' || COALESCE(question, '')),
                  to_tsquery('korean', :query)) DESC
        LIMIT :limit;
    """
    params = {"query": processed_query, "limit": limit}
    result = execute_sql(query, params)

    return result


def embed_user_input(user_input: str):
    """사용자 입력을 KLUE-BERT로 임베딩"""
    inputs = tokenizer(user_input, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    embedding = outputs.last_hidden_state[:, 0, :].squeeze().numpy()  # ✅ CLS 토큰 사용
    return np.array(embedding)


def test_bm25_and_embedding(user_input):
    print(f"📌 유저 입력: {user_input}")

    # ✅ 1. BM25 검색 수행 테스트
    bm25_results = search_bm25("legal_consultation", user_input, limit=3)

    if bm25_results:
        print("\n📌 [BM25 검색 결과]")
        for i, result in enumerate(bm25_results):
            print(f"\n🔹 결과 {i + 1}")
            print(f"ID: {result['id']}")
            print(f"📌 제목: {result['title']}")
            print(f"📌 질문: {result['question']}")
            print(f"📌 답변: {result['answer']}")
    else:
        print("❌ BM25 검색에서 후보군을 찾을 수 없습니다.")

    # ✅ 2. KLUE-BERT 임베딩 확인
    embedding = embed_user_input(user_input)
    print("\n📌 [BERT 임베딩 확인]")
    print(f"임베딩 벡터 크기: {embedding.shape}")
    print(f"첫 5개 값: {embedding[:5]}")


if __name__ == "__main__":
    test_query = "부동산 사기를 당했습니다 어떻게 대응할까요?"
    test_bm25_and_embedding(test_query)
