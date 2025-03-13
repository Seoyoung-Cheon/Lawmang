import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCaseDetail } from "./precedentApi"; // API 요청 함수
import Popup from "./Popup";
import DOMPurify from "dompurify"; // XSS 방지 라이브러리
import loadingGif from "../../assets/loading.gif";
import { useSelector } from "react-redux";
import { useCreateViewedLogMutation } from "../../redux/slices/mylogApi";

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [createViewedLog] = useCreateViewedLogMutation();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [precedentDetail, setPrecedentDetail] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 판례 열람 기록 저장
  useEffect(() => {
    if (user?.id && id) {
      createViewedLog({
        user_id: user.id,
        consultation_id: null,
        precedent_number: id,
      });
    }
  }, [id, user, createViewedLog]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchPrecedentDetail = async () => {
      setIsLoading(true);
      setError(null);

      // console.log("Fetching detail for pre_number:", id);

      try {
        const data = await fetchCaseDetail(id);

        if (data.type === "html") {
          // HTML에서 iframe URL 추출
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.content, "text/html");
          const iframeElement = doc.querySelector("iframe");

          if (iframeElement) {
            const extractedUrl = iframeElement.getAttribute("src");
            setIframeUrl(extractedUrl);
          } else {
            console.warn("⚠️ iframe을 찾을 수 없음");
          }
        }

        setPrecedentDetail(data);
      } catch (error) {
        console.error("판례 상세 정보를 가져오는데 실패했습니다:", error);
        setError("판례 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPrecedentDetail();
    }
  }, [id]);

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    // 뒤로가기 전에 fromDetail 플래그 설정
    sessionStorage.setItem("fromDetail", "true");
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="left-layout">
          <div className="px-0 pt-32 pb-10">
            <div className="flex flex-col justify-center items-center h-[790px] border border-gray-300 rounded-3xl">
              <img src={loadingGif} alt="loading" className="w-16 h-16" />
              <p className="text-lg text-gray-600 mt-4">로딩 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="left-layout">
          <div className="px-0 pt-32 pb-10">
            <div className="flex justify-center items-center h-[790px] border border-gray-300 rounded-3xl">
              <p className="text-lg text-red-500">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!precedentDetail) {
    return (
      <div className="container">
        <div className="left-layout">
          <div className="px-0 pt-32 pb-10">
            <div className="flex justify-center items-center h-[790px] border border-gray-300 rounded-3xl">
              <p className="text-lg text-gray-600">판례를 찾을 수 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ HTML 데이터일 경우 iframe으로 표시
  if (iframeUrl) {
    return (
      <div className="container">
        <div className="left-layout">
          <div className="px-0 pt-[100px] pb-10">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 mb-4 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              <span>목록으로</span>
            </button>

            <div className="border border-gray-300 rounded-3xl p-8 w-[900px] h-[790px]">
              <iframe
                src={iframeUrl}
                title="판례 상세"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                className="overflow-auto "
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 일반 JSON 데이터 렌더링
  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-[100px] pb-10">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 mb-4 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            <span>목록으로</span>
          </button>

          <div className="border border-gray-300 rounded-3xl p-8 w-[900px] h-[790px] ">
            <div className="relative flex justify-center mb-6 pb-6 border-b border-gray-200 shadow-sm">
              <h2 className="text-3xl font-bold">판례 상세</h2>
              <div className="absolute right-[20px]">
                <button
                  onClick={() => setIsPopupOpen(true)}
                  className="px-4 py-2 bg-Main text-white rounded-lg hover:bg-Main_hover transition-all"
                >
                  요약보기
                </button>
                <Popup
                  isOpen={isPopupOpen}
                  onClose={() => setIsPopupOpen(false)}
                />
              </div>
            </div>

            <div className="h-[650px] p-6 rounded-2xl overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-start pb-4 border-b border-gray-100">
                  <span className="w-24 font-bold">법원명:</span>
                  <span>{precedentDetail?.법원명 || "정보 없음"}</span>
                </div>
                <div className="flex items-start pb-4 border-b border-gray-100">
                  <span className="w-24 font-bold">선고일자:</span>
                  <span>{precedentDetail?.선고일자 || "정보 없음"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="w-24 font-bold">판례내용:</span>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span
                      className="text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          precedentDetail?.판례내용 || "자료가 없습니다."
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
