import React, { useState } from "react";
import { TfiWrite } from "react-icons/tfi";

const Dictionary = () => {
  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 헤더 섹션 */}
          <div className="flex items-center gap-4 mb-8">
            <TfiWrite className="text-6xl text-Main mr-2" />
            <h1 className="text-2xl font-medium">AI 리포트</h1>
          </div>
        </div>
      </div>
      <div className="right-layout"></div>
    </div>
  );
};

export default Dictionary;
