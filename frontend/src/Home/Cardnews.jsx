import React from "react";
import Cardnewsdata from "../constants/cardnewsdata";

const Cardnews = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {Cardnewsdata.map((card) => (
        <div key={card.id} className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2">{card.maintitle}</h1>
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
                          dangerouslySetInnerHTML={{ __html: para.subcontent }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Cardnews;
