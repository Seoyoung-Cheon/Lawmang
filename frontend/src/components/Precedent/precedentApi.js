// front/src/components/Precedent/precedentAPI.js

/**
 * 공통 API 요청 함수.
 * @param {string} apiUrl - 호출할 API의 URL.
 * @returns {Promise<any>} - API 응답 데이터(성공 시 JSON 또는 HTML 문자열).
 */
async function fetchData(apiUrl, retries = 2) {
  try {
    const response = await fetch(apiUrl, {
      headers: { "Accept": "*/*" }, 
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`API 404: ${apiUrl} - 빈 결과 반환`); // ✅ 경고 메시지로 변경
        return []; // ✅ 404 발생 시 빈 배열 반환 (콘솔에 에러 안 찍힘)
      }
      const errorText = await response.text();
      throw new Error(`API 오류: ${response.status} - ${response.statusText}\n${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      return await response.json();
    }

    return { type: "html", content: await response.text() };

  } catch (error) {
    if (retries > 0) {
      console.warn(`API 요청 실패, 재시도 중... 남은 횟수: ${retries}`);
      return fetchData(apiUrl, retries - 1);
    }
    console.error(`API 요청 실패: ${error.message}`); // ❌ 최종 실패 시 콘솔 에러만 출력
    return [];
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
  const result = await fetchData(apiUrl);

  if (result && typeof result === "object" && !Array.isArray(result)) {
    const firstKey = Object.keys(result)[0];

    if (firstKey === "Law") {
      const htmlApiUrl = apiUrl.replace("type=JSON", "type=HTML");
      const htmlResult = await fetchData(htmlApiUrl);

      // ✅ JSON 데이터가 없으면 새로 만든 열람 목록 API에서 판례 정보 가져오기
      const dbApiUrl = `/api/mylog/precedent-info/${pre_number}`;
      const dbResult = await fetchData(dbApiUrl);

      return {
        type: "html",
        content: htmlResult.content, // ✅ iframe으로 표시할 HTML
        ...dbResult, // ✅ DB에서 가져온 판례 정보 추가
      };
    }

    return result;
  }

  return result;
}

export async function fetchPrecedentInfo(precedent_id) {
  if (!precedent_id) throw new Error("유효한 precedent_id 필요합니다.");

  const apiUrl = `/api/mylog/history/precedent-info/${precedent_id}`;
  // console.log("📌 요청하는 API:", apiUrl);  // ✅ 로그 추가

  const result = await fetchData(apiUrl);
  // console.log("📌 API 응답 데이터:", result);  // ✅ 응답 확인용 로그 추가

  return result;
}
