from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from .routes import auth, checkdb, precedent, precedent_detail
from app.core.database import init_db
import os

# ✅ FastAPI 애플리케이션 생성 (기본 응답을 ORJSONResponse로 설정)
app = FastAPI(default_response_class=ORJSONResponse)

# CORS 설정 (React와 연결할 경우 필수)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
# app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(checkdb.router, prefix="/api/check", tags=["check"])    
app.include_router(precedent.router, prefix="/api/search", tags=["search"])
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(precedent_detail.router, prefix="/api/detail", tags=["detail"])

# 기본 엔드포인트 (테스트용)
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# ✅ 서버 시작 시 데이터베이스 테이블 생성
@app.on_event("startup")
def on_startup():
    init_db()
    
# ✅ 공통 예외 처리 (404 & 500 에러 핸들러)
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return ORJSONResponse(status_code=404, content={"error": "해당 경로를 찾을 수 없습니다."})

@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    return ORJSONResponse(status_code=500, content={"error": "서버 내부 오류가 발생했습니다."})