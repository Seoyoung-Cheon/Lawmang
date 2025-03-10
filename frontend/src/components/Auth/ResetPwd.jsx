import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSendResetCodeMutation, useVerifyResetCodeMutation, useResetPasswordMutation } from "../../redux/slices/authApi";
import { AiOutlineMail } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";
import { Link } from "react-router-dom";

const ResetPwd = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    special: false
  });
  const [passwordMatch, setPasswordMatch] = useState({
    isMatching: false,
    isDirty: false
  });

  // ✅ 새로고침 시 오류 메시지 초기화
  useEffect(() => {
    setErrorMessage("");
  }, []);
  

  // ✅ 이메일 인증 코드 요청
  const [sendResetCode, { isLoading: isSendingCode }] = useSendResetCodeMutation();
  // ✅ 비밀번호 재설정 요청
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();
  const [verifyResetCode] = useVerifyResetCodeMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'newPassword') {
      setPasswordChecks({
        length: value.length >= 8,
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
      if (formData.confirmNewPassword) {
        setPasswordMatch({
          isMatching: value === formData.confirmNewPassword,
          isDirty: true
        });
      }
    }

    if (name === 'confirmNewPassword') {
      setPasswordMatch({
        isMatching: value === formData.newPassword,
        isDirty: true
      });
    }
  };

  // ✅ 이메일 인증 코드 요청 핸들러
  const handleSendCode = async () => {
    if (!formData.email.includes("@")) {
      setErrorMessage("유효한 이메일 주소를 입력해주세요.");
      return;
    }
  
    try {
      const response = await sendResetCode({ email: formData.email }).unwrap();
  
      if (!response.exists) {
        alert("등록되지 않은 이메일입니다. 로그인 페이지로 이동합니다.");
        navigate("/login");
        return;
      }
      setIsCodeSent(true);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.data?.detail || "인증 코드 요청 실패");
    }
  };

  // ✅ 인증 코드 확인 핸들러 수정
  const handleVerifyCode = async () => {
    if (!formData.code) {
      setErrorMessage("인증 코드를 입력해주세요.");
      return;
    }
  
    try {
      setErrorMessage("");
  
      await verifyResetCode({
        email: formData.email,
        code: formData.code
      }).unwrap();
  
      setIsCodeVerified(true);
      setErrorMessage("");
    } catch (err) {
      console.error("❌ 인증 코드 검증 실패:", err);
      setIsCodeVerified(false);
      setErrorMessage("잘못된 인증 코드입니다.");
      setFormData({ ...formData, code: "" });
    }
  };  
  

  // ✅ 비밀번호 재설정 요청 핸들러
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!passwordChecks.length || !passwordChecks.special) {
      setErrorMessage("비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.");
      return;
    }

    if (formData.newPassword !== formData.confirmNewPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await resetPassword({
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword,
      }).unwrap();
      alert("비밀번호가 성공적으로 변경되었습니다! 로그인 페이지로 이동합니다.");
      navigate("/login");
    } catch (err) {
      setErrorMessage(err.data?.detail || "비밀번호 재설정 실패");
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[#e1e0df]" />
      
      <div className="bg-white/50 backdrop-blur-sm p-12 rounded-lg w-[600px] shadow-lg relative border-2 border-white/50 z-10">
        <h2 className="text-4xl text-neutral-700 text-center mb-8">비밀번호 재설정</h2>

        <form onSubmit={handleResetPassword} className="space-y-8 mt-16">
          <div className="relative">
            <span className="absolute left-3 top-4">
              <AiOutlineMail className="w-6 h-6 text-gray-400" />
            </span>
            <div className="flex">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email ID"
                className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSendingCode || isCodeSent}
                className={`ml-2 px-4 py-2 text-white rounded-md whitespace-nowrap w-[100px] ${
                  isCodeSent ? "bg-gray-500" : "bg-Main hover:bg-Main_hover"
                }`}
              >
                {isSendingCode ? "전송 중..." : isCodeSent ? "전송 완료" : "코드 요청"}
              </button>
            </div>
          </div>

          {isCodeSent && (
            <div className="relative">
              <span className="absolute left-3 top-4">
                <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
              </span>
              <div className="flex">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="인증 코드 입력"
                  className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
                  required
                  disabled={isCodeVerified}
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isCodeVerified}
                  className={`ml-2 px-4 py-2 text-white rounded-md whitespace-nowrap w-[100px] ${
                    isCodeVerified ? "bg-green-500" : "bg-Main hover:bg-Main_hover"
                  }`}
                >
                  {isCodeVerified ? "인증 완료" : "인증 확인"}
                </button>
              </div>
            </div>
          )}

          {isCodeVerified && (
            <>
              <div className="relative">
                <span className="absolute left-3 top-4">
                  <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
                </span>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="새 비밀번호"
                  className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
                  required
                />
                <div className="mt-2 text-xs">
                  {!passwordChecks.length && !passwordChecks.special ? (
                    <p className="text-gray-500">∙ 8자 이상 및 특수문자를 포함해주세요</p>
                  ) : !passwordChecks.length ? (
                    <p className="text-gray-500">∙ 8자 이상 입력해주세요</p>
                  ) : !passwordChecks.special ? (
                    <p className="text-gray-500">∙ 특수문자를 포함해주세요 (!@#$%^&amp;*(),.?":{}|&lt;&gt;)</p>
                  ) : (
                    <p className="text-green-600 font-medium">✓ 사용 가능한 비밀번호입니다</p>
                  )}
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-4">
                  <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
                </span>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="새 비밀번호 확인"
                  className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
                  required
                />
                {formData.confirmNewPassword && (
                  <div className="mt-2 text-xs">
                    {passwordMatch.isDirty && (
                      passwordMatch.isMatching ? (
                        <p className="text-green-600 font-medium">✓ 비밀번호가 일치합니다</p>
                      ) : (
                        <p className="text-red-500">∙ 비밀번호가 일치하지 않습니다</p>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="text-center text-gray-600">
                <Link to="/login" className="hover:text-gray-800 hover:underline font-normal">
                  로그인 페이지
                </Link>
                로 돌아가기
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-Main text-white py-5 rounded-md hover:bg-Main_hover transition-colors text-lg"
              >
                {isResetting ? "변경 중..." : "비밀번호 변경하기"}
              </button>
            </>
          )}

          {errorMessage && <p className="text-red-500 text-center mt-2">{errorMessage}</p>}
        </form>
      </div>
    </div>
  );
};

export default ResetPwd;
