import requests
import os
from dotenv import load_dotenv

# ✅ 환경 변수 로드
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# ✅ 토큰이 없는 경우 대비
if not HF_TOKEN:
    raise ValueError("❌ 환경 변수 `HF_TOKEN`이 설정되지 않았습니다.")

HUGGINGFACE_REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"
url = f"https://api-inference.huggingface.co/models/{HUGGINGFACE_REPO_ID}"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    print("✅ Hugging Face API 정상 작동!")
    print(response.json())  # 모델 정보 출력
else:
    print(f"❌ API 접근 실패! 응답 코드: {response.status_code}")
    print("응답 메시지:", response.json())

# ✅ `HF_TOKEN`이 정상적으로 로드되었는지 확인
if HF_TOKEN:
    print(f"✅ HF_TOKEN 로드됨: {HF_TOKEN[:10]}****")  # 일부만 출력하여 보안 유지
else:
    print("❌ HF_TOKEN이 로드되지 않음. 환경 변수를 설정해야 합니다.")
