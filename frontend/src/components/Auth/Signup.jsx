import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSendEmailCodeMutation, useRegisterUserMutation } from "../../redux/slices/authApi";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    code: "", // ✅ 인증 코드 추가
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false); // ✅ 인증 코드 발송 여부 상태 추가

  // ✅ 이메일 인증 코드 요청
  const [sendEmailCode, { isLoading: isSendingCode }] = useSendEmailCodeMutation();
  // ✅ 회원가입 요청
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();

  // ✅ 입력값 변경 핸들러
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ 인증 코드 요청 핸들러
  const handleSendCode = async () => {
    try {
      await sendEmailCode(formData.email).unwrap();
      setIsCodeSent(true); // ✅ 인증 코드 전송 완료
      alert("이메일로 인증 코드가 발송되었습니다!");
    } catch (err) {
      setErrorMessage(err.data?.detail || "인증 코드 전송 실패");
    }
  };

  // ✅ 회원가입 요청 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await registerUser(formData).unwrap();
      alert("회원가입 성공! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      setErrorMessage(err.data?.detail || "회원가입 실패");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* 단색 배경 */}
      <div className="absolute inset-0 bg-[#e1e0df]" />

      {/* 회원가입 폼 */}
      <div className="bg-white/80 backdrop-blur-sm p-12 mt-10 rounded-lg w-[700px] h-auto shadow-lg relative border-2 border-white/50">
        {/* 회원가입 텍스트 */}
        <h1 className="text-4xl font-bold text-black mb-8 text-center">
          회원가입
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* 이메일 입력 및 인증 코드 요청 */}
          <div className="relative">
            <label className="block text-black mb-2 text-lg">이메일</label>
            <div className="flex">
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="이메일을 입력해주세요"
                className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode || isCodeSent}
                className={`ml-2 px-4 py-2 text-white rounded-md ${
                  isCodeSent ? "bg-gray-500" : "bg-Main hover:bg-Main_hover"
                }`}
              >
                {isSendingCode ? "전송 중..." : isCodeSent ? "전송 완료" : "코드 요청"}
              </button>
            </div>
          </div>

          {/* 인증 코드 입력 (코드 전송 후 표시) */}
          {isCodeSent && (
            <div className="relative">
              <label className="block text-black mb-2 text-lg">인증 코드</label>
              <input
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                placeholder="이메일로 받은 인증 코드를 입력하세요"
                className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
                required
              />
            </div>
          )}

          {/* 닉네임 입력 */}
          <div className="relative">
            <label className="block text-black mb-2 text-lg">닉네임</label>
            <input
              name="nickname"
              type="text"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="닉네임을 입력해주세요"
              className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
              required
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="relative">
            <label className="block text-black mb-2 text-lg">비밀번호</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력해주세요"
              className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
              required
            />
          </div>

          {/* 비밀번호 확인 */}
          <div className="relative">
            <label className="block text-black mb-2 text-lg">비밀번호 확인</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력해주세요"
              className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
              required
            />
          </div>

          {/* 에러 메시지 표시 */}
          {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-Main text-white py-4 rounded-md hover:bg-Main_hover transition-colors text-lg mb-[25px]"
          >
            {isRegistering ? "회원가입 중..." : "회원가입하기"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
