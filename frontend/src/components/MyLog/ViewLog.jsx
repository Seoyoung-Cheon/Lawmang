import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useCreateViewedLogMutation } from "../../redux/slices/mylogApi";

const Detail = ({ consultation_id, precedent_number }) => {
  const user = useSelector((state) => state.auth.user);
  const [createViewedLog] = useCreateViewedLogMutation();

  // ✅ 열람 기록 저장
  useEffect(() => {
    if (user?.id && (consultation_id || precedent_number)) {
      createViewedLog({
        user_id: user.id,
        consultation_id: consultation_id || null,
        precedent_number: precedent_number || null,
      }).unwrap()
        .then((response) => {
          console.log("✅ 열람 기록 저장 완료:", response);
        })
        .catch((error) => {
          console.error("❌ 열람 기록 저장 실패:", error);
        });
    }
  }, [user, consultation_id, precedent_number, createViewedLog]);

  return <div>여기에 상세 내용 표시</div>;
};

export default Detail;
