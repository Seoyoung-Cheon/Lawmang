import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";

const Mypage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          <h1 className="text-3xl font-bold mb-8">마이페이지</h1>

          {/* 사용자 정보 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">사용자 정보</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="w-24 text-gray-600">이메일</span>
                <span>demo@example.com</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-gray-600">이름</span>
                <span>홍길동</span>
              </div>
            </div>
          </div>

          {/* 활동 내역 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">활동 내역</h2>
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium">최근 조회한 판례</h3>
                <p className="text-gray-600 mt-2">
                  아직 조회한 판례가 없습니다.
                </p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium">최근 다운로드한 서식</h3>
                <p className="text-gray-600 mt-2">
                  아직 다운로드한 서식이 없습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="right-layout">{/* 빈 공간으로 남겨둠 */}</div>
    </div>
  );
};

export default Mypage;
