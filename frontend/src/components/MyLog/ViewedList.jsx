import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import { useGetUserViewedLogsQuery } from "../../redux/slices/mylogApi";
import { setViewedLogs } from "../../redux/slices/mylogSlice";
import ViewLog from "./ViewLog"; // ✅ ViewLog 추가
import { Link } from "react-router-dom"; // ✅ 링크 추가

const ViewedList = () => {
  const user = useSelector(selectUser); // ✅ 현재 로그인한 회원 정보 가져오기
  const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState("consultation"); // 추가: 토글 상태

  // 스크롤을 맨 위로 이동시키는 함수
  const scrollToTop = () => {
    const scrollContainer = document.querySelector(".viewed-logs-container");
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  };

  // viewMode 변경 핸들러 수정
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    scrollToTop();
  };

  // ✅ API 요청 실행 (user?.id가 있어야 요청됨)
  const {
    data: viewedLogs = [],
    isLoading,
    error,
  } = useGetUserViewedLogsQuery(user?.id, { skip: !user?.id });

  // Redux Store에 저장
  useEffect(() => {
    if (viewedLogs.length > 0) {
      dispatch(setViewedLogs(viewedLogs));
    }
  }, [viewedLogs, dispatch]);

  // 추가: 필터링된 로그
  const filteredLogs = viewedLogs.filter((log) => {
    if (viewMode === "consultation") {
      return log.consultation_id;
    } else {
      return log.precedent_number;
    }
  });

  return (
    <div className="border border-gray-300 rounded-lg bg-[#f5f4f2] overflow-hidden">
      <div className="border-b border-gray-300 p-2 bg-[#a7a28f] flex items-center">
        <div className="flex-1"></div>
        <h2 className="font-medium text-white flex-1 text-center mr-[200px]">
          열람목록
        </h2>
        <div className="flex items-center gap-4 mr-4">
          <div className="flex bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => handleViewModeChange("consultation")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "consultation"
                  ? "bg-[#8b7b6e] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              상담사례
            </button>
            <button
              onClick={() => handleViewModeChange("precedent")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "precedent"
                  ? "bg-[#8b7b6e] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              판례
            </button>
          </div>
        </div>
      </div>
      <div className="h-[250px] px-4 pt-1 pb-4 overflow-y-auto viewed-logs-container">
        {isLoading ? (
          <p className="text-center">로딩 중...</p>
        ) : error ? (
          <p className="text-center text-red-500">오류 발생: {error.message}</p>
        ) : filteredLogs.length === 0 ? ( // viewedLogs를 filteredLogs로 변경
          <p className="text-center text-gray-500 w-full">
            {viewMode === "consultation"
              ? "열람한 상담사례가 없습니다."
              : "열람한 판례가 없습니다."}
          </p>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="border-b border-gray-200">
              {/* ✅ 클릭 시 상세 페이지로 이동하는 링크 추가 */}
              <Link
                to={
                  log.precedent_number
                    ? `/precedent/detail/${log.precedent_number}`
                    : `/consultation/detail/${log.consultation_id}`
                }
                className="block w-full transition-all duration-200 hover:pl-2"
              >
                <ViewLog
                  consultation_id={log.consultation_id}
                  precedent_number={log.precedent_number}
                />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewedList;
