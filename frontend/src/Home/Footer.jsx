import React from "react";
import Logo from "../assets/icon-180.png";

const Footer = () => {
  return (
    <footer className="bg-[#e1e0df] py-16 border-t min-h-[150px]">
      <div className="container mx-auto">
        <div className="flex items-start justify-between py-4">
          {/* 로고 섹션 */}
          <div className="flex items-center mr-40 ml-[-50px]">
            <img src={Logo} alt="로망 로고" className="h-20 w-auto" />
            <div className="ml-4">
              <h2 className="text-2xl font-basic">Lawmang</h2>
            </div>
          </div>

          {/* 회사 정보 섹션 */}
          <div className="text-gray-600 text-base space-y-3">
            <p> Lawmang은 전문적인 상담 서비스를 제공합니다. </p>
            <p>
              서울특별시 금천구 주소 가산디지털2로 144 현대테라타워 가산DK A동
              20층 2013~2018호
            </p>
          </div>
        </div>

        {/* 하단 정보 섹션 */}
        <div className="flex justify-center mt-32 ml-[-565px]">
          <p className="text-sm text-gray-400">© 2025 Lawmang 모든 권리 보유</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
