import React from "react";

const Chatbot = () => {
  return (
    <div>
      <div className="fixed right-20 top-[53%] -translate-y-1/2 z-50">
        <div className="w-[600px] h-[800px] bg-white rounded-lg shadow-lg flex flex-col">
          <div className="p-6 bg-Main text-white rounded-t-lg">
            <h3 className="font-medium text-2xl">Lawmang 챗봇</h3>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {/* 메시지들이 표시될 영역 */}
          </div>
          <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-100">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 text-lg border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="px-6 py-3 bg-Main text-white text-lg rounded-md hover:bg-brown-600 transition-colors">
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
