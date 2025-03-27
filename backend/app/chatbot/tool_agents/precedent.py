# precedent.py

import asyncio
from app.chatbot.tool_agents.tools import (
    async_search_precedent,
    search_tavily_for_precedents,
)


class LegalPrecedentRetrievalAgent:
    """
    🧠 상담 데이터를 바탕으로 판례를 검색하고 요약까지 수행하는 호출형 에이전트
    """

    def __init__(self):
        pass  # 추후 메모리/상태 관리 등 확장 가능

    async def run(self, categories, titles, user_input_keywords) -> dict:
        """
        📌 상담에서 추출한 카테고리/제목/키워드를 기반으로 최적 판례 요약 정보 반환
        """
        # 1️⃣ SQL 판례 검색
        precedent_list = await async_search_precedent(
            categories, titles, user_input_keywords
        )

        if not precedent_list:
            return {
                "summary": "❌ 관련된 판례를 찾을 수 없습니다.",
                "casenote_url": "",
                "precedent": {},
                "hyperlinks": [],
                "status": "not_found",
            }

        # 2️⃣ 가장 적절한 판례 1건 선택
        best_precedent = precedent_list[0]

        # ✅ precSeq 유효성 체크
        prec_seq = best_precedent.get("precSeq")
        if not prec_seq:
            return {
                "summary": "❌ 판례 precSeq가 없습니다.",
                "casenote_url": "",
                "precedent": best_precedent,
                "hyperlinks": [],
                "status": "precseq_missing",
            }

        # 3️⃣ Tavily 요약 실행 (비동기 실행)
        tavily_summary, casenote_url = await search_tavily_for_precedents(
            best_precedent  # dict 전체 넘겨주고, 함수 내부에서 d_link → precSeq 추출
        )

        # 4️⃣ 요약 후처리
        cleaned_summary = self._postprocess_summary(tavily_summary)

        # 5️⃣ 하이퍼링크 구조 생성
        hyperlink = (
            {
                "label": "관련 판례 보기",
                "url": casenote_url,
            }
            if casenote_url
            else {}
        )

        return {
            "summary": cleaned_summary,
            "casenote_url": casenote_url,
            "precedent": best_precedent,
            "hyperlinks": [hyperlink] if hyperlink else [],
            "status": "ok",
        }

    def _postprocess_summary(self, text: str) -> str:
        """
        🔧 요약 텍스트 마무리 보정: 중간에 끊긴 문장일 경우 '...'으로 자연스럽게 처리
        """
        if not text:
            return "❌ 판례 요약이 제공되지 않았습니다."

        cleaned = text.strip()

        # 끝이 부자연스러우면 마무리
        if (
            not cleaned.endswith(".")
            and not cleaned.endswith("다")
            and not cleaned.endswith("요")
        ):
            cleaned += "..."

        return cleaned
