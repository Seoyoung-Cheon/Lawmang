// ✅ API 요청을 처리하는 공통 함수
async function fetchData(apiUrl) {
  console.log("🔹 API 요청 URL:", apiUrl);

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 오류: ${response.status} - ${response.statusText}\n${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("⚠️ API 응답이 JSON 형식이 아닙니다.");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ API 요청 오류:", error.message);
    return []; // 오류 발생 시 빈 배열 반환
  }
}

// ✅ 판례 검색 API 호출 함수
export async function fetchCases(query) {
  if (!query) return [];
  return fetchData(`/api/search/precedents/${query}`);
}