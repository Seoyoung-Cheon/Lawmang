import React from "react";
import loadingGif from "../../assets/loading.gif";

const Popup = ({ isOpen, onClose, summary }) => {
  if (!isOpen) return null;

  // 요약 내용을 섹션별로 분리하는 함수
  const formatSummary = (text) => {
    if (!text) return [];

    // 섹션 제목 패턴 (예: "【사건개요】", "【판결요지】" 등)
    const sections = text.split(/【(.+?)】/).filter(Boolean);
    const formattedSections = [];

    for (let i = 0; i < sections.length; i += 2) {
      if (i + 1 < sections.length) {
        formattedSections.push({
          title: sections[i],
          content: sections[i + 1].trim(),
        });
      }
    }

    return formattedSections;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 팝업 컨텐츠 */}
      <div className="relative bg-white w-[900px] h-[80vh] rounded-2xl shadow-2xl transform transition-all">
        {/* 헤더 */}
        <div className="relative flex items-center justify-center p-6 border-b border-gray-100 shadow-md">
          <h3 className="text-2xl font-bold text-gray-800">판례 요약</h3>
          <button
            onClick={onClose}
            className="absolute right-6 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-gray-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-8 h-[calc(80vh-120px)] overflow-y-auto">
          {summary === null ? (
            <div className="flex flex-col items-center justify-center py-10">
              <img src={loadingGif} alt="loading" className="w-16 h-16" />
              <p className="text-gray-600 mt-4">요약을 생성하고 있습니다...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formatSummary(summary).map((section, index) => (
                <div
                  key={index}
                  className="bg-gray-50/50 p-6 rounded-xl border border-gray-200"
                >
                  <h4 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {section.title}
                  </h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line pl-2">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
      </div>
    </div>
  );
};

export default Popup;
