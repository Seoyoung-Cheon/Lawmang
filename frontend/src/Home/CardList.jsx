import React, { useState } from "react";
import { BsCardImage } from "react-icons/bs";
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
      card.sections[0].sections[0].paragraphs[0].content.substring(0, 50) +
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
    <div className="container">
      <div className="left-layout">
        <div className="flex items-center gap-4 mt-16 mx-[-85px]">
          <BsCardImage className="text-6xl text-blue-500" />
          <p className="text-2xl font-medium">법률 카드뉴스</p>
        </div>

        <ul className="flex flex-wrap mx-[-100px] mt-5">
          {currentCards.map((card) => (
            <li key={card.id} className="w-[45%] p-4 rounded-md mx-2">
              <Link to={`/cardnews/${card.id}`} className="block h-full">
                <div className="bg-gray-100 rounded-lg p-4 h-full hover:bg-gray-200 transition-colors">
                  <h3 className="text-lg font-bold mb-2 text-gray-900 line-clamp-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{card.date}</p>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {card.preview}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* 페이지네이션 UI */}
        <div className="pagination flex justify-center gap-2 mt-5 ml-[-100px]">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`px-3 py-1 border rounded ${
                currentPage === number
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
      <div className="right-layout">{/* 오른쪽 영역에 들어갈 내용 */}</div>
    </div>
  );
};

export default CardList;
