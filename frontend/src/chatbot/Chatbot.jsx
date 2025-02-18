import React from "react";
import { useLocation } from "react-router-dom";

const Chatbot = () => {
  const location = useLocation();

  // 로그인과 회원가입 화면에서는 챗봇 숨기기
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  return (
    <div>
      <div className="fixed right-[50px] 2xl:right-[120px] top-[55%] -translate-y-1/2 z-50">
        <div className="w-[500px] h-[600px] xl:w-[600px] xl:h-[800px] bg-white rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.2)] flex flex-col">
          <div className="p-6 bg-Main text-white rounded-t-xl">
            <h3 className="font-medium text-2xl">Lawmang 챗봇</h3>
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
    </div>
  );
};

export default Chatbot;
