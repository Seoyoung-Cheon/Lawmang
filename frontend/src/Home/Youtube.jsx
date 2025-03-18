import React, { useState, useEffect } from "react";
import axios from "axios";
import { ImYoutube2 } from "react-icons/im";
import { FaYoutube } from "react-icons/fa";
import he from "he";

const Youtube = () => {
  // 상태 변수 설정
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 4;
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const lastRequestTime = localStorage.getItem("lastRequestTime");
    const cachedVideos = localStorage.getItem("cachedVideos");
    const currentTime = new Date().getTime();

    // 캐시된 비디오가 있고 1시간이 지나지 않았다면 캐시된 데이터 사용
    if (
      cachedVideos &&
      lastRequestTime &&
      // 시간 수정할거면 앞에 24 * 60 * 60 * 1000 넣기
      currentTime - Number(lastRequestTime) < 24 * 60 * 60 * 1000
    ) {
      // console.log("캐시된 데이터 사용");
      setVideos(JSON.parse(cachedVideos));
      setLoading(false);
      return;
    } else {
      // console.log("새로운 API 요청 실행");
    }

    const YOUTUBE_API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
      setError("YouTube API 키가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }

    // 1년 전 날짜 계산
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const publishedAfter = oneYearAgo.toISOString();

    // 랜덤하게 가져와서 관련성순으로 배열
    const orderOptions = ["relevance"];
    const randomOrder =
      orderOptions[Math.floor(Math.random() * orderOptions.length)];

    axios
      .get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: "snippet",
          q: "법률 상식",
          type: "video",
          maxResults: 12,
          key: YOUTUBE_API_KEY,
          order: randomOrder,
          publishedAfter: publishedAfter,
        },
      })
      .then((response) => {
        setVideos(response.data.items);
        setLoading(false);

        // API 요청 후 현재 시간과 데이터를 로컬 스토리지에 저장
        localStorage.setItem(
          "cachedVideos",
          JSON.stringify(response.data.items)
        );
        localStorage.setItem("lastRequestTime", currentTime.toString());
      })
      .catch((error) => {
        setError(
          `동영상을 가져오는데 실패했습니다: ${
            error.response?.data?.error?.message || error.message
          }`
        );
        setLoading(false);
      });
  }, []);

  // 현재 페이지에 표시할 영상 계산
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = videos.slice(indexOfFirstVideo, indexOfLastVideo);

  // 전체 페이지 수 계산 (dot의 개수를 결정)
  const totalPages = Math.ceil(videos.length / videosPerPage);

  // 페이지 변경 핸들러 (dot 클릭 시 페이지를 변경)
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 동영상 자동 롤링을 위한 useEffect
  useEffect(() => {
    let interval;
    if (autoPlay) {
      interval = setInterval(() => {
        setCurrentPage((prev) => (prev === totalPages ? 1 : prev + 1));
      }, 5000); // 5초마다 변경
    }
    return () => clearInterval(interval);
  }, [autoPlay, totalPages]);

  // 마우스 호버 시 자동 롤링 일시 정지
  const handleMouseEnter = () => setAutoPlay(false);
  const handleMouseLeave = () => setAutoPlay(true);

  return (
    <div
      className="container !mt-[100px] !mb-[60px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="left-layout">
        <div className="mx-[-100px]">
          <div className="flex items-center gap-2">
            <ImYoutube2 className="text-9xl text-red-500" />
            <p className="text-2xl font-medium">법률 관련 유튜브</p>
          </div>

          {error && <div className="text-red-500 p-4 text-center">{error}</div>}
          {loading && <div className="text-center p-4">로딩 중...</div>}

          {/* ✅ FAQ, CardList와 동일한 2열 레이아웃 유지 */}
          <ul
            className="grid grid-cols-2 gap-2 justify-items-start w-[84%]"
            onMouseEnter={() => setAutoPlay(false)}
            onMouseLeave={() => setAutoPlay(true)}
          >
            {currentVideos.map((video) => (
              <li
                key={video.id.videoId || video.id}
                className="rounded-lg p-3 w-full max-w-[500px]"
              >
                <div className="w-full overflow-hidden relative shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group">
                  <a
                    href={`https://www.youtube.com/watch?v=${
                      video.id.videoId || video.id
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative"
                  >
                    <div className="relative overflow-hidden rounded-t-xl">
                      <img
                        src={video.snippet.thumbnails.medium.url}
                        alt={video.snippet.title}
                        className="w-full h-[200px] object-cover transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaYoutube className="text-white text-5xl transform scale-0 group-hover:scale-100 transition-transform duration-300" />
                      </div>
                    </div>

                    <div className="h-[80px] p-3 bg-white">
                      <h3
                        className="text-lg font-medium text-gray-900 line-clamp-2 
                                   group-hover:text-Main transition-colors duration-300"
                      >
                        {he.decode(video.snippet.title)}
                      </h3>
                    </div>
                  </a>
                </div>
              </li>
            ))}
          </ul>

          {/* 페이지네이션 UI */}
          <div className="flex justify-center gap-3 mt-10 mb-8 -ml-[160px]">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => handlePageChange(number)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentPage === number
                      ? "bg-gray-500 w-6"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Page ${number}`}
                />
              )
            )}
          </div>
        </div>
      </div>
      <div className="right-layout"></div>
    </div>
  );
};

export default Youtube;
