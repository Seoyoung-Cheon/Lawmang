import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  fetchConsultations,
  fetchConsultationsByCategory,
} from "./consultaionApi";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
} from "react-icons/md";
import loadingGif from "../../assets/loading.gif";
import { SlSpeech } from "react-icons/sl";

const Consultation = () => {
  const [searchQuery, setSearchQuery] = useState(() => {
    const fromDetail = sessionStorage.getItem("fromDetail") === "true";
    return fromDetail
      ? sessionStorage.getItem("consultationSearchQuery") || ""
      : "";
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const fromDetail = sessionStorage.getItem("fromDetail") === "true";
    return fromDetail
      ? sessionStorage.getItem("consultationCategory") || "all"
      : "all";
  });

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8; // 페이지당 8개 항목
  const pageNumbersToShow = 5;

  // 카테고리 배열만 유지
  const categories = [
    "행정",
    "개인회생, 파산 및 면책",
    "민사집행",
    "민사일반",
    "민사소송",
    "상사",
    "상가임대차",
    "헌법",
    "계약",
    "형법",
    "형사소송",
    "손해배상",
    "친족",
    "기타",
    "가사소송",
    "가족관계등록",
    "주택임대차",
    "노동",
    "채권",
    "보전처분",
    "물권",
    "상속",
  ];

  useEffect(() => {
    const fromDetail = sessionStorage.getItem("fromDetail") === "true";
    if (fromDetail) {
      sessionStorage.removeItem("fromDetail");
    } else {
      sessionStorage.removeItem("consultationSearchQuery");
      sessionStorage.removeItem("consultationCategory");
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("consultationSearchQuery", searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem("consultationCategory", selectedCategory);
  }, [selectedCategory]);

  const {
    data: searchResults = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["consultations", searchQuery],
    queryFn: () => {
      if (searchQuery.trim()) {
        return fetchConsultations(searchQuery);
      }
      return [];
    },
    enabled: false,
  });

  const {
    data: categoryResults = [],
    isLoading: isCategoryLoading,
    refetch: refetchCategory, // refetchCategory 추가
  } = useQuery({
    queryKey: ["consultationCategory", selectedCategory],
    queryFn: () => fetchConsultationsByCategory(selectedCategory),
    enabled: selectedCategory !== "all",
    onSuccess: (data) => {
      console.log("Query success, data:", data); // 쿼리 성공시 데이터 확인
    },
    onError: (error) => {
      console.error("Query error:", error); // 쿼리 에러 확인
    },
  });

  // 현재 표시할 결과 데이터 결정
  const currentResults = useMemo(() => {
    console.log("selectedCategory:", selectedCategory); // 선택된 카테고리 확인
    console.log("categoryResults:", categoryResults); // 카테고리 결과 확인
    if (selectedCategory === "all") {
      return searchQuery.trim() ? searchResults : categoryResults;
    }
    return categoryResults;
  }, [selectedCategory, searchQuery, searchResults, categoryResults]);

  // 총 개수 계산
  const totalCount = currentResults?.length || 0;

  const handleSearch = () => {
    setSelectedCategory("all");
    localStorage.setItem("consultationCategory", "all");
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
    localStorage.setItem("consultationSearchQuery", "");
    setSelectedCategory(category);
    localStorage.setItem("consultationCategory", category);
    refetchCategory(); // 이제 정의된 refetchCategory 사용
  };

  // 페이지네이션 관련 함수들
  const getTotalPages = () => {
    return Math.ceil((currentResults?.length || 0) / itemsPerPage);
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
    return currentResults.slice(startIndex, endIndex);
  };

  const totalPages = getTotalPages();
  const pageNumbers = getPageRange(totalPages);
  const currentItems = getCurrentItems();

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 헤더 섹션*/}
          <div className="flex items-center gap-4 mb-8">
            <SlSpeech className="text-6xl text-Main" />
            <h1 className="text-2xl font-medium">상담 사례</h1>
          </div>

          {/* 검색창 */}
          <div className="relative mb-8">
            <div className="relative w-full max-w-[900px]">
              <input
                type="text"
                placeholder="궁금한 법률 상담 사례를 검색하세요..."
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-xl shadow-sm 
                         focus:outline-none focus:border-Main focus:ring-1 focus:ring-[#d7d5cc] 
                          transition-colors duration-200 bg-gray-50/50 hover:bg-white"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyDown={handleKeyPress}
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

          {/* 카테고리 정보 */}
          {selectedCategory !== "all" && ( // todo: 첫 로딩 시 GET http://localhost:3000/api/search/precedents/category/all 404 (Not Found) 해결 필요
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-semibold text-black">
                {selectedCategory}
              </span>
              <span className="text-sm text-gray-500">(총 {totalCount}개)</span>
            </div>
          )}

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
          ) : currentResults && currentResults.length > 0 ? (
            <>
              <ul className="space-y-4 w-[900px]">
                {currentItems.map((consultation) => (
                  <li
                    key={consultation.id}
                    className="border border-gray-300 rounded-lg p-4 transition-all duration-200 
                               hover:border-gray-200 hover:shadow-md hover:bg-gray-50 
                               hover:translate-x-1 group cursor-pointer"
                  >
                    <Link
                      to={`/consultation/detail/${consultation.id}`}
                      className="flex justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium truncate mb-4">
                          {consultation.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3 truncate">
                          {consultation.question}
                        </p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{consultation.category}</span>
                          <span>{consultation.date}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* 페이지네이션 UI */}
              {getTotalPages() > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <MdKeyboardDoubleArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`p-2 rounded ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <MdKeyboardArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1">
                    {pageNumbers.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded ${
                          currentPage === pageNum
                            ? "bg-Main text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(prev + 1, getTotalPages())
                      )
                    }
                    disabled={currentPage === getTotalPages()}
                    className={`p-2 rounded ${
                      currentPage === getTotalPages()
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <MdKeyboardArrowRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(getTotalPages())}
                    disabled={currentPage === getTotalPages()}
                    className={`p-2 rounded ${
                      currentPage === getTotalPages()
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <MdKeyboardDoubleArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : searchQuery.trim() || selectedCategory !== "all" ? (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-lg text-gray-400">
                해당하는 상담사례가 없습니다.
              </p>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[400px]">
              <p className="text-lg text-gray-400">
                검색어를 입력하거나 카테고리를 선택해주세요.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="right-layout">{/* 빈 공간으로 남겨둠 */}</div>
    </div>
  );
};

export default Consultation;
