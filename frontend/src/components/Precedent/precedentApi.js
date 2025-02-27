// front/src/components/Precedent/precedentAPI.js

/**
 * 공통 API 요청 함수.
 * @param {string} apiUrl - 호출할 API의 URL.
 * @returns {Promise<any>} - API 응답 데이터(성공 시 JSON 또는 HTML 문자열).
 */
async function fetchData(apiUrl) {
  console.log("🔹 API 요청 URL:", apiUrl);

  try {
    const response = await fetch(apiUrl, {
      headers: { "Accept": "*/*" }, // ✅ JSON & HTML 모두 받을 수 있도록 설정
    });

    console.log("🔹 API 응답 상태 코드:", response.status);

    // HTTP 응답이 실패한 경우, 응답 본문을 읽어 오류 메시지를 생성합니다.
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 오류: ${response.status} - ${response.statusText}\n${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    console.log("🔹 응답 Content-Type:", contentType);

    // ✅ JSON 응답 처리
    if (contentType.includes("application/json")) {
      const data = await response.json();
      console.log("✅ API 응답 데이터 (JSON):", data);
      return data;
    }

    // ✅ HTML 응답 처리 (JSON이 아닌 경우)
    const htmlData = await response.text();
    console.warn("⚠️ API 응답이 HTML 형식입니다.");
    return { type: "html", content: htmlData }; // HTML 응답을 객체 형태로 반환

  } catch (error) {
    console.error("❌ API 요청 오류:", error.message);
    return { type: "error", message: error.message }; // 오류 발생 시 에러 정보 반환
  }
}

/**
 * 판례 카테고리별 검색 API 호출 함수.
 * @param {string} category - 검색할 판례 카테고리 (예: "형사", "민사" 등).
 * @returns {Promise<Array>} - 해당 카테고리의 판례 검색 결과 배열.
 */
export async function fetchCasesByCategory(category) {
  if (!category) return [];
  const apiUrl = `/api/search/precedents/category/${encodeURIComponent(category)}`;
  console.log("🔹 API 요청 URL (카테고리):", apiUrl);
  return fetchData(apiUrl);
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
 * @returns {Promise<Object | {type: "html", content: string}>} - JSON 또는 HTML 응답
 */
export async function fetchCaseDetail(pre_number) {
  if (!pre_number) throw new Error("유효한 pre_number가 필요합니다.");

  const apiUrl = `/api/detail/precedent/${pre_number}`;
  console.log("🔹 JSON 데이터 요청:", apiUrl);

  const result = await fetchData(apiUrl);

  // ✅ JSON인지 HTML인지 확인
  if (result && typeof result === "object" && !Array.isArray(result)) {
    const firstKey = Object.keys(result)[0]; // ✅ JSON 응답의 첫 번째 키 확인

    if (firstKey === "Law") {
      console.log("🔹 'Law' 키 발견 → HTML 데이터 요청");
      const htmlApiUrl = apiUrl.replace("type=JSON", "type=HTML"); // ✅ HTML API URL 변경
      return fetchData(htmlApiUrl); // ✅ HTML 요청 후 반환
    }

    return result; // ✅ 정상 JSON 반환
  }

  return result;
}
