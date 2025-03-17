import React from "react";

const Popup = ({ isOpen, onClose, summary }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 w-[800px] h-[700px]">
        <div className="relative flex justify-between items-center mb-6 pb-4 border-b border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-center w-full">판례 요약</h2>
          <button onClick={onClose} className="absolute right-0 text-2xl text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 h-[570px] overflow-y-auto">
          <p className="text-gray-700">{summary || "요약을 불러오는 중입니다..."}</p>
        </div>
      </div>
    </div>
  );
};

export default Popup;
