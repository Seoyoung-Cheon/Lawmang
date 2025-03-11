import re
from typing import List, Literal, Union

# ✅ n번째 백분위수를 계산하는 함수
def nth_percentile(values: list[float], percentile: float) -> float:
    """
    주어진 값들의 리스트에서 특정 백분위수에 해당하는 값을 반환하는 함수.

    Args:
        values (list[float]): 입력 값 리스트
        percentile (float): 계산할 백분위수 (0.0 ~ 1.0)

    Returns:
        float: 해당 백분위수의 값
    """
    values = sorted(values)  # 값을 정렬
    index = (
        min(round(percentile * len(values)), len(values)) - 1
    )  # 백분위수 인덱스 계산
    return values[index]


# ✅ 리스트의 평균값을 계산하는 함수
def average(values: list[float]) -> float:
    """
    입력된 숫자 리스트의 평균을 계산하는 함수.

    Args:
        values (list[float]): 숫자 리스트

    Returns:
        float: 평균값
    """
    return sum(values) / len(values)


# ✅ 극단값을 제거한 평균을 계산하는 함수
def trimmed_average(values: list[float], percentile: float) -> float:
    """
    극단적인 값(상위/하위)을 제거한 후 평균을 계산하는 함수.

    Args:
        values (list[float]): 숫자 리스트
        percentile (float): 제거할 백분위수 (0.0 ~ 1.0)

    Returns:
        float: 트리밍된 평균값
    """
    values = sorted(values)  # 값을 정렬
    count = round(len(values) * percentile)  # 제거할 개수 계산
    trimmed = values[count : len(values) - count]  # 중앙 부분 값만 남김
    return average(trimmed)  # 평균 계산 후 반환


# ✅ 문자열에서 숫자를 추출하는 함수
def extract_number_from_string(s: str) -> Union[int, float]:
    """
    주어진 문자열에서 숫자를 찾아 반환하는 함수.
    - 쉼표(,)가 포함된 경우 자동 제거
    - 소수점이 있는 경우 `float`로 반환, 없는 경우 `int`로 반환

    Args:
        s (str): 입력 문자열

    Returns:
        Union[int, float]: 추출된 숫자 (없으면 None 반환)
    """
    match = re.search(r"\d{1,3}(?:,\d{3})*(?:\.\d+)?", s)  # 숫자 패턴 검색
    if match:
        number_str = match.group().replace(",", "")  # 쉼표 제거
        return float(number_str) if "." in number_str else int(number_str)
    return None
