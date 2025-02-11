import React from "react";
import mainVideo from "../assets/main_video.mp4";
import Youtube from "./Youtube";

const Main = () => {
  return (
    <div className="overflow-x-hidden">
      <div className="relative w-full h-screen">
        <div className="opacity-45 overlay w-full h-full bg-black left-0 top-0 z-10 absolute"></div>
        <div className="video_container w-screen h-screen absolute top-0 left-0 overflow-hidden">
          <video
            src={mainVideo}
            className="w-full h-full object-cover scale-250"
            autoPlay
            muted
            loop
          ></video>
        </div>

        {/* 메인 문구 */}
        <div className="absolute bottom-20 left-20 z-20 text-white ">
          <h1 className="text-6xl font-bold mb-10 ">
            법망 안의 새로운 시작
            <br />
          </h1>
          <p className="text-3xl text-gray-300">당신의 법률 파트너, 로망</p>
        </div>
      </div>
      <Youtube />
    </div>
  );
};

export default Main;
