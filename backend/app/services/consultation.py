from app.core.database import execute_sql

def search_consultations(keyword: str):
    """
    키워드를 기반으로 legal_consultation 테이블을 검색하는 함수.
    - keyword는 title과 question 컬럼에서 검색합니다.
    - 검색 결과는 sub_category 컬럼 기준으로 정렬됩니다.
    - 여러 단어(띄어쓰기로 구분)가 포함된 경우, 각 단어가 모두 포함된 결과를 반환합니다.
    """
    # 키워드 전처리: 앞뒤 공백 제거
    keyword = keyword.strip()
    if not keyword:
        return []

    # 키워드를 공백 기준으로 분리
    tokens = keyword.split()
    token_count = len(tokens)
    if token_count == 0:
        return []

    # title, question 컬럼에 대해 각각 모든 토큰이 포함되어야 한다는 조건 생성
    title_conditions = " AND ".join([f"title ILIKE :token{i}" for i in range(token_count)])
    question_conditions = " AND ".join([f"question ILIKE :token{i}" for i in range(token_count)])

    query = f"""
    SELECT id, category, sub_category, title, question, answer
    FROM legal_consultation
    WHERE ({title_conditions})
       OR ({question_conditions})
    ORDER BY sub_category;
    """
    params = {f"token{i}": f"%{token}%" for i, token in enumerate(tokens)}

    results = execute_sql(query, params)
    return [dict(row) for row in results]


def search_consultations_by_category(category: str):
    """
    주어진 category(상담사례 카테고리)에 해당하는 상담 데이터를 검색합니다.
    """
    query = """
    SELECT id, category, sub_category, title, question, answer
    FROM legal_consultation
    WHERE category ILIKE :category
    ORDER BY sub_category;
    """
    params = {"category": f"%{category}%"}
    results = execute_sql(query, params)
   
    return [dict(row) for row in results]