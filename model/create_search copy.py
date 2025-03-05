import os
from transformers import (
    BartForConditionalGeneration,
    AutoTokenizer,
    BertForSequenceClassification,
)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv
from functools import lru_cache
from langchain_retriever import LangChainRetrieval
import numpy as np

# ✅ 환경 변수 로드
load_dotenv()

# ✅ FAISS 벡터DB 로드
DB_FAISS_PATH = "vectorstore/db_faiss"


def softmax(logits):
    """SciPy 없이 NumPy만으로 softmax 구현"""
    exp_logits = np.exp(logits - np.max(logits))  # 오버플로우 방지
    return exp_logits / np.sum(exp_logits, axis=1, keepdims=True)

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


langchain_retriever = LangChainRetrieval()


# ✅ BART 판례 요약 모델 로드
MODEL_PATH = "./model/1.판례요약모델/checkpoint-26606"


def load_bart():
    """KoBART 모델 로드"""
    try:
        print("🔍 KoBART 모델 로드 중...")

        # ✅ KoBART 모델 및 토크나이저 로드
        model = BartForConditionalGeneration.from_pretrained(MODEL_PATH)
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        tokenizer.pad_token_id = tokenizer.eos_token_id

        # ✅ 모델 평가 모드 전환
        model.eval()
        print("✅ KoBART 모델 로드 성공")
        return tokenizer, model

    except Exception as e:
        print(f"❌ [KoBART 로드 오류] {e}")
        return None, None


def summarize_case(text, tokenizer, model):
    """판례 요약"""
    try:
        if len(text.split()) < 5:
            return "입력된 텍스트가 짧아 요약을 수행할 수 없습니다."

        input_ids = tokenizer.encode(
            text, return_tensors="pt", max_length=1024, truncation=True
        )

        summary_ids = model.generate(
            input_ids,
            max_length=200,
            min_length=120,
            num_beams=6,
            early_stopping=True,
            no_repeat_ngram_size=3,
            repetition_penalty=1.8,
            length_penalty=1.0,
        )

        return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    except Exception as e:
        print(f"❌ [판례 요약 오류] {e}")
        return "❌ 요약 실패"


# ✅ BERT 판결 예측 모델 로드
JUDGMENT_MODEL_PATH = "./model/2.판결예측모델/20240222_best_bert.pth"


def load_bert():
    """BERT 판결 예측 모델 로드"""
    try:
        print("🔍 BERT 모델 로드 중...")
        tokenizer = AutoTokenizer.from_pretrained(JUDGMENT_MODEL_PATH)
        model = BertForSequenceClassification.from_pretrained(JUDGMENT_MODEL_PATH)
        model.eval()
        print("✅ BERT 모델 로드 성공")
        return tokenizer, model
    except Exception as e:
        print(f"❌ [BERT 로드 오류] {e}")
        return None, None


# ✅ 판결 예측 함수
def predict_judgment(text, tokenizer, model):
    try:
        inputs = tokenizer(
            text,
            return_tensors="np",  # ✅ NumPy 기반으로 변경
            max_length=300,
            truncation=True,
            padding="longest",
        )
        logits = model(**inputs).logits  # ✅ `torch.no_grad()` 제거
        logits = logits.detach().cpu().numpy()  # ✅ NumPy 변환
        probabilities = softmax(logits)  # ✅ SciPy 없이 Softmax 계산
        return probabilities.tolist()
    except Exception as e:
        print(f"❌ [판결 예측 오류] {e}")
        return "❌ 예측 실패"


@lru_cache(maxsize=1000)
def get_bart_model():
    return load_bart()


@lru_cache(maxsize=1000)
def get_bert_model():
    return load_bert()


def main():
    try:
        print("✅ [시작] 법률 AI 실행")

        ## FAISS, BART, BERT 로드
        db = load_faiss()
        summarizer_tokenizer, summarizer_model = get_bart_model()
        get_bert_model()  # ✅ BERT 모델 로드 수정

        while True:
            user_query = input("\n❓ 질문을 입력하세요 (종료: exit): ")
            if user_query.lower() == "exit":
                break

            response = "법률 정보를 찾을 수 없습니다."
            retrieved_text = ""

            if db:
                try:
                    search_results = db.similarity_search(user_query, k=3)
                    retrieved_text = "\n".join(
                        [doc.page_content for doc in search_results]
                    )
                    response = retrieved_text
                except Exception as e:
                    print(f"❌ [FAISS 검색 오류] {e}")

            summary = "BART 모델이 로드되지 않음"
            if summarizer_tokenizer and summarizer_model:
                summary = summarize_case(
                    retrieved_text, summarizer_tokenizer, summarizer_model
                )

            final_answer = langchain_retriever.generate_legal_answer(
                user_query, summary
            )

            print("\n📌 기본 검색 답변:", response)
            print("📌 판례 요약:", summary)
            print("\n🤖 LLM 최종 답변:", final_answer)

    except Exception as e:
        print(f"\n❌ [main() 실행 오류] {e}")


if __name__ == "__main__":
    main()
