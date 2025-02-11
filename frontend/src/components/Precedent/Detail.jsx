import React from "react";

const Detail = () => {
  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-32 pb-10">
          {/* 판결문 카드 */}
          <div className="border border-gray-300 rounded-3xl p-8 w-[900px] h-[770px]">
            {/* 상단 제목과 버튼 */}
            <div className="relative flex justify-end mb-6">
              <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
                판결문
              </h2>
              <button className="px-4 py-2 bg-sage text-white rounded-lg hover:bg-opacity-90 transition-all">
                원문 보기
              </button>
            </div>

            {/* 판결문 내용 */}
            <div className="min-h-[500px] p-6 bg-gray-50 rounded-2xl">
              <p className="text-gray-700">내용</p>
            </div>
          </div>
        </div>
      </div>
      <div className="right-layout">
        {/* 오른쪽 영역의 컨텐츠가 추가될 예정 */}
      </div>
    </div>
  );
};

export default Detail;
