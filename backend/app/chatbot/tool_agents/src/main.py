from crewai import Crew
from tasks import PreprocessorTasks
from agents import PreprocessAgent
from dotenv import load_dotenv

def main():
    load_dotenv()

    print('안녕하세요. 법률 상담을 진행합니다')
    print('*' * 50)
    
    # 상담 텍스트 입력 
    law_context = input('상담 받고자 하는 법률 상황을 입력해주세요.')
    law_objective = input('상담 받는 내용에 따라 어떠한 결과가 필요한가요?')

    # 클래스 선언 
    tasks = PreprocessorTasks()
    agents = PreprocessAgent()
    
    # agent 구성 
    research_agent = agents.research_agent()
    analysis_agent = agents.analysis_agent()
    strategy_agent = agents.strategy_agent()
    summary_and_briefing_agent = agents.summary_and_briefing_agent()
    
    # tasks 구성 
    research_task = tasks.research_task(research_agent,law_context)
    analysis_task = tasks.analysis_task(analysis_agent,law_objective)
    strategy_task = tasks.strategy_task(strategy_agent,law_objective)
    summary_and_briefing_task = tasks.summary_and_briefing_task(summary_and_briefing_agent,law_objective)

    # 결과를 바탕으로 한 필요 작업 통합 
    strategy_task.context = [research_task, analysis_task]
    summary_and_briefing_task.context = [research_task, analysis_task, strategy_task]
    
    # 크루 구성 
    crew = Crew(
        agents=[research_agent, analysis_agent, strategy_agent, summary_and_briefing_agent],
        tasks=[research_task, analysis_task, strategy_task, summary_and_briefing_task]
    )
    
    # crew AI work
    result = crew.kickoff()
    
    # crew AI summary
    print(result)
    
if __name__ == '__main__':
    main()