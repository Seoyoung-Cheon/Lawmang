from typing import Dict, List, Optional
from pydantic import BaseModel

def llm_call(prompt: str, model: str, client) -> str:
    """
    주어진 프롬프트로 LLM을 비동기적으로 호출합니다.
    이는 메시지를 하나의 프롬프트로 연결하는 일반적인 헬퍼 함수입니다.
    """
    messages = [{"role": "user", "content": prompt}]
    chat_completion = client.chat.completions.create(
        model=model,
        messages=messages,
    )
    print(model, "완료")
    return chat_completion.choices[0].message.content


def JSON_llm(user_prompt: str, schema: BaseModel, client, system_prompt: Optional[str] = None, model: Optional[str] = None):
    """
    JSON 모드에서 언어 모델 호출을 비동기적으로 실행하고 구조화된 JSON 객체를 반환합니다.
    모델이 제공되지 않으면 기본 JSON 처리 가능한 모델이 사용됩니다.
    """
    if model is None:
        model = "gpt-4o-mini"
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": user_prompt})

        completion = client.beta.chat.completions.parse(
            model=model,
            messages=messages,
            response_format=schema,
        )
        
        return completion.choices[0].message.parsed
    except Exception as e:
        print(f"Error in JSON_llm: {e}")
        return None 