from textwrap import dedent  # 선행 공백 제거
from crewai import Task

class PreprocessorTasks:
    # agent = 수행작업 진행 agent 전달받음
    # context = agent 수행할 정보 전달 
    def research_task(self, agent, context): 
        return Task(
        description=dedent(f"""\
                Research the following case in Korean legal databases:
                1. Find relevant legal precedents from the Supreme Court and lower courts
                2. Identify specific legal procedures and requirements
                3. Search for similar cases and their procedural history
            
                Case Context: {context}
            
                Provide all results in Korean."""),
        expected_output=dedent(f"""\
                Provide a detailed report in Korean including:
                1. Relevant legal precedents
                2. Applicable legal procedures
                3. Required documentation
                4. Timeline requirements
                모든 결과는 한국어로 작성되어야 합니다."""),
        agent=agent,
        async_execution=True,
        )
    
    def analysis_task(self, agent, context):
        return Task(
            description=dedent(f"""\
        Analyze the legal research results with focus on:
        1. Required legal procedures
        2. Procedural timelines
        3. Documentation requirements
        4. Relevant legal authorities
       
        Case Context: {context}
       
        Provide the analysis in Korean."""),
            expected_output=dedent(f"""\
        Deliver a comprehensive analysis in Korean including:
        1. Step-by-step legal procedures
        2. Timeline requirements
        3. Required forms and documents
        4. Relevant legal authorities
        모든 분석은 한국어로 작성되어야 합니다."""),
            agent=agent,
            async_execution=True,
        )

    def strategy_task(self, agent, case_objective):
        return Task(
        description=dedent(f"""\
        Create a detailed procedural strategy including:
        1. Step-by-step legal process
        2. Required documentation
        3. Timeline and deadlines
        4. Potential procedural challenges
       
        Objective: {case_objective}
       
        Present the strategy in Korean."""),
        expected_output=dedent(f"""\
        Provide a detailed strategic plan in Korean including:
        1. Chronological procedure steps
        2. Documentation checklist
        3. Timeline with key deadlines
        4. Procedural recommendations
        모든 전략은 한국어로 작성되어야 합니다."""),
            agent=agent,
        )

    def summary_and_briefing_task(self, agent, case_objective):
        return Task(
        description=dedent(f"""\
            Create a comprehensive legal procedure briefing that includes:
            1. Summary of required legal procedures
            2. Step-by-step process guide
            3. Documentation requirements
            4. Timeline and deadlines
        
            Objective: {case_objective}
        
            Present the briefing in Korean."""),
        expected_output=dedent(f"""\
            Deliver a well-structured briefing in Korean including:
            1. Overview of legal procedures
            2. Detailed process steps
            3. Required documents and forms
            4. Timeline and important dates
            모든 브리핑은 한국어로 작성되어야 합니다."""),
        agent=agent,
        )
