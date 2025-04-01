import { jsPDF } from "jspdf";
import font from "./NotoSansKR-Regular-normal.js";

const addMultilineText = (pdf, lines, startY) => {
  const pageHeight = pdf.internal.pageSize.height;
  let y = startY;

  lines.forEach((line) => {
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, 20, y);
    y += 10;
  });

  return y;
};

export const generateTaxPDF = (formData, result) => {
  const pdf = new jsPDF();
  pdf.addFileToVFS("NotoSansKR-Regular.ttf", font);
  pdf.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
  pdf.setFont("NotoSansKR");

  // 제목
  pdf.setFontSize(18);
  pdf.text("📄 세무 검토 보고서", 20, 25);

  // 정보란
  pdf.setFontSize(11);
  let y = 40;
  pdf.text(`작성일시: ${result.timestamp}`, 20, y);
  y += 7;
  pdf.text(`신고유형: ${formData.report_type}`, 20, y);
  y += 7;
  pdf.text(`신고기간: ${formData.report_period}`, 20, y);
  y += 7;
  pdf.text(`소득/사업유형: ${formData.income_type}`, 20, y);
  y += 10;

  // 구분선
  pdf.setDrawColor(180);
  pdf.line(20, y, 190, y);
  y += 10;

  // 본문 (백엔드에서 온 final_report 그대로 출력)
  pdf.setFontSize(13);
  const reportLines = pdf.splitTextToSize(result.final_report, 170);
  y = addMultilineText(pdf, reportLines, y);

  pdf.save(`세무검토보고서_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateLegalPDF = (formData, result) => {
  const pdf = new jsPDF();
  pdf.addFileToVFS("NotoSansKR-Regular.ttf", font);
  pdf.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
  pdf.setFont("NotoSansKR");

  // 제목
  pdf.setFontSize(18);
  pdf.text("📄 법률 검토 보고서", 20, 25);

  // 정보란
  pdf.setFontSize(11);
  let y = 40;
  pdf.text(`작성일시: ${result.timestamp}`, 20, y);
  y += 7;
  pdf.text(`사건유형: ${formData.case_type}`, 20, y);
  y += 7;
  pdf.text(`사건 발생 시점: ${formData.incident_date}`, 20, y);
  y += 7;
  pdf.text(`관련자: ${formData.related_party}`, 20, y);
  y += 10;

  // 구분선
  pdf.setDrawColor(180);
  pdf.line(20, y, 190, y);
  y += 10;

  // 본문 (백엔드에서 온 final_report 그대로 출력)
  pdf.setFontSize(13);
  const reportLines = pdf.splitTextToSize(result.final_report, 170);
  y = addMultilineText(pdf, reportLines, y);

  pdf.save(`법률검토보고서_${new Date().toISOString().slice(0, 10)}.pdf`);
};
