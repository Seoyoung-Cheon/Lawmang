import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import documentStructure from '../../constants/document_structure.json';
import PreviewModal from './PreviewModal';

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

  // 카테고리 선택 핸들러 수정
  const handleCategorySelect = (key) => {
    setSelectedCategory(key);
    navigate(`/template/${key}`);
  };

  // 파일명에서 숫자 제거하는 함수
  const removeLeadingNumbers = (filename) => {
    return filename.replace(/^\d+[-\s]*/, '');
  };

  // 선택된 카테고리에 따라 문서 필터링
  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : { [selectedCategory]: documents[selectedCategory] };

  // 파일 다운로드 핸들러
  const handleDownload = async (category, file) => {
    try {
      // src/assets/template 경로의 파일을 import
      const fileModule = await import(`../../assets/template/${category}/${file}`);
      const fileUrl = fileModule.default;

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('파일을 찾을 수 없습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('파일 다운로드 중 오류가 발생했습니다:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  // 미리보기 핸들러
  const handlePreview = async (category, file) => {
    try {
      const response = await fetch(`./template_extracted/${category}/${file}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setSelectedFile(file);
      setPreviewUrl(url);
    } catch (error) {
      console.error('파일 미리보기 중 오류가 발생했습니다:', error);
    }
  };

  const handleClosePreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

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
          <div className="flex gap-4 mb-10 flex-wrap w-[900px]">
            {Object.entries(categoryMapping).map(([key, value]) => (
              <button
                key={key}
                onClick={() => handleCategorySelect(key)}
                className={`px-4 py-2 border rounded-lg transition-colors duration-200
                  ${selectedCategory === key 
                    ? 'bg-Main text-white border-Main' 
                    : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {value}
              </button>
            ))}
          </div>

          {/* 문서 리스트 */}
          <div className="w-[900px]">
            {Object.entries(filteredDocuments).map(([category, files]) => (
              <div key={category} className="mb-6">
                <h2 className="text-lg font-semibold mb-4">
                  {categoryMapping[category]}
                </h2>
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <div key={index} 
                         className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600">📄</span>
                          <span className="text-lg">{removeLeadingNumbers(file)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handlePreview(category, file)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition-colors duration-200"
                          >
                            미리보기
                          </button>
                          <button 
                            onClick={() => handleDownload(category, file)}
                            className="px-4 py-2 text-sm text-white bg-Main hover:bg-Main_hover rounded-lg transition-colors duration-200"
                          >
                            다운로드
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
