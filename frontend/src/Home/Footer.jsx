import React from "react";
import Logo from "../assets/icon-180.png";

const Footer = () => {
  return (
    <footer className="bg-[#e1e0df] border-t min-h-[100px] relative z-10">
      <div className="container w-full bg-[#e1e0df]">
        <div className="2xl:ml-[-130px] xl:ml-0 lg:ml-[50px] px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between mt-10 py-8">
            {/* 로고 섹션 */}
            <div className="flex items-center mb-8 md:mb-0  mt-4 sm:ml-10">
              <img src={Logo} alt="로망 로고" className="h-16 md:h-20 w-auto" />
              <div className="ml-4">
                <h2 className="text-2xl md:text-3xl font-basic font-['Oswald']">
                  Lawmang
                </h2>
              </div>
            </div>

            {/* 회사 정보 섹션 */}
            <div className="text-gray-600 ml-32 text-sm md:text-base mb-5 text-center md:text-left w-[90%] md:w-auto max-w-[600px]">
              <p className="mb-5">
                Lawmang | AI 법률 자문 및 판례 검색은 Lawmang <br />
                AI로 빠르고 정확한 법률 자문을 받고, 최신 판례를 확인하세요.
              </p>
              <p className="mt-6 mb-3">
                서울특별시 금천구 주소 가산디지털2로 144 현대테라타워 가산DK A동
                20층 2013~2018호
              </p>
              <p className="text-xs md:text-sm text-gray-400">
                © 2025 Lawmang 모든 권리 보유
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
