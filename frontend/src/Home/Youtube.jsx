import React, { useState, useEffect } from "react";
import axios from "axios";
import { ImYoutube2 } from "react-icons/im";
import he from "he";

const Youtube = () => {
  // 상태 변수 설정
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 4;

  useEffect(() => {
    console.log("API KEY:", process.env.REACT_APP_YOUTUBE_API_KEY);
    const lastRequestTime = localStorage.getItem("lastRequestTime");
    const cachedVideos = localStorage.getItem("cachedVideos");
    const currentTime = new Date().getTime();

    // 디버깅을 위한 로그 추가
    console.log("마지막 요청 시간:", new Date(Number(lastRequestTime)));
    console.log("현재 시간:", new Date(currentTime));
    console.log(
      "경과 시간(시간):",
      (currentTime - Number(lastRequestTime)) / (1000 * 60 * 60)
    );
    console.log("캐시된 비디오 존재:", !!cachedVideos);

    // 캐시된 비디오가 있고 1시간이 지나지 않았다면 캐시된 데이터 사용
    if (
      cachedVideos &&
      lastRequestTime &&
      // 시간 수정할거면 앞에 24 * 60 * 60 * 1000 넣기
      currentTime - Number(lastRequestTime) < 24 * 60 * 60 * 1000
    ) {
      console.log("캐시된 데이터 사용");
      setVideos(JSON.parse(cachedVideos));
      setLoading(false);
      return;
    } else {
      console.log("새로운 API 요청 실행");
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

  console.log(videos);

  // 현재 페이지에 표시할 영상 계산
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = videos.slice(indexOfFirstVideo, indexOfLastVideo);

  // 전체 페이지 수 계산
  const totalPages = Math.ceil(videos.length / videosPerPage);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-20">
      <div className="left-layout">
        <div className="flex items-center gap-4 mx-[-100px]">
          <ImYoutube2 className="text-9xl text-red-500" />
          <p className="text-2xl font-medium">법률 관련 유튜브</p>
        </div>

        {/* 에러 메시지 표시 */}
        {error && <div className="text-red-500 p-4 text-center">{error}</div>}

        {/* 로딩 표시 */}
        {loading && <div className="text-center p-4">로딩 중...</div>}

        <ul className="grid grid-cols-2 gap-8 ml-[-100px]">
          {currentVideos.map((video) => (
            <li key={video.id.videoId} className="rounded-lg p-4">
              <div className="w-full">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="w-full h-[230px] object-cover rounded-xl"
                  />
                  <div className="mt-4 text-xl font-medium text-gray-900 line-clamp-2 hover:text-blue-600">
                    {he.decode(video.snippet.title)}
                  </div>
                </a>
              </div>
            </li>
          ))}
        </ul>

        {/* 페이지네이션 UI */}
        <div className="pagination flex justify-center gap-2 mt-5 ml-[-100px]">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`px-3 py-1 border rounded ${
                currentPage === number
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {number}
            </button>
          ))}
        </div>
      </div>
      <div className="right-layout">{/* 오른쪽 영역에 들어갈 내용 */}</div>
    </div>
  );
};

export default Youtube;
