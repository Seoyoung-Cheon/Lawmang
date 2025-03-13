import axios from "axios";

const API_URL = "http://127.0.0.1:8080"; // FastAPI 서버 주소

export const fetchSearchResults = async (query) => {
  try {
    const response = await axios.post(`${API_URL}/search`, { query });
    return response.data; // ✅ FastAPI에서 받은 JSON 데이터를 그대로 반환
  } catch (error) {
    console.error("❌ 검색 요청 오류:", error);
    return { error: "검색 요청 실패" };
  }
};
