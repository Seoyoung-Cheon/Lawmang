import React, { useState, useEffect } from "react";
import axios from "axios";
import { ImYoutube2 } from "react-icons/im";

const Youtube = () => {
  // 상태 변수 설정
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 4;

  useEffect(() => {
    const lastRequestTime = localStorage.getItem("lastRequestTime"); // 로컬 스토리지에서 마지막 요청 시간 가져오기
    const currentTime = new Date().getTime(); // 현재 시간 (밀리초 단위)

    // 하루가 지나지 않았다면 API 요청을 하지 않음
    if (lastRequestTime && currentTime - lastRequestTime < 24 * 60 * 60 * 1000) {
      // 하루가 지나지 않았으면 이전 데이터를 사용
      setLoading(false); // 데이터를 바로 사용할 수 있도록 로딩 종료
      return;
    }

    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // 환경 변수에서 API 키 가져오기
    
    axios
      .get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          part: "snippet",
          q: "법률",
          type: "video",
          maxResults: 4,
          key: YOUTUBE_API_KEY,
        },
      })
      .then((response) => {
        setVideos(response.data.items); // 응답 데이터에서 영상 항목 저장
        setLoading(false); // 로딩 상태 종료

        // API 요청 후 현재 시간을 로컬 스토리지에 저장
        localStorage.setItem("lastRequestTime", currentTime);
      })
      .catch((error) => {
        setError("Failed to fetch videos."); // 오류 처리
        setLoading(false); // 로딩 종료
      });
  }, []); // 빈 배열은 컴포넌트가 마운트될 때만 실행

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
    <div className="container">
      <div className="left-layout">
        <div className="flex items-center gap-4">
          <ImYoutube2 className="text-9xl text-red-500" />
          <p className="text-2xl font-medium">법률 관련 유튜브</p>
        </div>
        <ul className="flex flex-wrap">
          {currentVideos.map((video) => (
            <li key={video.id.videoId} className="w-1/2 p-4 border-1 border-black rounded-md">
              <div className="w-full h-full">
                <a
                  href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={video.snippet.thumbnails.medium.url}
                    alt={video.snippet.title}
                    className="rounded-lg w-full object-cover"
                  />
                  <div className="mt-2 text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600">
                    {video.snippet.title}
                  </div>
                </a>
              </div>
            </li>
          ))}
        </ul>
        
        {/* 페이지네이션 UI */}
        <div className="pagination flex justify-center gap-2 mt-4">
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
      <div className="right-layout">
        {/* 오른쪽 영역에 들어갈 내용 */}
      </div>
    </div>
  );
};

export default Youtube;
