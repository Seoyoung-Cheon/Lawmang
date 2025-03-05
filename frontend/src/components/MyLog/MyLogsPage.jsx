import React from "react";
import MemoBoard from "./MemoBoard";
import ViewedList from "./ViewedList";

const MyLogsPage = () => {
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
              <ViewedList />
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