import httpx
from fastapi import HTTPException

async def fetch_external_precedent_detail(pre_number: int) -> dict:
    """
    외부 API에서 판례 상세 정보를 가져오는 함수.
    pre_number를 기반으로 외부 API를 호출하여 JSON 데이터를 반환합니다.
    """
    external_api_url = (
        f"https://www.law.go.kr/DRF/lawService.do?OC=youngsunyi&target=prec&ID={pre_number}&type=JSON"
    )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(external_api_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"외부 API 요청 실패: {str(e)}")
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"외부 API 호출 실패: {response.text}"
        )
    
    try:
        data = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"응답 파싱 오류: {str(e)}")
    
    # "PrecService" 키가 있으면 그 안의 데이터를 꺼내기
    if "PrecService" in data:
        data = data["PrecService"]
    
    return data