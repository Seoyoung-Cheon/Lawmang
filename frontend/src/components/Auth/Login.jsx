import React, { useState } from "react";
import { AiOutlineMail } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";
import { MdOutlinePersonOutline } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    navigate("/");
  };

  // 임시 로그인 처리 함수
  const handleDemoLogin = () => {
    login();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* 배경 */}
      <div className="absolute inset-0 bg-[#e1e0df]" />

      {/* 로그인 폼 */}
      <div className="bg-white/50 backdrop-blur-sm p-12 rounded-lg w-[500px] shadow-lg relative border-2 border-white/50 z-10">
        {/* 프로필 이미지 */}
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
          <div className="w-40 h-40 bg-gray-300 rounded-full flex items-center justify-center relative">
            <MdOutlinePersonOutline className="w-20 h-20 text-[#f5f4f2]" />
          </div>
        </div>

        <form className="space-y-8 mt-16" onSubmit={handleSubmit}>
          {/* 이메일 입력 */}
          <div className="relative">
            <span className="absolute left-3 top-3">
              <AiOutlineMail className="w-6 h-6 text-gray-400" />
            </span>
            <input
              type="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
            />
          </div>

          {/* 비밀번호 입력 */}
          <div className="relative">
            <span className="absolute left-3 top-3">
              <RiLockPasswordLine className="w-6 h-6 text-gray-400" />
            </span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 mb-10 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
            />
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center text-gray-600">
            회원이 아니신가요?{" "}
            <Link
              to="/signup"
              className="text-gray-800 hover:underline font-medium"
            >
              회원가입하기
            </Link>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full bg-Main text-white py-3 rounded-md hover:bg-Main_hover transition-colors"
          >
            로그인
          </button>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/50 text-gray-500">
                임시 입니다.
              </span>
            </div>
          </div>

          {/* 데모 로그인 버튼 */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors text-sm"
          >
            데모 계정으로 로그인
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
