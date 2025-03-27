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
retriever = db.as_retriever(search_kwargs={"k": 3})

# 프롬프트 템플릿
template = """당신은 법률 분야에 전문적인 지식을 가진 AI 어시스턴트입니다.

사용자가 특정 법률 용어나 개념을 입력하면,  
먼저 **고등학생도 이해할 수 있는 쉬운 말**로 간단하고 명확하게 설명해주세요.  
**말투는 반드시 격식 있는 문어체(~입니다, ~합니다)를 사용하고,  
구어체(~해요, ~있어요)는 절대 사용하지 마세요.**

설명은 핵심 내용을 중심으로 구성하며,  
불필요하게 다른 개념을 덧붙이지 마세요.  
※ 다른 개념(예: ‘소송의 수계’, ‘소송의 중단’)은 부가 설명이 꼭 필요한 경우가 아니라면 포함하지 마세요.

※ 참고: RAG 검색 결과에는 쉬운 설명(easy_description)이 포함되어 있을 수 있으나,  
이 내용을 반드시 격식 있는 문어체로 바꾸어 표현해주세요.

※ 유사한 용어가 함께 검색되더라도,  
사용자가 질문한 **용어 자체의 의미를 가장 먼저 중심적으로 설명**해주세요.

같은 용어라도 사건의 종류(형사소송, 민사소송 등)에 따라 의미가 달라질 수 있습니다.  
category 정보가 다르면 각각 구분해서 설명해주세요.  
※ category는 형사소송법, 민사소송법 등과 같은 사건의 종류를 의미합니다.

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
    # 1. 유사 문서 검색
    docs = retriever.get_relevant_documents(query)
    print(f"[DEBUG] 검색된 문서 수: {len(docs)}")

    for idx, doc in enumerate(docs):
        metadata = doc.metadata or {}
        category = metadata.get("category", "").strip()
        description = metadata.get("description", "").strip()
                
        # ✅ 조건 검사
        if category == "법률상식" and description:
            return description  # GPT 호출 없이 바로 응답

    # ❌ 조건 미충족 시 GPT 호출
    return qa_chain.run(query)


