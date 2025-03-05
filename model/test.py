import os
import numpy as np
from transformers import BartForConditionalGeneration, AutoTokenizer
from safetensors.numpy import load_file

# ✅ Hugging Face 저장소 경로
MODEL_REPO = "rommaniitedomum/custom_model"
MODEL_PATH = f"{MODEL_REPO}/1_bart"

# ✅ KoBART 가중치 (Safetensors) 파일 로드
SAFE_FILE = f"{MODEL_PATH}/model.safetensors"
weights = load_file(SAFE_FILE)  # Torch 없이 NumPy로 가중치 로드

# ✅ Hugging Face에서 KoBART 기본 모델 로드
bart_model = BartForConditionalGeneration.from_pretrained(
    MODEL_PATH,
    token="your_hf_token",  # Private 모델이라면 토큰 필요
    trust_remote_code=True,  # 필요할 경우
)

# ✅ 모델 가중치 적용 (NumPy → 모델)
for name, param in bart_model.state_dict().items():
    if name in weights:
        param.data = np.array(weights[name])  # NumPy 데이터로 변환 후 적용

# ✅ KoBART 토크나이저 로드
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

print("✅ KoBART 모델 로드 완료!")
