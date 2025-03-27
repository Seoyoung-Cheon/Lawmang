import React, { useEffect } from "react";

const PreviewModal = ({ file, previewUrl, onClose }) => {
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // 파일명에서 숫자 제거하는 함수
  const removeLeadingNumbers = (filename) => {
    return filename.replace(/^\d+[-\s]*/, "");
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white backdrop-blur-sm rounded-lg w-[80%] h-[80%] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-transform duration-300 hover:rotate-180"
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
        <h3 className="text-xl font-semibold mb-4">
          {removeLeadingNumbers(file)}
        </h3>
        <iframe
          src={previewUrl}
          className="w-full h-[calc(100%-3rem)]"
          title="문서 미리보기"
        />
      </div>
    </div>
  );
};

export default PreviewModal;
