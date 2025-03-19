import os
import sys
import re
import asyncio
from concurrent.futures import ThreadPoolExecutor
from langchain.tools import Tool
from app.services.consultation import (
    search_consultations,
    search_consultations_by_category,
)
from app.services.consultation_detail_service import get_consultation_detail_by_id
from app.services.precedent_service import (
    search_precedents,
    search_precedents_by_category,
)
# from app.services.mylog_service import get_user_logs, get_user_logs_old
#------------------------------------------------------------API calls
from app.services.precedent_detail_service import fetch_external_precedent_detail
from app.core.database import execute_sql

# ---------------------------------------------------------------
executor = ThreadPoolExecutor(max_workers=10)
# ✅ 현재 파일의 상위 경로를 Python 경로에 추가

# ✅ 1. 검색 도구 정의
class llmCOD_tool_sets:
    @staticmethod
    def search_cons():
        """키워드를 기반으로 법률 상담 사례 검색"""
        return Tool(
            name="SearchLegalConsultations",
            func=search_consultations,
            description="사용자가 입력한 키워드를 포함하는 법률 상담 사례를 검색합니다.",
        )

    # ----------------------------------------------------------------------------------------------

    @staticmethod
    def search_pre():
        """법률 판례 검색"""
        return Tool(
            name="SearchLegalPrecedents",
            func=search_precedents,
            description="사용자가 입력한 키워드를 포함하는 법률 판례를 검색합니다.",
        )

    # ----------------------------------------------------------------------------------------------

    # @staticmethod
    # def user_log():
    #     """사용자의 최근 상담 기록 검색"""
    #     return Tool(
    #         name="GetUserLogs",
    #         func=get_user_logs,
    #         description="사용자의 최신 상담 기록을 검색합니다.",
    #     )

    # @staticmethod
    # def user_log_history():
    #     """사용자의 과거 상담 기록 검색"""
    #     return Tool(
    #         name="GetUserLogsOld",
    #         func=get_user_logs_old,
    #         description="사용자의 과거 상담 기록을 검색합니다.",
    #     )

# ---------------------------------------------------------------------------

    # ✅ 4. 모든 도구 리스트 반환
    @staticmethod
    def get_all_tools():
        """정의된 모든 도구 리스트 반환"""
        return [
            llmCOD_tool_sets.search_pre(),
            llmCOD_tool_sets.search_pre_cat(),
            llmCOD_tool_sets.search_pre_d_id(),
            llmCOD_tool_sets.user_log(),
            llmCOD_tool_sets.user_log_history(),
            llmCOD_tool_sets.search_pre_limited(),  # ✅ 제한 적용된 검색 함수 추가
            llmCOD_tool_sets.search_cons_limited(),
        ]
        

# ------------------ 정밀 서치 상담 쿼리---------------------------------------------
async def async_search_consultation(keywords):
    """비동기 SQL 상담 검색 (카테고리 기반 필터 추가)"""
    loop = asyncio.get_running_loop()

    formatted_keywords = ", ".join(f"'{kw}'" for kw in keywords)

    query = f"""
    SET pg_trgm.similarity_threshold = 0.04;

    WITH filtered_by_category AS (
        SELECT id, category, sub_category, title, question, answer,
               GREATEST({", ".join([f"similarity(sub_category, '{kw}')" for kw in keywords])}) AS max_score
        FROM legal_consultation
        WHERE sub_category % ANY(ARRAY[{formatted_keywords}])
        ORDER BY max_score DESC
        LIMIT 50
    )
    SELECT fc.id, fc.category, fc.sub_category, fc.title, fc.question, fc.answer,
           GREATEST({", ".join([f"similarity(fc.question, '{kw}')" for kw in keywords])}) AS question_score,
           GREATEST({", ".join([f"similarity(fc.answer, '{kw}')" for kw in keywords])}) AS answer_score,
           (GREATEST({", ".join([f"similarity(fc.question, '{kw}')" for kw in keywords])}) + 
            GREATEST({", ".join([f"similarity(fc.answer, '{kw}')" for kw in keywords])})) / 2 AS avg_score
    FROM filtered_by_category fc
    WHERE fc.question % ANY(ARRAY[{formatted_keywords}]) 
       OR fc.answer % ANY(ARRAY[{formatted_keywords}])
    ORDER BY avg_score DESC
    LIMIT 20;
    """

    print(f"✅ [async_search_consultation] 실행된 쿼리: \n{query}")  # 🔥 쿼리 로그 추가

    # ✅ 상담 데이터 검색 실행
    consultation_results = await loop.run_in_executor(
        executor, execute_sql, query, None, False
    )

    if not consultation_results:
        print("❌ [SQL 검색 실패] 상담 데이터를 찾을 수 없습니다.")
        return [], [], []  # ✅ 빈 리스트 3개 반환하여 오류 방지!

    # ✅ 검색된 상담 데이터에서 category & title 추출
    consultation_categories = list(
        set([row["category"] for row in consultation_results])
    )
    consultation_titles = list(set([row["title"] for row in consultation_results]))

    print(f"✅ [추출된 카테고리]: {consultation_categories}")
    print(f"✅ [추출된 제목]: {consultation_titles}")

    return (
        consultation_results,
        consultation_categories,
        consultation_titles,
    )  # ✅ 정상적인 3개 반환


# ------------------ 정밀 서치 판례 쿼리---------------------------------------------
async def async_search_precedent(categories, titles, user_input_keywords):
    """비동기 SQL 판례 검색 (카테고리 + 제목 + 사용자 입력 키워드 기반)"""
    loop = asyncio.get_running_loop()

    # ✅ 1. title 및 category를 단어 단위로 변환
    def extract_words(text):
        return re.findall(r"\b\w+\b", text)

    title_words = set()
    category_words = set()

    for title in titles:
        title_words.update(extract_words(title))
    for category in categories:
        category_words.update(extract_words(category))

    formatted_categories = ", ".join(f"'{c}'" for c in category_words)
    formatted_titles = ", ".join(f"'{t}'" for t in title_words)
    formatted_user_keywords = ", ".join(f"'{kw}'" for kw in user_input_keywords)

    # ✅ 2. SQL 쿼리 수정: 단어 단위 검색 적용
    query = f"""
        SET pg_trgm.similarity_threshold = 0.2;  -- ✅ 적절한 유사도 기준 조정

    WITH filtered_precedents AS (
        SELECT id, c_number, c_type, j_date, court, c_name, d_link,
            -- ✅ 유사도 평균값 계산 (각 키워드 유사도 합 / 전체 개수)
            (
                {"+".join([f"COALESCE(similarity(c_name, '{kw}'), 0)" for kw in user_input_keywords])}
                + {"+".join([f"COALESCE(similarity(c_name, '{t}'), 0)" for t in title_words])}
                + {"+".join([f"COALESCE(similarity(c_name, '{c}'), 0)" for c in category_words])}
            ) / ({len(user_input_keywords) + len(title_words) + len(category_words)}) AS avg_score
        FROM precedent
        WHERE (
            -- ✅ 단어 기반 유사도 검색
            c_name % ANY(ARRAY[{formatted_user_keywords}])
            OR c_name % ANY(ARRAY[{formatted_titles}])
            OR c_name % ANY(ARRAY[{formatted_categories}])
            
            -- ✅ 문장 검색 강화 (ILIKE 포함)
            OR c_name ILIKE ANY(ARRAY[{", ".join([f"'%{kw}%'" for kw in user_input_keywords])}])
            OR c_name ILIKE ANY(ARRAY[{", ".join([f"'%{t}%'" for t in title_words])}])
        )
        ORDER BY avg_score DESC
        LIMIT 50
    )
    SELECT fp.id, fp.c_number, fp.c_type, fp.j_date, fp.court, fp.c_name, fp.d_link,
        (
            {"+".join([f"COALESCE(similarity(fp.c_name, '{kw}'), 0)" for kw in user_input_keywords])}
            + {"+".join([f"COALESCE(similarity(fp.c_name, '{t}'), 0)" for t in title_words])}
            + {"+".join([f"COALESCE(similarity(fp.c_name, '{c}'), 0)" for c in category_words])}
        ) / ({len(user_input_keywords) + len(title_words) + len(category_words)}) AS final_avg_score
    FROM filtered_precedents fp
    ORDER BY final_avg_score DESC
    LIMIT 20;
    """

    print(f"✅ [async_search_precedent] 실행된 쿼리: \n{query}")  # 🔥 쿼리 로그 추가

    # ✅ 판례 데이터 검색 실행
    precedent_results = await loop.run_in_executor(
        executor, execute_sql, query, None, False
    )

    return precedent_results


# ---------------------------------------------------------------------------------


# async def async_search_precedent(keywords):
#     """비동기 SQL 판례 검색 (최적화된 다중 키워드 검색 적용)"""
#     loop = asyncio.get_running_loop()

#     # ✅ 키워드 리스트를 올바른 SQL 배열 형식으로 변환
#     formatted_keywords = ", ".join(f"'{kw}'" for kw in keywords)

#     query = f"""
#     SET pg_trgm.similarity_threshold = 0.04;

# WITH filtered_by_category AS (
#     SELECT id, category, sub_category, title, question, answer, c_number, c_type, j_date, court, c_name, d_link,
#            GREATEST(
#                {", ".join([f"COALESCE(similarity(sub_category, '{kw}'), 0)" for kw in keywords])}
#            ) AS max_score
#     FROM legal_consultation
#     WHERE sub_category % ANY(ARRAY[{formatted_keywords}])
#     ORDER BY max_score DESC
#     LIMIT 50
# )
# SELECT fc.id, fc.category, fc.sub_category, fc.title, fc.question, fc.answer, fc.c_number, fc.c_type, fc.j_date, fc.court, fc.c_name, fc.d_link,
#        GREATEST(
#            {", ".join([f"COALESCE(similarity(fc.question, '{kw}'), 0)" for kw in keywords])}
#        ) AS question_score,
#        GREATEST(
#            {", ".join([f"COALESCE(similarity(fc.answer, '{kw}'), 0)" for kw in keywords])}
#        ) AS answer_score,
#        (
#            GREATEST(
#                {", ".join([f"COALESCE(similarity(fc.question, '{kw}'), 0)" for kw in keywords])}
#            ) + 
#            GREATEST(
#                {", ".join([f"COALESCE(similarity(fc.answer, '{kw}'), 0)" for kw in keywords])}
#            )
#        ) / 2 AS avg_score
# FROM filtered_by_category fc
# WHERE (fc.question % ANY(ARRAY[{formatted_keywords}]) 
#    OR fc.answer % ANY(ARRAY[{formatted_keywords}]))
# ORDER BY avg_score DESC
# LIMIT 20;
#     """

#     print(f"✅ [async_search_precedent] 실행된 쿼리: \n{query}")  # 🔥 쿼리 로그 추가

#     return await loop.run_in_executor(executor, execute_sql, query, None, False)
