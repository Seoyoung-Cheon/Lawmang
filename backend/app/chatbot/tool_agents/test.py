# from langchain.chat_models import ChatOpenAI
# from langchain.prompts import PromptTemplate

# llm = ChatOpenAI(model_name="gpt-4")


# def generate_search_keywords(user_query):
#     prompt = PromptTemplate.from_template(
#         "사용자가 '{query}'라고 질문했습니다. 가장 관련성이 높은 키워드 5개를 생성하세요."
#     )
#     response = llm.predict(prompt.format(query=user_query))
#     return response.split()
# from langchain.vectorstores import FAISS
# from langchain.embeddings import OpenAIEmbeddings

# faiss_db = FAISS.load_local("faiss_index", OpenAIEmbeddings())


# def search_documents(query):
#     results = faiss_db.similarity_search(query, k=5)
#     return results
# def verify_search_results(results):
#     """
#     검색 결과의 품질을 평가하여 Self-Reflection 수행
#     """
#     llm_prompt = (
#         f"검색 결과: {results}\n이 문서들이 질문과 관련 있는지 평가하세요. (Yes / No)"
#     )
#     verification = llm.predict(llm_prompt)

#     if "No" in verification:
#         return False  # 🔄 키워드 수정 후 재검색 필요
#     return True  # ✅ 검색 결과 사용 가능
# def generate_follow_up_question(user_query):
#     prompt = PromptTemplate.from_template(
#         "사용자의 질문 '{query}'이(가) 검색 결과와 일치하지 않습니다. 추가적으로 물어볼 질문을 생성하세요."
#     )
#     follow_up = llm.predict(prompt.format(query=user_query))
#     return follow_up
# from langchain.chains import RetrievalQA

# qa_chain = RetrievalQA.from_chain_type(llm, retriever=faiss_db.as_retriever())


# def generate_final_answer(query):
#     return qa_chain.run(query)
# def self_rag_pipeline(user_query):
#     print(f"🔎 사용자 질문: {user_query}")

#     # 1️⃣ 검색 키워드 생성
#     search_keywords = generate_search_keywords(user_query)
#     print(f"✅ 생성된 검색 키워드: {search_keywords}")

#     # 2️⃣ FAISS 기반 검색
#     search_results = search_documents(" ".join(search_keywords))
#     print(f"🔍 초기 검색 결과: {search_results}")

#     # 3️⃣ 검색 결과 자체 검증
#     if not verify_search_results(search_results):
#         print("⚠ 검색 결과 부족 → 키워드 수정 후 재검색")
#         search_keywords = generate_search_keywords(user_query + " 추가 검색")
#         search_results = search_documents(" ".join(search_keywords))

#     # 4️⃣ 추가 질문 필요 여부 확인
#     if not search_results:
#         follow_up_question = generate_follow_up_question(user_query)
#         print(f"❓ 추가 질문 요청: {follow_up_question}")
#         return follow_up_question

#     # 5️⃣ 최종 응답 생성
#     final_answer = generate_final_answer(user_query)
#     print(f"🤖 최종 답변: {final_answer}")

#     return final_answer
