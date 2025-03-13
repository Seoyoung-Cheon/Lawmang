import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import { useGetViewedQuery } from "../../redux/slices/historyApi";
import MemoBoard from "./MemoBoard";
import ViewedList from "./ViewedList";

const MyLogsPage = () => {
  const user = useSelector(selectUser);

  // ✅ API에서 열람 기록 데이터 가져오기
  const { data: viewedLogs = [], isLoading, error } = useGetViewedQuery(user?.id, { 
    skip: !user?.id 
  });

  return (
    <div className="min-h-screen w-full">
      <div className="container min-h-[100vh]">
        <div className="left-layout">
          <div className="px-0 pt-[135px] pb-10">
            {/* 메모장 (MemoBoard) */}
            <div className="mb-8">
              <MemoBoard />
            </div>

            {/* 열람목록 (ViewedList) */}
            <div>
              <ViewedList viewedLogs={viewedLogs} isLoading={isLoading} error={error} />
            </div>
          </div>
        </div>

        {/* 우측 여백 (기존 UI 유지) */}
        <div className="right-layout"></div>
      </div>
    </div>
  );
};

export default MyLogsPage;
