import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CiLogin, CiUser } from "react-icons/ci";

import { useLogoutUserMutation } from "../redux/slices/authApi";
import {
  selectIsAuthenticated,
  selectToken,
  logout,
  selectUser,
} from "../redux/slices/authSlice";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isScrolled, setIsScrolled] = useState(false);
  const isDarkText = location.pathname === "/" && !isScrolled;
  const textColorClass = isDarkText ? "text-white" : "text-black";
  const token = useSelector(selectToken); // ✅ Redux에서 토큰 가져오기
  const [logoutUser] = useLogoutUserMutation(); // ✅ RTK Query 로그아웃 훅 사용
  const user = useSelector(selectUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    console.log("🚀 로그아웃 버튼 클릭됨!");

    try {
      await logoutUser(token); // ✅ 백엔드 로그아웃 요청
    } catch (error) {
      console.error("❌ 로그아웃 API 호출 실패:", error);
    }

    dispatch(logout()); // ✅ Redux 상태 변경
    navigate("/"); // ✅ 홈으로 이동
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
          <div className="relative z-10 mb-4 pt-2">
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
            {isAuthenticated ? (
              <div
                className="relative inline-block"
                onMouseEnter={() => setIsProfileMenuOpen(true)}
                onMouseLeave={() => setIsProfileMenuOpen(false)}
              >
                <button
                  className={`${textColorClass} hover:opacity-70 text-lg cursor-pointer flex items-center gap-2`}
                >
                  <CiUser className="w-6 h-6" />
                  <span>{user?.nickname || "사용자"}</span>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-0 w-48 py-2 bg-white rounded-lg shadow-xl z-50">
                    <Link
                      to="/mylog"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      사건 기록 페이지
                    </Link>
                    <Link
                      to="/modify"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      회원정보 수정
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`${textColorClass} hover:opacity-70 text-lg cursor-pointer flex items-center gap-2`}
              >
                <CiLogin className="w-5 h-5" />
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
