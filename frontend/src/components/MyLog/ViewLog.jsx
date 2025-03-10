import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useCreateViewedLogMutation } from "../../redux/slices/mylogApi";
import { fetchConsultationDetail } from "../Consultation/consultaionApi";
import { fetchCaseDetail } from "../Precedent/precedentApi";

const Detail = ({ consultation_id, precedent_number }) => {
  const user = useSelector((state) => state.auth.user);
  const [createViewedLog] = useCreateViewedLogMutation();
  const [caseData, setCaseData] = useState({
    title: "",
    caseNumber: "",
    court: "",
    date: "",
  });

  // 상세 내용 가져오기
  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (consultation_id) {
          const data = await fetchConsultationDetail(consultation_id);
          setCaseData({
            title: data?.title || "",
            caseNumber: "",
            court: "",
            date: "",
          });
        } else if (precedent_number) {
          const data = await fetchCaseDetail(precedent_number);
          // 판례 데이터 구조에 맞게 매핑
          setCaseData({
            title: data?.사건명 || "",
            caseNumber: data?.사건번호 || "",
            court: data?.법원명 || "",
            date: data?.선고일자 || "",
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
      createViewedLog({
        user_id: user.id,
        consultation_id: consultation_id || null,
        precedent_number: precedent_number || null,
      });
    }
  }, [user, consultation_id, precedent_number, createViewedLog]);

  return (
    <div className="hover:bg-white hover:shadow-md py-4 px-2 rounded-lg transition-all duration-200">
      {consultation_id ? (
        // 상담사례 표시
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 group-hover:text-blue-700 font-medium">
              {caseData.title}
            </span>
          </div>
        </div>
      ) : (
        // 판례 표시
        <div>
          <h3 className="text-lg font-medium truncate mb-4">{caseData.title}</h3>
          <div className="text-sm text-gray-600">{caseData.caseNumber}</div>
          <div className="text-sm text-gray-600">
            {caseData.court} | {caseData.date}
          </div>
        </div>
      )}
    </div>
  );
};

export default Detail;
