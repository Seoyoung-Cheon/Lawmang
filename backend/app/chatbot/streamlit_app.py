# app/chatbot/streamlit_app.py

import os
import sys
import asyncio
import streamlit as st
import nest_asyncio

# ✅ 경로 추가: backend 디렉토리를 기준으로 app 모듈 인식
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))  # chatbot/
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../"))  # backend/
sys.path.append(BACKEND_DIR)

# ✅ 정상 import 가능
from main import run_dual_pipeline, llm2_lock

nest_asyncio.apply()


st.set_page_config(page_title="Lawmang Chatbot", layout="wide")

st.title("📚 법률 AI 상담 챗봇")

# 상태 저장
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

user_input = st.text_input("질문을 입력하세요:", key="user_input")

if st.button("질문하기") and user_input:
    if llm2_lock.locked():
        st.warning("⚠️ 고급 응답 생성 중입니다. 잠시 후 다시 시도해주세요.")
    else:
        # ✅ Streamlit에서 async 함수 실행
        result = asyncio.run(run_dual_pipeline(user_input))

        # ✅ 결과 정리
        initial = result.get("initial", {})
        advanced = result.get("advanced", {})

        st.session_state.chat_history.append(("🙋 사용자", user_input))
        st.session_state.chat_history.append(
            ("🤖 초기 응답", initial.get("initial_response", "응답 없음"))
        )

        # 후속 질문
        followup = initial.get("followup_question")
        if followup:
            if initial.get("is_mcq"):
                question = followup.get("question", "없음")
                st.session_state.chat_history.append(("📘 객관식 질문", question))
                for k, v in followup.get("options", {}).items():
                    st.session_state.chat_history.append((f"{k}.", v))
            else:
                st.session_state.chat_history.append(("📘 후속 질문", followup))

        # 고급 응답
        if advanced and advanced.get("final_answer"):
            st.session_state.chat_history.append(
                ("🧠 고급 응답", advanced.get("final_answer", "없음"))
            )
        else:
            st.session_state.chat_history.append(
                ("✅ 시스템", "고급 응답 조건에 도달하지 않음")
            )

# ✅ 채팅 히스토리 출력
for speaker, message in st.session_state.chat_history:
    st.markdown(f"**{speaker}**: {message}")
