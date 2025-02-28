import React, { useState, useEffect } from "react";

const MemoPopup = ({
  isOpen,
  onClose,
  onSave,
  initialContent = "",
  initialTitle = "",
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  // 팝업이 열릴 때마다 초기값 설정
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, content });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="container mx-auto">
        <div className="left-layout bg-gray-50 rounded-3xl w-[900px] h-[820px] p-8 border border-gray-300 mt-[60px]">
          {/* 상단 제목과 버튼 */}
          <div className="relative flex justify-end mb-20 bg-white">
            <h2 className="absolute left-1/2 top-10 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold ">
              {initialContent ? "메모 수정" : "새 메모 작성"}
            </h2>
          </div>

          {/* 구분선 */}
          <div className="border-b border-gray-300 shadow-sm mb-6"></div>

          {/* 메모 입력 영역 */}
          <form onSubmit={handleSubmit} className="h-[600px]">
            {/* 제목 입력 영역 */}
            <div className="mb-4">
              <label className="block text-lg font-semibold mb-2">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  if (e.target.value.length <= 45) {
                    setTitle(e.target.value);
                  }
                }}
                maxLength={45}
                className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-Main text-lg"
                placeholder="제목을 입력해주세요. (45자 이내)"
                autoFocus
              />
            </div>

            {/* 내용 입력 영역 */}
            <div>
              <label className="block text-lg font-semibold mb-2">내용</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[450px] p-6 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-Main text-lg"
                placeholder="내용을 입력해주세요."
              />
            </div>

            <div className="flex justify-center gap-5 mt-[25px]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 bg-white hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-Main text-white rounded-lg hover:bg-Main_hover"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MemoPopup;
