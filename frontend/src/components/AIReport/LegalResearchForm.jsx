import { useState, useRef } from "react";
import { useSubmitLegalResearchMutation } from "../../redux/slices/deepResearchApi";
import { pdfStyles } from "./pdfStyle";
import { generateLegalPDF } from "./pdfGenerator";

const LegalResearchForm = () => {
  const [formData, setFormData] = useState({
    case_type: "",
    incident_date: "",
    related_party: "",
    fact_details: "",
    evidence: "",
    prior_action: "",
    desired_result: "",
  });

  const [submitLegalResearch, { isLoading }] = useSubmitLegalResearchMutation();
  const [result, setResult] = useState(null);
  const reportRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await submitLegalResearch(formData).unwrap();
      setResult(response);
    } catch (error) {
      console.error("Error:", error);
      alert("보고서 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="w-full max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              사건 유형
            </label>
            <input
              type="text"
              value={formData.case_type}
              onChange={(e) =>
                setFormData({ ...formData, case_type: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 임대차 분쟁, 손해배상 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              사건 발생 시점
            </label>
            <input
              type="date"
              value={formData.incident_date}
              onChange={(e) =>
                setFormData({ ...formData, incident_date: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              관련자
            </label>
            <input
              type="text"
              value={formData.related_party}
              onChange={(e) =>
                setFormData({ ...formData, related_party: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 건물주, 거래처 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              사실관계
            </label>
            <textarea
              value={formData.fact_details}
              onChange={(e) =>
                setFormData({ ...formData, fact_details: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main h-32"
              placeholder="사건의 경위를 상세히 설명해주세요"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              확보한 증거
            </label>
            <input
              type="text"
              value={formData.evidence}
              onChange={(e) =>
                setFormData({ ...formData, evidence: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 계약서, 영수증, 녹취록 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              기존 대응 여부
            </label>
            <input
              type="text"
              value={formData.prior_action}
              onChange={(e) =>
                setFormData({ ...formData, prior_action: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 내용증명 발송, 유선상 합의 시도 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              원하는 해결 방향
            </label>
            <input
              type="text"
              value={formData.desired_result}
              onChange={(e) =>
                setFormData({ ...formData, desired_result: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 보증금 전액 반환, 손해배상 등"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full p-4 text-white rounded-lg transition-colors ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-Main hover:bg-Main_hover"
              }`}
            >
              {isLoading ? "분석 중..." : "법률 검토 요청"}
            </button>
            {isLoading && (
              <p className="text-sm text-gray-500 text-center mt-6">
                약 1~2분 정도의 시간이 소요될 수 있습니다.
              </p>
            )}
          </div>
        </form>
      </div>

      {result && (
      <div className="w-full max-w-4xl mx-auto bg-gray-50 rounded-lg p-8">
        <div ref={reportRef} style={pdfStyles.container}>
          {/* 제목 + 버튼 */}
          <div className="flex justify-between items-center">
            <h2 style={{ ...pdfStyles.title, fontSize: "26px" }}>
              📄 법률 검토 보고서
            </h2>
            <button
              onClick={() => generateLegalPDF(formData, result)}
              className="px-4 py-2 bg-Main text-white rounded-lg pdf-download-btn"
            >
              PDF 다운로드
            </button>
          </div>

          {/* 정보란 */}
          <div style={{ fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" }}>
            <p>작성일시: {result.timestamp}</p>
            <p>사건유형: {formData.case_type}</p>
            <p>사건 발생 시점: {formData.incident_date}</p>
            <p>관련자: {formData.related_party}</p>
          </div>

          <hr className="my-4 border-gray-300" />

          {/* 본문 */}
          <div style={{ fontSize: "15px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
            {result.final_report
              .replace(/^#+\s/gm, "")
              .split("\n")
              .map((line, index) => (
                <p key={index}>{line}</p>
              ))}
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default LegalResearchForm;
