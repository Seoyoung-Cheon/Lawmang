import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useCreateViewedLogMutation } from "../../redux/slices/mylogApi";
import { fetchConsultationDetail } from "../Consultation/consultaionApi";
import { fetchCaseDetail } from "../Precedent/precedentApi";

const Detail = ({ consultation_id, precedent_number }) => {
  const user = useSelector((state) => state.auth.user);
  const [createViewedLog] = useCreateViewedLogMutation();
  const [content, setContent] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");

  // 상세 내용 가져오기
  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (consultation_id) {
          const data = await fetchConsultationDetail(consultation_id);
          setContent(data?.question || "");
          setDisplayTitle(data?.title || "");
        } else if (precedent_number) {
          const data = await fetchCaseDetail(precedent_number);
          // 판례 데이터 처리 로직 수정
          setDisplayTitle(data?.사건번호 || precedent_number); // 사건번호가 없으면 precedent_number 사용

          // 사건명이 없는 경우 대체 텍스트 표시
          if (data?.사건명) {
            setContent(data.사건명);
          } else if (data?.판시사항) {
            // 사건명이 없는 경우 판시사항의 첫 부분을 사용
            setContent(data.판시사항.slice(0, 50) + "...");
          } else if (data?.판례내용) {
            // 판시사항도 없는 경우 판례내용의 첫 부분을 사용
            setContent(data.판례내용.slice(0, 50) + "...");
          } else {
            setContent("판례 내용 확인하기"); // 최후의 대체 텍스트
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
      createViewedLog({
        user_id: user.id,
        consultation_id: consultation_id || null,
        precedent_number: precedent_number || null,
      });
    }
  }, [user, consultation_id, precedent_number, createViewedLog]);

  return (
    <div className="hover:bg-white hover:shadow-md py-4 px-2 rounded-lg transition-all duration-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-600 group-hover:text-blue-700 font-medium">
          {displayTitle}
        </span>
      </div>
      <div className="text-gray-600 text-sm truncate group-hover:text-gray-800">
        {content}
      </div>
    </div>
  );
};

export default Detail;
