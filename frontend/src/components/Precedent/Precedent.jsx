import React, { useState, useEffect } from "react";
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
import { ImHammer2 } from "react-icons/im";
import HighlightText from "../HighlightText";

const Precedent = () => {
  const [searchQuery, setSearchQuery] = useState(() => {
    const fromDetail = sessionStorage.getItem("fromDetail") === "true";
    return fromDetail
      ? sessionStorage.getItem("precedentSearchQuery") || ""
      : "";
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const fromDetail = sessionStorage.getItem("fromDetail") === "true";
    return fromDetail
      ? sessionStorage.getItem("precedentCategory") || null
      : null;
  });

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

  // ✅ 카테고리별 검색 API (selectedCategory가 `null`이 아니고 `"all"`이 아닐 때 실행)
  const {
    data: categoryResults = [],
    isLoading: isCategoryLoading,
    refetch: refetchCategory,
  } = useQuery({
    queryKey: ["precedentCategory", selectedCategory],
    queryFn: () =>
      selectedCategory ? fetchCasesByCategory(selectedCategory) : [],
    enabled: selectedCategory !== null && selectedCategory !== "all",
  });

  // 현재 표시할 결과 데이터 결정
  let currentResults = [];

  if (selectedCategory) {
    currentResults = categoryResults;
  } else if (searchQuery.trim()) {
    currentResults = searchResults;
  }

  // 배열이 아닐 경우 빈 배열로 초기화
  currentResults = Array.isArray(currentResults) ? currentResults : []; // 🛠 배열이 아닐 경우 빈 배열로 초기화

  // 컴포넌트 마운트 시 fromDetail 플래그 제거
  useEffect(() => {
    const fromDetail = sessionStorage.getItem("fromDetail") === "true";
    if (fromDetail) {
      sessionStorage.removeItem("fromDetail");
    } else {
      // Detail에서 오지 않은 경우 저장된 상태 모두 제거
      sessionStorage.removeItem("precedentSearchQuery");
      sessionStorage.removeItem("precedentCategory");
    }
  }, []);

  // 검색어나 카테고리 변경 시 저장
  useEffect(() => {
    sessionStorage.setItem("precedentSearchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("precedentCategory", selectedCategory);
  }, [selectedCategory]);

  const handleSearch = () => {
    setSelectedCategory(null); // 카테고리 선택 초기화
    setCurrentPage(1); // 페이지 1로 초기화
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
    setSearchQuery(""); // 검색어 초기화
    setSelectedCategory(category);
    setCurrentPage(1); // 페이지 1로 초기화

    if (category) {
      refetchCategory();
    }
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

  const renderTitle = (title) => (
    <HighlightText text={title} highlight={searchQuery} />
  );

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 헤더 섹션 추가 */}
          <div className="flex items-center gap-4 mb-8 ">
            <ImHammer2 className="text-6xl text-Main mr-2" />
            <h1 className="text-2xl font-medium cursor-default">판례</h1>
          </div>

          {/* 검색바 */}
          <div className="relative mb-8">
            <div className="relative w-full max-w-[900px]">
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
              <ul className="space-y-4 w-full max-w-[900px]">
                {currentItems.map((item) => (
                  <li
                    key={item.pre_number}
                    className="border border-gray-300 rounded-lg p-4 transition-all duration-200 
                               hover:border-gray-200 hover:shadow-md hover:bg-gray-50 
                               hover:translate-x-1 group cursor-pointer"
                  >
                    <Link
                      to={`/precedent/detail/${item.pre_number}`}
                      className="flex flex-col sm:flex-row sm:justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium mb-2 sm:mb-4 line-clamp-2">
                          {renderTitle(item.c_name)}
                        </h3>
                        <div className="text-sm text-gray-600 mb-2">
                          <HighlightText
                            text={item.c_number}
                            highlight={searchQuery}
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          <HighlightText
                            text={`${item.court} | ${item.j_date}`}
                            highlight={searchQuery}
                          />
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 text-sm rounded-lg h-fit sm:ml-4 border w-[80px] text-center
                                   ${getCategoryColor(item.c_type)} 
                                   group-hover:scale-105 transition-transform`}
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
