import { useState } from "react";
import { TfiWrite } from "react-icons/tfi";
import LegalResearchForm from "./LegalResearchForm";
import TaxResearchForm from "./TaxResearchForm";

const Report = () => {
  const [activeTab, setActiveTab] = useState("legal");

  return (
    <div className="container min-h-screen">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 헤더 섹션 */}
          <div className="flex items-center gap-4 mb-8">
            <TfiWrite className="text-6xl text-Main mr-2" />
            <div>
              <h1 className="text-2xl font-medium cursor-default">AI 리포트</h1>
              <p className="text-sm text-gray-500 mt-1">
                사용자의 답변을 바탕으로 AI가 법률 검토 보고서를 작성해드립니다.
              </p>
            </div>
          </div>

          {/* 탭 섹션 */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("legal")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                activeTab === "legal"
                  ? "bg-Main text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              소송/분쟁
            </button>
            <button
              onClick={() => setActiveTab("tax")}
              className={`px-6 py-3 rounded-lg transition-colors ${
                activeTab === "tax"
                  ? "bg-Main text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              세무/회계
            </button>
          </div>

          {/* 폼 섹션 */}
          <div className="w-full max-w-[900px]">
            <div
              className="bg-white rounded-xl p-8 mt-1"
              style={{
                boxShadow:
                  "0 -4px 6px -1px rgba(0, 0, 0, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.05), -2px 0 6px -1px rgba(0, 0, 0, 0.05), 2px 0 6px -1px rgba(0, 0, 0, 0.05)",
              }}
            >
              {activeTab === "legal" ? (
                <LegalResearchForm />
              ) : (
                <TaxResearchForm />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="right-layout"></div>
    </div>
  );
};

export default Report;
