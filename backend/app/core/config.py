import os
from dotenv import load_dotenv

# ✅ .env 파일 로드
load_dotenv()

# ✅ 환경 변수 불러오기
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

# ✅ SQLAlchemy에서 사용할 데이터베이스 URL 생성
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ✅ 환경 변수 출력 (디버깅용, 실제 코드에서는 사용X)
print("DATABASE_URL:", DATABASE_URL)  # 🚀 DB 연결 URL 확인