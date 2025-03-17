import os
import torch
import numpy as np
import ast
from sklearn.metrics.pairwise import cosine_similarity
from transformers import BertModel, BertTokenizer
from app.core import execute_sql

# 모델 로드 (로컬 BERT 모델)
base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "20240222_best_bert_final.pth")


# 개조한 BERT 모델 정의
class CustomBERTModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.bert = BertModel.from_pretrained("bert-base-uncased")

    def forward(self, input_ids, attention_mask=None, token_type_ids=None):
        return self.bert(
            input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids
        )


# 모델 로딩
model = CustomBERTModel()
state_dict = torch.load(model_path, map_location="cpu")
new_state_dict = {k.replace("bert.", ""): v for k, v in state_dict.items()}
model.load_state_dict(new_state_dict, strict=False)
model.eval()

# 토크나이저 로딩
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")


# 사용자 입력을 벡터로 변환하는 함수
def embed_user_input(user_input: str):
    inputs = tokenizer(user_input, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        outputs = model(**inputs)
    embedding = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
    return np.array(embedding)


# 벡터 DB에서 임베딩된 데이터를 가져오는 함수 (여러 개 반환)
def fetch_vectors(table_name: str, limit=50):
    query = f"""
        SELECT id, l_id, embedding
        FROM {table_name}
        LIMIT :limit;
    """
    params = {"limit": limit}
    result = execute_sql(query, params)

    vectors = []
    for row in result:
        embedding_raw = row["embedding"]
        if isinstance(embedding_raw, str):
            embedding_vector = np.array(ast.literal_eval(embedding_raw))
        else:
            embedding_vector = np.array(embedding_raw)

        vectors.append(
            {
                "id": row["id"],
                "l_id": row["l_id"],
                "embedding": embedding_vector,
            }
        )
    return vectors


# 가장 유사한 여러 개의 벡터 찾기 (Top-K + 유사도 기준 적용)
def find_top_similar_vectors(
    user_vector, vector_data, top_k=3, similarity_threshold=0.5
):
    embeddings = np.array([v["embedding"] for v in vector_data])
    similarities = cosine_similarity([user_vector], embeddings)[0]

    # ✅ Top-K 결과 가져오기
    sorted_indices = np.argsort(similarities)[::-1]  # 유사도가 높은 순서로 정렬
    top_results = []

    for idx in sorted_indices[:top_k]:
        if similarities[idx] >= similarity_threshold:
            top_results.append((vector_data[idx], similarities[idx]))

    return top_results


# 실제 법률 상담 데이터를 가져오는 함수
def fetch_consultation_content(l_id: int):
    query = """
        SELECT title, question, answer
        FROM legal_consultation
        WHERE id = :l_id;
    """
    result = execute_sql(query, {"l_id": l_id}, fetch_one=True)
    return result if result else None


# 메인 실행 함수
def main(user_input):
    print(f"📌 유저 입력: {user_input}")

    user_vector = embed_user_input(user_input)
    vectors = fetch_vectors("vectorized_consultation", limit=100)  # ✅ 검색 범위 확대

    top_similar_vectors = find_top_similar_vectors(
        user_vector, vectors, top_k=3, similarity_threshold=0.5
    )

    if not top_similar_vectors:
        print("❌ 유사한 데이터를 찾을 수 없습니다.")
        return

    print("\n📌 [상담 데이터] 유사도가 높은 결과 (Top-K):")
    for i, (best_vector, similarity) in enumerate(top_similar_vectors):
        print(f"\n🔹 결과 {i + 1}")
        print(
            f"ID: {best_vector['id']}, l_id: {best_vector['l_id']}, 유사도: {similarity:.4f}"
        )

        original_content = fetch_consultation_content(best_vector["l_id"])
        if original_content:
            print(f"📌 제목: {original_content['title']}")
            print(f"📌 질문: {original_content['question']}")
            print(f"📌 답변: {original_content['answer']}")
        else:
            print("❌ 원본 데이터를 찾을 수 없습니다.")


if __name__ == "__main__":
    user_input = "부동산 사기를 당했습니다 어떻게 대응할까요?"
    main(user_input)
