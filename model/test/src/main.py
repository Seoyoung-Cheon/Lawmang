import os
from dotenv import load_dotenv
from agents import process_query

import os


load_dotenv()

## 랭그래프 구조 : 1. LLM 정의;tool,llm정의  2. 에이전트 정의 3. 프로세스 정의 4. 메인 실행 
## 크루에이아이 구조 : 1. 에이전트 정의 2. ~ 비슷하게 진행? 
# 랭그래프 툴 정의 하는거 해보기 (같은개념? 비슷하게 사용 가능한걸로암?)

# 1. LLM 정의


# 메인 함수 수정
async def main():
    print("법률 관련 질문에 답변해드립니다. 종료하려면 'exit'를 입력하세요.")

    # 대화 기록 유지
    conversation_history = []

    while True:
        query = input("\n질문을 입력하세요: ").strip()

        if query.lower() == "exit":
            print("프로그램을 종료합니다.")
            break

        response = await process_query(
            query, conversation_history
        )  # conversation_history 전달
        print("\n답변:", response)

        # 대화 기록 저장 (이제 process_query 내부에서 자동으로 저장됨)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())