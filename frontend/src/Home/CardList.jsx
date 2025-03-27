import React, { useState, useEffect, useRef } from "react";
import { ImNewspaper } from "react-icons/im";
import { Link } from "react-router-dom";
import Cardnewsdata from "../constants/cardnewsdata";

const CardList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  // 애니메이션을 위한 state와 ref 추가
  const [isVisible, setIsVisible] = useState(false);
  const cardListRef = useRef(null);

  // Intersection Observer 설정
  useEffect(() => {
    const observerCallback = ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
    });

    const currentRef = cardListRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

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
    <div
      ref={cardListRef}
      className={`container relative transition-all duration-1000 transform !mt-[60px] !mb-[40px]
        ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
    >
      <div className="left-layout">
        <div className="2xl:ml-[-50px] xl:ml-0 lg:ml-[50px]">
          <div className="flex items-center gap-4 ml-[10px]">
            <ImNewspaper className="text-6xl text-blue-500" />
            <p className="text-2xl font-medium">법률 카드뉴스</p>
          </div>

          <ul className="grid grid-cols-2 gap-4 mt-5 w-[90%]">
            {currentCards.map((card) => (
              <li key={card.id} className="w-full p-1">
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
                      <p className="text-sm text-gray-600 mb-3">{card.date}</p>
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
          <div className="w-[90%] flex justify-center items-center gap-2 mt-8 mb-10 ml-[-5px]">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === number
                      ? "bg-gray-500 text-white hover:bg-gray-500"
                      : "bg-white text-gray-700 hover:bg-gray-50"
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
  );
};

export default CardList;
