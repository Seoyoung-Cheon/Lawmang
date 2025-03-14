import React, { useState } from "react";
import { ImNewspaper } from "react-icons/im";
import { Link } from "react-router-dom";
import Cardnewsdata from "../constants/cardnewsdata";

const CardList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  // 카드뉴스 데이터에서 미리보기용 정보 추출
  const cardPreviews = Cardnewsdata.map((card) => ({
    id: card.id,
    title: card.maintitle,
    date: card.date,
    preview:
      card.sections[0].sections[0].paragraphs[0].content.substring(0, 80) +
      "...",
  }));

  // 현재 페이지에 표시할 카드 계산
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = cardPreviews.slice(indexOfFirstCard, indexOfLastCard);

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(cardPreviews.length / cardsPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <span className="absolute h-[700px] w-screen left-0 -z-10 bg-gray-100"></span>
      <div className="container relative">
        <div className="left-layout">
          <div className="mx-[-200px]">
            <div className="flex items-center gap-4 mx-[110px] pt-12">
              <ImNewspaper className="text-6xl text-blue-500" />
              <p className="text-2xl font-medium">법률 카드뉴스</p>
            </div>

            <ul className="flex flex-wrap mt-5 w-[90%]">
              {currentCards.map((card, index) => (
                <li
                  key={card.id}
                  className={`w-[40%] p-4 rounded-md ${
                    index % 2 === 0 ? "ml-[90px]" : ""
                  }`}
                >
                  <Link to={`/cardnews/${card.id}`} className="block h-full">
                    {/* 카드뉴스 호버 시 효과를 위한 그룹화 */}
                    <div className="relative group">
                      <div
                        className="absolute inset-[-2px] rounded-lg bg-gray-500 transition-all duration-200 ease-out 
                        [clip-path:polygon(0_0,0_0,0_0,0_0)] group-hover:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]"
                      ></div>
                      <div className="relative bg-white rounded-lg p-6 h-[200px] border border-gray-300 flex flex-col justify-between">
                        <h3 className="text-lg font-bold mb-3 text-gray-900">
                          {card.title.length > 20
                            ? card.title.substring(0, 20) + "..."
                            : card.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {card.date}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-4">
                          {card.preview}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* 페이지네이션 UI */}
            <div className="w-[90%] flex justify-center items-center gap-2 mt-8 mb-10 ml-[-30px]">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => handlePageChange(number)}
                    className={`px-3 py-1 border rounded hover:bg-gray-50 ${
                      currentPage === number
                        ? "bg-gray-500 text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    {number}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
        <div className="right-layout"></div>
      </div>
    </>
  );
};

export default CardList;
