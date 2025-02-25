import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCases } from "./precedentApi";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
} from "react-icons/md";

const Precedent = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8; // 페이지당 8개 항목
  const pageNumbersToShow = 5;

  const categories = ["형사", "민사", "세무", "일반행정", "특허", "가사"];

  const {
    data: searchResults = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cases", searchQuery],
    queryFn: () => {
      if (searchQuery.trim()) {
        return fetchCases(searchQuery);
      }
      return [];
    },
    enabled: false,
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      refetch();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 페이지네이션 관련 함수들
  const getTotalPages = () => {
    return Math.ceil((searchResults?.length || 0) / itemsPerPage);
  };

  const getPageRange = (totalPages) => {
    let start = Math.max(1, currentPage - Math.floor(pageNumbersToShow / 2));
    let end = start + pageNumbersToShow - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - pageNumbersToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return searchResults.slice(startIndex, endIndex);
  };

  const totalPages = getTotalPages();
  const pageNumbers = getPageRange(totalPages);
  const currentItems = getCurrentItems();

  // c_type별 배경색 매핑
  const typeColors = {
    형사: "bg-red-50 text-red-600 border-red-200",
    민사: "bg-blue-50 text-blue-600 border-blue-200",
    세무: "bg-green-50 text-green-600 border-green-200",
    일반행정: "bg-yellow-50 text-yellow-600 border-yellow-200",
    특허: "bg-purple-50 text-purple-600 border-purple-200",
    가사: "bg-pink-50 text-pink-600 border-pink-200",
  };

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 검색바 */}
          <div className="relative mb-8">
            <div className="relative w-[900px]">
              <input
                type="text"
                placeholder="판례 및 키워드를 입력해주세요..."
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-xl"
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
                className="absolute right-4 top-1/2 transform -translate-y-1/2 px-5 py-2 
                          text-sm text-white bg-Main hover:bg-Main_hover rounded-lg"
                onClick={handleSearch}
              >
                검색
              </button>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 mb-10 flex-wrap w-full max-w-[900px]">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 border rounded-lg transition-colors duration-200
                  min-w-[100px] text-center
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

          {/* 로딩 및 초기 메시지 중앙 정렬 */}
          {isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-lg text-gray-600">검색 중...</p>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <>
              <ul className="space-y-4 w-[900px]">
                {currentItems.map((item) => (
                  <li
                    key={item.c_number}
                    className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <Link
                      to={`/precedent/detail/${item.id}`}
                      className="flex justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium truncate mb-4">
                          {item.c_name}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {item.c_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.court} | {item.j_date}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 text-sm rounded-lg h-fit ml-4 
                        ${
                          typeColors[item.c_type] ||
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {item.c_type}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* 페이지네이션 UI */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded-lg ${
                      currentPage === 1
                        ? "text-gray-300"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <MdKeyboardDoubleArrowLeft size={20} />
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded-lg ${
                      currentPage === 1
                        ? "text-gray-300"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <MdKeyboardArrowLeft size={20} />
                  </button>

                  <div className="flex gap-1">
                    {pageNumbers.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg ${
                          currentPage === pageNum
                            ? "bg-Main text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 rounded-lg ${
                      currentPage === totalPages
                        ? "text-gray-300"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <MdKeyboardArrowRight size={20} />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 rounded-lg ${
                      currentPage === totalPages
                        ? "text-gray-300"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <MdKeyboardDoubleArrowRight size={20} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-lg text-gray-400">
                검색어를 입력하거나 카테고리를 선택해주세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Precedent;
