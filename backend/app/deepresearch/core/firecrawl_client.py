import os
from typing import List, Optional, Dict, Literal
from firecrawl import FirecrawlApp
from app.deepresearch.research.research_models import SearchResult
import requests
from urllib.parse import urlparse
import aiohttp
import asyncio

# 법률 관련 신뢰할 수 있는 도메인
LEGAL_DOMAINS = [
    "law.go.kr",          # 국가법령정보센터
    "www.moef.go.kr",     # 기획재정부
    "www.lawnb.com",      # 로앤비
]

# 세무/회계 관련 신뢰할 수 있는 도메인
TAX_DOMAINS = [
    "hometax.go.kr",            # 홈택스
    "nts.go.kr",                # 국세청
    "www.simpan.go.kr",         # 조세심판원
    "www.kacpta.or.kr",         # 한국세무사회
    "www.kicpa.or.kr",          # 한국공인회계사회
    "www.koreatax.org",         # 한국납세자연맹
    "www.taxnet.co.kr",         # 택스넷
    "www.etaxkorea.net",        # 이택스코리아
    "www.taxguide.co.kr",       # 세무가이드
    "www.taxpoint.co.kr",       # 택스포인트
    "www.taxkorea.net",         # 세금코리아
    "www.taxrefund.co.kr",      # 세금환급
    "www.taxconsulting.co.kr",  # 세무컨설팅
    "www.taxaccount.co.kr",     # 세무회계
    "www.taxnews.co.kr",        # 세무뉴스
    "www.taxnews.co.kr",        # 세무뉴스
    "www.taxnews.co.kr",        # 세무뉴스
    "www.taxnews.co.kr",        # 세무뉴스
    "www.taxnews.co.kr",        # 세무뉴스
    "www.taxnews.co.kr",        # 세무뉴스
]

# 통합 도메인 리스트 (기존 TRUSTED_DOMAINS를 대체)
TRUSTED_DOMAINS = [
    *LEGAL_DOMAINS,
    *TAX_DOMAINS
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
    
    def __init__(
        self, 
        api_key: Optional[str] = None, 
        base_url: str = "https://api.firecrawl.com",
        search_type: Literal["legal", "tax"] = "legal"
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.search_type = search_type
        self.trusted_domains = LEGAL_DOMAINS if search_type == "legal" else TAX_DOMAINS
        self.session = aiohttp.ClientSession()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def close(self):
        """세션을 정리합니다."""
        if self.session and not self.session.closed:
            await self.session.close()

    def _is_trusted_domain(self, url: str) -> bool:
        """URL이 신뢰할 수 있는 도메인인지 확인합니다."""
        try:
            domain = urlparse(url).netloc
            return any(trusted in domain for trusted in self.trusted_domains)
        except:
            return False

    async def search(self, query: str) -> Dict:
        """검색 쿼리를 실행하고 결과를 반환합니다."""
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            async with self.session.get(
                f"{self.base_url}/search",
                params={"q": query, "type": self.search_type},
                headers=headers
            ) as response:
                response.raise_for_status()
                return await response.json()
        except Exception as e:
            print(f"검색 중 오류 발생: {e}")
            return {"results": []}

    async def get_content(self, url: str) -> str:
        """주어진 URL의 컨텐츠를 가져옵니다."""
        if not self._is_trusted_domain(url):
            return ""
            
        try:
            async with self.session.get(url) as response:
                response.raise_for_status()
                return await response.text()
        except Exception as e:
            print(f"컨텐츠 가져오기 실패 ({url}): {e}")
            return ""

    async def process_results(self, results: List[Dict]) -> List[Dict]:
        """검색 결과를 처리합니다."""
        processed_results = []
        
        for result in results:
            if not self._is_trusted_domain(result.get("url", "")):
                continue
                
            try:
                # 필요한 필드만 추출하고 정제
                processed_result = {
                    "url": result.get("url", ""),
                    "title": result.get("title", "").strip(),
                    "snippet": result.get("snippet", "").strip(),
                    "source": self.search_type,
                    "timestamp": result.get("timestamp")
                }
                processed_results.append(processed_result)
            except Exception as e:
                print(f"결과 처리 중 오류 발생: {e}")
                continue
                
        return processed_results

    @classmethod
    async def create(
        cls, 
        api_key: Optional[str] = None, 
        base_url: str = "https://api.firecrawl.com",
        search_type: Literal["legal", "tax"] = "legal"
    ):
        """비동기 컨텍스트 관리자를 사용하기 위한 팩토리 메서드"""
        return cls(api_key, base_url, search_type)
