import { useState, useRef } from "react";
import { useSubmitLegalResearchMutation } from "../../redux/slices/deepResearchApi";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// PDF 변환 영역의 스타일을 별도로 정의
const pdfStyles = {
  container: {
    margin: '2rem 0',
    padding: '2rem',
    backgroundColor: 'white',
    maxWidth: '800px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  info: {
    color: '#666',
    marginBottom: '1rem',
  },
  content: {
    whiteSpace: 'pre-line',
    lineHeight: '1.5',
  }
};

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

  const downloadPDF = async () => {
    const element = reportRef.current;
    if (!element) return;

    try {
      // PDF 다운로드 버튼 임시로 숨기기
      const downloadButton = element.querySelector('.pdf-download-btn');
      if (downloadButton) {
        downloadButton.style.display = 'none';
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      // PDF 다운로드 버튼 다시 보이기
      if (downloadButton) {
        downloadButton.style.display = 'block';
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`법률검토보고서_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 상단: 입력 폼 */}
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
        </form>
      </div>

      {/* 구분선 */}
      {result && (
        <div className="w-full border-t-2 border-gray-200 my-8">
          <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center mx-auto -mt-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* 하단: 보고서 미리보기 */}
      {result && (
        <div className="w-full max-w-4xl mx-auto bg-gray-50 rounded-lg p-8">
          <div ref={reportRef} style={pdfStyles.container}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={pdfStyles.title}>법률 검토 보고서</h2>
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-Main text-white rounded-lg pdf-download-btn"
              >
                PDF 다운로드
              </button>
            </div>
            <div style={pdfStyles.info}>
              <p>작성일시: {result.timestamp}</p>
              <p>사건유형: {formData.case_type}</p>
            </div>
            <div style={pdfStyles.content}>
              {result.final_report}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalResearchForm; 