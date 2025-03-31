from typing import List, Optional, Literal
from app.deepresearch.core.firecrawl_client import firecrawl_search, filter_by_whitelist
from app.deepresearch.research.search_result_processor import process_serp_result
from app.deepresearch.research.keyword_generator import generate_serp_queries
from app.deepresearch.research.research_models import ResearchResult
from openai import OpenAI
from app.deepresearch.core.firecrawl_client import FirecrawlClient

async def deep_research(
    query: str,
    breadth: int = 2,
    depth: int = 2,
    client: OpenAI = None,
    model: str = "gpt-3.5-turbo",
    search_type: Literal["legal", "tax"] = "legal"
) -> ResearchResult:
    """
    주어진 쿼리에 대해 심층 리서치를 수행합니다.
    """
    try:
        # FirecrawlClient 초기화 및 사용
        async with await FirecrawlClient.create(
            api_key="your_api_key",
            search_type=search_type  # legal/tax 구분
        ) as crawler:
            # 검색 수행
            search_results = await crawler.search(query)
            
            # 결과 처리
            processed_results = await crawler.process_results(
                search_results.get("results", [])
            )

            # 필요한 경우 각 결과의 상세 내용 가져오기
            for result in processed_results:
                if "url" in result:
                    content = await crawler.get_content(result["url"])
                    result["content"] = content

            # ResearchResult 형식으로 변환 및 반환
            return ResearchResult(
                learnings=[result.get("content", "") for result in processed_results],
                visited_urls=[result.get("url", "") for result in processed_results]
            )

    except Exception as e:
        print(f"심층 리서치 중 오류 발생: {e}")
        return ResearchResult(learnings=[], visited_urls=[])
