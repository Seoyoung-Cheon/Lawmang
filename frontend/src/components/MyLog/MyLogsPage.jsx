import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import { useGetUserViewedLogsQuery } from "../../redux/slices/mylogApi";
import { setViewedLogs } from "../../redux/slices/mylogSlice";
import MemoBoard from "./MemoBoard";
import ViewedList from "./ViewedList";

const MyLogsPage = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  // ✅ API에서 열람 기록 데이터 가져오기
  const { data: viewedLogs = [], isLoading, error } = useGetUserViewedLogsQuery(user?.id, { skip: !user?.id });

  useEffect(() => {
    console.log("📌 API 응답 데이터 확인:", viewedLogs);
    if (viewedLogs.length > 0) {
      dispatch(setViewedLogs(viewedLogs));
    }
  }, [viewedLogs, dispatch]);


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
              <ViewedList viewedLogs={viewedLogs} />
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