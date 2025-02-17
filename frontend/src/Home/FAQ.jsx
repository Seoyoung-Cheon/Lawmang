import React from "react";
import { IoIosArrowDown } from "react-icons/io";
import { GrCircleQuestion } from "react-icons/gr";
import { useState } from "react";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  // 데이터 예시
  const faqData = [
    {
      question: "로망은 어떤 서비스인가요?",
      answer:
        "로망은 법률 정보를 쉽게 접근할 수 있도록 도와주는 서비스입니다. 판례 검색, 법률 상담, 관련 서식 등을 제공합니다.",
    },
  ];

  const toggleAnswer = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container">
      <div className="left-layout">
        <div className="flex items-center gap-4 mt-[100px] mx-[-100px]">
          <GrCircleQuestion className="text-6xl text-black" />
          <p className="text-2xl font-medium">자주 묻는 질문</p>
        </div>

        <div className="mx-[-100px] mt-10">
          <div className="w-[90%] border-t border-b border-gray-200 py-2 space-y-4">
            {faqData.map((faq, index) => (
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
        </div>
      </div>
      <div className="right-layout"></div>
    </div>
  );
};

export default FAQ;
