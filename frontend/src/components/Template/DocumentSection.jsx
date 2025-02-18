const DocumentSection = ({ documents, categoryMapping, setSelectedFile, setPreviewUrl }) => {
  // 파일명에서 숫자 제거하는 함수
  const removeLeadingNumbers = (filename) => {
    return filename.replace(/^\d+[-\s]*/, '');
  };

  // 파일 다운로드 핸들러
  const handleDownload = async (category, file) => {
    try {
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

  return (
    <div className="w-[900px]">
      {Object.entries(documents).map(([category, files]) => (
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
  );
};

export default DocumentSection; 