import { useState, useEffect } from "react";
import documentStructure from '../../constants/document_structure.json';

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
  const [documents, setDocuments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    setIsLoading(true);
    setDocuments(documentStructure);
    setIsLoading(false);
  }, []);

  // 파일명에서 숫자 제거하는 함수
  const removeLeadingNumbers = (filename) => {
    return filename.replace(/^\d+[-\s]*/, '');
  };

  // 선택된 카테고리에 따라 문서 필터링
  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : { [selectedCategory]: documents[selectedCategory] };

  if (isLoading) return <div className="p-6 flex items-center justify-center text-gray-600">로딩 중...</div>;
  if (error) return <div className="p-6 flex items-center justify-center text-red-500 font-medium">{error}</div>;

  return <div>
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">문서 열람</h1>
      
      {/* 카테고리 버튼 그룹 */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(categoryMapping).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-full text-sm transition-colors duration-200
              ${selectedCategory === key 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            {value}
          </button>
        ))}
      </div>

      {/* 문서 리스트 */}
      <div className="h-[500px] border p-4 rounded-lg overflow-y-auto">
        {Object.entries(filteredDocuments).map(([category, files]) => (
          <div key={category} className="mb-6">
            <h2 className="text-lg font-semibold mb-2">
              {categoryMapping[category]}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {files.map((file, index) => (
                <div key={index} className="p-2 flex justify-between items-center border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">📄</span>
                    <span>{removeLeadingNumbers(file)}</span>
                  </div>
                  <button 
                    className="px-3 py-1 border rounded-md flex items-center gap-2 hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => window.open(`./template_extracted/${category}/${file}`, "_blank")}
                  > 
                    <span className="text-gray-600">⬇️</span> 다운로드
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
};

export default Template;
