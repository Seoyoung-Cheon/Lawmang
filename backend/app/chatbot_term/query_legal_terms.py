from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.embeddings import OpenAIEmbeddings

# 벡터 저장 위치
DB_FAISS_PATH = "./app/chatbot_term/vectorstore"

# 임베딩 모델 및 벡터 DB 로드
embedding = OpenAIEmbeddings()
db = FAISS.load_local(DB_FAISS_PATH, embedding, allow_dangerous_deserialization=True)
retriever = db.as_retriever(search_kwargs={"k": 4})

# 프롬프트 템플릿
template = """당신은 법률 분야의 지식이 풍부한 AI 어시스턴트입니다.

사용자가 특정 법률 용어나 개념을 입력하면, 그 의미를 설명해주세요.

특히 같은 용어라도 사건의 종류(예: 형사소송, 민사소송 등)에 따라 의미가 달라질 수 있음을 인식하고, 
category 정보가 다르면 각각 따로 설명해주세요.

다음 기준에 따라 답변을 구성해주세요:

1. 용어의 정의를 정확하게 서술하세요.
2. 사건 분야(category)가 여러 개일 경우, 각 분야별로 나누어 설명하세요.
3. 쉬운 말로 다시 설명도 가능하면 추가하세요.

용어: {question}

RAG 검색 결과:
{context}
"""

QA_CHAIN_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template=template,
)

qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model_name="gpt-3.5-turbo"),
    retriever=retriever,
    chain_type="stuff",
    chain_type_kwargs={"prompt": QA_CHAIN_PROMPT}
)

def get_legal_term_answer(query: str) -> str:
    return qa_chain.run(query)
