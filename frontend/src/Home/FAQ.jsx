import React, { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { GrCircleQuestion } from "react-icons/gr";
import FAQdata from "../constants/FAQdata";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(FAQdata.length / itemsPerPage);

  const toggleAnswer = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const displayedFAQs = FAQdata.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container !mt-[100px] !mb-[80px]">
      <div className="left-layout">
        <div className="flex items-center gap-4 mx-[-100px]">
          <GrCircleQuestion className="text-6xl text-black" />
          <p className="text-2xl font-medium">자주 묻는 질문</p>
        </div>

        <div className="mx-[-100px] mt-10">
          <div className="w-[84%] border-t border-b border-gray-200 py-2 space-y-4">
            {displayedFAQs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-gray-200 last:border-b-0"
              >
                <button
                  className="w-full py-4 flex justify-between items-center text-left hover:text-gray-500"
                  onClick={() => toggleAnswer(index)}
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  <IoIosArrowDown
                    className={`transform transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openIndex === index ? "max-h-40 pb-4" : "max-h-0"
                  }`}
                >
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-4 space-x-2 ml-[-80px]">
            {[...Array(totalPages).keys()].map((num) => (
              <button
                key={num + 1}
                className={`px-3 py-1 border rounded-md ${
                  currentPage === num + 1 ? "bg-gray-300" : "bg-white"
                }`}
                onClick={() => paginate(num + 1)}
              >
                {num + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="right-layout"></div>
    </div>
  );
};

export default FAQ;