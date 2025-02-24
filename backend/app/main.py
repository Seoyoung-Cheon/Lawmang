from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from .routes import users  
from .routes import precedent
from .routes import checkdb
import os

# FastAPI 애플리케이션 생성
app = FastAPI()

# CORS 설정 (React와 연결할 경우 필수)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(checkdb.router, prefix="/api/check", tags=["check"])    
app.include_router(precedent.router, prefix="/api/search", tags=["search"])

@app.get("/favicon.ico")
async def favicon():
    # React가 실행되지 않을 때 기본 favicon 제공 : 404 오류 방지
    favicon_path = "../front/public/favicon.ico"  # back 폴더에서 상위로 올라가서 front 폴더로 접근
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    return Response(status_code=204)  # No Content

# 기본 엔드포인트 (테스트용)
@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}