# 모델을 툴로 전달 
import os 
from exa_py import Exa
from langchain.agents import tool 

class ExaSearchToolset():
    @tool
    def search(query: str): 
        """Search Korean official legal websites and databases"""
        return ExaSearchToolset._exa().search(
            f"language:ko site:law.go.kr OR site:scourt.go.kr {query}",
            use_autoprompt=True,
            num_results=7
        )
    
    @tool
    def find_similar(url: str): 
        """Search for similar korean official legal cases based on the url"""
        return ExaSearchToolset._exa().find_similar(url, num_results=7,
        )
    
    @tool
    def get_contents(ids: str):
        """Get contents based on webpages' ID"""
        try:
            if ',' in ids:
                ids = [id.strip() for id in ids.split(',')]
            else:
                ids = [ids.strip()]

            contents = ExaSearchToolset._exa().get_contents(ids)
            if not contents:
                return "웹페이지의 내용을 가져올 수 없습니다. 유효한 ID인지 확인해주세요."

            contents = str(contents)
            contents = contents.split("URL:")
            contents = [content[:1000] for content in contents]
            return "\n\n".join(contents)
        except Exception as e:
            return f"웹페이지 내용을 가져오는 중 오류가 발생했습니다: {str(e)}"

    def tools():
        return [ExaSearchToolset.search, ExaSearchToolset.find_similar, ExaSearchToolset.get_contents]
    
    def _exa():
        return Exa(api_key=os.environ.get("EXA_API_KEY"))