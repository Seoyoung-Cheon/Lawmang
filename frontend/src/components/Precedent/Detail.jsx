import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCaseDetail, fetchPrecedentSummary } from "./precedentApi";
import Popup from "./Popup";
import DOMPurify from "dompurify"; // XSS 방지 라이브러리
import loadingGif from "../../assets/loading.gif";
import { useSelector } from "react-redux";
import { useCreateViewedMutation } from "../../redux/slices/historyApi";

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [createViewed] = useCreateViewedMutation();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [precedentDetail, setPrecedentDetail] = useState(null);
  const [summary, setSummary] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isViewedSaved, setIsViewedSaved] = useState(false); // 저장 여부 체크용

  // ✅ 판례 열람 기록 저장
  useEffect(() => {
    const saveViewHistory = async () => {
      if (!user?.id || !id || isViewedSaved) {
        // isViewedSaved 체크 추가
        return;
      }

      try {
        console.log("Detail - 열람 기록 저장 시도:", {
          시간: new Date().toISOString(),
          user_id: user.id,
          precedent_id: parseInt(id),
        });

        await createViewed({
          user_id: user.id,
          consultation_id: null,
          precedent_id: parseInt(id),
        }).unwrap();

        setIsViewedSaved(true); // 저장 완료 표시
        console.log("Detail - 열람 기록 저장 성공");
      } catch (error) {
        console.error("Detail - 열람 기록 저장 실패:", error);
      }
    };

    saveViewHistory();
  }, [id, user, createViewed, isViewedSaved]); // isViewedSaved 의존성 추가

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

  // 판례 요약 가져오기
  const handleFetchSummary = async () => {
    try {
      setSummary(null); // 기존 요약 초기화
      const summaryText = await fetchPrecedentSummary(id);
      setSummary(summaryText);
    } catch (error) {
      console.error("요약 정보를 불러오는데 실패했습니다.");
      setSummary("요약을 가져오는 중 오류가 발생했습니다.");
    }
  };

  // 뒤로가기 핸들러
  const handleGoBack = () => {
    // 뒤로가기 전에 fromDetail 플래그 설정
    sessionStorage.setItem("fromDetail", "true");
    navigate(-1);
  };

  // 로딩 상태 렌더링
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

  // 에러 상태 렌더링
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

  // 판례 상세 정보가 없는 경우
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

  // HTML 데이터일 경우 iframe으로 표시
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

            <div className="border border-gray-300 rounded-3xl p-4 sm:p-8 w-full max-w-[900px] h-[790px] ">
              <iframe
                src={iframeUrl}
                title="판례 상세"
                width="100%"
                height="100%"
                style={{ border: "none" }}
                className="overflow-auto"
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

          <div className="border border-gray-300 rounded-3xl p-4 sm:p-8 w-full max-w-[900px] h-[790px]">
            <div className="relative flex flex-col sm:flex-row sm:justify-center sm:items-center mb-6 pb-6 border-b border-gray-200 shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0 text-center sm:text-left">
                판례 상세
              </h2>
              <div className="sm:absolute sm:right-[20px] w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsPopupOpen(true);
                    handleFetchSummary();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-Main text-white rounded-lg hover:bg-Main_hover transition-all"
                >
                  요약보기
                </button>
                <Popup
                  isOpen={isPopupOpen}
                  onClose={() => setIsPopupOpen(false)}
                  summary={summary}
                />
              </div>
            </div>

            <div className="h-[650px] p-4 sm:p-6 rounded-2xl overflow-y-auto">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start pb-4 border-b border-gray-100">
                  <span className="w-full sm:w-24 font-bold mb-1 sm:mb-0">
                    법원명:
                  </span>
                  <span className="sm:flex-1">
                    {precedentDetail?.법원명 || "정보 없음"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start pb-4 border-b border-gray-100">
                  <span className="w-full sm:w-24 font-bold mb-1 sm:mb-0">
                    선고일자:
                  </span>
                  <span className="sm:flex-1">
                    {precedentDetail?.선고일자 || "정보 없음"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="w-full sm:w-24 font-bold mb-1 sm:mb-0">
                    판례내용:
                  </span>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <span
                      className="text-gray-800 leading-relaxed whitespace-pre-line text-sm sm:text-base"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          (
                            precedentDetail?.판례내용 || "자료가 없습니다."
                          ).replace(/\n/g, "<br />")
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
