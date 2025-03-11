import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import {
  useGetUserViewedLogsQuery,
  useDeleteViewedLogMutation,
} from "../../redux/slices/mylogApi";
import { setViewedLogs, removeViewedLog } from "../../redux/slices/mylogSlice";
import ViewLog from "./ViewLog";
import { Link } from "react-router-dom";
import DeleteConfirm from "./DeleteConfirm";
import { fetchPrecedentInfo } from "../Precedent/precedentApi";

const ViewedList = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState("consultation");
  const [deleteViewedLog] = useDeleteViewedLogMutation();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isAllDelete, setIsAllDelete] = useState(false);
  const [caseDataMap, setCaseDataMap] = useState({});

  // ✅ 스크롤을 맨 위로 이동시키는 함수
  const scrollToTop = () => {
    const scrollContainer = document.querySelector(".viewed-logs-container");
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  };

  // ✅ viewMode 변경 시 스크롤 유지
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    scrollToTop();
  };

  // ✅ API 요청 실행
  const {
    data: viewedLogs = [],
    isLoading,
    error,
  } = useGetUserViewedLogsQuery(user?.id, { skip: !user?.id });

  // Redux Store에 저장
  useEffect(() => {
    if (viewedLogs.length > 0) {
      dispatch(setViewedLogs(viewedLogs));
    }
  }, [viewedLogs, dispatch]);

  // ✅ 필터링된 로그 정렬 및 중복 제거
  const filteredLogs = [...viewedLogs]
    .sort((a, b) => new Date(b.viewed_at) - new Date(a.viewed_at))
    .filter((log) => {
      return viewMode === "consultation"
        ? log.consultation_id && !log.precedent_number
        : !log.consultation_id && log.precedent_number;
    })
    .filter((log, index, self) =>
      viewMode === "consultation"
        ? index === self.findIndex((l) => l.consultation_id === log.consultation_id)
        : index === self.findIndex((l) => l.precedent_number === log.precedent_number)
    );

  // ✅ 판례 정보를 개별적으로 가져오기
  useEffect(() => {
    const fetchCaseData = async () => {
      const newCaseDataMap = {}; 

      const fetchPromises = filteredLogs.map(async (log) => {
        if (log.precedent_number && !caseDataMap[log.precedent_number]) {
          try {
            const data = await fetchPrecedentInfo(log.precedent_number);
            if (data) {
              newCaseDataMap[log.precedent_number] = {
                title: data?.title || "제목 없음",
                caseNumber: data?.caseNumber || "사건번호 없음",
                court: data?.court || "법원 정보 없음",
                date: data?.date || "날짜 없음",
              };
            } else {
              newCaseDataMap[log.precedent_number] = { title: "정보 없음" };
            }
          } catch (error) {
            console.error("📌 판례 정보 가져오기 실패:", error);
            newCaseDataMap[log.precedent_number] = { title: "정보 없음" };
          }
        }
      });

      await Promise.all(fetchPromises);
      setCaseDataMap((prev) => ({ ...prev, ...newCaseDataMap }));
    };

    if (filteredLogs.length > 0) {
      fetchCaseData();
    }
  }, [filteredLogs]);
  
  // ✅ 열람 기록 삭제
  const handleDelete = async (logId) => {
    setLogToDelete(logId);
    setIsDeleteConfirmOpen(true);
  };

  // ✅ 전체 삭제 핸들러
  const handleDeleteAll = () => {
    if (!user?.id || filteredLogs.length === 0) return;
    setIsAllDelete(true);
    setIsDeleteConfirmOpen(true);
  };

  // 삭제 확인 핸들러 수정
  const handleConfirmDelete = async () => {
    try {
      if (isAllDelete) {
        // 전체 삭제
        for (const log of filteredLogs) {
          await deleteViewedLog(log.id);
          dispatch(removeViewedLog(log.id));
        }
      } else {
        // 단일 삭제
        await deleteViewedLog(logToDelete);
        dispatch(removeViewedLog(logToDelete));
      }
    } catch (error) {
      console.error("삭제 중 오류 발생:", error);
    }
    setIsDeleteConfirmOpen(false);
    setLogToDelete(null);
    setIsAllDelete(false);
  };

  return (
    <>
      <div className="border border-gray-300 rounded-lg bg-[#f5f4f2] overflow-hidden">
        <div className="border-b border-gray-300 p-2 bg-[#a7a28f] flex items-center">
          <div className="flex-1"></div>
          <h2 className="font-medium text-white flex-1 text-center mr-[50px]">열람목록</h2>
          <div className="flex items-center gap-4 mr-4">
            <div className="flex bg-white rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewModeChange("consultation")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "consultation" ? "bg-[#8b7b6e] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                상담사례
              </button>
              <button
                onClick={() => handleViewModeChange("precedent")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "precedent" ? "bg-[#8b7b6e] text-white" : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                판례
              </button>
            </div>
            {/* 전체 삭제 버튼 추가 */}
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1 text-white hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              <span className="text-sm">전체삭제</span>
            </button>
          </div>
        </div>

        {/* ✅ 리스트 패널 크기 유지 */}
        <div className="h-[250px] px-4 pt-1 pb-4 overflow-y-auto viewed-logs-container">
          {isLoading ? (
            <p className="text-center">로딩 중...</p>
          ) : error ? (
            <p className="text-center text-red-500">오류 발생: {error.message}</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500">
              {viewMode === "consultation" ? "열람한 상담사례가 없습니다." : "열람한 판례가 없습니다."}
            </p>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="border-b border-gray-200 relative group hover:bg-white hover:shadow-md rounded-lg">
                <Link
                  to={
                    log.precedent_number
                      ? `/precedent/detail/${log.precedent_number}`
                      : `/consultation/detail/${log.consultation_id}`
                  }
                  className="block w-full transition-all duration-200 group-hover:pl-2"
                >
                  <ViewLog
                    consultation_id={log.consultation_id}
                    precedent_number={log.precedent_number}
                    precedentData={caseDataMap[log.precedent_number]}
                  />
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(log.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                            transition-all duration-200 p-1.5 hover:bg-gray-100
                            rounded-full text-gray-500 hover:text-red-500
                            z-10"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setLogToDelete(null);
          setIsAllDelete(false);
        }}
        onConfirm={handleConfirmDelete}
        type={isAllDelete ? "viewLogAll" : "viewLog"}
      />
    </>
  );
};

export default ViewedList;
