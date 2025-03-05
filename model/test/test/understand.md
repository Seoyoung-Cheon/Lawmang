class State(TypedDict):
messages: Annotated[list, add_messages] # 상태정의 # State = 타입 저장 # message: 대화기록 저장하는 리스트 # add_messages = 랭그래프에 메시지를 자동 추가

# 랭그래프 초기화

graph_builder = StateGraph(State)

# 챗봇 노드 LLM 호출

def chatbot(state: State):
model = llm() # LLM 객체 생성
response = model.invoke(state["messages"]) # response는 문자열(str) # message 받고 호출 # response 는 문자열로 반환 == 그러니까 response 받으면 list 화

    # LLM 응답을 메시지 리스트에 저장할수 있도록 변환  ( 왜? )
    return {"messages": [{"role": "assistant", "content": response}]}

graph_builder.add_node("chatbot", chatbot)
graph_builder.set_entry_point("chatbot")
graph_builder.set_finish_point("chatbot")
graph = graph_builder.compile()

# 랭그래프 실행 및 사용자 입력 처리 함수

def stream_graph_updates(user_input: str):
for event in graph.stream({"messages": [{"role": "user", "content": user_input}]}):
for value in event.values(): # 메시지 리스트에서 가장 마지막 응답 content 를 출력
print("Assistant:", value["messages"][-1]["content"])

1. User_input 전달
   User 입력 (문자열)
   ↓
   {
   "messages": [
   {"role": "user", "content": "안녕!"}
   ]
   }
   ↓
   LangGraph의 chatbot() 노드 실행
   ↓
   chatbot(state: State) 호출
   ↓
   state["messages"] = [{"role": "user", "content": "안녕!"}]
   ↓
   llm().invoke(state["messages"]) 실행
   ↓
   Hugging Face LLM 모델이 입력을 받아 응답 생성
   ↓
   response = "안녕하세요! 무엇을 도와드릴까요?" (문자열)
   ↓
   response = "안녕하세요! 무엇을 도와드릴까요?"
   ↓
   리스트로 변환
   ↓
   {
   "messages": [
   {"role": "assistant", "content": "안녕하세요! 무엇을 도와드릴까요?"}
   ]
   }
   ↓
   LangGraph의 다음 단계로 전달
   ↓
   LangGraph 결과값을 받음
   ↓
   {
   "messages": [
   {"role": "assistant", "content": "안녕하세요! 무엇을 도와드릴까요?"}
   ]
   }
   ↓
   value["messages"][-1]["content"] 접근
   ↓
   "Assistant: 안녕하세요! 무엇을 도와드릴까요?" 출력

str-> messages = list[dict] ->state["message"] = state = [messages(list[dict]) + response(list[dict])]

-> state 는 상태를 계속 저장 so
state = {
"messages": [
{"role": "user", "content": "안녕!"}
]
}

state = {
"messages": [
{"role": "user", "content": "안녕!"},
{"role": "assistant", "content": "안녕하세요! 무엇을 도와드릴까요?"}
]
}

최종 전달 = value["messages"][-1]["content"] = "안녕하세요! 무엇을 도와드릴까요?"

즉 State 에서 가장 최근꺼를 가저오는것임

# tavily 요청방법: 허깅페이스 API와 GPT 의 방식이 다름
