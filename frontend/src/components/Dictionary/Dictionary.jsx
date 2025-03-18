import React, { useState } from "react";
import { PiBookOpenTextLight } from "react-icons/pi";
import HighlightText from "../HighlightText";

const Dictionary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearched, setIsSearched] = useState(false);

  // 임시 법률용어 데이터 (나중에 DB에서 가져올 예정)
  const legalTerms = [
    {
      term: "공소시효",
      definition:
        "범죄 후 일정 기간이 경과하면 검사가 더 이상 공소를 제기할 수 없게 되는 제도입니다. 이는 시간이 경과함에 따라 증거가 산일되고 공소의 가치가 감소하는 점을 고려한 것입니다.",
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const result = legalTerms.find((term) => term.term === searchQuery);
    setSearchResult(result);
    setIsSearched(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 헤더 섹션 */}
          <div className="flex items-center gap-4 mb-8">
            <PiBookOpenTextLight className="text-6xl text-Main" />
            <h1 className="text-2xl font-medium">법률 용어</h1>
          </div>

          {/* 검색바 */}
          <div className="relative mb-8">
            <div className="relative w-full max-w-[900px]">
              <input
                type="text"
                placeholder="법률용어를 입력해주세요..."
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-xl 
                          focus:outline-none focus:border-Main focus:ring-1 focus:ring-[#d7d5cc] 
                          transition-colors duration-200 bg-gray-50/50 hover:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
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

          {/* 검색 결과 */}
          {isSearched && (
            <div className="w-[900px]">
              {searchResult ? (
                <div
                  className="border border-gray-300 rounded-lg p-8 space-y-6 min-h-[580px] 
                               hover:border-gray-200 hover:shadow-md hover:bg-gray-50 
                               transition-all duration-200"
                >
                  <h2 className="text-2xl font-medium text-Main">
                    <HighlightText
                      text={searchResult.term}
                      highlight={searchQuery}
                    />
                  </h2>
                  <p className="text-gray-800 leading-relaxed text-lg">
                    <HighlightText
                      text={searchResult.definition}
                      highlight={searchQuery}
                    />
                  </p>
                </div>
              ) : (
                <div className="flex justify-center items-center h-[600px]">
                  <p className="text-lg text-gray-400">
                    검색하신 법률용어를 찾을 수 없습니다.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isSearched && (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-lg text-gray-400">
                찾고 싶은 법률용어를 검색해주세요.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="right-layout"></div>
    </div>
  );
};

export default Dictionary;
