import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useCreateViewedMutation } from "../../redux/slices/historyApi";
import { fetchConsultationDetail } from "../Consultation/consultaionApi";
import { fetchPrecedentInfo } from "../Precedent/precedentApi";

const ViewLog = ({ consultation_id, precedent_id, precedentData }) => {
  const user = useSelector((state) => state.auth.user);
  const [createViewed] = useCreateViewedMutation();
  const [hasRecorded, setHasRecorded] = useState(false);
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
    if (!consultation_id && !precedent_id) return;

    const fetchContent = async () => {
      try {
        if (consultation_id) {
          const data = await fetchConsultationDetail(consultation_id);
          setCaseData({
            title: data?.title || "제목 없음",
            caseNumber: "",
            court: "",
            date: "",
          });
        } else if (precedent_id) {
          // precedentData가 있으면 사용, 없으면 fetch
          if (precedentData) {
            setCaseData(precedentData);
          } else {
            const data = await fetchPrecedentInfo(precedent_id);
            if (data) {
              setCaseData({
                title: data.title || "제목 없음",
                caseNumber: data.caseNumber || "사건번호 없음",
                court: data.court || "법원 정보 없음",
                date: data.date || "날짜 없음",
              });
            }
          }
        }
      } catch (error) {
        console.error("상세 내용 조회 실패:", error);
      }
    };

    fetchContent();
  }, [consultation_id, precedent_id, precedentData]);

  // ✅ 열람 기록 저장
  useEffect(() => {
    // ✅ 고유한 키 생성
    const key = consultation_id 
      ? `viewed_consultation_${user?.id}_${consultation_id}`
      : `viewed_precedent_${user?.id}_${precedent_id}`;
    
    // 이미 저장된 기록인지 확인
    if (localStorage.getItem(key)) {
      return;
    }

    const saveViewHistory = async () => {
      if (!user?.id || (!consultation_id && !precedent_id)) {
        return;
      }

      try {
        console.log("열람 기록 저장 시도:", {
          user_id: user.id,
          consultation_id,
          precedent_id
        });

        await createViewed({
          user_id: user.id,
          consultation_id: consultation_id || null,
          precedent_id: precedent_id || null,
        }).unwrap();

        console.log("열람 기록 저장 성공");
        // 저장 성공 시 로컬 스토리지에 기록
        localStorage.setItem(key, 'true');
      } catch (error) {
        console.error("열람 기록 저장 실패:", error);
      }
    };

    saveViewHistory();
  }, []);

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
        // 판례 표시
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

export default ViewLog;