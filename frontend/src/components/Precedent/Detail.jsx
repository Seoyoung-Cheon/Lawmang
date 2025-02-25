import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Popup from "./Popup";
import axios from "axios";
import loadingGif from "../../assets/loading.gif";

const Detail = () => {
  const { id } = useParams();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [precedentDetail, setPrecedentDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrecedentDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Fetching detail for pre_number:", id);

        const response = await axios.get(
          `http://localhost:8000/api/detail/precedent/${id}`
        );

        console.log("API Response:", response.data);
        setPrecedentDetail(response.data);
      } catch (error) {
        console.error("판례 상세 정보를 가져오는데 실패했습니다:", error);
        if (error.response) {
          console.error("Error response:", error.response.data);
          console.error("Error status:", error.response.status);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPrecedentDetail();
    }
  }, [id]);

  // 데이터 확인을 위한 디버깅 로그 추가
  useEffect(() => {
    console.log("Current precedentDetail:", precedentDetail);
  }, [precedentDetail]);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  // 데이터 표시를 위한 유틸리티 함수
  const renderContent = (content, isHtml = false) => {
    if (!content || content.trim() === "") {
      return <span className="text-gray-400 italic">자료가 없습니다.</span>;
    }

    if (isHtml) {
      return <span dangerouslySetInnerHTML={{ __html: content }}></span>;
    }

    return <span>{content}</span>;
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

  if (!precedentDetail) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-600">판례를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-32 pb-10">
          <div className="border border-gray-300 rounded-3xl p-8 w-[900px] h-[790px]">
            {/* 상단 제목과 버튼 */}
            <div className="relative flex justify-end mb-6">
              <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold">
                판례
              </h2>
              <button
                onClick={() => setIsPopupOpen(true)}
                className="px-4 py-2 bg-Main text-white rounded-lg hover:bg-Main_hover transition-all"
              >
                요약보기
              </button>
            </div>

            {/* 구분선과 그림자 */}
            <div className="border-b border-gray-200 shadow-sm mb-6"></div>

            {/* 판결문 내용 */}
            <div className="h-[650px] p-6 rounded-2xl overflow-y-auto">
              <div className="space-y-8">
                {/* 1. 법원명 */}
                <div className="text-center space-y-4 mb-8">
                  <h1 className="text-2xl tracking-widest font-bold">
                    {precedentDetail?.법원명 || ""}
                  </h1>
                  <h2 className="text-xl tracking-widest">
                    {precedentDetail?.선고 || ""}
                  </h2>
                </div>

                <div className="space-y-6">
                  {/* 2. 판결유형 */}
                  <div className="flex items-start pb-4 border-b border-gray-100">
                    <span className="w-24">판결유형 :</span>
                    {renderContent(precedentDetail?.판결유형)}
                  </div>

                  {/* 3. 사건종류명 */}
                  <div className="flex items-start pb-4 border-b border-gray-100">
                    <span className="w-24">사건종류 :</span>
                    {renderContent(precedentDetail?.사건종류명)}
                  </div>

                  {/* 4. 사건번호 */}
                  <div className="flex items-start pb-4 border-b border-gray-100">
                    <span className="w-24">사건번호 :</span>
                    {renderContent(precedentDetail?.사건번호)}
                  </div>

                  {/* 5. 판시사항 */}
                  <div className="flex items-start pb-4 border-b border-gray-100">
                    <span className="w-24 shrink-0">판시사항 :</span>
                    <div className="space-y-2">
                      {renderContent(precedentDetail?.판시사항, true)}
                    </div>
                  </div>

                  {/* 6. 참조조문 */}
                  <div className="flex items-start pb-4 border-b border-gray-100">
                    <span className="w-24 shrink-0">참조조문 :</span>
                    {renderContent(precedentDetail?.참조조문, true)}
                  </div>

                  {/* 7. 판결요지 */}
                  <div className="flex items-start pb-4 border-b border-gray-100">
                    <span className="w-24 shrink-0">판결요지 :</span>
                    <div className="space-y-2">
                      {renderContent(precedentDetail?.판결요지, true)}
                    </div>
                  </div>

                  {/* 8. 판례내용 */}
                  <div className="flex flex-col">
                    <span className="w-24 mb-4">판례내용 :</span>
                    <div className="space-y-4 pl-4 pt-6 bg-gray-50 rounded-lg w-full">
                      {precedentDetail?.판례내용 ? (
                        <span
                          className="whitespace-pre-line text-gray-800 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: precedentDetail.판례내용
                              .split("<br/>")
                              .map(
                                (text) =>
                                  `<p class="mb-4 pb-4 last:border-b-0">${text}</p>`
                              )
                              .join(""),
                          }}
                        ></span>
                      ) : (
                        <p className="text-gray-400 italic pb-4">
                          자료가 없습니다.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 9. 선고일자 */}
                  <div className="flex items-start pb-4 border-b border-gray-100">
                    <span className="w-24">선고일자 :</span>
                    {renderContent(precedentDetail?.선고일자)}
                  </div>

                  {/* 10. 참조판례 */}
                  <div className="flex items-start pb-4">
                    <span className="w-24">참조판례 :</span>
                    {renderContent(precedentDetail?.참조판례, true)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 팝업 컴포넌트 */}
      <Popup isOpen={isPopupOpen} onClose={handleClosePopup} />
    </div>
  );
};

export default Detail;
