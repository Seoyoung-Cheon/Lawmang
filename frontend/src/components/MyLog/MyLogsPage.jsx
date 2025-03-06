import React, { useEffect, useMemo } from "react";
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
  const { data: apiViewedLogs = [], isLoading, error } = useGetUserViewedLogsQuery(user?.id, { skip: !user?.id });

  // ✅ Redux에 저장된 기존 열람 기록 가져오기
  const reduxViewedLogs = useSelector((state) => state.mylog.viewedLogs);

  // 🔥 `useMemo`를 사용하여 API 데이터가 변경되지 않으면 동일한 참조 유지
  const viewedLogs = useMemo(() => apiViewedLogs, [apiViewedLogs]);

  useEffect(() => {
    console.log("📌 API 응답 데이터 확인:", viewedLogs);

    // 🔥 기존 Redux 상태와 다를 때만 Redux 상태 업데이트 실행
    if (viewedLogs.length > 0 && JSON.stringify(viewedLogs) !== JSON.stringify(reduxViewedLogs)) {
      console.log("🔄 Redux 상태 업데이트 실행됨!");
      dispatch(setViewedLogs(viewedLogs));
    }
  }, [viewedLogs, reduxViewedLogs, dispatch]); // ✅ `viewedLogs`가 변경될 때만 실행

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
