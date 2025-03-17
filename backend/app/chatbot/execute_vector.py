import os
from app.core import execute_sql


def preprocess_query_for_bm25(query_text: str):
    """BM25 검색을 위한 to_tsquery() 변환"""
    query_terms = query_text.split()  # 공백 기준 단어 분리
    processed_query = " & ".join(query_terms)  # ✅ '단어1 & 단어2 & 단어3' 형식 변환
    print(f"✅ 변환된 BM25 검색어: {processed_query}")  # 디버깅용 출력
    return processed_query


def search_bm25(table_name: str, user_query: str, limit=5):
    """BM25 기반 검색 (자연어 입력을 to_tsquery() 형식으로 변환)"""
    processed_query = preprocess_query_for_bm25(user_query)  # ✅ 변환 적용

    query = f"""
        SELECT id, title, question, answer
        FROM {table_name}
        WHERE to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(question, ''))
              @@ to_tsquery('simple', :query)
        ORDER BY ts_rank_cd(to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(question, '')),
                  to_tsquery('simple', :query)) DESC
        LIMIT :limit;
    """
    params = {"query": processed_query, "limit": limit}
    result = execute_sql(query, params)

    return result


def main(user_input):
    print(f"📌 유저 입력: {user_input}")

    # ✅ 1. BM25 검색 수행
    bm25_results = search_bm25("legal_consultation", user_input, limit=5)

    if not bm25_results:
        print("❌ BM25 검색에서 후보군을 찾을 수 없습니다.")
        return

    print("\n📌 [BM25 검색 결과]")
    for i, result in enumerate(bm25_results):
        print(f"\n🔹 결과 {i + 1}")
        print(f"ID: {result['id']}")
        print(f"📌 제목: {result['title']}")
        print(f"📌 질문: {result['question']}")
        print(f"📌 답변: {result['answer']}")


if __name__ == "__main__":
    user_input = "부동산 사기를 당했습니다 어떻게 대응할까요?"
    main(user_input)
