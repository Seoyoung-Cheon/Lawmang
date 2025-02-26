import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSendEmailCodeMutation, useRegisterUserMutation, useVerifyEmailCodeMutation } from "../../redux/slices/authApi";
import { MdOutlinePersonOutline } from "react-icons/md";
import { AiOutlineMail } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";

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
  const [isCodeVerified, setIsCodeVerified] = useState(false); // ✅ 인증 코드 확인 상태 추가
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    special: false
  });
  const [passwordMatch, setPasswordMatch] = useState({
    isMatching: false,
    isDirty: false
  });

  // ✅ 이메일 인증 코드 요청
  const [sendEmailCode, { isLoading: isSendingCode }] = useSendEmailCodeMutation();
  // ✅ 회원가입 요청
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();
  // ✅ 인증 코드 확인 API 추가
  const [verifyEmailCode] = useVerifyEmailCodeMutation();

  // ✅ 입력값 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 비밀번호 입력 필드일 경우 유효성 검사 실행
    if (name === 'password') {
      setPasswordChecks({
        length: value.length >= 8,
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      });
      // 비밀번호 확인 일치 여부 체크
      if (formData.confirmPassword) {
        setPasswordMatch({
          isMatching: value === formData.confirmPassword,
          isDirty: true
        });
      }
    }

    // 비밀번호 확인 입력 필드일 경우 일치 여부 체크
    if (name === 'confirmPassword') {
      setPasswordMatch({
        isMatching: value === formData.password,
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
      await sendEmailCode({ email: formData.email }).unwrap();
      setIsCodeSent(true);
    } catch (err) {
      console.error("인증 코드 요청 실패:", err);
      setErrorMessage(
        Array.isArray(err.data?.detail)
          ? err.data.detail.map((e) => e.msg).join(", ")
          : err.data?.detail || "인증 코드 전송 실패"
      );
    }
  };

  // ✅ 인증 코드 확인 핸들러 추가
  const handleVerifyCode = async () => {
    if (!formData.code) {
      setErrorMessage("인증 코드를 입력해주세요.");
      return;
    }

    try {
      await verifyEmailCode({
        email: formData.email,
        code: formData.code
      }).unwrap();
      setIsCodeVerified(true);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage("잘못된 인증 코드입니다. 다시 확인해주세요.");
      setIsCodeVerified(false);
    }
  };

  // ✅ 회원가입 핸들러 수정
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 비밀번호 유효성 검사
    if (!passwordChecks.length || !passwordChecks.special) {
      setErrorMessage("비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.");
      return;
    }

    if (!isCodeVerified) {
      setErrorMessage("이메일 인증을 완료해주세요.");
      return;
    }

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
      <div className="bg-white/50 backdrop-blur-sm p-12 rounded-lg w-[600px] mt-10 shadow-lg relative border-2 border-white/50 z-10">
        <h2 className="text-4xl text-neutral-700 text-center mb-8">회원가입</h2>
        <form className="space-y-6 mt-16" onSubmit={handleSubmit}>
          {/* 이메일 입력 및 인증 코드 요청 */}
          <div className="relative">
            <span className="absolute left-3 top-4">
              <AiOutlineMail className="w-6 h-6 text-gray-400" />
            </span>
            <div className="flex">
              <input
                name="email"
                type="email"
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

          {/* 인증 코드 입력 */}
          {isCodeSent && (
            <div className="relative">
              <span className="absolute left-3 top-4">
                <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
              </span>
              <div className="flex">
                <input
                  name="code"
                  type="text"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="인증 코드"
                  className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
                  required
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

          {/* 닉네임 입력 */}
          <div className="relative">
            <span className="absolute left-3 top-4">
              <MdOutlinePersonOutline className="w-6 h-6 text-gray-400" />
            </span>
            <input
              name="nickname"
              type="text"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="닉네임"
              className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
              required
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="relative">
            <span className="absolute left-3 top-3">
              <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
            </span>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
              required
            />
            {/* 비밀번호 조건 표시 */}
            <div className="mt-2 text-xs">
              {!passwordChecks?.length && !passwordChecks?.special ? (
                <p className="text-gray-500">∙ 8자 이상 및 특수문자를 포함해주세요</p>
              ) : !passwordChecks?.length ? (
                <p className="text-gray-500">∙ 8자 이상 입력해주세요</p>
              ) : !passwordChecks?.special ? (
                <p className="text-gray-500">∙ 특수문자를 포함해주세요 (!@#$%^&amp;*(),.?":{}|&lt;&gt;)</p>
              ) : (
                <p className="text-green-600 font-medium">✓ 사용 가능한 비밀번호입니다</p>
              )}
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div className="relative">
            <span className="absolute left-3 top-3">
              <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
            </span>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
              required
            />
            {formData.confirmPassword && (
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

          {/* 에러 메시지 */}
          {errorMessage && <p className="text-red-500 text-center">{errorMessage}</p>}

          {/* 로그인 페이지 링크 */}
          <div className="text-center text-gray-600">
            이미 계정이 있으시다면 &nbsp;
            <Link to="/login" className="hover:text-gray-800 underline hover:font-bold">
              로그인 하기
            </Link>
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-Main text-white py-5 rounded-md hover:bg-Main_hover transition-colors text-lg"
          >
            {isRegistering ? "회원가입 중..." : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
