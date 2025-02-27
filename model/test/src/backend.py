from pydantic import BaseModel
from typing import List, Tuple
from fastapi import FastAPI, HTTPException
import os
from dotenv import load_dotenv
from agents import process_query

# .env 파일 로드
load_dotenv()

class RequestState(BaseModel):
    model_name: str
    model_provider: str
    system_prompt: str
    messages: List[str]
    allow_search: bool

class ChatResponse(BaseModel):
    response: str
    conversation_history: List[Tuple[str, str]]

app = FastAPI(title="LangGraph AI Agent Chatbot")

# 대화 기록을 FastAPI의 상태로 유지
app.state.conversation_history = []

@app.get("/")
async def root():
	return {"message": "Hello World"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: RequestState):
	"""
	API Endpoint to interact with the Chatbot using LangGraph search tools.
	"""
	try:
		# FastAPI 상태에서 대화 기록 가져오기
		conversation_history = app.state.conversation_history

		# 현재 사용자의 입력 메시지 가져오기
		current_message = request.messages[-1] if request.messages else ""

		# AI 응답 생성 및 conversation_history 업데이트
		response = await process_query(current_message, conversation_history)

		return ChatResponse(
				response=response,
				conversation_history=conversation_history
		)
	
	except Exception as e:
			raise HTTPException(status_code=500, detail=f"처리 중 오류 발생: {str(e)}")

@app.post("/reset")
async def reset_conversation():
	"""대화 기록 초기화"""
	app.state.conversation_history.clear()
	return {"message": "대화 기록이 초기화되었습니다."}

# 직접 실행을 위한 코드 추가
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
