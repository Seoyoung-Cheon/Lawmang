import os
import sys
from dotenv import load_dotenv
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from asyncio import Event

from app.chatbot.tool_agents.utils.utils import faiss_kiwi, classify_legal_query

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def load_llm():
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        api_key=OPENAI_API_KEY,
        temperature=0.6,
        max_tokens=512,
        streaming=True,
    )


class LegalChatbot:
    def __init__(self, faiss_db):
        self.llm = load_llm()
        self.memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )
        self.faiss_db = faiss_db
        self.prompt_template = PromptTemplate(
            template="""
당신은 대한민국의 법률 전문가입니다.
아래 키워드 및 검색 결과를 기반으로, 사용자의 질문에 대해 명확하고 간결한 법률적 답변을 제공하세요.

💬 대화 기록:
{chat_history}

❓ 사용자 질문:
"{user_query}"

🧠 사용자 입력 키워드:
{query_keywords}

📚 FAISS 유사 키워드:
{faiss_keywords}

📂 질문 유형: {query_type}
⚖️ 법률 연관성 점수: {legal_score}

📢 지시사항:
- 질문 유형이 **"legal"** 이면 → 명확한 법률 조항 또는 판례에 기반해 판단을 내려주세요.
- 질문 유형이 **"nonlegal"** 이면 → 법적 관련성이 낮음을 알려주되, 유사한 사례나 관련 조항을 소개하세요.
※ 마지막 줄에 질문이 법률적으로 충분히 명확하면 ###yes, 아니면 ###no를 붙이세요.
""",
            input_variables=[
                "chat_history",
                "user_query",
                "query_keywords",
                "faiss_keywords",
                "query_type",
                "legal_score",
            ],
        )

    async def generate(
        self,
        user_query: str,
        current_yes_count: int = 0,
        stop_event: Event = None,
    ):
        print("\n🤖 [Legal AI]: ", end="", flush=True)

        query_keywords = faiss_kiwi.extract_keywords(user_query, top_k=5)
        faiss_keywords = faiss_kiwi.extract_top_keywords_faiss(
            user_query, self.faiss_db, top_k=5
        )
        legal_score = sum(1 for kw in query_keywords if kw in faiss_keywords) / max(
            len(query_keywords), 1
        )
        query_type = classify_legal_query(user_query, set(faiss_keywords))
        chat_history = self.memory.load_memory_variables({}).get("chat_history", "")

        prompt = self.prompt_template.format(
            chat_history=chat_history,
            user_query=user_query,
            query_keywords=", ".join(query_keywords),
            faiss_keywords=", ".join(faiss_keywords),
            legal_score=f"{legal_score:.2f}",
            query_type=query_type,
        )

        full_response = ""
        is_no_detected = False

        async for chunk in self.llm.astream(prompt):
            content = getattr(chunk, "content", str(chunk))
            if content:
                sys.stdout.write(content)
                sys.stdout.flush()
                full_response += content

                # 실시간 감지
                if "###no" in full_response[-10:].lower():
                    is_no_detected = True
                    if stop_event:
                        stop_event.set()
                    break

        print("\n")

        self.memory.save_context(
            {"user_query": user_query}, {"response": full_response}
        )

        return {
            "initial_response": full_response,
            "escalate_to_advanced": False,
            "yes_count": current_yes_count,
            "query_type": query_type,
            "is_no": is_no_detected,
        }
