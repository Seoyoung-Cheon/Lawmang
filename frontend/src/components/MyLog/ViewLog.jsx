import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useCreateViewedLogMutation, useGetUserViewedLogsQuery } from "../../redux/slices/mylogApi";
import { fetchConsultationDetail } from "../Consultation/consultaionApi";
import { fetchPrecedentInfo } from "../Precedent/precedentApi";

const Detail = ({ consultation_id, precedent_number }) => {
  const user = useSelector((state) => state.auth.user);
  const [createViewedLog] = useCreateViewedLogMutation();
  const { data: viewedLogs = [] } = useGetUserViewedLogsQuery(user?.id, { skip: !user?.id });

  const [caseData, setCaseData] = useState({
    title: "",
    caseNumber: "",
    court: "",
    date: "",
  });

  // 텍스트 길이 제한 함수
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length <= maxLength ? text : text.slice(0, maxLength) + "...";
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  };

  // 상세 내용 가져오기
  useEffect(() => {
    if (!consultation_id && !precedent_number) return;

    const fetchContent = async () => {
      try {
        let data;

        if (consultation_id) {
          data = await fetchConsultationDetail(consultation_id);
          console.log("📌 상담사례 API 응답:", data); // ✅ 응답 확인용 로그
          setCaseData({
            title: data?.title || "제목 없음",
            caseNumber: "",
            court: "",
            date: "",
          });

        } else if (precedent_number) {
          data = await fetchPrecedentInfo(precedent_number);
          console.log("📌 판례 API 응답:", data); // ✅ 응답 확인용 로그

          // ✅ 데이터가 존재할 때만 업데이트
          if (data) {
            setCaseData({
              title: data.title || "제목 없음",
              caseNumber: data.caseNumber || "사건번호 없음",
              court: data.court || "법원 정보 없음",
              date: data.date || "날짜 없음",
            });
          }
        }
      } catch (error) {
        console.error("상세 내용 조회 실패:", error);
      }
    };

    fetchContent();
  }, [consultation_id, precedent_number]);

  // 열람 기록 저장
  useEffect(() => {
    if (user?.id && (consultation_id || precedent_number)) {
      const isAlreadyViewed = viewedLogs.some(
        (log) =>
          (log.consultation_id && log.consultation_id === consultation_id) ||
          (log.precedent_number && log.precedent_number === precedent_number)
      );

      if (!isAlreadyViewed) {
        createViewedLog({
          user_id: user.id,
          consultation_id: consultation_id || null,
          precedent_number: precedent_number || null,
        });
      }
    }
  }, [user, consultation_id, precedent_number, createViewedLog, viewedLogs]);

  return (
    <div className="py-4 px-2">
      {consultation_id ? (
        // 상담사례 표시
        <div>
          <h3 className="text-lg font-medium text-blue-600 group-hover:text-blue-700 mb-2">
            {truncateText(caseData.title, 30)}
          </h3>
        </div>
      ) : (
        // 판례 표시 (JSON & HTML 동일한 UI 적용)
        <div>
          <h3 className="text-lg font-medium truncate mb-2">
            {truncateText(caseData.title, 30)}
          </h3>
          <div className="flex justify-between items-end text-sm text-gray-600">
            <div>
              {truncateText(caseData.court, 15)} | {formatDate(caseData.date)}
            </div>
            <div>{truncateText(caseData.caseNumber, 20)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
