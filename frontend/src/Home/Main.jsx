import React, { useEffect, useRef, useState } from "react";
import { HiOutlineChevronDoubleDown } from "react-icons/hi2";
import { FaArrowUp } from "react-icons/fa";
import mainVideo from "../assets/main_video.mp4";
import Youtube from "./Youtube";
import CardList from "./CardList";
import FAQ from "./FAQ";

const Main = () => {
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 비디오 재생속도 조절 및 스크롤 이벤트
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }

    const handleScroll = () => {
      const isBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 10;
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

  const handleScrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-screen">
      <div className="h-screen">
        <div className="fixed w-full h-screen">
          <div className="opacity-50 overlay w-full h-full bg-black left-0 top-0 z-10 absolute"></div>
          <div className="video_container w-screen h-screen absolute top-0 left-0 overflow-hidden">
            <video
              ref={videoRef}
              src={mainVideo}
              className="w-full h-full object-cover scale-250"
              autoPlay
              muted
              loop
              onLoadedMetadata={(e) => {
                e.target.playbackRate = 0.7;
              }}
            ></video>
          </div>

          {/* 메인 문구 */}
          <div className="fixed bottom-[125px] left-20 z-20 text-white">
            <h1 className="text-6xl font-bold mb-10">
              법망 안의 새로운 시작
              <br />
            </h1>
            <p className="text-3xl text-gray-300">당신의 법률 파트너, 로망</p>
          </div>

          {/* 스크롤 유도 애니메이션 */}
          <div 
            onClick={handleScrollDown}
            className="fixed bottom-10 left-[48%] -translate-x-1/2 z-20 text-white flex flex-col items-center animate-bounce cursor-pointer"
          >
            <HiOutlineChevronDoubleDown size={40} className="scale-x-130" />
          </div>
        </div>
      </div>

      {/* 콘텐츠 섹션들 */}
      <div ref={contentRef} className="relative z-10 flex flex-col -space-y-[1px] w-full overflow-hidden">
        <div className="bg-white border-b border-gray-100 rounded-t-[20px] w-full overflow-hidden">
          <Youtube />
        </div>
        <div className="bg-gray-100 w-full">
          <CardList />
        </div>
        <div className="bg-white  w-full">
          <FAQ />
        </div>
      </div>

      {/* 스크롤 탑 버튼 */}
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
