import os
import torch
import re
from transformers import (
    BartForConditionalGeneration,
    AutoTokenizer,
    BertForSequenceClassification,
    AutoConfig,
)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from safetensors.torch import load_file
from dotenv import load_dotenv
from kobart import get_pytorch_kobart_model, get_kobart_tokenizer

from functools import lru_cache
from langchain_retriever import LangChainRetrieval


# ✅ 환경 변수 로드
load_dotenv()

# ✅ FAISS 벡터DB 로드
DB_FAISS_PATH = "vectorstore/db_faiss"


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

        # ✅ KoBART 모델 로드
        model = BartForConditionalGeneration.from_pretrained(get_pytorch_kobart_model())

        # ✅ KoBART 전용 토크나이저 로드
        tokenizer = get_kobart_tokenizer()
        tokenizer.pad_token_id = tokenizer.eos_token_id
        tokenizer.model_max_length = 1024

        # ✅ `model.safetensors`에서 가중치 로드
        state_dict = load_file(os.path.join(MODEL_PATH, "model.safetensors"))

        # ✅ 모델 가중치 적용
        model.load_state_dict(state_dict, strict=False)
        # 주의사항 누락된 키가 존재 하지만 모델에 직접적인 성능을 주지 않기에 무시
        # 오히려 성능이 좋아짐

        # ✅ 모델 평가 모드 전환
        model.eval()
        print("✅ KoBART 모델 로드 성공")
        return tokenizer, model

    except Exception as e:
        print(f"❌ [KoBART 로드 오류] {e}")
        return None, None


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

        # ✅ 토큰화 후 인코딩된 값 확인
        input_ids = tokenizer.encode(
            text, return_tensors="pt", max_length=1024, truncation=True
        )
        print(f"🔎 [DEBUG] BART input_ids: {input_ids}")

        # ✅ 모델의 vocab_size 범위 내로 값 제한
        input_ids = torch.clamp(input_ids, min=0, max=model.config.vocab_size - 1)

        print("🚀 [INFO] `generate()` 실행 시작")
        # summary_ids = model.generate(
        #     input_ids,
        #     max_length=512,
        #     min_length=120,
        #     num_beams=8,
        #     early_stopping=True,
        #     no_repeat_ngram_size=3,
        #     repetition_penalty=2.5,
        #     length_penalty=1.0,
        # ) # 모델 1 (정확도)
        summary_ids = model.generate(
            input_ids,
            max_length=200,
            min_length=120,
            num_beams=8,
            early_stopping=True,
            no_repeat_ngram_size=3,
            repetition_penalty=1.8,
            length_penalty=1,
        )  # 모델 2 (속도 + 정확) 사용
        # summary_ids = model.generate(
        #     input_ids,
        #     max_length=150,  # ✅ 응답 속도를 높이기 위해 짧게 설정 (200 → 150)
        #     min_length=120,  # ✅ 최소한의 정보 포함 (80~120 유지)
        #     num_beams=4,  # ✅ beams 감소로 속도 증가 (8 → 4)
        #     early_stopping=True,
        #     no_repeat_ngram_size=3,
        #     repetition_penalty=1.5,  # ✅ 반복 최소화 (2.0 → 1.5)
        #     length_penalty=0.8,  # ✅ 더 짧은 요약 생성 (1.0 → 0.8)
        # ) # 모델 3 속도만 빠르고 부정확
        print(f"🔎 [DEBUG] summary_ids: {summary_ids}")

        decoded = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        print(f"🔎 [DEBUG] 요약 결과: {decoded}")

        return decoded

    except Exception as e:
        print(f"❌ [판례 요약 오류] {e}")
        return "❌ 요약 실패"


# ✅ BERT 판결 예측 모델 로드
JUDGMENT_MODEL_PATH = "./model/2.판결예측모델/20240222_best_bert.pth"


def load_bert():
    """BERT 판결 예측 모델 로드"""
    try:
        print("🔍 BERT 모델 로드 중...")

        # ✅ 토크나이저 로드
        tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
        print("✅ BERT 토크나이저 로드 성공")

        # ✅ 설정값 불러오기
        config = AutoConfig.from_pretrained("bert-base-uncased")
        config.num_labels = 3  # 0: 무죄, 1: 유죄, 2: 불명확
        config.id2label = {0: "무죄", 1: "유죄", 2: "불명확"}
        config.label2id = {"무죄": 0, "유죄": 1, "불명확": 2}

        # ✅ BERT 모델 초기화
        model = BertForSequenceClassification.from_pretrained(
            "bert-base-uncased", config=config
        )
        print("✅ BERT 기본 모델 로드 성공")

        # ✅ 사전 훈련된 가중치 적용 (map_location="cpu"로 CPU 로드)
        state_dict = torch.load(JUDGMENT_MODEL_PATH, map_location="cpu")
        missing_keys, unexpected_keys = model.load_state_dict(state_dict, strict=False)

        # ✅ 가중치 체크
        if missing_keys:
            print(f"❌ [경고] 모델 가중치 누락: {missing_keys}")
        if unexpected_keys:
            print(f"⚠ [경고] 예상치 못한 가중치: {unexpected_keys}")

        # ✅ 모델을 평가 모드로 설정
        model.eval()
        print("✅ BERT 모델 로드 성공")

        return tokenizer, model

    except Exception as e:
        print(f"❌ [BERT 로드 오류] {e}")
        return None, None


def predict_judgment(text, tokenizer, model):
    """판결 예측"""
    try:
        # inputs = tokenizer(
        #     text,
        #     return_tensors="pt",
        #     max_length=512,
        #     truncation=True,
        #     padding="max_length",
        # ) # 기본설정
        inputs = tokenizer(
            text,
            return_tensors="pt",
            max_length=300,  # ✅ 불필요한 연산 줄이기 위해 300으로 설정
            truncation=True,
            padding="longest",  # ✅ 불필요한 패딩 최소화
        )  # 2차 조정

        inputs["attention_mask"] = torch.ones_like(inputs["input_ids"])

        with torch.no_grad():
            logits = model(**inputs).logits
            print(f"🔎 [DEBUG] BERT logits: {logits}")
            probabilities = torch.nn.functional.softmax(logits, dim=1)

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
    print("✅ [시작] 법률 AI 실행")

    ## FAISS, BART, BERT 로드
    db = load_faiss()
    summarizer_tokenizer, summarizer_model = get_bart_model()
    load_bert()

    while True:
        user_query = input("\n❓ 질문을 입력하세요 (종료: exit): ")
        if user_query.lower() == "exit":
            break

        response = "법률 정보를 찾을 수 없습니다."
        retrieved_text = ""

        if db:
            try:
                search_results = db.similarity_search(user_query, k=3)
                retrieved_text = "\n".join([doc.page_content for doc in search_results])
                response = retrieved_text
            except Exception as e:
                print(f"❌ [FAISS 검색 오류] {e}")

        summary = "BART 모델이 로드되지 않음"
        if summarizer_tokenizer and summarizer_model:
            summary = summarize_case(
                retrieved_text, summarizer_tokenizer, summarizer_model
            )

        # ✅ LangChain을 활용한 최종 답변 생성 (DeepSeek 적용)
        final_answer = langchain_retriever.generate_legal_answer(user_query, summary)

        # ✅ 최종 출력
        print("\n📌 기본 검색 답변:", response)
        print("📌 판례 요약:", summary)
        print("\n🤖 LLM 최종 답변:", final_answer)


if __name__ == "__main__":
    main()
