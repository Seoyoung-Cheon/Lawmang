import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useCreateViewedLogMutation, useGetUserViewedLogsQuery } from "../../redux/slices/mylogApi";
import { fetchConsultationDetail } from "../Consultation/consultaionApi";
import { fetchCaseDetail } from "../Precedent/precedentApi";

const Detail = ({ consultation_id, precedent_number }) => {
  const user = useSelector((state) => state.auth.user);
  const [createViewedLog] = useCreateViewedLogMutation();
  const { data: viewedLogs = [] } = useGetUserViewedLogsQuery(user?.id, { skip: !user?.id });
  const [caseData, setCaseData] = useState({
    title: "",
    content: "",
    caseNumber: "",
  });

  // 텍스트 길이 제한 함수
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // 상세 내용 가져오기
  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (consultation_id) {
          const data = await fetchConsultationDetail(consultation_id);
          setCaseData({
            title: data?.title || "",
            content: data?.question || "",
            caseNumber: "",
          });
        } else if (precedent_number) {
          const data = await fetchCaseDetail(precedent_number);
          setCaseData({
            title: data?.사건명 || "",
            caseNumber: data?.사건번호 || "",
          });
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
        // ✅ Redux 상태에서 이미 있는지 확인
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
    <div className="hover:bg-white hover:shadow-md py-4 px-2 rounded-lg transition-all duration-200">
      {consultation_id ? (
        // 상담사례 표시
        <div>
          <h3 className="text-lg font-medium text-blue-600 group-hover:text-blue-700 mb-2">
            {truncateText(caseData.title, 30)}
          </h3>
          <div className="text-sm text-gray-600 line-clamp-2">
            {truncateText(caseData.content, 50)}
          </div>
        </div>
      ) : (
        // 판례 표시
        <div>
          <h3 className="text-lg font-medium truncate">{caseData.title}</h3>
          <div className="text-sm text-gray-600">{caseData.caseNumber}</div>
        </div>
      )}
    </div>
  );
};

export default Detail;
