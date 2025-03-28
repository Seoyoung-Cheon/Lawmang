import React, { useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cardnewsdata from "../constants/cardnewsdata";

const Cardnews = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 페이지를 맨위에서부터 시작하게 설정
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const card = Cardnewsdata.find((card) => card.id === parseInt(id));

  if (!card) {
    return <div>카드뉴스를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container h-screen">
      <div className="left-layout h-full">
        <div className="max-w-4xl p-6 h-[85vh] overflow-y-auto mt-[100px]">
          {/* 홈으로 가기 버튼 */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-4 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            홈으로
          </button>

          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="mb-4 flex items-center">
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-bold mb-20 ml-20">
                  {card.maintitle}
                </h1>
              </div>
              <p className="text-gray-600">{card.date}</p>
            </div>

            {card.sections.map((mainSection) => (
              <div key={mainSection.subtitle} className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {mainSection.subtitle}
                </h2>

                {mainSection.sections.map((subSection) => (
                  <div key={subSection.title} className="mb-4">
                    <h3 className="text-lg font-medium mb-3 text-gray-700">
                      {subSection.title}
                    </h3>

                    {subSection.paragraphs.map((para, paraIndex) => (
                      <div key={paraIndex} className="mb-3">
                        <p
                          className="text-gray-600 mb-2"
                          dangerouslySetInnerHTML={{ __html: para.content }}
                        />
                        {para.subcontent && (
                          <p
                            className="text-gray-600 pl-4"
                            dangerouslySetInnerHTML={{
                              __html: para.subcontent,
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cardnews;
