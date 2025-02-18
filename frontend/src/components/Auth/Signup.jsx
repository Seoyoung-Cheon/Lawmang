import React from "react";

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* 단색 배경 */}
      <div className="absolute inset-0 bg-[#e1e0df]" />

      {/* 회원가입 폼 */}
      <div className="bg-white/80 backdrop-blur-sm p-12 mt-10 rounded-lg w-[700px] h-[700px] shadow-lg relative border-2 border-white/50">
        {/* 회원가입 텍스트 */}
        <h1 className="text-4xl font-bold text-black mb-20 text-center">
          회원가입
        </h1>

        <form className="h-[500px] flex flex-col justify-between">
          <div className="space-y-8">
            {/* 이메일 입력 */}
            <div className="relative">
              <label className="block text-black mb-2 text-lg">이메일</label>
              <input
                type="email"
                placeholder="이메일을 입력해주세요"
                className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="relative">
              <label className="block text-black mb-2 text-lg">비밀번호</label>
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요"
                className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="relative">
              <label className="block text-black mb-2 text-lg">
                비밀번호 확인
              </label>
              <input
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                className="w-full pl-4 pr-4 py-3 text-sm bg-transparent border-b-2 border-gray-300 focus:border-gray-600 outline-none placeholder-gray-300"
              />
            </div>
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            className="w-full bg-Main text-white py-4 rounded-md hover:bg-Main_hover transition-colors text-lg mb-[25px]"
          >
            회원가입하기
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
