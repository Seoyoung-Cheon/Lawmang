import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCurrentUserQuery, useUpdateUserMutation, useCheckNicknameQuery, useVerifyCurrentPasswordMutation, useDeleteUserMutation } from "../../redux/slices/authApi";
import { AiOutlineMail } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";
import { CiUser } from "react-icons/ci";
import { useDispatch } from 'react-redux';
import { updateUserInfo } from '../../redux/slices/authSlice';

const Modify = () => {
  const navigate = useNavigate();
  const { data: user } = useGetCurrentUserQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [nicknameStatus, setNicknameStatus] = useState(null);
  const [nicknameError, setNicknameError] = useState("");

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    special: false,
  });
  
  const [passwordMatch, setPasswordMatch] = useState({
    isMatching: false,
    isDirty: false,
  });

  const [formData, setFormData] = useState({
    nickname: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const { data: nicknameData, error: nicknameErrorResponse } = useCheckNicknameQuery(
    formData.nickname,
    { skip: !formData.nickname || formData.nickname === user?.nickname }
  );

  const [currentPasswordVerified, setCurrentPasswordVerified] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  
  const [verifyCurrentPassword] = useVerifyCurrentPasswordMutation();

  const dispatch = useDispatch();

  const [deleteUser] = useDeleteUserMutation();

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        nickname: user.nickname || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 현재 비밀번호가 확인되지 않은 상태에서 새 비밀번호를 입력하려 할 때
    if ((name === "newPassword" || name === "confirmNewPassword") && !currentPasswordVerified) {
      alert("현재 비밀번호를 먼저 확인해주세요.");
      return;
    }

    setFormData({ ...formData, [name]: value });

    // 새 비밀번호 입력 필드일 경우 유효성 검사 실행
    if (name === "newPassword") {
      setPasswordChecks({
        length: value.length >= 8,
        special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
      // 비밀번호 확인 일치 여부 체크
      if (formData.confirmNewPassword) {
        setPasswordMatch({
          isMatching: value === formData.confirmNewPassword,
          isDirty: true,
        });
      }
    }

    // 새 비밀번호 확인 입력 필드일 경우 일치 여부 체크
    if (name === "confirmNewPassword") {
      setPasswordMatch({
        isMatching: value === formData.newPassword,
        isDirty: true,
      });
    }
  };

  const handleCheckNickname = async () => {
    if (!formData.nickname) {
      setNicknameError("닉네임을 입력해주세요.");
      return;
    }

    if (formData.nickname === user?.nickname) {
      setNicknameStatus(false);
      setNicknameError("∙ 이미 사용 중인 닉네임입니다.");
      return;
    }

    if (nicknameData) {
      setNicknameStatus(true);
      setNicknameError("");
    } else {
      setNicknameStatus(false);
      setNicknameError("∙ 이미 사용 중인 닉네임입니다.");
    }
  };

  const handleVerifyCurrentPassword = async () => {
    if (!formData.currentPassword) {
      setCurrentPasswordError("현재 비밀번호를 입력해주세요.");
      return;
    }

    try {
      await verifyCurrentPassword({ currentPassword: formData.currentPassword }).unwrap();
      setCurrentPasswordVerified(true);
      setCurrentPasswordError("");
    } catch (err) {
      setCurrentPasswordVerified(false);
      setCurrentPasswordError("∙ 현재 비밀번호가 일치하지 않습니다.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 변경할 데이터가 있는지 확인
    const hasNicknameChange = formData.nickname !== user?.nickname;
    const hasPasswordChange = formData.newPassword || formData.confirmNewPassword;

    // 아무 변경사항이 없는 경우
    if (!hasNicknameChange && !hasPasswordChange) {
      alert("변경할 정보를 입력해주세요.");
      return;
    }

    // 비밀번호 변경 시 현재 비밀번호 검증 확인
    if (hasPasswordChange && !currentPasswordVerified) {
      alert("현재 비밀번호 확인이 필요합니다.");
      return;
    }

    // 닉네임 변경 시 중복 확인 체크
    if (hasNicknameChange && nicknameStatus !== true) {
      alert("닉네임 중복 확인을 해주세요.");
      return;
    }

    // 비밀번호 변경 시 유효성 검사
    if (hasPasswordChange) {
      // 새 비밀번호만 입력하고 확인은 안 한 경우
      if (!formData.newPassword || !formData.confirmNewPassword) {
        alert("새 비밀번호와 확인을 모두 입력해주세요.");
        return;
      }

      // 비밀번호 유효성 검사
      if (!passwordChecks.length || !passwordChecks.special) {
        alert("비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.");
        return;
      }

      // 비밀번호 일치 여부 확인
      if (formData.newPassword !== formData.confirmNewPassword) {
        alert("새 비밀번호가 일치하지 않습니다.");
        return;
      }
    }

    // 변경할 데이터만 포함하여 전송
    const updateData = {};
    if (hasNicknameChange) {
      updateData.nickname = formData.nickname;
    }
    if (hasPasswordChange) {
      updateData.currentPassword = formData.currentPassword;
      updateData.newPassword = formData.newPassword;
    }

    try {
      const result = await updateUser(updateData).unwrap();
      // Redux store 업데이트
      if (updateData.nickname) {
        dispatch(updateUserInfo({ nickname: updateData.nickname }));
      }
      
      alert("회원정보가 성공적으로 수정되었습니다!");
      navigate("/mypage");
    } catch (err) {
      console.error("❌ 회원정보 수정 실패:", err);
      alert(err.data?.detail || "회원정보 수정 실패");
    }
  };

  // 회원탈퇴 핸들러 추가
  const handleWithdraw = async () => {
    const confirmed = window.confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    
    if (confirmed) {
      try {
        await deleteUser().unwrap();
        alert("회원탈퇴가 완료되었습니다.");
        
        // ✅ 탈퇴 후 홈 화면으로 리디렉트
        navigate("/");
  
      } catch (err) {
        console.error("회원탈퇴 실패:", err);
        alert(err.data?.detail || "회원탈퇴 처리 중 오류가 발생했습니다.");
      }
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[#e1e0df]" />

      <div className="bg-white/50 backdrop-blur-sm p-12 rounded-lg w-[600px] shadow-lg relative border-2 border-white/50 z-10">
        <h2 className="text-4xl text-neutral-700 text-center mb-8">회원정보 수정</h2>

        <form onSubmit={handleSubmit} className="space-y-8 mt-16">
          {/* 이메일 (수정 불가능) */}
          <div className="relative">
            <span className="absolute left-3 top-4">
              <AiOutlineMail className="w-6 h-6 text-gray-400" />
            </span>
            <input
              type="email"
              value={user?.email || ""}
              className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 outline-none text-gray-500"
              disabled
            />
          </div>

          {/* 닉네임 (수정 가능) */}
          <div className="relative">
            <span className="absolute left-3 top-4">
              <CiUser className="w-6 h-6 text-gray-400" />
            </span>
            <div className="flex">
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                placeholder="닉네임"
                className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                className="ml-2 px-4 py-2 text-white rounded-md whitespace-nowrap w-[100px] bg-Main hover:bg-Main_hover"
              >
                중복 확인
              </button>
            </div>
            <div className="mt-2 text-xs">
              {nicknameStatus === false && <p className="text-red-500">{nicknameError}</p>}
              {nicknameStatus === true && <p className="text-green-600">✓ 사용 가능한 닉네임입니다.</p>}
            </div>
          </div>

          {/* 현재 비밀번호 입력 */}
          <div className="relative">
            <span className="absolute left-3 top-3">
              <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
            </span>
            <div className="flex">
              <input
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="현재 비밀번호"
                className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
              />
              <button
                type="button"
                onClick={handleVerifyCurrentPassword}
                disabled={currentPasswordVerified}
                className={`ml-2 px-4 py-2 text-white rounded-md whitespace-nowrap w-[100px] ${
                  currentPasswordVerified ? "bg-green-500" : "bg-Main hover:bg-Main_hover"
                }`}
              >
                {currentPasswordVerified ? "확인 완료" : "확인"}
              </button>
            </div>
            <div className="mt-2 text-xs">
              {currentPasswordError && (
                <p className="text-red-500">{currentPasswordError}</p>
              )}
              {currentPasswordVerified && (
                <p className="text-green-600">✓ 비밀번호가 확인되었습니다</p>
              )}
            </div>
          </div>

          {/* 새 비밀번호 입력 (선택사항) */}
          <div className="relative">
            <span className="absolute left-3 top-3">
              <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
            </span>
            <input
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="새 비밀번호"
              className={`w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 
                ${!currentPasswordVerified ? 'border-gray-300 text-gray-400' : 'border-gray-400 focus:border-gray-600'} 
                outline-none placeholder-gray-400`}
              disabled={!currentPasswordVerified}
            />
            {/* 비밀번호 조건 표시 */}
            <div className="mt-2 text-xs">
              {!currentPasswordVerified ? (
                <p className="text-gray-500">∙ 비밀번호 변경을 원하시면 현재 비밀번호를 먼저 확인해주세요.</p>
              ) : (
                <>
                  {!passwordChecks?.length && !passwordChecks?.special ? (
                    <p className="text-gray-500">
                      ∙ 8자 이상 및 특수문자를 포함해주세요
                    </p>
                  ) : !passwordChecks?.length ? (
                    <p className="text-gray-500">∙ 8자 이상 입력해주세요</p>
                  ) : !passwordChecks?.special ? (
                    <p className="text-gray-500">
                      ∙ 특수문자를 포함해주세요 (!@#$%^&amp;*(),.?":{}|&lt;&gt;)
                    </p>
                  ) : (
                    <p className="text-green-600 font-medium">
                      ✓ 사용 가능한 비밀번호입니다
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 새 비밀번호 확인 */}
          <div className="relative">
            <span className="absolute left-3 top-3">
              <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
            </span>
            <input
              name="confirmNewPassword"
              type="password"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="새 비밀번호 확인"
              className={`w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 
                ${!currentPasswordVerified ? 'border-gray-300 text-gray-400' : 'border-gray-400 focus:border-gray-600'} 
                outline-none placeholder-gray-400`}
              disabled={!currentPasswordVerified}
            />
            {formData.confirmNewPassword && (
              <div className="mt-2 text-xs">
                {passwordMatch.isDirty &&
                  (passwordMatch.isMatching ? (
                    <p className="text-green-600 font-medium">
                      ✓ 비밀번호가 일치합니다
                    </p>
                  ) : (
                    <p className="text-red-500">
                      ∙ 비밀번호가 일치하지 않습니다
                    </p>
                  ))}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-4">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-Main text-white py-5 rounded-md hover:bg-Main_hover transition-colors text-lg"
            >
              {isUpdating ? "수정 중..." : "회원정보 수정하기"}
            </button>
          </div>
        </form>
        
        {/* 회원탈퇴 버튼 추가 */}
        <div className="mt-8 text-center">
          <button
            onClick={handleWithdraw}
            className="text-red-500 hover:text-red-700 text-sm underline"
          >
            회원탈퇴
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modify;
