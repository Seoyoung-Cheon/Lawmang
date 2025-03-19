import torch
from transformers import BertModel, BertTokenizer
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql import text
from app.core.database import execute_sql, SessionLocal
import os
# ✅ 최적화된 BERT 모델 로드 (GPU 없이 CPU 사용)
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "20240222_best_bert_final.pth")
bert_model = BertModel.from_pretrained("bert-base-uncased")
bert_model.load_state_dict(torch.load(model_path, map_location="cpu"), strict=False)
bert_model.eval()  # ✅ 평가 모드
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")


# ✅ BERT 기반 벡터 변환 함수
def generate_embedding_bert(text: str):
    """
    ✅ 주어진 텍스트를 BERT 모델을 사용하여 768차원 벡터로 변환
    """
    inputs = tokenizer(
        text, return_tensors="pt", padding=True, truncation=True, max_length=512
    )
    with torch.no_grad():
        outputs = bert_model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().tolist()  # ✅ 평균 풀링 적용


def fetch_and_convert_embeddings():
    """
    ✅ DB에서 c_name 및 question 데이터를 가져와 벡터 변환 후 저장
    """
    # ✅ DB에서 데이터를 가져오기
    precedent_data = execute_sql("SELECT id, c_name FROM precedent;")
    consultation_data = execute_sql("SELECT id, question FROM legal_consultation;")

    # ✅ 변환한 벡터를 저장할 리스트
    precedent_embeddings = [
        (row["id"], generate_embedding_bert(row["c_name"])) for row in precedent_data
    ]
    consultation_embeddings = [
        (row["id"], generate_embedding_bert(row["question"]))
        for row in consultation_data
    ]

    return precedent_embeddings, consultation_embeddings


def save_embeddings_to_db(precedent_embeddings, consultation_embeddings):
    """
    ✅ 변환된 벡터 데이터를 별도 테이블(`vectorized_data`, `vectorized_consultation`)에 저장
    """
    # ✅ 테이블이 없으면 생성
    create_table_queries = [
        """
        CREATE TABLE IF NOT EXISTS vectorized_data (
            id SERIAL PRIMARY KEY,
            p_id INTEGER NOT NULL UNIQUE REFERENCES precedent(id) ON DELETE SET NULL,
            embedding VECTOR(768) NOT NULL,
            CONSTRAINT unique_vectorized_precedent UNIQUE (p_id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS vectorized_consultation (
            id SERIAL PRIMARY KEY,
            l_id INTEGER NOT NULL UNIQUE REFERENCES legal_consultation(id) ON DELETE SET NULL,
            embedding VECTOR(768) NOT NULL,
            CONSTRAINT unique_vectorized_consultation UNIQUE (l_id)
        );
        """,
    ]

    insert_query_precedent = """
    INSERT INTO vectorized_data (p_id, embedding) 
    VALUES (:p_id, :embedding)
    ON CONFLICT (p_id) DO UPDATE SET embedding = EXCLUDED.embedding;
    """

    insert_query_consultation = """
    INSERT INTO vectorized_consultation (l_id, embedding) 
    VALUES (:l_id, :embedding)
    ON CONFLICT (l_id) DO UPDATE SET embedding = EXCLUDED.embedding;
    """

    with SessionLocal() as db:
        try:
            # ✅ 테이블이 없으면 생성
            for query in create_table_queries:
                db.execute(text(query))
            db.commit()

            # ✅ 벡터 데이터를 PostgreSQL `vector` 형식으로 변환하여 저장
            formatted_precedent_embeddings = [
                {"p_id": id, "embedding": vector}  # ✅ id → p_id로 변경
                for id, vector in precedent_embeddings
            ]
            formatted_consultation_embeddings = [
                {"l_id": id, "embedding": vector}  # ✅ id → l_id로 변경
                for id, vector in consultation_embeddings
            ]

            # ✅ `executemany()` 를 사용하여 대량 삽입
            db.execute(text(insert_query_precedent), formatted_precedent_embeddings)
            db.execute(text(insert_query_consultation), formatted_consultation_embeddings)

            db.commit()
            print("✅ 벡터 변환 데이터가 DB에 저장되었습니다.")

        except SQLAlchemyError as e:
            db.rollback()
            print(f"❌ 벡터 저장 중 오류 발생: {e}")


if __name__ == "__main__":
    print("✅ 데이터 변환 시작...")
    precedent_embeddings, consultation_embeddings = fetch_and_convert_embeddings()
    print("✅ 변환 완료, DB 저장 시작...")
    save_embeddings_to_db(precedent_embeddings, consultation_embeddings)
    print("✅ 모든 작업 완료!")




# SET pg_trgm.similarity_threshold = 0.04;

# WITH filtered_by_category AS (
#     SELECT id, category, sub_category, title, question, answer,
#            similarity(sub_category, '계약') AS contract_score,
#            similarity(sub_category, '위반') AS violation_score,
#            similarity(sub_category, '손해배상') AS compensation_score,
#            similarity(sub_category, '책임') AS responsibility_score,
#            similarity(sub_category, '갱신') AS renewal_score,
#            similarity(sub_category, '해지') AS termination_score,
#            similarity(sub_category, '위약금') AS penalty_score,
#            similarity(sub_category, '법적') AS legal_score,
#            similarity(sub_category, '효력') AS effect_score,
#            similarity(sub_category, '소송') AS lawsuit_score,
#            GREATEST(similarity(sub_category, '계약'), 
#                     similarity(sub_category, '위반'),
#                     similarity(sub_category, '손해배상'),
#                     similarity(sub_category, '책임'),
#                     similarity(sub_category, '갱신'),
#                     similarity(sub_category, '해지'),
#                     similarity(sub_category, '위약금'),
#                     similarity(sub_category, '법적'),
#                     similarity(sub_category, '효력'),
#                     similarity(sub_category, '소송')) AS max_score
#     FROM legal_consultation
#     WHERE (sub_category % '계약' OR sub_category % '위반' OR sub_category % '손해배상' OR sub_category % '책임'
#         OR sub_category % '갱신' OR sub_category % '해지' OR sub_category % '위약금' OR sub_category % '법적' OR sub_category % '효력' OR sub_category % '소송')
#     ORDER BY max_score DESC
#     LIMIT 50
# )
# SELECT fc.id, fc.category, fc.sub_category, fc.title, fc.question, fc.answer,
#        similarity(fc.question, '계약 위반 손해배상 책임 갱신 해지 위약금 법적 효력 소송') AS question_score,
#        similarity(fc.answer, '계약 위반 손해배상 책임 갱신 해지 위약금 법적 효력 소송') AS answer_score,
#        (similarity(fc.question, '계약 위반 손해배상 책임 갱신 해지 위약금 법적 효력 소송') + similarity(fc.answer, '계약 위반 손해배상 책임 갱신 해지 위약금 법적 효력 소송')) / 2 AS avg_score
# FROM filtered_by_category fc
# WHERE (fc.question % '계약 위반 손해배상 책임 갱신 해지 위약금 법적 효력 소송' OR fc.answer % '계약 위반 손해배상 책임 갱신 해지 위약금 법적 효력 소송')
# ORDER BY avg_score DESC
# LIMIT 20;




# async def async_search_precedent(keyword):
#     """비동기 SQL 판례 검색 (최적화된 쿼리 적용)"""
#     loop = asyncio.get_running_loop()
#     query = f"""
#     SET pg_trgm.similarity_threshold = 0.04;
    
#     WITH keyword_filtered AS (
#         SELECT id, category, sub_category, title, question, answer,
#                similarity(sub_category, '{keyword}') AS score
#         FROM legal_consultation
#         WHERE sub_category % '{keyword}'
#         ORDER BY score DESC
#         LIMIT 50
#     )
#     SELECT fc.id, fc.category, fc.sub_category, fc.title, fc.question, fc.answer,
#            similarity(fc.question, '{keyword}') AS question_score,
#            similarity(fc.answer, '{keyword}') AS answer_score,
#            (similarity(fc.question, '{keyword}') + similarity(fc.answer, '{keyword}')) / 2 AS avg_score
#     FROM keyword_filtered fc
#     WHERE (fc.question % '{keyword}' OR fc.answer % '{keyword}')
#     ORDER BY avg_score DESC
#     LIMIT 20;
#     """

#     return await loop.run_in_executor(executor, search_precedents, query)


# import asyncio
# from concurrent.futures import ThreadPoolExecutor

# # ✅ 비동기 실행을 위한 ThreadPoolExecutor 추가
# executor = ThreadPoolExecutor(max_workers=5)


# async def async_search_precedent(keywords):
#     """비동기 SQL 판례 검색 (5개의 키워드로 최적화된 쿼리 적용)"""
#     loop = asyncio.get_running_loop()

#     # ✅ 키워드 리스트를 쉼표(,)로 연결하여 다중 검색 적용
#     formatted_keywords = " | ".join(
#         f"'{kw}'" for kw in keywords
#     )  # ✅ "'계약' | '위반' | '손해배상'"

#     query = f"""
#     SET pg_trgm.similarity_threshold = 0.04;
    
#     WITH filtered_by_category AS (
#         SELECT id, category, sub_category, title, question, answer,
#                GREATEST({", ".join([f"similarity(sub_category, '{kw}')" for kw in keywords])}) AS max_score
#         FROM legal_consultation
#         WHERE sub_category % ANY(ARRAY[{formatted_keywords}])
#         ORDER BY max_score DESC
#         LIMIT 50
#     )
#     SELECT fc.id, fc.category, fc.sub_category, fc.title, fc.question, fc.answer,
#            similarity(fc.question, ARRAY[{formatted_keywords}]) AS question_score,
#            similarity(fc.answer, ARRAY[{formatted_keywords}]) AS answer_score,
#            (similarity(fc.question, ARRAY[{formatted_keywords}]) + similarity(fc.answer, ARRAY[{formatted_keywords}])) / 2 AS avg_score
#     FROM filtered_by_category fc
#     WHERE fc.question % ANY(ARRAY[{formatted_keywords}]) OR fc.answer % ANY(ARRAY[{formatted_keywords}])
#     ORDER BY avg_score DESC
#     LIMIT 20;
#     """

#     return await loop.run_in_executor(executor, search_precedents, query)


# import asyncio
# from concurrent.futures import ThreadPoolExecutor

# # ✅ 비동기 실행을 위한 ThreadPoolExecutor 추가
# executor = ThreadPoolExecutor(max_workers=5)


# async def async_search_precedent(keywords):
#     """비동기 SQL 판례 검색 (기존 검색 방식 유지)"""
#     loop = asyncio.get_running_loop()

#     # ✅ 키워드 리스트를 쉼표(,)로 연결하여 다중 검색 적용
#     formatted_keywords = ", ".join(
#         f"'{kw}'" for kw in keywords
#     )  # ✅ "'계약', '위반', '손해배상'"

#     query = f"""
#     SET pg_trgm.similarity_threshold = 0.04;

#     WITH filtered_by_category AS (
#         SELECT id, category, sub_category, title, question, answer,
#                GREATEST({", ".join([f"similarity(sub_category, '{kw}')" for kw in keywords])}) AS max_score
#         FROM legal_consultation
#         WHERE sub_category % ANY(ARRAY[{formatted_keywords}])
#         ORDER BY max_score DESC
#         LIMIT 50
#     )
#     SELECT fc.id, fc.category, fc.sub_category, fc.title, fc.question, fc.answer,
#            GREATEST({", ".join([f"similarity(fc.question, '{kw}')" for kw in keywords])}) AS question_score,
#            GREATEST({", ".join([f"similarity(fc.answer, '{kw}')" for kw in keywords])}) AS answer_score,
#            (GREATEST({", ".join([f"similarity(fc.question, '{kw}')" for kw in keywords])}) + 
#             GREATEST({", ".join([f"similarity(fc.answer, '{kw}')" for kw in keywords])})) / 2 AS avg_score
#     FROM filtered_by_category fc
#     WHERE fc.question % ANY(ARRAY[{formatted_keywords}]) 
#        OR fc.answer % ANY(ARRAY[{formatted_keywords}])
#     ORDER BY avg_score DESC
#     LIMIT 20;
#     """

#     return await loop.run_in_executor(executor, search_precedents, query)


# SET pg_trgm.similarity_threshold = 0.04;

# WITH filtered_precedents AS (
#     SELECT id, c_number, c_type, j_date, court, c_name, d_link,
#            GREATEST(
#                {", ".join([f"COALESCE(similarity(c_name, '{kw}'), 0)" for kw in keywords])}
#            ) AS max_score
#     FROM precedent
#     WHERE c_name % ANY(ARRAY[{formatted_keywords}])
#       AND c_type % ANY(ARRAY[{formatted_category}]) -- ✅ 법률 분야 일치 필터 추가
#     ORDER BY max_score DESC
#     LIMIT 50
# )
# SELECT fp.id, fp.c_number, fp.c_type, fp.j_date, fp.court, fp.c_name, fp.d_link,
#        GREATEST(
#            {", ".join([f"COALESCE(similarity(fp.c_name, '{kw}'), 0)" for kw in keywords])}
#        ) AS name_score
# FROM filtered_precedents fp
# ORDER BY name_score DESC
# LIMIT 20;


# SET pg_trgm.similarity_threshold = 0.04;

# WITH filtered_by_title AS (
#     SELECT id, category, sub_category, title, question, answer,
#            GREATEST(
#                {", ".join([f"COALESCE(similarity(title, '{kw}'), 0)" for kw in keywords])}
#            ) AS max_score
#     FROM legal_consultation
#     WHERE title % ANY(ARRAY[{formatted_keywords}])
#       AND category % ANY(ARRAY[{formatted_category}]) -- ✅ 법률 분야 일치 필터 추가
#     ORDER BY max_score DESC
#     LIMIT 50
# )
# SELECT fc.id, fc.category, fc.sub_category, fc.title, fc.question, fc.answer,
#        GREATEST(
#            {", ".join([f"COALESCE(similarity(fc.title, '{kw}'), 0)" for kw in keywords])}
#        ) AS title_score
# FROM filtered_by_title fc
# ORDER BY title_score DESC
# LIMIT 20;
