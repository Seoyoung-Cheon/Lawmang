import os
import sys
import re
import requests
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
from langchain_community.tools import TavilySearchResults
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
           (
               (GREATEST({", ".join([f"COALESCE(similarity(title, '{kw}'), 0)" for kw in keywords])}) * 0.6)  -- ✅ title 가중치 90%
               +
               (GREATEST({", ".join([f"COALESCE(similarity(sub_category, '{kw}'), 0)" for kw in keywords])}) * 0.4)  -- ✅ sub_category 가중치 10%
           ) AS weighted_score  -- ✅ 가중 평균 적용
    FROM legal_consultation
    WHERE (sub_category % ANY(ARRAY[{formatted_keywords}]) OR title % ANY(ARRAY[{formatted_keywords}]))  -- ✅ title도 검색 조건에 포함
    ORDER BY weighted_score DESC
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
        LIMIT 10
    )
    SELECT fp.id, fp.c_number, fp.c_type, fp.j_date, fp.court, fp.c_name, fp.d_link,
        (
            {"+".join([f"COALESCE(similarity(fp.c_name, '{kw}'), 0)" for kw in user_input_keywords])}
            + {"+".join([f"COALESCE(similarity(fp.c_name, '{t}'), 0)" for t in title_words])}
            + {"+".join([f"COALESCE(similarity(fp.c_name, '{c}'), 0)" for c in category_words])}
        ) / ({len(user_input_keywords) + len(title_words) + len(category_words)}) AS final_avg_score
    FROM filtered_precedents fp
    ORDER BY final_avg_score DESC
    LIMIT 5;
    """

    print(f"✅ [async_search_precedent] 실행된 쿼리: \n{query}")  # 🔥 쿼리 로그 추가

    # ✅ 판례 데이터 검색 실행
    precedent_results = await loop.run_in_executor(
        executor, execute_sql, query, None, False
    )

    return precedent_results


# ---------------------------------------------------------------------------------

async def search_tavily_for_precedents(precedent: dict):
    """
    📌 선택된 판례에 대해 Tavily를 이용한 요약을 시도하되,
    precSeq와 정확히 일치하는 결과만 사용함.
    """
    tavily_result = "❌ Tavily 요약 정보를 찾을 수 없습니다."
    casenote_url = ""

    if not precedent:
        return tavily_result, casenote_url

    # ✅ precSeq 추출
    d_link = precedent.get("d_link", "")
    if "ID=" not in d_link:
        return tavily_result, casenote_url

    prec_seq = d_link.split("ID=")[-1].split("&")[0]
    casenote_url = f"https://law.go.kr/LSW/precInfoP.do?precSeq={prec_seq}"

    # ✅ search_tool 인스턴스 생성 (내부에서 정의)
    search_tool = LawGoKRTavilySearch(max_results=5)
    query_path = f"/LSW/precInfoP.do?precSeq={prec_seq}"

    try:
        results = search_tool.run(query_path)

        if isinstance(results, list):
            for result in results:
                url = result.get("url", "")
                content = (
                    result.get("content") or result.get("snippet") or result.get("text")
                )

                if url and f"precSeq={prec_seq}" in url and content:
                    tavily_result = content
                    casenote_url = url
                    break
                else:
                    print(f"⚠️ [Tavily 불일치] 요청: {prec_seq} | 응답: {url}")
        elif isinstance(results, str):
            print(f"❗ Tavily 오류 메시지: {results}")
    except Exception as e:
        print(f"❌ [Tavily 요청 실패]: {e}")

    return tavily_result, casenote_url


# ---------------------------------------------------------------------------------
class LawGoKRTavilySearch:
    """
    Tavily를 사용하여 law.go.kr에서만 검색하도록 제한하는 클래스
    """

    def __init__(self, max_results=3):  # ✅ 검색 결과 개수 조정 가능
        self.search_tool = TavilySearchResults(max_results=max_results)

    def run(self, query):
        """
        Tavily를 사용하여 특정 URL(law.go.kr)에서만 검색 실행
        """
        # ✅ 특정 사이트(law.go.kr)에서만 검색하도록 site 필터 적용
        site_restrict_query = f"site:law.go.kr {query}"

        try:
            # ✅ Tavily 검색 실행
            results = self.search_tool.run(site_restrict_query)

            # ✅ 응답이 리스트인지 확인
            if not isinstance(results, list):
                return (
                    f"❌ Tavily 검색 오류: 결과가 리스트가 아닙니다. ({type(results)})"
                )

            # ✅ `law.go.kr`이 포함된 결과만 필터링
            filtered_results = [
                result
                for result in results
                if isinstance(result, dict)
                and "url" in result
                and "law.go.kr" in result["url"]
            ]

            # ✅ 검색 결과가 없을 경우 처리
            if not filtered_results:
                return "❌ 관련 법률 정보를 찾을 수 없습니다."

            return filtered_results
        except Exception as e:
            return f"❌ Tavily 검색 오류: {str(e)}"


search_tool = LawGoKRTavilySearch(max_results=1)
#---------------------------------------------------------------
class LawGoKRTavilySearch:
    """
    Tavily를 사용하여 law.go.kr에서만 검색하도록 제한하는 클래스
    """

    def __init__(self, max_results=1):  # ✅ 검색 결과 개수 조정 가능
        self.search_tool = TavilySearchResults(max_results=max_results)

    def run(self, query):
        """
        Tavily를 사용하여 특정 URL(law.go.kr)에서만 검색 실행
        """
        # ✅ 특정 사이트(law.go.kr)에서만 검색하도록 site 필터 적용
        site_restrict_query = f"site:law.go.kr {query}"

        try:
            # ✅ Tavily 검색 실행
            results = self.search_tool.run(site_restrict_query)

            # ✅ 결과 출력 (디버깅용)
            print("🔍 Tavily 응답:", results)

            # ✅ 응답이 리스트인지 확인
            if not isinstance(results, list):
                return (
                    f"❌ Tavily 검색 오류: 결과가 리스트가 아닙니다. ({type(results)})"
                )

            # ✅ `law.go.kr`이 포함된 결과만 필터링
            filtered_results = [
                result
                for result in results
                if isinstance(result, dict)
                and "url" in result
                and "law.go.kr" in result["url"]
            ]

            # ✅ 검색 결과가 없을 경우 처리
            if not filtered_results:
                return "❌ 관련 법률 정보를 찾을 수 없습니다."

            return filtered_results
        except Exception as e:
            return f"❌ Tavily 검색 오류: {str(e)}"


search_tool = LawGoKRTavilySearch(max_results=1)

# ----------------------------------------------------------------

class LawGoKRTavilyAPIOpener:
    """
    Tavily를 사용하여 law.go.kr 판례번호 기반 API를 여는 클래스
    """

    def __init__(self, max_results=1, api_key="youngsunyi"):
        self.search_tool = TavilySearchResults(max_results=max_results)
        self.api_key = api_key  # ✅ law.go.kr API 키

    def open_case_api(self, pre_number):
        """
        특정 판례번호(pre_number)를 기반으로 law.go.kr API를 Tavily를 통해 열기
        """
        # ✅ JSON & HTML API URL 생성
        json_api_url = f"https://www.law.go.kr/DRF/lawService.do?OC={self.api_key}&target=prec&ID={pre_number}&type=JSON"
        html_api_url = f"https://www.law.go.kr/DRF/lawService.do?OC={self.api_key}&target=prec&ID={pre_number}&type=HTML"

        # ✅ Tavily 검색어 생성
        tavily_query = f"site:law.go.kr {json_api_url} OR {html_api_url}"

        try:
            # ✅ Tavily를 사용하여 API URL을 검색
            results = self.search_tool.run(tavily_query)

            # ✅ 검색 결과 디버깅용 출력
            print("🔍 Tavily 검색 결과:", results)

            return {
                "판례번호": pre_number,
                "JSON API URL": json_api_url,
                "HTML API URL": html_api_url,
                "Tavily 검색 결과": results,
            }

        except Exception as e:
            return {
                "판례번호": pre_number,
                "오류": f"Tavily 검색 오류 발생: {str(e)}",
                "JSON API URL": json_api_url,
                "HTML API URL": html_api_url,
            }

# ----------------------------------------------------------------


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
