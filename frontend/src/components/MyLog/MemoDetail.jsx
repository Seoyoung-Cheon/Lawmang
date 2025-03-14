import React from "react";

const MemoDetail = ({ isOpen, memo, onClose }) => {
  if (!isOpen || !memo) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="container mx-auto">
        <div className="left-layout bg-gray-50 rounded-3xl w-[900px] h-[820px] p-8 border border-gray-300 mt-[65px]">
          {/* 상단 제목과 버튼 */}
          <div className="relative flex justify-end mb-20">
            <h2 className="absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
              메모 상세보기
            </h2>
          </div>

          {/* 구분선 */}
          <div className="border-b border-gray-300 shadow-sm mb-6"></div>

          {/* 알림 설정 표시 영역 */}
          <div className="flex justify-end mb-2">
            {memo.notification && memo.event_date && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 cursor-default">
                    알림 설정일:
                  </span>
                  <span className="ml-2 text-sm text-gray-700 cursor-default">
                    {new Date(memo.event_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 메모 내용 영역 */}
          <div className="h-[600px]">
            {/* 제목 영역 */}
            <div className="mb-4">
              <label className="block text-lg font-semibold mb-2">제목</label>
              <div className="w-full p-3 border border-gray-300 rounded-md text-lg bg-white">
                {memo.title}
              </div>
            </div>

            {/* 내용 영역 */}
            <div>
              <label className="block text-lg font-semibold mb-2">내용</label>
              <div className="w-full h-[450px] p-6 border border-gray-300 rounded-md text-lg bg-white whitespace-pre-wrap overflow-y-auto">
                {memo.content}
              </div>
            </div>

            <div className="flex justify-center gap-5 mt-[25px]">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-Main text-white rounded-lg border border-gray-300 hover:bg-Main_hover"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoDetail;
