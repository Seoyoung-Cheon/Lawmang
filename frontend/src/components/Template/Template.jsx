import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import documentStructure from "../../constants/document_structure.json";
import PreviewModal from "./PreviewModal";
import DocumentSection from "./DocumentSection";

const categoryMapping = {
  all: "전체",
  administration: "행정",
  bankruptcy: "개인회생, 파산 및 면책",
  "civil execution": "민사집행",
  "civil general": "민사일반",
  "civil suit": "민사소송",
  commercial: "상사",
  "commercial building lease": "상가임대차",
  constitution: "헌법",
  contract: "계약",
  "criminal law": "형법",
  "criminal suit": "형사소송",
  damage: "손해배상",
  "domestic relation": "친족",
  etc: "기타",
  family_lawsuit: "가사소송",
  "family relation registration": "가족관계등록",
  "housing lease": "주택임대차",
  labor: "노동",
  obligation: "채권",
  "preservative measure": "보전처분",
  "real right": "물권",
  succession: "상속",
};

const Template = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(false);

  // 선택된 카테고리 설정
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);

  // 검색어 입력 핸들러
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchTrigger(true); // ✅ 검색 실행
      setSelectedCategory("all"); // ✅ 검색 시 전체에서 검색
    }
  };

  // Enter 키 입력 핸들러
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 카테고리 선택 핸들러 수정
  const handleCategorySelect = (key) => {
    setSelectedCategory(key);
    setSearchQuery(""); // 검색어도 초기화
    setSearchTrigger(false);
    navigate(`/template/${key}`);
  };

  // ✅ `handleCategoryClick`을 `handleCategorySelect` 아래에 배치
  const handleCategoryClick = (category) => {
    handleCategorySelect(category);
  };

  // 미리보기 모달 닫기
  const handleClosePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // 선택된 카테고리에 따라 문서 필터링
  const getDisplayDocuments = () => {
    if (selectedCategory === "all") {
      return documentStructure;
    }
    return { [selectedCategory]: documentStructure[selectedCategory] };
  };

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-4 sm:px-6 lg:px-8 xl:px-0 pt-[135px] pb-10">
          {/* 검색바 수정 */}
          <div className="relative mb-8">
            <div className="relative w-full max-w-[900px]">
              <input
                type="text"
                placeholder="문서 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-xl shadow-sm 
                         focus:outline-none focus:border-Main focus:ring-1 focus:ring-[#d7d5cc] 
                          transition-colors duration-200
                          bg-gray-50/50 hover:bg-white"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <button
                onClick={handleSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 px-5 py-2 
                               text-sm text-white bg-Main hover:bg-Main_hover 
                               rounded-lg transition-colors duration-200"
              >
                검색
              </button>
            </div>
          </div>

          {/* 카테고리 버튼 그룹 */}
          <div className="flex gap-2 mb-10 flex-wrap w-full max-w-[900px] justify-between">
            {Object.entries(categoryMapping).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleCategoryClick(key)}
                className={`px-3 py-1.5 border rounded-lg transition-colors duration-200
                  min-w-[100px] text-center
                  ${
                    selectedCategory === key
                      ? "bg-Main text-white border-Main"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {value}
              </button>
            ))}
          </div>

          {/* DocumentSection에 searchQuery 전달 */}
          <DocumentSection
            documents={getDisplayDocuments()}
            categoryMapping={categoryMapping}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            setSelectedFile={setSelectedFile}
            setPreviewUrl={setPreviewUrl}
            searchTrigger={searchTrigger}
            setSearchTrigger={setSearchTrigger}
            setSearchQuery={setSearchQuery}            
          />
        </div>
      </div>

      {/* 미리보기 모달 */}
      {selectedFile && (
        <PreviewModal
          file={selectedFile}
          previewUrl={previewUrl}
          onClose={handleClosePreview}
        />
      )}
      <div className="right-layout">{/* 빈 공간으로 남겨둠 */}</div>
    </div>
  );
};

export default Template;
