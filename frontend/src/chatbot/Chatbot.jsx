import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const Chatbot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // 로그인과 회원가입 화면에서는 챗봇 숨기기
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  return (
    <div>
      {/* 큰 화면에서의 챗봇 */}
      <div className="hidden lg:block fixed right-[50px] 2xl:right-[120px] top-[55%] -translate-y-1/2 z-50">
        <div className="w-[500px] h-[600px] 2xl:w-[600px] 2xl:h-[800px] bg-white rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.2)] flex flex-col">
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

      {/* 작은 화면에서의 챗봇 */}
      <div className="lg:hidden fixed right-6 bottom-6 z-50">
        {isOpen ? (
          <div className="fixed right-4 bottom-20 w-[90vw] h-[80vh] max-w-[400px] bg-white rounded-xl shadow-[0_0_20px_5px_rgba(0,0,0,0.2)] flex flex-col">
            <div className="p-4 bg-Main text-white rounded-t-xl flex justify-between items-center">
              <h3 className="font-medium text-xl">Lawmang 챗봇</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {/* 메시지들이 표시될 영역 */}
            </div>
            <div className="p-4 border-t border-gray-200 rounded-b-xl flex gap-2 bg-gray-100">
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-Main text-white text-base rounded-xl hover:bg-Main_hover transition-colors">
                전송
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-Main hover:bg-Main_hover text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
