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
