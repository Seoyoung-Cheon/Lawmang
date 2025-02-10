import React from "react";

const Cardnews = () => {
  return (
    <div className="bg-[#E1DFD9] py-16">
      <div className="layout-container">
        <div className="layout-left">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "6rem",
              marginRight: "43rem",
            }}
          >
            <h2
              className="text-white"
              style={{
                WebkitTextStroke: "1px #c8c8c8",
                textStroke: "1px #dcdcdc",
                fontSize: "2rem",
                fontWeight: "600",
              }}
            >
              카드뉴스
            </h2>
          </div>
          {/* 여기에 카드뉴스 컨텐츠를 추가할 수 있습니다 */}
        </div>
      </div>
    </div>
  );
};

export default Cardnews;
