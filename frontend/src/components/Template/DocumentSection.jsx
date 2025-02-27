import { useState } from "react";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
} from "react-icons/md";
import PreviewModal from './PreviewModal';

const DocumentSection = ({ documents, categoryMapping, selectedCategory }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [previewData, setPreviewData] = useState(null); // 미리보기 데이터 상태 추가
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // 모달 상태 추가
  const itemsPerPage = 10;
  const pageNumbersToShow = 5;

  // 파일명에서 숫자 제거하는 함수
  const removeLeadingNumbers = (filename) => {
    return filename.replace(/^\d+[-\s]*/, "");
  };

  // 파일 다운로드 핸들러
  const handleDownload = async (category, file) => {
    try {
      const fileModule = await import(
        `../../assets/template/${category}/${file}`
      );
      const fileUrl = fileModule.default;

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("파일을 찾을 수 없습니다.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("파일 다운로드 중 오류가 발생했습니다:", error);
      alert("파일 다운로드에 실패했습니다.");
    }
  };

  // 미리보기 핸들러 수정
  const handlePreview = async (category, file) => {
    try {
      let formattedFile = file.endsWith(".hwp")
        ? file.replace(".hwp", ".pdf")
        : file;
  
      const encodedCategory = encodeURIComponent(category);
      const encodedFile = encodeURIComponent(formattedFile);
      const pdfUrl = `/template_pdfs/${encodedCategory}/${encodedFile}`;
  
      console.log('미리보기 URL:', pdfUrl);
  
      // 바로 미리보기 데이터 설정 및 모달 열기
      setPreviewData({
        url: pdfUrl,
        fileName: formattedFile,
        category: category
      });
      setIsPreviewOpen(true);
  
    } catch (error) {
      console.error("미리보기 오류:", error);
      alert("미리보기 처리 중 오류가 발생했습니다.");
    }
  };

  // 모든 파일을 하나의 배열로 합치는 함수
  const getAllFiles = () => {
    return Object.entries(documents).reduce((acc, [category, files]) => {
      return acc.concat(files.map((file) => ({ category, file })));
    }, []);
  };

  // 현재 표시할 파일 목록 가져오기
  const getCurrentFiles = () => {
    if (selectedCategory === "all") {
      const allFiles = getAllFiles();
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return allFiles.slice(startIndex, endIndex);
    }

    const files = documents[selectedCategory] || [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return files.slice(startIndex, endIndex).map((file) => ({
      category: selectedCategory,
      file,
    }));
  };

  // 총 페이지 수 계산
  const getTotalPages = () => {
    const totalFiles =
      selectedCategory === "all"
        ? getAllFiles().length
        : (documents[selectedCategory] || []).length;
    return Math.ceil(totalFiles / itemsPerPage);
  };

  // 페이지 범위 계산
  const getPageRange = (totalPages) => {
    let start = Math.max(1, currentPage - Math.floor(pageNumbersToShow / 2));
    let end = start + pageNumbersToShow - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - pageNumbersToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const totalPages = getTotalPages();
  const currentFiles = getCurrentFiles();
  const pageNumbers = getPageRange(totalPages);
  const totalFiles =
    selectedCategory === "all"
      ? getAllFiles().length
      : (documents[selectedCategory] || []).length;

  return (
    <div className="w-full max-w-[900px]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {selectedCategory === "all"
            ? "전체"
            : categoryMapping[selectedCategory]}
          <span className="text-sm text-gray-500 ml-2">
            (총 {totalFiles}개)
          </span>
        </h2>
        <div className="space-y-4">
          {currentFiles.map((fileInfo, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600">📄</span>
                  <span className="text-lg">
                    {removeLeadingNumbers(fileInfo.file)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handlePreview(fileInfo.category, fileInfo.file)
                    }
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition-colors duration-200"
                  >
                    미리보기
                  </button>
                  <button
                    onClick={() =>
                      handleDownload(fileInfo.category, fileInfo.file)
                    }
                    className="px-4 py-2 text-sm text-white bg-Main hover:bg-Main_hover rounded-lg transition-colors duration-200"
                  >
                    다운로드
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PreviewModal 컴포넌트 추가 */}
        {isPreviewOpen && (
          <PreviewModal
            file={previewData.fileName}  // 파일명
            previewUrl={previewData.url} // PDF 미리보기 URL
            onClose={() => {
            setIsPreviewOpen(false);
            setPreviewData(null);
            }}
          />
        )}  
              
        {/* 페이지네이션 UI */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded-lg ${
                currentPage === 1
                  ? "text-gray-300"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MdKeyboardDoubleArrowLeft size={20} />
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded-lg ${
                currentPage === 1
                  ? "text-gray-300"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MdKeyboardArrowLeft size={20} />
            </button>

            <div className="flex gap-1">
              {pageNumbers.map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg ${
                    currentPage === pageNum
                      ? "bg-Main text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded-lg ${
                currentPage === totalPages
                  ? "text-gray-300"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MdKeyboardArrowRight size={20} />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded-lg ${
                currentPage === totalPages
                  ? "text-gray-300"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MdKeyboardDoubleArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSection;
