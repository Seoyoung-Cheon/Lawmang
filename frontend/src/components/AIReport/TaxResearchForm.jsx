import { useState, useRef } from "react";
import { useSubmitTaxResearchMutation } from "../../redux/slices/deepResearchApi";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { pdfStyles, downloadPDFConfig } from './pdfStyle';

const TaxResearchForm = () => {
  const [formData, setFormData] = useState({
    report_type: "",
    report_period: "",
    income_type: "",
    concern: "",
    desired_result: "",
    additional_info: "",
  });

  const [submitTaxResearch, { isLoading }] = useSubmitTaxResearchMutation();
  const [result, setResult] = useState(null);
  const reportRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await submitTaxResearch(formData).unwrap();
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
      const downloadButton = element.querySelector('.pdf-download-btn');
      if (downloadButton) {
        downloadButton.style.display = 'none';
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      if (downloadButton) {
        downloadButton.style.display = 'block';
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const margin = 10; // 여백

      // 첫 페이지
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth - (margin * 2), pdfHeight - (margin * 2));
      heightLeft -= pdf.internal.pageSize.getHeight();

      // 추가 페이지
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, pdfWidth - (margin * 2), pdfHeight - (margin * 2));
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`세무검토보고서_${new Date().toISOString().slice(0,10)}.pdf`);
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
              신고 유형
            </label>
            <input
              type="text"
              value={formData.report_type}
              onChange={(e) =>
                setFormData({ ...formData, report_type: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 종합소득세, 부가가치세 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              신고 대상 기간
            </label>
            <input
              type="text"
              value={formData.report_period}
              onChange={(e) =>
                setFormData({ ...formData, report_period: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 2023년 귀속, 2024년 1기 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              소득/사업 유형
            </label>
            <input
              type="text"
              value={formData.income_type}
              onChange={(e) =>
                setFormData({ ...formData, income_type: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 프리랜서, 개인사업자 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              걱정되는 점
            </label>
            <textarea
              value={formData.concern}
              onChange={(e) =>
                setFormData({ ...formData, concern: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main h-32"
              placeholder="세무 신고시 우려되는 사항을 설명해주세요"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              원하는 신고 목표
            </label>
            <input
              type="text"
              value={formData.desired_result}
              onChange={(e) =>
                setFormData({ ...formData, desired_result: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main"
              placeholder="예: 적절한 공제 적용, 세금 최적화 등"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              추가 참고 사항
            </label>
            <textarea
              value={formData.additional_info}
              onChange={(e) =>
                setFormData({ ...formData, additional_info: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-Main h-32"
              placeholder="기타 참고할 만한 사항을 자유롭게 작성해주세요"
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
              {isLoading ? "분석 중..." : "세무 검토 요청"}
            </button>
            {isLoading && (
              <p className="text-sm text-gray-500 text-center mt-6">
                약 1~2분 정도의 시간이 소요될 수 있습니다.
              </p>
            )}
          </div>
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
              <h2 style={pdfStyles.title}>세무 검토 보고서</h2>
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-Main text-white rounded-lg pdf-download-btn"
              >
                PDF 다운로드
              </button>
            </div>
            <div style={pdfStyles.info}>
              <p>작성일시: {result.timestamp}</p>
              <p>신고유형: {formData.report_type}</p>
              <p>신고기간: {formData.report_period}</p>
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

export default TaxResearchForm; 