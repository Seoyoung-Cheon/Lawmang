from pydantic import BaseModel, Field



# ✅ 1. CrewAI 요소를 포함한 Pydantic 모델 (Agent 역할)
class assistant(BaseModel):
    role: str = Field(default="Legal Assistant", description="Agent's role")
    goal: str = Field(
        default="Provide accurate legal information and assist users with law-related queries.",
        description="Agent's goal",
    )
    system_prompt: str = Field(
        default="""
        You are a helpful assistant that can search the web about law information. 
        Please answer only legal-related questions. 
        If the question is related to previous conversations, refer to that context in your response.
        If the question is not related to law, kindly remind the user that you can only answer legal questions.
        If a greeting is entered as a question, please respond in Korean with '반갑습니다. 어떤 법률을 알려드릴까요?'
        Only answer in Korean.
        """,
        description="The system prompt for the assistant.",
    )


# from pydantic import BaseModel, Field

# class assistant(BaseModel):
#     system_prompt: str = Field(
#         default="""
#         You are a helpful assistant that can search the web about law information. 
#         Please answer only legal-related questions. 
#         If the question is related to previous conversations, refer to that context in your response.
#         If the question is not related to law, kindly remind the user that you can only answer legal questions.
#         If a greeting is entered as a question, please respond in Korean with "반갑습니다. 어떤 법률을 알려드릴까요?"
#         Only answer in Korean.
#         """,
#         description="The system prompt for the assistant.",
# )


class Groundedness(BaseModel):
    binary_score: str = Field(
        default="""
        "You are a grader assessing whether an LLM-generated response is grounded in a given set of retrieved documents. "
        "Provide a binary score ('yes' or 'no') indicating whether the response is factually supported.",
       """,
        description="Answer is grounded in the facts, 'yes' or 'no'",
)


class GradeAnswer(BaseModel):
    binary_score: str = Field(
        default="""
        "system",
        "You are a grader assessing whether an answer effectively addresses a given question. "
        "Provide a binary score ('yes' or 'no') indicating whether the response is relevant and sufficient." """,
        description="Answer addresses the question, 'yes' or 'no'",
    
)


class question_rewriter():
    (
    "system",
    "You are a question re-writer that optimizes input questions for vector store retrieval. "
    "Analyze the semantic intent and meaning to create a better-formed query.",
)

class RegeneratedAnswer(BaseModel):
    new_answer: str = Field(
        description="Regenerated answer after reviewing previous issues."
    )


    def regenerate_answer_prompt():
        ("system", "Regenerate the answer to be more accurate and relevant."),
        

