import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthContext";

const Chatbot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general"); // 'general' or 'legal'
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // 로그인과 회원가입 화면에서는 챗봇 숨기기
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  const handleCategoryClick = (category) => {
    if (category === "legal" && !isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    setSelectedCategory(category);
  };

  // 로그인 페이지로 이동하는 함수
  const handleLoginClick = () => {
    setShowLoginPopup(false); // 팝업 닫기
    navigate("/login"); // 로그인 페이지로 이동
  };

  return (
    <div>
      {/* ===================== 데스크톱 버전 시작 ===================== */}
      <div
        className={`${
          isOpen ? "" : "hidden lg:block"
        } fixed right-[50px] 2xl:right-[120px] top-[55%] -translate-y-1/2 z-50`}
      >
        <div className="w-[500px] h-[600px] 2xl:w-[600px] 2xl:h-[800px] bg-white rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.2)] flex flex-col relative">
          {/* 로그인 필요 팝업  */}
          {showLoginPopup && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl overflow-hidden">
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setShowLoginPopup(false)}
              />
              <div className="relative bg-white rounded-lg p-6 mb-10 shadow-xl max-w-sm w-full mx-4">
                <p className="text-center text-lg mb-6 font-light">
                  법률상담은 로그인이 필요한 서비스입니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLoginPopup(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleLoginClick}
                    className="flex-1 bg-Main text-white py-2 rounded-lg hover:bg-Main_hover transition-colors"
                  >
                    로그인 하기
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 bg-Main text-white rounded-t-xl">
            <h3 className="font-medium text-2xl">Lawmang 챗봇</h3>
          </div>

          {/* 카테고리 선택 버튼 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => handleCategoryClick("general")}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === "general"
                    ? "bg-Main text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                일반상담
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => handleCategoryClick("legal")}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === "legal"
                      ? "bg-Main text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  법률상담
                </button>
                {selectedCategory === "general" && (
                  <p className="text-xs text-gray-500 ml-4 max-w-[200px] leading-4 whitespace-nowrap">
                    ※ 구체적이고 전문적인 '법률 상담'이 필요하신 경우
                    <br />
                    로그인 후 이용 가능합니다.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {/* 메시지들이 표시될 영역 */}
          </div>
          <div className="p-6 border-t border-gray-200 rounded-b-xl flex gap-3 bg-gray-100">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="px-6 py-3 bg-Main text-white text-lg rounded-xl hover:bg-Main_hover transition-colors">
              전송
            </button>
          </div>
        </div>
      </div>
      {/* ===================== 데스크톱 버전 끝 ===================== */}

      {/* ===================== 챗봇 아이콘 ===================== */}
      <div
        className={`${
          isOpen ? "hidden" : "lg:hidden"
        } fixed right-6 bottom-6 z-50`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-Main hover:bg-Main_hover text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
