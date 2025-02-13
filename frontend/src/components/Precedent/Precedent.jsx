import React from "react";
import { useNavigate } from "react-router-dom";

const Precedent = () => {
  const navigate = useNavigate();

  // 상세 페이지로 이동하는 함수
  const handleDetailClick = (id) => {
    navigate(`/precedent/detail/${id}`);
  };

  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 검색바 */}
          <div className="relative mb-8">
            <div className="relative w-[900px]">
              <input
                type="text"
                placeholder="검색어를 입력해주세요..."
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-xl shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-sage focus:border-sage
                         transition-all duration-200 bg-gray-50/50 hover:bg-white"
              />

              {/* 검색 아이콘 */}
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
                className="absolute right-4 top-1/2 transform -translate-y-1/2 px-5 py-2 
                               text-sm text-white bg-Main hover:bg-Main_hover 
                               rounded-lg transition-colors duration-200"
              >
                검색
              </button>
            </div>
          </div>
          {/* 필터 버튼들 */}
          <div className="flex gap-4 mb-10">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              전체
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              민사
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              형사
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              행정
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              특허
            </button>
          </div>
          {/* 판례 검색 결과 영역 */}
          <div
            className="border border-gray-300 rounded-lg p-4 mb-6 w-[900px] hover:bg-gray-50 cursor-pointer"
            onClick={() => handleDetailClick("1")}
          >
            <div className="flex justify-end mb-2">
              <div className="px-3 py-1 text-sm border border-gray-300 rounded cursor-default">
                민사
              </div>
            </div>
            <div className="h-32 bg-gray-50 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Precedent;
