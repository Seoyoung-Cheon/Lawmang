import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthContext";
import axios from "axios";
import { apiUrl } from "../utils/apiUrl";

const Chatbot = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general"); // 'general' or 'legal'
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  // 로그인/로그아웃 시 리렌더링
  useEffect(() => {
    console.log("🔄 로그인 상태 변경 감지됨:", isLoggedIn);
    if (!isLoggedIn) {
      setSelectedCategory("general"); // 로그아웃 시 일반상담으로 자동 변경
    }
  }, [isLoggedIn]);  

  // 상담 유형 선택 함수
  const handleCategoryClick = (category) => {
    if (category === "legal" && !isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    setSelectedCategory(category);
  };

  // 로그인 페이지로 이동하는 함수
  const handleLoginClick = () => {
    setShowLoginPopup(false);
    navigate("/login");
  };

  // 메시지 전송 함수
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = { role: "user", text: inputMessage };
    setMessages([...messages, newMessage]);
    setInputMessage("");

    try {
      const response = await axios.post(
        `${apiUrl}/chatbot/${selectedCategory}`,
        { message: inputMessage },
        { withCredentials: true }
      );

      setMessages((prev) => [...prev, { role: "bot", text: response.data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: "오류가 발생했습니다. 다시 시도해주세요." }]);
    }
  };

  return (
    <div>
      {/* ===================== 데스크톱 버전 시작 ===================== */}
      <div className={`${isOpen ? "" : "hidden lg:block"} fixed right-[50px] 2xl:right-[120px] top-[52%] -translate-y-1/2 z-50`}>
        <div className="w-[500px] h-[600px] 2xl:w-[600px] 2xl:h-[770px] bg-white rounded-xl shadow-md flex flex-col relative">
          {/* 로그인 필요 팝업  */}
          {showLoginPopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <p className="text-center text-lg mb-6">법률상담은 로그인이 필요합니다.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowLoginPopup(false)} className="flex-1 bg-gray-200 py-2 rounded-lg">닫기</button>
                  <button onClick={handleLoginClick} className="flex-1 bg-Main text-white py-2 rounded-lg">로그인</button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-Main text-white rounded-t-xl">
            <h3 className="text-2xl">Lawmang 챗봇</h3>
          </div>

          {/* 카테고리 선택 버튼 */}
          <div className="flex justify-between p-4 border-b">
            <div className="flex gap-2">
              <button onClick={() => handleCategoryClick("general")} className={`px-4 py-2 rounded-lg ${selectedCategory === "general" ? "bg-Main text-white" : "bg-gray-100"}`}>일반상담</button>

              <button
                onClick={() => handleCategoryClick("legal")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === "legal"
                    ? "bg-Main text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } ${!isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!isLoggedIn}
                title={!isLoggedIn ? "로그인이 필요합니다" : ""}
              >
                법률상담
              </button>
              {selectedCategory === "general" && (
                  <p className="text-sm text-gray-500 ml-4 max-w-[200px] leading-5 whitespace-nowrap">
                    ※ 구체적이고 전문적인 '법률상담'이 필요한 경우
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;로그인 후 이용 가능합니다.
                  </p>
                )}

            </div>
          </div>

          {/* 챗봇 메시지 영역 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <p className={`${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"} inline-block px-4 py-2 rounded-lg`}>{msg.text}</p>
              </div>
            ))}
          </div>

          {/* 입력창 */}
          <div className="p-6 border-t bg-gray-100 flex gap-3">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border rounded-xl focus:outline-none"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button onClick={sendMessage} className="px-6 py-3 bg-Main text-white rounded-xl">전송</button>
          </div>
        </div>
      </div>
      {/* ===================== 데스크톱 버전 끝 ===================== */}

      {/* ===================== 챗봇 아이콘 ===================== */}
      <div className={`${isOpen ? "hidden" : "lg:hidden"} fixed right-6 bottom-6 z-50`}>
        <button onClick={() => setIsOpen(true)} className="w-14 h-14 bg-Main text-white rounded-full shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03 8.25 9 8.25s9 3.694 9 8.25z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
