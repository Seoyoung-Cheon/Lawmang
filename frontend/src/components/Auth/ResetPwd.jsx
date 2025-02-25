import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSendResetCodeMutation, useVerifyResetCodeMutation, useResetPasswordMutation } from "../../redux/slices/authApi";

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
      if (response.exists === false) {
        setErrorMessage("등록되지 않은 이메일입니다.");
        return;
      }
      setIsCodeSent(true);
      setErrorMessage("");
      alert("이메일로 인증 코드가 발송되었습니다!");
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
      await verifyResetCode({ 
        email: formData.email, 
        code: formData.code 
      }).unwrap();
      setIsCodeVerified(true);
      setErrorMessage("");
      alert("이메일 인증이 완료되었습니다!");
    } catch (err) {
      setErrorMessage("잘못된 인증 코드입니다.");
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
      
      <div className="bg-white/80 backdrop-blur-sm p-12 mt-10 rounded-lg w-[700px] h-auto shadow-lg relative border-2 border-white/50">
        <h1 className="text-4xl font-bold text-black mb-8 text-center">
          비밀번호 재설정
        </h1>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="relative">
            <label className="block text-black mb-2 text-lg">이메일</label>
            <div className="flex">
              <input
                type="email"
                name="email"
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

          {isCodeSent && (
            <div className="relative">
              <label className="block text-black mb-2 text-lg">인증 코드</label>
              <div className="flex">
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="이메일로 받은 인증 코드를 입력하세요"
                  className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
                  required
                  disabled={isCodeVerified}
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isCodeVerified}
                  className={`ml-2 px-4 py-2 text-white rounded-md ${
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
                <label className="block text-black mb-2 text-lg">새 비밀번호</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="새 비밀번호를 입력해주세요"
                  className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
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
                <label className="block text-black mb-2 text-lg">새 비밀번호 확인</label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={formData.confirmNewPassword}
                  onChange={handleChange}
                  placeholder="새 비밀번호를 다시 입력해주세요"
                  className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
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

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-Main text-white py-4 rounded-md hover:bg-Main_hover transition-colors text-lg mb-[25px]"
              >
                {isResetting ? "변경 중..." : "비밀번호 변경하기"}
              </button>
            </>
          )}
        </form>

        {errorMessage && <p className="text-red-500 text-center mt-2">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default ResetPwd;
