import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { consultationData } from "./consultationData";

const Consultation = () => {
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); // 기본값은 '전체'

  // 임시 데이터를 consultationData의 값들로 변경
  const [consultations] = useState(Object.values(consultationData));

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

  const handleSearch = (e) => {
    e.preventDefault();
    // 검색 로직 구현
    console.log("Searching for:", searchTerm);
  };

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
  };

  // 선택된 카테고리에 따라 데이터 필터링
  const filteredConsultations =
    selectedCategory === "all"
      ? consultations
      : consultations.filter((item) => item.category === selectedCategory);

  const handleConsultationClick = (consultationId) => {
    navigate(`/consultation/detail/${consultationId}`);
  };

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 검색창 */}
          <div className="relative mb-8">
            <div className="relative w-full max-w-[900px]">
              <input
                type="text"
                placeholder="사례 검색..."
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
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 px-5 py-2 
                               text-sm text-white bg-Main hover:bg-Main_hover 
                               rounded-lg transition-colors duration-200"
              >
                검색
              </button>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="flex gap-2 mb-10 flex-wrap w-full max-w-[900px] justify-between">
            {Object.entries(categoryMapping).map(([id, name]) => (
              <button
                key={id}
                onClick={() => handleCategorySelect(id)}
                className={`px-3 py-1.5 border rounded-lg transition-colors duration-200
                  min-w-[100px] text-center
                  ${
                    selectedCategory === id
                      ? "bg-Main text-white border-Main"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* 카테고리 정보 */}
          <div className="flex items-center gap-2  mb-4">
            <span className="text-lg font-semibold text-black">
              {categoryMapping[selectedCategory]}
            </span>
            <span className="text-sm text-gray-500">
              (총 {filteredConsultations.length}개)
            </span>
          </div>

          {/* 상담사례 목록 */}
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <div
                key={consultation.id}
                onClick={() => handleConsultationClick(consultation.id)}
                className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-Main transition-colors cursor-pointer"
              >
                <h3 className="text-lg font-medium mb-2">
                  {consultation.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 truncate">
                  {consultation.question}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{categoryMapping[consultation.category]}</span>
                  <span>{consultation.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="right-layout">{/* 빈 공간으로 남겨둠 */}</div>
    </div>
  );
};

export default Consultation;
