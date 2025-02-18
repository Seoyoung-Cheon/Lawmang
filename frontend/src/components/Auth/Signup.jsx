import React from "react";

const Signup = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* 단색 배경 */}
      <div className="absolute inset-0 bg-[#e1e0df]" />

      <div className="bg-white/10 backdrop-blur-sm p-20 rounded-xl w-[800px] shadow-2xl relative border border-white/30 z-10">
        {/* Signup 텍스트 */}
        <h1 className="text-4xl font-bold text-white mb-12 text-center">
          Signup
        </h1>
      </div>
    </div>
  );
};

export default Signup;
