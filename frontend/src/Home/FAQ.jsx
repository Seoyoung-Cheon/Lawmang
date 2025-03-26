import React, { useState, useRef, useEffect } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { GrCircleQuestion } from "react-icons/gr";
import FAQdata from "../constants/FAQdata";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const faqRef = useRef(null);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(FAQdata.length / itemsPerPage);

  useEffect(() => {
    const observerCallback = ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
    });

    const currentRef = faqRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const toggleAnswer = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // 페이지네이션 클릭 시 페이지 이동 및 열린 답변 닫기
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    setOpenIndex(null);
  };

  const displayedFAQs = FAQdata.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div ref={faqRef} className="container !mt-[100px] !mb-[60px] h-[500px]">
      <div className="left-layout">
        <div className="2xl:ml-[-100px] xl:ml-[-50px] lg:ml-0">
          <div className="flex items-center gap-2">
            <GrCircleQuestion className="text-6xl text-black" />
            <p className="text-2xl font-medium">자주 묻는 질문</p>
          </div>

          <div className="mt-10">
            <div className="w-[90%] border-t border-b border-gray-200">
              {displayedFAQs.map((faq, index) => (
                <div
                  key={index}
                  className={`border-b border-gray-200 last:border-b-0 py-2
                    transition-all duration-700 transform
                    ${
                      isVisible
                        ? "translate-x-0 opacity-100"
                        : "translate-x-[-50px] opacity-0"
                    }`}
                  style={{
                    transitionDelay: `${index * 150}ms`,
                  }}
                >
                  <button
                    className={`w-full py-4 flex justify-between items-center text-left 
                                relative group transition-all duration-300
                                hover:pl-4 hover:bg-gray-50 rounded-lg
                                ${
                                  openIndex === index ? "pl-4 bg-gray-100" : ""
                                }`}
                    onClick={() => toggleAnswer(index)}
                  >
                    <span
                      className="text-lg font-medium text-black
                                    transition-colors duration-300 flex items-center gap-2"
                    >
                      <span
                        className={`transition-opacity duration-300
                                       ${
                                         openIndex === index
                                           ? "opacity-100"
                                           : "opacity-0 group-hover:opacity-100"
                                       }`}
                      >
                        •
                      </span>
                      {faq.question}
                    </span>
                    <IoIosArrowDown
                      className={`transform transition-all duration-300 mr-4 
                                  ${openIndex === index ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openIndex === index ? "max-h-40 pb-4" : "max-h-0"
                    }`}
                  >
                    <p className="text-gray-600 ml-8">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            <div
              className={`w-[90%] flex justify-center items-center gap-2 mt-10 mb-10 ml-[-5px]
              transition-all duration-700 transform
              ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
              style={{ transitionDelay: `${displayedFAQs.length * 150}ms` }}
            >
              {[...Array(totalPages).keys()].map((num) => (
                <button
                  key={num + 1}
                  className={`px-3 py-1 border rounded-md ${
                    currentPage === num + 1
                      ? "bg-gray-500 text-white hover:bg-gray-500"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => paginate(num + 1)}
                >
                  {num + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="right-layout"></div>
    </div>
  );
};

export default FAQ;
