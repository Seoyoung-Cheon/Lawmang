import React, { useState } from "react";
import { PiBookOpenTextLight } from "react-icons/pi";

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
    {
      term: "소송",
      definition:
        "법적인 분쟁을 해결하기 위해 법원에 제소하여 진행하는 절차입니다. 민사소송, 형사소송 등 다양한 유형이 있습니다.",
    },
    {
      term: "피고",
      definition:
        "소송에서 주장에 대해 방어하는 측으로, 소송을 당한 사람을 의미합니다. 형사소송에서는 범죄를 저지른 혐의를 받는 사람을 피고라고 합니다.",
    },
    {
      term: "유언",
      definition:
        "사람이 사망한 후 자신의 재산을 어떻게 처리할지를 결정하는 문서로, 법적으로 효력을 갖습니다. 유언의 방식에 따라 공정증서유언, 자필유언 등이 있습니다.",
    },
    {
      term: "합의",
      definition:
        "법적 분쟁이나 갈등을 법원에 가지 않고 당사자 간의 상호 합의에 의해 해결하는 방법입니다. 소송을 통해 해결할 경우보다 빠르고 비용이 적게 듭니다.",
    },
    {
      term: "증거",
      definition:
        "법원에서 사건에 대한 사실을 입증하기 위해 제출되는 모든 자료를 의미합니다. 서류, 물증, 증인 진술 등이 포함됩니다.",
    },
    {
      term: "청구권",
      definition:
        "법적으로 요구할 수 있는 권리입니다. 예를 들어, 금전적 배상을 요구하는 권리나 특정 행동을 취하라는 요청을 할 수 있는 권리입니다.",
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
                    {searchResult.term}
                  </h2>
                  <p className="text-gray-800 leading-relaxed text-lg">
                    {searchResult.definition}
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
