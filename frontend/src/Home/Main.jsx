import React, { useEffect, useRef } from "react";
import { HiOutlineChevronDoubleDown } from "react-icons/hi2";
import mainVideo from "../assets/main_video.mp4";
import Youtube from "./Youtube";
import CardList from "./CardList";
import FAQ from "./FAQ";

const Main = () => {
  const videoRef = useRef(null);

  {
    /* 비디오 재생속도 조절 */
  }
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="relative w-full h-screen">
        <div className="opacity-50 overlay w-full h-full bg-black left-0 top-0 z-10 absolute"></div>
        <div className="video_container w-screen h-screen absolute top-0 left-0 overflow-hidden">
          <video
            ref={videoRef}
            src={mainVideo}
            className="w-full h-full object-cover scale-250"
            autoPlay
            muted
            loop
          ></video>
        </div>

        {/* 메인 문구 */}
        <div className="absolute bottom-[125px] left-20 z-20 text-white animate-slide-up">
          <h1 className="text-6xl font-bold mb-10">
            법망 안의 새로운 시작
            <br />
          </h1>
          <p className="text-3xl text-gray-300">당신의 법률 파트너, 로망</p>
        </div>

        {/* 스크롤 유도 애니메이션 */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white flex flex-col items-center animate-bounce">
          <HiOutlineChevronDoubleDown size={40} className="scale-x-130" />
        </div>
      </div>
      <Youtube />
      <CardList />
      <FAQ />
    </div>
  );
};

export default Main;
