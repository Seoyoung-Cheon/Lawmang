import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginUserMutation } from "../../redux/slices/authApi"; // ✅ FastAPI 로그인 API 연동
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../../redux/slices/authSlice"; // ✅ Redux에 토큰 저장
import { AiOutlineMail } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";
import { MdOutlinePersonOutline } from "react-icons/md";
import { Link } from "react-router-dom";
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import { useAuth } from './AuthContext';
import axios from 'axios';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [credentials, setCredentialsState] = useState({ email: "", password: "" });
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { login } = useAuth();

  // ✅ FastAPI 로그인 API 호출
  const [loginUser, { isLoading, error }] = useLoginUserMutation();

  // ✅ 입력값 변경 핸들러
  const handleChange = (e) => {
    setCredentialsState({ ...credentials, [e.target.name]: e.target.value });
  };

  // ✅ 로그인 요청 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(credentials).unwrap(); // ✅ FastAPI 로그인 요청
      const token = response.access_token;
      dispatch(setCredentials({ token: token })); // ✅ Redux에 토큰 저장
      localStorage.setItem("token", token); // ✅ 로컬 스토리지에 저장
      login(token); // AuthContext의 login 함수 호출
      alert("로그인 성공!");
      navigate("/"); // ✅ 로그인 성공 시 홈으로 이동
    } catch (err) {
      alert("로그인 실패: " + (err.data?.detail || "서버 오류"));
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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
              name="email"
              placeholder="Email ID"
              value={credentials.email}
              onChange={handleChange}
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
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 mb-10 text-lg bg-transparent border-b-2 border-gray-400 focus:border-gray-600 outline-none placeholder-gray-400"
              required
            />
          </div>

          {/* 비밀번호 재설정/회원가입 링크 */}
          <div className="text-center text-gray-600">
            <Link to="/reset-password" className="hover:text-gray-800 hover:underline font-normal">비밀번호 찾기</Link>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Link to="/signup" className="hover:text-gray-800 hover:underline font-normal">
              회원가입하기
            </Link>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-Main text-white py-3 rounded-md hover:bg-Main_hover transition-colors"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>

          {/* 로그인 에러 메시지 표시 */}
          {error && <p className="text-red-500 text-center">로그인 실패: {error.data?.detail || "서버 오류"}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;