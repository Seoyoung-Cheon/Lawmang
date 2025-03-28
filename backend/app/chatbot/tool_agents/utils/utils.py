import re
from kiwipiepy import Kiwi
from typing import List, Set
kiwi = Kiwi()

def insert_hyperlinks_into_text(text: str, hyperlinks: list) -> str:
    if not hyperlinks:
        return text

    for link in hyperlinks:
        label = link.get("label")
        url = link.get("url")
        tooltip = link.get("tooltip", "")

        if not label or not url:
            continue

        # 🔍 정규식으로 단어 경계만 매칭, 첫 번째 항목만 교체
        pattern = r"\b" + re.escape(label) + r"\b"
        hyperlink_html = f'<a href="{url}" title="{tooltip}">{label}</a>'
        text = re.sub(pattern, hyperlink_html, text, count=1)

    return text

#--------------------------------------------------------------------------------

def extract_json_from_text(text):
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        return match.group(0)
    return None
# --------------------------------------------------------------------------------
# 법률 여부 판단 기준: FAISS 키워드 기반
def is_legal_query(keywords: List[str], legal_terms: Set[str], threshold=0.3) -> bool:
    legal_count = sum(1 for kw in keywords if kw in legal_terms)
    ratio = legal_count / len(keywords) if keywords else 0
    return ratio >= threshold
def classify_legal_query(user_input: str, legal_terms: Set[str]) -> str:
    tokens = kiwi.tokenize(user_input)
    extracted = [token.form for token in tokens if token.tag in ("NNG", "NNP")]

    if not extracted:
        return "nonlegal"

    legal_count = sum(1 for word in extracted if word in legal_terms)
    ratio = legal_count / len(extracted)

    return "legal" if ratio >= 0.3 else "nonlegal"


# --------------------------------------------------------------------------------
class faiss_kiwi:
    @staticmethod
    def jaccard_similarity(set1, set2):
        """Jaccard 유사도를 이용한 키워드 비교"""
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        return len(intersection) / len(union) if len(union) > 0 else 0

    @staticmethod
    def extract_keywords(text, top_k=5):
        """형태소 분석을 통해 명사(NNG, NNP) 상위 키워드 추출"""
        tokens = kiwi.tokenize(text)
        nouns = [token.form for token in tokens if token.tag in ("NNG", "NNP")]

        keyword_freq = {word: nouns.count(word) for word in set(nouns)}
        sorted_keywords = sorted(keyword_freq, key=keyword_freq.get, reverse=True)[
            :top_k
        ]

        print(f"✅ [키워드 추출 결과] {sorted_keywords}")
        return sorted_keywords

    @staticmethod
    def filter_keywords_with_jaccard(user_keywords, faiss_keywords, threshold=0.15):
        """자카드 유사도를 활용하여 FAISS 키워드를 필터링 (유저 키워드 유지)"""
        filtered_keywords = set(user_keywords)  # ✅ 유저 입력 키워드를 무조건 포함

        for faiss_word in faiss_keywords:
            max_sim = max(
                faiss_kiwi.jaccard_similarity(set(faiss_word), set(user_word))
                for user_word in user_keywords
            )
            if max_sim >= threshold:
                filtered_keywords.add(faiss_word)

        return list(filtered_keywords)

    @staticmethod
    def adjust_faiss_keywords(user_input, faiss_keywords):
        """유저 입력 키워드와 FAISS 키워드를 모두 포함하여 검색"""
        user_keywords = faiss_kiwi.extract_keywords(user_input, top_k=5)
        adjusted_keywords = list(set(user_keywords + faiss_keywords))

        print(f"✅ [최종 검색 키워드]: {adjusted_keywords}")
        return adjusted_keywords

    @staticmethod
    def extract_top_keywords_faiss(user_input, faiss_db, top_k=5):
        """FAISS 검색 후 상위 키워드 추출 (유저 입력 반영)"""
        print(f"🔍 [FAISS 키워드 추출] 입력: {user_input}")

        search_results = faiss_db.similarity_search(user_input, k=15)
        all_text = " ".join([doc.page_content for doc in search_results])

        faiss_keywords = faiss_kiwi.extract_keywords(all_text, top_k)
        adjusted_keywords = faiss_kiwi.adjust_faiss_keywords(user_input, faiss_keywords)

        print(f"✅ [FAISS 최종 검색 키워드] {adjusted_keywords}")
        return adjusted_keywords


def validate_model_type(model):
    if not isinstance(model, str):
        raise TypeError(
            f"❌ model 인자는 문자열(str)이어야 합니다. 현재: {type(model)}, 값: {model}"
        )