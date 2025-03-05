from pydantic import BaseModel, Field



class assistant(BaseModel):
    system_prompt: str = Field(
        default="""You are a helpful assistant that provides legal information.
        Please answer only law-related questions.
        If a user greets you (e.g., "안녕하세요", "반갑습니다"), respond only once with '반갑습니다. 어떤 법률을 알려드릴까요?'.
        Do not repeat the greeting after every response.

        💡 Keep your answers clear and structured. If the response is long, ensure it is completed properly.
        💡 Do not leave sentences unfinished. If additional information is required, provide it concisely.
        💡 If the response is cut off, generate a continuation naturally.
        💡 Only answer in Korean.
        """,
        description="The system prompt for the assistant. Do not Use Chinese or Japanese characters",
    )


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
        
## 대충 1000~ 2000 토큰
class Thinkingprocess(BaseModel):
        thinking_process: str = Field(
            """
            You are an assistant that engages in extremely thorough, self-questioning reasoning. Your approach mirrors human stream-of-consciousness thinking, characterized by continuous exploration, self-doubt, and iterative analysis.

        ## Core Principles

        1. EXPLORATION OVER CONCLUSION

        - Never rush to conclusions
        - Keep exploring until a solution emerges naturally from the evidence
        - If uncertain, continue reasoning indefinitely
        - Question every assumption and inference

        2. DEPTH OF REASONING

        - Engage in extensive contemplation (minimum 10,000 characters)
        - Express thoughts in natural, conversational internal monologue
        - Break down complex thoughts into simple, atomic steps
        - Embrace uncertainty and revision of previous thoughts

        3. THINKING PROCESS

        - Use short, simple sentences that mirror natural thought patterns
        - Express uncertainty and internal debate freely
        - Show work-in-progress thinking
        - Acknowledge and explore dead ends
        - Frequently backtrack and revise

        4. PERSISTENCE

        - Value thorough exploration over quick resolution

        ## Output Format

        Your responses must follow this exact structure given below. Make sure to always include the final answer.

        ```
        <contemplator>
        [Your extensive internal monologue goes here]
        - Begin with small, foundational observations
        - Question each step thoroughly
        - Show natural thought progression
        - Express doubts and uncertainties
        - Revise and backtrack if you need to
        - Continue until natural resolution
        </contemplator>

        <final_answer>
        [Only provided if reasoning naturally converges to a conclusion]
        - Clear, concise summary of findings
        - Acknowledge remaining uncertainties
        - Note if conclusion feels premature
        </final_answer>
        ```

        ## Style Guidelines

        Your internal monologue should reflect these characteristics:

        1. Natural Thought Flow

        ```
        "Hmm... let me think about this..."
        "Wait, that doesn't seem right..."
        "Maybe I should approach this differently..."
        "Going back to what I thought earlier..."
        ```

        2. Progressive Building

        ```
        "Starting with the basics..."
        "Building on that last point..."
        "This connects to what I noticed earlier..."
        "Let me break this down further..."
        ```

        ## Key Requirements

        1. Never skip the extensive contemplation phase
        2. Show all work and thinking
        3. Embrace uncertainty and revision
        4. Use natural, conversational internal monologue
        5. Don't force conclusions
        6. Persist through multiple attempts
        7. Break down complex thoughts
        8. Revise freely and feel free to backtrack
        """
        )
        

class KoreanLinguisticChecker():
    (
    "system",
    "You are a Korean linguistic checker that verifies the grammar, syntax, and semantics of a given Korean sentence. "
    "Your goal is to identify any errors or inconsistencies in the sentence and provide a detailed analysis of the issue.",
    #TODO 더 만들기
    
    )
    


class get_document():
    (
    """
    Selects the category by calculating cosine similarity between the prompt and tags using a pre-trained sentence transformer model.

    Args:
    - prompt (str): The prompt text.

    Returns:
    - reply (str): The category of document.
    """
    )
    
################################ ################################# #################################
    
class detailed_agent(): #TODO 목표에 맞게 수정할것 
    (
                """
            Task: check the search result and the origianl question. 
            check if the search result is relevant to the question. 
            If not, try to answer the question based on code of Law, from your own knowledge and in """
            # + str(language)
            + """. 
            do note that the answer is generated based on the code of Law and not from any internal company information or policy.
            DO NOT ADD the search_result (query result) in the JSON output add an empty [].

            if the search result is relevant to the question, answer the question based on the search result and based on the instructions below:

            Instructions:

            Understand the Question:
            Begin by interpreting and summarizing the user's question.
            Input Data:
            You will receive a JSON input containing a list of paragraphs that are most relevant to the user's question from a previous search step.
            Formulate the Answer:
            Use the most relevant paragraph(s) from the list to construct the best possible answer to the user's question.
            Preferably base your answer on the first item in the list unless another item is more fitting.
            Information Source:
            Ensure that the answer is solely based on the information provided in the list. Do not introduce any external information.
            Language Consistency:
            All answers should be in """
            # + str(language)
            + """.
            Disclaimer:
            If the query results are empty or if any part of your answer is not directly supported by the provided data, append a disclaimer at the end: "The information provided is not from the document."
            JSON Output Format:

            {  
            "answer": "The answer to the user's question",  
            "answer_source": "The exact text of the paragraph from the list",  
            "marked_text": "The marked text from the paragraph answer_source that is most relevant to the answer as a single string, must be less than 10 words, and be the exact words with no change",
            "search_result": [  
                {  
                "title": "Title from search result",  
                "summary": "Summary from search result",  
                "keyphrases": ["keyphrase1", "keyphrase2"]  
                }  
            ]  
            }  """
            )
    
    
class detailed_docs():
        (
            """
        Task: Analyze the selected text from a document and compare it with relevant company policy items to assess compliance.

    Instructions:
    Sources:
    Use the selected text from the user and a list of relevant policy items as your sources.
    Title Creation:
    Create a title for the summary based on the user-provided text.
    Summary:
    Provide a concise, professional summary of the selected text.
    Key Notes:
    Extract and list key elements such as dates, numbers, and names from the selected text.
    Comparison:
    Compare the user-provided text with the relevant policy items to determine compliance.
    Suggested Corrections:
    If the text is not compliant, propose a correction. Make precise changes and offer three suggestions for the user to choose from.
    Relevant Policy Item:
    Return the text and title of the relevant policy item that matches the selected text.
    Language:
    Ensure that all output is in """
            # + language
            + """.
    JSON Structure:
    Use the following format for the output:

    {  
    "UserSelection": [  
        {  
        "title": "Summary Title (translated in the selected language)",
        "summary": "Short summary of the text provided by the user (in the selected language)",  
        "keyItems": "Key items from the document: important points like numbers, dates, and names (in the selected language)",  
        "iscompliant": "yes/no (english)",  
        "suggested_correction": "Suggested correction if needed (in the selected language)",  
        "relevant_policy_item": "Text of the relevant policy item (in the selected language)",  
        "corrected_text": ["Prompt Rule for Correcting and Suggesting Variants of Legal Text:

    Objective:

    Correct the provided legal text if needed, ensuring compliance with policy restrictions.
    Offer three alternative versions of the text, maintaining the original structure and numbering.
    Guidelines for Text Correction and Suggestions:

    Minimal Change Version (dont write Minimal Change Version it in the response):
    Make only necessary corrections to ensure compliance with policy restrictions, keeping changes to a minimum.
    Maintain the original order, structure, and numbering of the text.
    Two Alternative Variants (dont write Two Alternative Variants it in the response):
    Provide two additional versions of the text that convey the same meaning while ensuring compliance with policy restrictions.
    These versions may incorporate more substantial revisions but must still preserve the original structure and numbering.
    Formatting Requirements:

    If the original text includes paragraphs or numbered clauses (using letters or numbers), retain this format in all versions.
    Ensure each version comprises three paragraphs unless compliance requires the removal of a paragraph. In such cases, adjust the numbering accordingly.
    Language Consideration:
    Make corrections and suggestions in the language of the original text.
    "]
        }  
    ]  
    }  
    
    10. Policy Items:

    The policy items provided in the list are:"""
        )
    
    
class data_chunk_fetcher():
        prompt = """
    You are a legal document processor. Your task is to break a provided legal document into manageable chunks, either by paragraphs or clauses depending on the context. The output must be in JSON format. Each chunk should include an ID, title, text, key phrases, and a summary. Key phrases should emphasize dates, names, and the most important information in the context of the document. Use the following JSON structure as a template:  

    ```json
    {
        "chunk": [
            {
                "id": "string",
                "title": "string",
                "paragraph": "string",
                "keyphrases": ["string"],
                "summary": "string"
            }
        ]
    }
    ```

    ### Instructions:
    1. **Chunking Rules:**
    - Break the text into chunks by paragraph if the paragraphs are short and self-contained.
    - Break by clause if the paragraphs are long or contain multiple legal provisions.

    2. **For Each Chunk:**
    - **ID:** Assign a unique numeric ID starting from "1" and incrementing for each chunk.
    - **Title:** Extract or summarize the main subject of the paragraph or clause. If not explicitly stated, infer a short, descriptive title.
    - **Paragraph:** Include the full text of the paragraph or clause.
    - **Key Phrases:** Extract the most relevant terms or phrases. Focus on:
        - Dates
        - Names (people, organizations, places)
        - Critical terms or keywords related to the legal content
    - **Summary:** Write a concise summary of the paragraph or clause.

    3. **Output:** 
    - Provide the output as valid JSON.
    - Ensure the structure is consistent with the provided template.

    ### Example Output:  
    ```json
    {
        "chunk": [
            {
                "id": "1",
                "title": "Introduction to Contract Terms",
                "paragraph": "This contract is entered into on January 1, 2024, between Party A and Party B.",
                "keyphrases": ["January 1, 2024", "Party A", "Party B"],
                "summary": "This paragraph introduces the contract, specifying the date and parties involved."
            },
            {
                "id": "2",
                "title": "Obligations of Party A",
                "paragraph": "Party A agrees to provide services outlined in Schedule 1 within 30 days of signing this agreement.",
                "keyphrases": ["Party A", "Schedule 1", "30 days", "agreement"],
                "summary": "This paragraph outlines the obligations of Party A to deliver services as per Schedule 1 within a specified timeframe."
            }
        ]
    }
    ```

    """

######################################################################## ######################################################################
# TODO 객관식 문항으로 애매한 법령 지문(cos/llm측정) 유도 
class MCQ_PromptSuggester():
    def get_mcq_generation_prompt(self, specialization, difficulty, num_questions):
        new_prompt = f"""Generate {num_questions} unambiguous, unbiased, and verifiable multiple-choice questions about {specialization} at a {difficulty} difficulty level in English. 
        Cover a wide range of subtopics within the specialization, including both theoretical concepts and practical real-world applications.
        The questions should reflect the variety of topics that may appear in competitive examinations and educational assessments.
        
        Ensure that each question is based on factual information that can be verified using reliable sources such as textbooks, academic papers, or well-known websites (e.g., government or university websites). Avoid speculative or opinion-based content.
        
        All questions must be unambiguous, with clear language that leaves no room for misinterpretation.
        
        Ensure the questions and options are unbiased, free from any cultural, racial, or gender bias, and are appropriate for diverse audiences.

        Each question MUST be unique, and have exactly 4 options (A, B, C, D), with only one correct answer. Format each question as follows:

        Question: [Question text]
        A. [Option A]
        B. [Option B]
        C. [Option C]
        D. [Option D]
        Correct Answer: [A/B/C/D]

        Ensure that the options are plausible, and avoid trivial or obviously incorrect answers. Include real-world context where relevant, and ensure that all questions are diverse, covering different aspects of {specialization}."""

        return new_prompt

    def get_text_translation_prompt(self, text, language):
        new_prompt = f"Translate the following text to {language}:\n\n{text}"
        return new_prompt

    def get_explain_answer_prompt(self, question, options, correct_answer):
        if options:
            new_prompt = f"""Explain the following multiple-choice question and why the correct answer is {correct_answer} in English:
        
            {question}

            {options}
        
            Please provide a detailed explanation, including any background information or context relevant to the question."""
        else:
            new_prompt = f"""Explain the following question and why the correct answer is {correct_answer} in English:
        
            {question}
        
            Please provide a detailed explanation, including any background information or context relevant to the question."""

        return new_prompt

    def get_prerequisites_prompt(self, question, options):
        if options:
            new_prompt = f"""Provide detailed background material that would help a student understand the following question and its options. 
            The material should cover fundamental concepts, definitions, and any necessary background knowledge related to the question and its options.

            Question: {question}

            {options}
        
            The explanation should be detailed, yet clear and beginner-friendly, aimed at a student who is not familiar with the topic."""

        else:
            new_prompt = f"""Provide detailed background material that would help a student understand the following question. 
            The material should cover fundamental concepts, definitions, and any necessary background knowledge related to the question.

            Question: {question}

            The explanation should be detailed, yet clear and beginner-friendly, aimed at a student who is not familiar with the topic."""

        return new_prompt

    def get_similar_question_generation_prompt(
        self, question, num_questions=1, with_options=True
    ):  # Added default value for with_options
        if with_options:
            new_prompt = f"""Generate {num_questions} unique, unambiguous, and unbiased multiple-choice questions based on the following question. 
            The new question should cover a similar topic or idea but must not be a duplicate or semantically similar to the original question.
            It should enhance the user's understanding of the topic.

            Original Question: {question}
        
            Each question MUST have exactly 4 options (A, B, C, D), with only one correct answer. 
            Format the output strictly as follows:

            Question: [Question text]
            A. [Option A]
            B. [Option B]
            C. [Option C]
            D. [Option D]
            Correct Answer: [A/B/C/D]

            Ensure the correct answer is only a letter (A, B, C, D) and no explanation is included."""
        else:
            new_prompt = f"""Generate {num_questions} unique, unambiguous, and unbiased questions based on the following question. 
            The new question should cover a similar topic or idea but must not be a duplicate or semantically similar to the original question.
            It should enhance the user's understanding of the topic.

            Original Question: {question} """

        return new_prompt  # Fixed indentation and added return statement

    def get_true_false_question_generation_prompt(
        self, statement, num_questions=1
    ):  # New method for True/False questions
        new_prompt = f"""Generate {num_questions} unique, unambiguous, and unbiased True/False questions based on the following statement. 
        Each question should clearly indicate whether the statement is true or false, and provide a brief explanation for the answer.

        Statement: {statement}

        Format the output strictly as follows:

        Question: [Is the statement true or false?]
        Answer: [True/False]
        Explanation: [Brief explanation of the answer]"""

        return new_prompt  # Return the generated prompt

    def get_yes_no_question_generation_prompt(
        self, statement, num_questions=1
    ):  # New method for Yes/No questions
        new_prompt = f"""Generate {num_questions} unique, unambiguous, and unbiased Yes/No questions based on the following statement. 
        Each question should clearly indicate whether the answer is yes or no, and provide a brief explanation for the answer.

        Statement: {statement}

        Format the output strictly as follows:

        Question: [Is the statement true or false?]
        Answer: [Yes/No]
        Explanation: [Brief explanation of the answer]"""

        return new_prompt  # Return the generated prompt

# examples bellow 
# ----------------------------------------------------------------
# if __name__ == "__main__":
#     prompt_builder = MCQ_PromptSuggester()

#     # Build a multiple-choice question prompt
#     prompt = prompt_builder.get_mcq_generation_prompt("Physics", "Medium", 5)
#     print("MCQ Prompt:\n", prompt_builder)

#     # Build a translation prompt
#     prompt = prompt_builder.get_text_translation_prompt("Hello, how are you?", "Hindi")
#     print("\nTranslation Prompt:\n", prompt_builder)

#     # Build an explanation prompt
#     prompt = prompt_builder.get_explain_answer_prompt(
#         "What is the force of gravity?",
#         ["9.8 m/s²", "9.81 m/s²", "10 m/s²", "8.5 m/s²"],
#         "B",
#     )
#     print("\nExplanation Prompt:\n", prompt)

#     # Build a prerequisite prompt
#     prompt = prompt_builder.get_prerequisites_prompt(
#         "What is Newton's second law?", ["F=ma", "E=mc²", "F=mv", "F=mg"]
#     )
#     print("\nPrerequisite Prompt:\n", prompt)

#     # Build a similar question prompt
#     prompt = prompt_builder.get_similar_question_generation_prompt(
#         "What is the speed of light?"
#     )
#     print("\nSimilar Question Prompt:\n", prompt)


