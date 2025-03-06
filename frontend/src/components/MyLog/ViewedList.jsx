import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import { useGetUserViewedLogsQuery } from "../../redux/slices/mylogApi";
import { setViewedLogs } from "../../redux/slices/mylogSlice";
import ViewLog from "./ViewLog"; // ✅ ViewLog 추가
import { Link } from "react-router-dom"; // ✅ 링크 추가

const ViewedList = () => {
  const user = useSelector(selectUser); // ✅ 현재 로그인한 회원 정보 가져오기
  const dispatch = useDispatch();
  
  // ✅ API 요청 실행 (user?.id가 있어야 요청됨)
  const { data: viewedLogs = [], isLoading, error } = useGetUserViewedLogsQuery(user?.id, { skip: !user?.id });

  // Redux Store에 저장
  useEffect(() => {
    if (viewedLogs.length > 0) {
      dispatch(setViewedLogs(viewedLogs));
    }
  }, [viewedLogs, dispatch]);

  return (
    <div className="border border-gray-300 rounded-lg bg-[#f5f4f2] overflow-hidden">
      <div className="border-b border-gray-300 p-2 bg-[#a7a28f] text-white">
        <h2 className="text-center font-medium">열람목록</h2>
      </div>
      <div className="h-[250px] p-4 overflow-y-auto">
        {isLoading ? (
          <p className="text-center">로딩 중...</p>
        ) : error ? (
          <p className="text-center text-red-500">오류 발생: {error.message}</p>
        ) : viewedLogs.length === 0 ? (
          <p className="text-center text-gray-500 w-full">아직 열람한 판례/상담 사례가 없습니다.</p>
        ) : (
          viewedLogs.map((log, index) => (
            <div key={index} className="border-b border-gray-200 py-2">
              {/* ✅ ViewLog 실행 (열람 기록 저장) */}
              <ViewLog consultation_id={log.consultation_id} precedent_number={log.precedent_number} />

              {/* ✅ 클릭 시 상세 페이지로 이동하는 링크 추가 */}
              {log.precedent_number ? (
                <Link to={`/precedent/detail/${log.precedent_number}`} className="text-blue-600 hover:underline">
                  판례 번호: {log.precedent_number}
                </Link>
              ) : (
                <Link to={`/consultation/detail/${log.consultation_id}`} className="text-blue-600 hover:underline">
                  상담 사례 ID: {log.consultation_id}
                </Link>
              )}
              <span className="text-xs text-gray-500 ml-2">({log.viewed_at})</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewedList;
