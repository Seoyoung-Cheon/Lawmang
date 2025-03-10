import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CiLogin, CiUser } from "react-icons/ci";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoClose } from "react-icons/io5";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤 위치가 50px을 넘어가면 배경 변경
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 스크롤 방지추가
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // ✅ 로그아웃 버튼 클릭 시 실행
  const handleLogout = async () => {
    try {
      await logoutUser(token);
    } catch (error) {
      console.error("❌ 로그아웃 API 호출 실패:", error);
    }
    dispatch(logout());
    navigate("/");
  };

  // ✅ 브라우저 종료 시 자동 로그아웃
  useEffect(() => {
    const handleUnload = (event) => {
      // 새로고침인 경우 (performance.navigation.type === 1)
      if (
        event.persisted ||
        (window.performance && window.performance.navigation.type === 1)
      ) {
        return;
      }
      logoutUser();
      dispatch(logout());
    };

    window.addEventListener("unload", handleUnload);
    return () => {
      window.removeEventListener("unload", handleUnload);
    };
  }, [logoutUser, dispatch]);

  return (
    <div className="w-full">
      {/* 어두운 배경 오버레이 - 전체 화면 */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[140]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 z-[100] w-full transition-all duration-300 ${
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

          {/* 기존 메뉴 (lg 이상에서만 표시) */}
          <ul className="hidden lg:flex items-center justify-center space-x-20 text-xl">
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
            {/* 기존 로그인/프로필 메뉴 (lg 이상에서만 표시) */}
            {isAuthenticated ? (
              <div
                className="relative hidden lg:inline-block"
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
                  <div className="absolute right-0 mt-0 w-48 py-2 bg-white rounded-lg border border-gray-100 shadow-md z-[200]">
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
                className={`${textColorClass} hover:opacity-70 text-lg cursor-pointer hidden lg:flex items-center gap-2`}
              >
                <CiLogin className="w-5 h-5" />
                로그인
              </Link>
            )}

            {/* 햄버거 메뉴 버튼 (lg 미만에서만 표시) */}
            <button
              className="lg:hidden text-gray-600 hover:text-Main transition-colors relative z-[40]"
              onClick={() => setIsMenuOpen(true)}
            >
              <RxHamburgerMenu className={`w-7 h-7 ${textColorClass}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 패널 */}
      <div
        className={`fixed top-0 right-0 w-80 h-screen bg-white transform transition-transform duration-300 ease-in-out z-[150] flex flex-col ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 상단 헤더와 닫기 버튼 */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 text-gray-800">
              <CiUser className="w-6 h-6" />
              <span className="font-medium">
                {user?.nickname || "사용자"}님
              </span>
            </div>
          ) : (
            <div className="text-gray-800">메뉴</div>
          )}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-gray-600 hover:text-Main transition-colors z-[160]"
          >
            <IoClose className="w-7 h-7" />
          </button>
        </div>

        {/* 메뉴 항목들 */}
        <div className="flex-1 overflow-y-auto">
          <Link
            to="/consultation"
            className="block px-6 py-4 text-gray-600 hover:bg-gray-50 hover:text-Main transition-colors"
          >
            상담사례
          </Link>
          <Link
            to="/precedent"
            className="block px-6 py-4 text-gray-600 hover:bg-gray-50 hover:text-Main transition-colors"
          >
            판례
          </Link>
          <Link
            to="/template"
            className="block px-6 py-4 text-gray-600 hover:bg-gray-50 hover:text-Main transition-colors"
          >
            법률 서식
          </Link>
        </div>

        {/* 하단 메뉴 */}
        <div className="mt-auto border-t border-gray-200 p-4">
          {isAuthenticated ? (
            <div className="space-y-3">
              <Link
                to="/mylog"
                className="block w-full py-2 text-gray-600 hover:text-Main transition-colors"
              >
                사건 기록 페이지
              </Link>
              <Link
                to="/modify"
                className="block w-full py-2 text-gray-600 hover:text-Main transition-colors"
              >
                회원정보 수정
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full py-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-2 text-gray-600 hover:text-Main transition-colors"
            >
              <CiLogin className="w-5 h-5" />
              로그인
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
