import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/slices/authSlice"; // ✅ Redux 로그인 상태 가져오기
import { useSendMessageMutation } from "../redux/slices/authApi"; // ✅ RTK Query 챗봇 API 가져오기

const Chatbot = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const [sendMessage, { isLoading }] = useSendMessageMutation(); // ✅ RTK Query 훅 사용

  // 로그인 상태 변경 감지하여 법률상담 버튼 비활성화
  useEffect(() => {
    console.log("🔄 로그인 상태 변경 감지됨:", isAuthenticated);
    if (!isAuthenticated) {
      setSelectedCategory("general");
    }
  }, [isAuthenticated]);

  const handleCategoryClick = (category) => {
    if (category === "legal" && !isAuthenticated) {
      setShowLoginPopup(true);
      return;
    }
    setSelectedCategory(category);
  };

  const handleLoginClick = () => {
    setShowLoginPopup(false);
    navigate("/login");
  };

  // ✅ RTK Query를 사용하여 챗봇 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = { role: "user", text: inputMessage };
    setMessages([...messages, newMessage]);
    setInputMessage("");

    try {
      const response = await sendMessage({
        message: inputMessage,
        category: selectedCategory,
      }).unwrap(); // ✅ 응답 데이터 가져오기

      setMessages((prev) => [...prev, { role: "bot", text: response.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "오류가 발생했습니다. 다시 시도해주세요." },
      ]);
    }
  };

  return (
    <div>
      {/* ===================== 데스크톱 버전 챗봇 ===================== */}
      <div
        className={`${
          isOpen ? "block max-[1380px]:block" : "hidden max-[1380px]:hidden"
        } min-[1380px]:block fixed right-[50px] 2xl:right-[120px] top-[52%] -translate-y-1/2 z-50`}
      >
        <div className="w-[500px] h-[600px] 2xl:w-[600px] 2xl:h-[770px] bg-white rounded-xl shadow-md flex flex-col relative">
          {showLoginPopup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 shadow-xl">
                <p className="text-center text-lg mb-6">
                  법률상담은 로그인이 필요합니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLoginPopup(false)}
                    className="flex-1 bg-gray-200 py-2 rounded-lg"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleLoginClick}
                    className="flex-1 bg-Main text-white py-2 rounded-lg"
                  >
                    로그인
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-Main text-white rounded-t-xl">
            <h3 className="text-2xl">Lawmang 챗봇</h3>
          </div>

          <div className="flex justify-between p-4 border-b">
            <div className="flex gap-2">
              <button
                onClick={() => handleCategoryClick("general")}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === "general"
                    ? "bg-Main text-white"
                    : "bg-gray-100"
                }`}
              >
                일반상담
              </button>

              <button
                onClick={() => handleCategoryClick("legal")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === "legal"
                    ? "bg-Main text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? "로그인이 필요합니다" : ""}
              >
                법률상담
              </button>
              {selectedCategory === "general" && (
                <p className="text-xs 2xl:text-sm text-gray-500 ml-4 max-w-[200px] 2xl:leading-5 whitespace-nowrap">
                  ※ 구체적이고 전문적인 '법률상담'이 필요한 경우
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;로그인 후 이용 가능합니다.
                </p>
              )}
            </div>
          </div>

          {/* 챗봇 메시지 영역 */}
          <div className="flex-1 p-6 overflow-y-auto ">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <p
                  className={`${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  } inline-block px-4 py-2 rounded-lg`}
                >
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          {/* 입력창 */}
          <div className="p-6 border-t bg-gray-100 flex gap-3 rounded-b-xl">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border rounded-xl focus:outline-none"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading}
              className="px-6 py-3 bg-Main text-white rounded-xl"
            >
              {isLoading ? "전송 중..." : "전송"}
            </button>
          </div>

          {/* 1380px 이하에서 닫기 버튼 */}
          <div className="max-[1380px]:block hidden absolute top-4 right-4">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== 챗봇 아이콘 ===================== */}
      <div
        className={`${
          isOpen ? "hidden max-[1380px]:hidden" : "hidden max-[1380px]:block"
        } min-[1380px]:hidden fixed right-6 bottom-6 z-50`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-Main text-white rounded-full shadow-lg flex items-center justify-center hover:bg-Main_hover transition-colors relative group"
        >
          {/* 챗봇 아이콘 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7"
          >
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
          </svg>

          {/* 툴팁 */}
          <div className="absolute bottom-16 right-0 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            챗봇 열기
          </div>
        </button>
      </div>
    </div>
  );
};
// ㅇㅇ
export default Chatbot;
