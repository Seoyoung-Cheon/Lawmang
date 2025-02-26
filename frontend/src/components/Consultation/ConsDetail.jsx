import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import openLicenseImg from "../../assets/open_license.jpg";
import { TbCircleLetterQFilled, TbCircleLetterA } from "react-icons/tb";
import axios from "axios";
import loadingGif from "../../assets/loading.gif";

const ConsDetail = () => {
  const { id } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsultation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get(
          `http://localhost:8000/api/detail/consultation/${id}`
        );

        console.log("API Response:", response.data);
        setConsultation(response.data);
      } catch (error) {
        console.error("상담 상세 정보를 가져오는데 실패했습니다:", error);
        if (error.response) {
          console.error("Error response:", error.response.data);
          console.error("Error status:", error.response.status);
        }
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchConsultation();
    }
  }, [id]);

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

  if (!consultation) {
    return (
      <div className="container">
        <div className="left-layout">
          <div className="px-0 pt-32 pb-10">
            <div className="flex justify-center items-center h-[790px] border border-gray-300 rounded-3xl">
              <p className="text-lg text-gray-600">
                상담 내용을 찾을 수 없습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="left-layout">
        <div className="px-0 pt-[135px] pb-10">
          {/* 상단 정보 영역 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            {/* 구분 */}
            <div className="flex border-b border-gray-100 pb-4 mb-4">
              <span className="text-sm text-gray-500 w-20">구분</span>
              <span className="text-sm text-black">
                {consultation.category}
              </span>
            </div>

            {/* 제목 */}
            <div className="flex">
              <span className="text-sm text-gray-500 w-20">제목</span>
              <span className="text-sm text-black font-medium">
                {consultation.title}
              </span>
            </div>
          </div>

          {/* 질문 영역 */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center text-base font-semibold text-gray-900">
                <TbCircleLetterQFilled className="w-8 h-8 mr-2 text-black text-2xl" />
                질문
              </div>
              <div className="text-sm text-gray-500 ml-2">
                {consultation.date}
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {consultation.question}
            </div>
          </div>

          {/* 답변 영역 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center text-base font-semibold text-gray-900 mb-4">
              <TbCircleLetterA className="w-8 h-8 mr-2 text-black text-2xl" />
              답변
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {consultation.answer}
            </div>
          </div>

          {/* 공공누리 유형 */}
          <div className="mt-8 flex items-center gap-2">
            <img src={openLicenseImg} alt="공공누리" className="h-6" />
            <span className="text-sm text-gray-500">
              대한법률구조공단의 해당 저작물은 "공공누리 4유형(출처표시)" 조건에
              따라 누구나 이용할 수 있습니다.
            </span>
          </div>
        </div>
      </div>
      <div className="right-layout">{/* 빈 공간으로 남겨둠 */}</div>
    </div>
  );
};

export default ConsDetail;
