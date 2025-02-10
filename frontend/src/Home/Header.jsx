import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="w-full">
      <div className="absolute top-0 left-0 z-50 w-full">
        <div className="px-20 py-16 w-full h-16 flex items-center justify-between">
          {/* Lawmang 텍스트 */}
          <div className="text-white text-5xl font-normal">Lawmang</div>
          
          {/* 가운데 위치한 메뉴 리스트 (ul) - 항목 간 간격을 4로 설정 */}
          <ul className="w-[400px] flex items-center justify-center flex-grow space-x-6 text-lg">
            <li className="text-neutral-200 hover:text-white cursor-pointer">
              <Link to="/consultation" className="text-neutral-200 hover:text-white">상담사례</Link>
            </li>
            <li className="text-neutral-200 hover:text-white cursor-pointer">
              <Link to="/precedent" className="text-neutral-200 hover:text-white">판례</Link>
            </li>
            <li className="text-neutral-200 hover:text-white cursor-pointer">
              <Link to="/template" className="text-neutral-200 hover:text-white">법률 서식</Link>
            </li>
          </ul>
          
          {/* 로그인 텍스트 */}
          <div className="text-neutral-200 hover:text-white  text-lg cursor-pointer">로그인</div>
        </div>
      </div>
    </div>
  );
};

export default Header;
