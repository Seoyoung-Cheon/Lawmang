import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { precedentData } from "./precedentData";

const Precedent = () => {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("전체"); // 카테고리 상태 추가

  // 상세 페이지로 이동하는 함수
  const handleDetailClick = (id) => {
    navigate(`/precedent/detail/${id}`);
  };

  // 카테고리 선택 핸들러
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // 선택된 카테고리에 따라 데이터 필터링
  const filteredPrecedents =
    selectedCategory === "전체"
      ? Object.values(precedentData) // 객체를 배열로 변환
      : Object.values(precedentData).filter(
          (item) => item.c_type === selectedCategory
        );

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
          <div className="flex gap-4 mb-10 w-[900px]">
            {["전체", "민사", "형사", "행정", "특허"].map((category) => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={`px-4 py-2 border rounded-lg transition-colors duration-200
                  ${
                    selectedCategory === category
                      ? "bg-Main text-white border-Main"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 카테고리 정보 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg font-semibold text-black">
              {selectedCategory}
            </span>
            <span className="text-sm text-gray-500">
              (총 {filteredPrecedents.length}개)
            </span>
          </div>

          {/* 판례 리스트 */}
          {filteredPrecedents.map((precedent) => (
            <div
              key={precedent.id}
              className="border border-gray-300 rounded-lg p-4 mb-6 w-[900px] hover:bg-gray-50 cursor-pointer"
              onClick={() => handleDetailClick(precedent.id)}
            >
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-medium overflow-hidden whitespace-nowrap text-ellipsis max-w-[700px]">
                  {precedent.c_name}
                </h3>
                <div className="px-3 py-1 text-sm border border-gray-300 rounded cursor-default">
                  {precedent.c_type}
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {precedent.c_number}
              </div>
              <div className="text-sm text-gray-600">
                {precedent.court} | {precedent.j_date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Precedent;
