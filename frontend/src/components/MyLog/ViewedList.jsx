import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import { useGetUserViewedLogsQuery } from "../../redux/slices/mylogApi";

const ViewedList = () => {
  const user = useSelector(selectUser);
  const { data: viewedLogs = [], isLoading, error } = useGetUserViewedLogsQuery(user?.id);

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
          viewedLogs.map((log) => (
            <div key={log.id} className="border-b border-gray-200 py-2">
              <p className="text-sm">
                {log.precedent_number ? `판례 번호: ${log.precedent_number}` : `상담 사례 ID: ${log.consultation_id}`}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewedList;
