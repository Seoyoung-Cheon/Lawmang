from app.core.database import execute_sql

def search_precedents(keyword: str):
    """
    키워드를 기반으로 precedent 테이블을 검색하는 함수.
    - '법원'이 포함된 단어는 court 컬럼에서 검색.
    - 나머지 단어들은 c_name 컬럼에서 검색.
    - '법원' 키워드가 없으면, c_name, court, c_number에서 검색.
    """

    tokens = keyword.split()
    court_tokens = [token for token in tokens if "법원" in token]
    c_name_tokens = [token for token in tokens if "법원" not in token]

    if court_tokens:
        court_keyword = " ".join(court_tokens)
        if c_name_tokens:
            c_name_keyword = " ".join(c_name_tokens)
            query = """
            SELECT id, c_number, c_type, j_date, pre_number, court, d_link, c_name
            FROM precedent
            WHERE court ILIKE :court_keyword
              AND c_name ILIKE :c_name_keyword
            ORDER BY j_date DESC;
            """
            params = {
                "court_keyword": f"%{court_keyword}%",
                "c_name_keyword": f"%{c_name_keyword}%"
            }
        else:
            query = """
            SELECT id, c_number, c_type, j_date, pre_number, court, d_link, c_name
            FROM precedent
            WHERE court ILIKE :court_keyword
            ORDER BY j_date DESC;
            """
            params = {"court_keyword": f"%{court_keyword}%"}
    else:
        query = """
        SELECT id, c_number, c_type, j_date, pre_number, court, d_link, c_name
        FROM precedent
        WHERE c_name ILIKE :keyword
           OR court ILIKE :keyword           
        ORDER BY j_date DESC;
        """
        params = {"keyword": f"%{keyword}%"}

    # ✅ execute_sql() 실행 후 JSON 직렬화가 가능한 형식으로 변환
    results = execute_sql(query, params)
    return [dict(row) for row in results]  # JSON 직렬화 가능하도록 변환