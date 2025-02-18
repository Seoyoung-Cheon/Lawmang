import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import documentStructure from '../../constants/document_structure.json';
import PreviewModal from './PreviewModal';
import DocumentSection from './DocumentSection';

const categoryMapping = {
  'all': '전체',
  'administration': '행정',
  'bankruptcy': '개인회생, 파산 및 면책',
  'civil execution': '민사집행',
  'civil general': '민사일반',
  'civil suit': '민사소송',
  'commercial': '상사',
  'commercial building lease': '상가임대차',
  'constitution': '헌법',
  'contract': '계약',
  'criminal law': '형법',
  'criminal suit': '형사소송',
  'damage': '손해배상',
  'domestic relation': '친족',
  'etc': '기타',
  'family lawsuit': '가사소송',
  'family relation registration': '가족관계등록',
  'housing lease': '주택임대차',
  'labor': '노동',
  'obligation': '채권',
  'preservative measure': '보전처분',
  'real right': '물권',
  'succession': '상속'
};

const Template = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setDocuments(documentStructure);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (category && categoryMapping[category]) {
      setSelectedCategory(category);
    }
  }, [category]);

  const handleCategorySelect = (key) => {
    setSelectedCategory(key);
    navigate(`/template/${key}`);
  };

  const handleClosePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // 선택된 카테고리에 따라 문서 필터링
  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : { [selectedCategory]: documents[selectedCategory] };

  if (isLoading) return <div className="p-6 flex items-center justify-center text-gray-600">로딩 중...</div>;
  if (error) return <div className="p-6 flex items-center justify-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 검색바 */}
          <div className="relative mb-8">
            <div className="relative w-[900px]">
              <input
                type="text"
                placeholder="문서 검색..."
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-xl shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage
                         transition-all duration-200 bg-gray-50/50 hover:bg-white"
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
              <button className="absolute right-4 top-1/2 transform -translate-y-1/2 px-5 py-2 
                               text-sm text-white bg-Main hover:bg-Main_hover 
                               rounded-lg transition-colors duration-200">
                검색
              </button>
            </div>
          </div>

          {/* 카테고리 버튼 그룹 */}
          <div className="flex gap-2 mb-10 flex-wrap w-[900px] justify-between">
            {Object.entries(categoryMapping).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleCategorySelect(key)}
                className={`px-3 py-1.5 border rounded-lg transition-colors duration-200
                  min-w-[100px] text-center
                  ${selectedCategory === key 
                    ? 'bg-Main text-white border-Main' 
                    : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {value}
              </button>
            ))}
          </div>

          {/* 문서 섹션 */}
          <DocumentSection 
            documents={filteredDocuments}
            categoryMapping={categoryMapping}
            setSelectedFile={setSelectedFile}
            setPreviewUrl={setPreviewUrl}
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
    </div>
  );
};

export default Template;
