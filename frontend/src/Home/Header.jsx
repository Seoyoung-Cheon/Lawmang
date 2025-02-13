import React from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const isDarkText = location.pathname === "/";
  const textColorClass = isDarkText ? "text-white" : "text-black";

  return (
    <div className="w-full">
      <div className="absolute top-0 left-0 z-50 w-full">
        <div className="px-20 py-16 w-full h-16 flex items-center justify-between">
          {/* Lawmang 로고 */}
          <div className="relative z-10 mb-4">
            <Link to="/" className={`${textColorClass} text-5xl font-normal`}>
              Lawmang
            </Link>
          </div>

          {/* 가운데 위치한 메뉴 리스트 (ul) */}
          <ul className="flex items-center justify-center space-x-20 text-xl">
            <li>
              <Link
                to="/consultation"
                className={`${textColorClass} hover:opacity-70 cursor-pointer`}
              >
                상담사례
              </Link>
            </li>
            <li>
              <Link
                to="/precedent"
                className={`${textColorClass} hover:opacity-70 cursor-pointer`}
              >
                판례
              </Link>
            </li>
            <li>
              <Link
                to="/template"
                className={`${textColorClass} hover:opacity-70 cursor-pointer`}
              >
                법률 서식
              </Link>
            </li>
          </ul>

          {/* 로그인 텍스트 */}
          <div
            className={`${textColorClass} hover:opacity-70 text-lg cursor-pointer`}
          >
            로그인
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
