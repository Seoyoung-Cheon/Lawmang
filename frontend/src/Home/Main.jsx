import React, { useEffect, useRef, useState } from "react";
import { HiOutlineChevronDoubleDown } from "react-icons/hi2";
import { FaArrowUp } from "react-icons/fa";
import mainVideo from "../assets/main_video.mp4";
import Youtube from "./Youtube";
import CardList from "./CardList";
import FAQ from "./FAQ";

const Main = () => {
  const videoRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  {
    /* 비디오 재생속도 조절 */
  }
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }

    const handleScroll = () => {
      // 현재 스크롤 위치 + 화면 높이가 문서 전체 높이와 같거나 크면 (= 페이지 끝에 도달)
      const isBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 10; // 약간의 여유를 둠
      setShowScrollTop(isBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
      {/* 왼쪽 여백만 추가 */}
      <div className="ml-[100px]">
        <Youtube />
        <CardList />
        <FAQ />
      </div>

      {/* 맨위로 스크롤 버튼 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed right-[35px] bottom-[80px] z-50 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all duration-300"
        >
          <FaArrowUp size={24} className="text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default Main;
