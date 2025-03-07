import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCases, fetchCasesByCategory } from "./precedentApi";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
} from "react-icons/md";
import loadingGif from "../../assets/loading.gif";

const Precedent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8; // 페이지당 8개 항목
  const pageNumbersToShow = 5;

  const categories = ["형사", "민사", "세무", "일반행정", "특허", "가사"];

  const {
    data: searchResults = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["cases", searchQuery],
    queryFn: () => (searchQuery.trim() ? fetchCases(searchQuery) : []),
    enabled: false,
  });

  const {
    data: categoryResults = [],
    isLoading: isCategoryLoading,
    refetch: refetchCategory,
  } = useQuery({
    queryKey: ["precedentCategory", selectedCategory],
    queryFn: () => fetchCasesByCategory(selectedCategory),
    enabled: selectedCategory !== "all",
  });

  // 현재 표시할 결과 데이터 결정
  let currentResults =
    selectedCategory === "all" ? searchResults : categoryResults;
  currentResults = Array.isArray(currentResults) ? currentResults : []; // 🛠 배열이 아닐 경우 빈 배열로 초기화

  const handleSearch = () => {
    setSelectedCategory("all");
    if (searchQuery.trim()) {
      refetch();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategorySelect = (category) => {
    setSearchQuery("");
    setSelectedCategory(category);
    refetchCategory();
  };

  // 현재 페이지의 아이템들 계산
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return currentResults.slice(startIndex, endIndex);
  };

  // 총 페이지 수 계산
  const getTotalPages = () => {
    return Math.ceil(currentResults.length / itemsPerPage);
  };

  // 페이지 범위 계산
  const getPageRange = (totalPages) => {
    let start = Math.max(1, currentPage - Math.floor(pageNumbersToShow / 2));
    let end = start + pageNumbersToShow - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - pageNumbersToShow + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const totalPages = getTotalPages();
  const currentItems = getCurrentItems();
  const pageNumbers = getPageRange(totalPages);

  const getCategoryColor = (type) => {
    switch (type) {
      case "형사":
        return "bg-red-100 text-red-700 border-red-200";
      case "민사":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "세무":
        return "bg-green-100 text-green-700 border-green-200";
      case "일반행정":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "특허":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "가사":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 검색바 */}
          <div className="relative mb-8">
            <div className="relative w-[900px]">
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
              <input
                type="text"
                placeholder="판례 및 키워드를 입력해주세요..."
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-xl 
                          focus:outline-none focus:border-Main focus:ring-1 focus:ring-[#d7d5cc] 
                          transition-colors duration-200 bg-gray-50/50 hover:bg-white"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={handleKeyPress}
              />
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
                onClick={() => handleCategorySelect(category)}
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

          {/* 로딩 및 결과 표시 */}
          {isLoading || isCategoryLoading ? (
            <div className="flex flex-col justify-center items-center h-[400px] gap-4">
              <img
                src={loadingGif}
                alt="loading"
                className="w-16 h-16 text-gray-600"
              />
              <p className="text-lg text-gray-600">로딩 중...</p>
            </div>
          ) : currentResults.length > 0 ? (
            <>
              <ul className="space-y-4 w-[900px]">
                {currentItems.map((item) => (
                  <li
                    key={item.pre_number}
                    className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <Link
                      to={`/precedent/detail/${item.pre_number}`}
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
                        className={`px-3 py-1 text-sm rounded-lg h-fit ml-4 border ${getCategoryColor(
                          item.c_type
                        )}`}
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
                {searchQuery.trim()
                  ? "해당하는 판례가 없습니다."
                  : "검색어를 입력하거나 카테고리를 선택해주세요."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Precedent;
