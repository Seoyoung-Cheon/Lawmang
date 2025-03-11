from app.services.consultation import (
    search_consultations,
    search_consultations_by_category,
)
from app.services.consultation_detail_service import get_consultation_detail_by_id
from app.services.mylog_service import get_user_logs, create_user_log, get_user_logs_old
from app.services.precedent_service import (
    search_precedents,
    search_precedents_by_category,
)
from app.services.precedent_detail_service import fetch_external_precedent_detail
from langchain.tools import Tool
from langchain.agents import initialize_agent
from langchain.chat_models import ChatOpenAI
from langchain.agents import AgentType


# LLM이 호출할 수 있는 SQL 툴 정의
search_tool = Tool(
    name="SearchLegalConsultations",
    func=search_consultations,
    description="법률 상담을 검색하는 도구. 키워드를 입력하면 관련 상담을 검색함.",
)


llm = ChatOpenAI(model_name="gpt-3.5-turbo")
agent = initialize_agent(
    tools=[search_tool],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)

# LLM이 툴을 활용하여 SQL 실행
response = agent.run("이혼 관련 법률 상담 사례를 검색해줘")
print(response)
