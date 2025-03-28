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
        print(f"🔍 [Precedent Agent] 입력 카테고리: {categories}")
        print(f"🔍 [Precedent Agent] 입력 제목: {titles}")
        print(f"🔍 [Precedent Agent] 검색 키워드: {user_input_keywords}")

        precedent_list = await async_search_precedent(
            categories, titles, user_input_keywords
        )

        if not precedent_list:
            print("⚠️ [Precedent Agent] SQL 검색 결과 없음.")
            return {
                "summary": "❌ 관련된 판례를 찾을 수 없습니다.",
                "casenote_url": "",
                "precedent": {},
                "hyperlinks": [],
                "status": "not_found",
            }

        best_precedent = dict(precedent_list[0])  # ✅ RowMapping → dict
        print(f"✅ [Precedent Agent] 선택된 판례:", best_precedent)
        d_link = best_precedent.get("d_link", "")
        prec_seq = ""

        if "ID=" in d_link:
            prec_seq = d_link.split("ID=")[-1].split("&")[0]
            best_precedent["precSeq"] = prec_seq  # ✅ 안정적 활용

        if not prec_seq:
            print("⚠️ [Precedent Agent] precSeq 없음")
            return {
                "summary": "❌ 판례 precSeq가 없습니다.",
                "casenote_url": "",
                "precedent": best_precedent,
                "hyperlinks": [],
                "status": "precseq_missing",
            }

        # 3️⃣ 요약 검색
        tavily_summary, casenote_url = await search_tavily_for_precedents(best_precedent)

        print(f"🧠 [Precedent Agent] 요약 결과: {tavily_summary}")
        print(f"🔗 [Precedent Agent] casenote URL: {casenote_url}")

        cleaned_summary = self._postprocess_summary(tavily_summary)

        hyperlink = {"label": "관련 판례 보기", "url": casenote_url} if casenote_url else {}

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
