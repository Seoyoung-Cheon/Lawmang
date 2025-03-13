import os
import sys
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
# ---------------------------------------------------------------

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

    @staticmethod
    def search_cons_cat():
        """특정 카테고리에 속하는 법률 상담 사례 검색"""
        return Tool(
            name="SearchLegalConsultationsByCategory",
            func=search_consultations_by_category,
            description="특정 카테고리에 속하는 법률 상담 사례를 검색합니다.",
        )

    @staticmethod
    def search_cons_d_id():
        """법률 상담 상세 정보를 ID를 기반으로 검색"""
        return Tool(
            name="GetLegalConsultationDetail",
            func=get_consultation_detail_by_id,
            description="법률 상담의 상세 정보를 검색합니다. 상담 ID를 입력해야 합니다.",
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

    @staticmethod
    def search_pre_cat():
        """특정 카테고리에 속하는 법률 판례 검색"""
        return Tool(
            name="SearchLegalPrecedentsByCategory",
            func=search_precedents_by_category,
            description="특정 카테고리에 속하는 법률 판례를 검색합니다.",
        )

    @staticmethod
    def search_pre_d_id():
        """법률 판례 상세 정보를 ID를 기반으로 검색"""
        return Tool(
            name="GetLegalPrecedentDetail",
            func=fetch_external_precedent_detail,
            description="법률 판례의 상세 정보를 검색합니다. 판례 ID를 입력해야 합니다.",
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

    # @staticmethod
    # def evaluate_legal_data():
    #     """BART 모델을 사용하여 법률 데이터를 평가하는 도구"""
    #     return Tool(
    #         name="EvaluateLegalData",
    #         func=fetch_and_evaluate,
    #         description="기존 검색 도구에서 가져온 데이터를 BART를 사용하여 요약 및 평가합니다.",
    #     )

    # ----------------------------------------------------------------------------------------------
    @staticmethod
    def search_pre_limited():
        """법률 판례 검색 (결과 5개 제한)"""
        return Tool(
            name="SearchLegalPrecedentsLimited",
            func=lambda query: search_precedents(query)[
                :1
            ],  # ✅ 입력을 받아서 5개만 반환
            description="키워드를 포함하는 법률 판례를 검색하고 최대 5개의 결과를 반환합니다.",
        )

    @staticmethod
    def search_cons_limited():
        """법률 상담 검색 (결과 2개 제한)"""
        return Tool(
            name="SearchLegalConsultationLimited",
            func=lambda query: search_consultations(query)[
                :2
            ],  # ✅ 입력을 받아서 5개만 반환
            description="키워드를 포함하는 법률 상담을 검색하고 최대 2개의 결과를 반환합니다.",
        )

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