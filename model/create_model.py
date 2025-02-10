from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import xml.etree.ElementTree as ET 
# PDF 파일 로드
DATA_PATH = "data/"


def load_pdf_files(data):
    loader = DirectoryLoader(data, glob="*.pdf", loader_cls=PyPDFLoader)
    documents = loader.load()
    return documents


documents = load_pdf_files(DATA_PATH)
print("문서 수", len(documents))


# 문서 청크 생성 - 한글 문서에 맞게 청크 사이즈 조정
def create_chunks(extracted_data):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,  # 한글 문서는 더 큰 청크 사이즈가 효과적일 수 있음
        chunk_overlap=50,
        separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    )
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks


text_chunks = create_chunks(extracted_data=documents)
print("문서 청크 수: ", len(text_chunks))


# 벡터 임베딩 생성: 허깅페이스 모델 사용
def get_embedding_model():
    embedding_model = HuggingFaceEmbeddings(
        model_name="jhgan/ko-sroberta-multitask",
        model_kwargs={"device": "cpu"},  # CPU 사용 명시
        encode_kwargs={"normalize_embeddings": True},  # 임베딩 정규화
    )
    return embedding_model


embedding_model = get_embedding_model()


# FAISS 벡터 스토어 생성
DB_FAISS_PATH = "vectorstore/db_faiss"
db = FAISS.from_documents(text_chunks, embedding_model)
db.save_local(DB_FAISS_PATH)
