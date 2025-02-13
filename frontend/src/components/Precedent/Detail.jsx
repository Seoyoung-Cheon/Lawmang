import React, { useState } from "react";
import Popup from "./Popup";

const Detail = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-32 pb-10">
          <div className="border border-gray-300 rounded-3xl p-8 w-[900px] h-[790px]">
            {/* 상단 제목과 버튼 */}
            <div className="relative flex justify-end mb-6">
              <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold">
                판례
              </h2>
              <button
                onClick={() => setIsPopupOpen(true)}
                className="px-4 py-2 bg-Main text-white rounded-lg hover:bg-Main_hover transition-all"
              >
                요약보기
              </button>
            </div>

            {/* 구분선과 그림자 */}
            <div className="border-b border-gray-200 shadow-sm mb-6"></div>

            {/* 판결문 내용 */}
            <div className="h-[600px] p-6 rounded-2xl overflow-y-auto">
              <div className="space-y-8">
                {/* 1. 법원명 */}
                <div className="text-center space-y-4 mb-8">
                  <h1 className="text-2xl tracking-widest">
                    부 산 고 등 법 원
                  </h1>
                  <h2 className="text-xl tracking-widest">제 1 형 사 부</h2>
                  <h2 className="text-xl tracking-widest">판 결</h2>
                </div>

                <div className="space-y-6">
                  {/* 2. 판결유형 */}
                  <div className="flex items-start">
                    <span className="w-24">판결유형 :</span>
                    <span>판결</span>
                  </div>

                  {/* 3. 사건종류명 */}
                  <div className="flex items-start">
                    <span className="w-24">사건종류 :</span>
                    <span>살인미수, 총일국관리법위반</span>
                  </div>

                  {/* 4. 사건명 */}
                  <div className="flex items-start">
                    <span className="w-24">사건번호 :</span>
                    <span>2019노183</span>
                  </div>

                  {/* 5. 판시사항 */}
                  <div className="flex items-start">
                    <span className="w-24">판시사항 :</span>
                    <span>피고인과 검사의 항소를 모두 기각한다.</span>
                  </div>

                  {/* 6. 참조조문 */}
                  <div className="flex items-start">
                    <span className="w-24">참조조문 :</span>
                    <span>형법 제123조...</span>
                  </div>

                  {/* 7. 판결요지 */}
                  <div className="flex items-start">
                    <span className="w-24">판결요지 :</span>
                    <span>...</span>
                  </div>

                  {/* 8. 판례내용 */}
                  <div className="flex items-start">
                    <span className="w-24">판례내용 :</span>
                    <div className="space-y-2">
                      <p>1. 항소이유의 요지</p>
                      <p className="ml-4">가. 피고인</p>
                      <p className="ml-8">1) 사실오인</p>
                    </div>
                  </div>

                  {/* 9. 선고일자 */}
                  <div className="flex items-start">
                    <span className="w-24">선고일자 :</span>
                    <span>2019. 7. 18.</span>
                  </div>

                  {/* 10. 참조판례 */}
                  <div className="flex items-start">
                    <span className="w-24">참조판례 :</span>
                    <span className="text-blue-600 underline">
                      부산지방법원 서부지원 2019. 3. 28. 선고 2018고합296 판결
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 팝업 컴포넌트 */}
      <Popup isOpen={isPopupOpen} onClose={handleClosePopup} />
    </div>
  );
};

export default Detail;
