// front/src/components/Precedent/precedentAPI.js

/**
 * 공통 API 요청 함수.
 * @param {string} apiUrl - 호출할 API의 URL.
 * @returns {Promise<any>} - API 응답 데이터(성공 시 JSON, 실패 시 빈 배열).
 */
async function fetchData(apiUrl) {
  console.log("🔹 API 요청 URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
    });
    console.log("🔹 API 응답 상태 코드:", response.status);

    // HTTP 응답이 실패한 경우, 응답 본문을 읽어 오류 메시지를 생성합니다.
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 오류: ${response.status} - ${response.statusText}\n${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    console.log("🔹 응답 Content-Type:", contentType);

    // 응답이 JSON 형식이 아니면 오류 처리
    if (!contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error("⚠️ API 응답이 JSON 형식이 아님:", errorText);
      throw new Error("⚠️ API 응답이 JSON 형식이 아닙니다.");
    }

    const data = await response.json();
    console.log("✅ API 응답 데이터:", data);
    return data;
  } catch (error) {
    console.error("❌ API 요청 오류:", error.message);
    return []; // 오류 발생 시 빈 배열 반환
  }
}

/**
 * 판례 검색 API 호출 함수.
 * @param {string} query - 검색어.
 * @returns {Promise<Array>} - 판례 검색 결과 배열.
 */
export async function fetchCases(query) {
  if (!query) return [];
  // encodeURIComponent를 사용하여 쿼리 문자열 안전 처리
  const apiUrl = `/api/search/precedents/${encodeURIComponent(query)}`;
  return fetchData(apiUrl);
}

/**
 * 판례 상세 정보 API 호출 함수.
 * @param {number|string} pre_number - 상세 정보를 조회할 판례 번호.
 * @returns {Promise<Object>} - 판례 상세 정보 객체.
 */
export async function fetchCaseDetail(pre_number) {
  if (!pre_number) throw new Error("유효한 pre_number가 필요합니다.");
  const apiUrl = `/api/detail/precedent/${pre_number}`;
  console.log("🔹 API 요청 URL:", apiUrl);
  return fetchData(apiUrl);
}
