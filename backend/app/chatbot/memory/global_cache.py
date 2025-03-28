# ✅ global_cache.py 업데이트 (session_id 해시 기반 관리 포함)
from typing import Any, Dict
import hashlib
import time

_cache: Dict[str, Dict[str, Any]] = {}
_ttl: Dict[str, float] = {}  # TTL 저장 (선택 사항)


def make_session_id(text: str) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:20]


def cache_intermediate_result(session_id: str, data: dict, ttl: int = 3600):
    """
    ✅ 최초 캐시 저장 (덮어쓰기) + TTL 적용
    """
    _cache[session_id] = data
    _ttl[session_id] = time.time() + ttl


def get_cached_result(session_id: str) -> dict:
    """
    ✅ 캐시 조회 (없으면 빈 dict)
    """
    now = time.time()
    if session_id in _cache and (_ttl.get(session_id, now + 1) > now):
        return _cache[session_id]
    else:
        _cache.pop(session_id, None)
        _ttl.pop(session_id, None)
        return {}


def update_cached_result(session_id: str, key: str, value: Any):
    """
    ✅ 기존 캐시에 항목 추가 또는 수정
    """
    if session_id not in _cache:
        _cache[session_id] = {}
    _cache[session_id][key] = value


def clear_cached_result(session_id: str):
    """
    ✅ 세션 캐시 삭제
    """
    _cache.pop(session_id, None)
    _ttl.pop(session_id, None)
