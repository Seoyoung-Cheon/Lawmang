from textwrap import dedent  # 선행 공백 제거
from crewai import Agent
from tools import ExaSearchToolset

class PreprocessAgent():
    def research_agent(self):
        return Agent(
            role="Legal Research Specialist",  # 역할 부여
            goal="Research and collect relevant legal precedents and procedures from Korean court cases",  # 목표부여
            tools=ExaSearchToolset.tools(),
            backstory=dedent(f"""\
                As a specialized legal researcher, your mission is to thoroughly investigate
                Korean legal precedents, court decisions, and procedural guidelines.
                You focus on finding similar cases and their procedural history
                from official Korean legal databases."""),  # 배경설명
            verbose=True,  # 상세 로그 출력
        )
        
    def analysis_agent(self):
        return Agent(
            role="Legal Case Analyst",
            goal="Analyze Korean court precedents and extract relevant legal procedures and requirements",
            tools=ExaSearchToolset.tools(),
            backstory=dedent(f"""\
        As an experienced legal analyst specializing in Korean law,
        you excel at interpreting court decisions and understanding
        legal procedures. You focus on identifying key procedural
        requirements and legal steps from similar cases."""),
            verbose=True,
        )
    
    def strategy_agent(self):
        return Agent(
            role="Legal Strategy Advisor",
            goal="Develop a step-by-step legal procedure plan based on Korean law and precedents",
            tools=ExaSearchToolset.tools(),
            backstory=dedent(f"""\
        As a legal strategy advisor with expertise in Korean legal procedures,
        you specialize in creating detailed procedural guidelines and timelines.
        You have extensive experience in mapping out legal processes and
        identifying required documentation and deadlines."""),
            verbose=True,
        )
        
    def summary_and_briefing_agent(self):
        return Agent(
            role="Legal Process Coordinator",
            goal="Create a comprehensive briefing on legal procedures and requirements",
            tools=ExaSearchToolset.tools(),
            backstory=dedent(f"""\
        As a legal process coordinator, you excel at organizing complex legal
        procedures into clear, actionable steps. You ensure all procedural
        requirements are properly documented and explained in Korean."""),
            verbose=True,
        )
