import React, { useState } from "react";
import { fetchSearchResults } from "./Chatbot_testfront"; // ✅ API 함수 가져오기

const ChatbotTest = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    const data = await fetchSearchResults(query);
    setResult(data); // ✅ 검색 결과 업데이트
  };

  return (
    <div className="chatbot-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="법률 관련 질문을 입력하세요..."
      />
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}{" "}
      {/* ✅ 검색 결과를 버튼 위로 이동 */}
      <button onClick={handleSearch}>검색</button>
    </div>
  );
};

export default ChatbotTest;
