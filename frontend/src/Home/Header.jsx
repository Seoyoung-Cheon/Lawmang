import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../components/Auth/AuthContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isDarkText = location.pathname === "/" && !isScrolled;
  const textColorClass = isDarkText ? "text-white" : "text-black";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="w-full">
      <div
        className={`fixed top-0 left-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? "bg-white/80 backdrop-blur-sm shadow-md" : ""
        }`}
      >
        <div className="px-20 w-full h-[100px] flex items-center justify-between">
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

          {/* 로그인/로그아웃 버튼 */}
          <div className="flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <Link
                  to="/mypage"
                  className={`${textColorClass} hover:opacity-70 text-lg cursor-pointer`}
                >
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className={`${textColorClass} hover:opacity-70 text-lg cursor-pointer`}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`${textColorClass} hover:opacity-70 text-lg cursor-pointer`}
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
