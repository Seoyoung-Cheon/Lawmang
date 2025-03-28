import os
from typing import List, Optional, Dict
from firecrawl import FirecrawlApp
from app.deepresearch.research.research_models import SearchResult
import requests

TRUSTED_DOMAINS = [
    "hometax.go.kr", "nts.go.kr", "law.go.kr", "moef.go.kr",
    "koreatax.com", "blog.naver.com/seumtax"
]

def firecrawl_search(query: str, timeout: int = 15000, limit: int = 5) -> List[SearchResult]:
    try:
        app = FirecrawlApp(api_key=os.getenv("FIRECRAWL_API_KEY", ""))
        response = app.search(
            query=query,
            params={"timeout": timeout, "limit": limit, "scrapeOptions": {"formats": ["markdown"]}}
        )
        return response.get("data", [])
    except Exception as e:
        print(f"Firecrawl 검색 오류: {e}")
        return []

def filter_by_whitelist(results: List[SearchResult]) -> List[SearchResult]:
    return [item for item in results if any(domain in item.url for domain in TRUSTED_DOMAINS)]

class FirecrawlClient:
    """FireCrawl API와 통신하는 클라이언트 클래스"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.firecrawl.com"):
        self.api_key = api_key
        self.base_url = base_url
        
    def search(self, query: str) -> Dict:
        """검색 쿼리를 실행하고 결과를 반환합니다."""
        # 실제 구현은 API 스펙에 맞게 수정해야 합니다
        return {"results": []}
    
    def get_content(self, url: str) -> str:
        """주어진 URL의 컨텐츠를 가져옵니다."""
        # 실제 구현은 API 스펙에 맞게 수정해야 합니다
        return ""

    def process_results(self, results: List[Dict]) -> List[Dict]:
        """검색 결과를 처리합니다."""
        # 실제 구현은 요구사항에 맞게 수정해야 합니다
        return results
