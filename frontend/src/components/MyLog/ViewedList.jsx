import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import {
  useGetUserViewedLogsQuery,
  useDeleteViewedLogMutation,
} from "../../redux/slices/mylogApi";
import { setViewedLogs, removeViewedLog } from "../../redux/slices/mylogSlice";
import ViewLog from "./ViewLog"; // ✅ ViewLog 추가
import { Link } from "react-router-dom"; // ✅ 링크 추가
import DeleteConfirm from "./DeleteConfirm";

const ViewedList = () => {
  const user = useSelector(selectUser); // ✅ 현재 로그인한 회원 정보 가져오기
  const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState("consultation"); // 추가: 토글 상태
  const [deleteViewedLog] = useDeleteViewedLogMutation();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isAllDelete, setIsAllDelete] = useState(false);

  // 스크롤을 맨 위로 이동시키는 함수
  const scrollToTop = () => {
    const scrollContainer = document.querySelector(".viewed-logs-container");
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  };

  // viewMode 변경 핸들러 수정
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    scrollToTop();
  };

  // ✅ API 요청 실행 (user?.id가 있어야 요청됨)
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

  // 필터링된 로그를 최신순으로 정렬하고 중복 제거
  const filteredLogs = [...viewedLogs]
    .filter((log) => {
      if (viewMode === "consultation") {
        return log.consultation_id && !log.precedent_number;
      } else {
        return !log.consultation_id && log.precedent_number;
      }
    })
    // 중복 제거: consultation_id 또는 precedent_number 기준
    .filter((log, index, self) => {
      if (viewMode === "consultation") {
        return (
          index ===
          self.findIndex((l) => l.consultation_id === log.consultation_id)
        );
      } else {
        return (
          index ===
          self.findIndex((l) => l.precedent_number === log.precedent_number)
        );
      }
    })
    .sort((a, b) => {
      // ISO 문자열 형식의 날짜를 확실하게 비교
      const dateA = new Date(a.viewed_at).getTime();
      const dateB = new Date(b.viewed_at).getTime();
      return dateB - dateA; // 내림차순 정렬 (최신순)
    });

  // 열람 기록 삭제
  const handleDelete = async (logId) => {
    setLogToDelete(logId);
    setIsDeleteConfirmOpen(true);
  };

  // 전체 삭제 핸들러 추가
  const handleDeleteAll = () => {
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
          <h2 className="font-medium text-white flex-1 text-center mr-[50px]">
            열람목록
          </h2>
          <div className="flex items-center gap-4 mr-4">
            <div className="flex bg-white rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewModeChange("consultation")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "consultation"
                    ? "bg-[#8b7b6e] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                상담사례
              </button>
              <button
                onClick={() => handleViewModeChange("precedent")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === "precedent"
                    ? "bg-[#8b7b6e] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                판례
              </button>
            </div>
            {/* 전체 삭제 버튼 추가 */}
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1 text-white hover:text-red-500 transition-colors"
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
        <div className="h-[250px] px-4 pt-1 pb-4 overflow-y-auto viewed-logs-container">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-center">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-center text-red-500">
                오류 발생: {error.message}
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-center text-gray-500">
                {viewMode === "consultation"
                  ? "열람한 상담사례가 없습니다."
                  : "열람한 판례가 없습니다."}
              </p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className="border-b border-gray-200 relative group"
              >
                {/* ✅ 클릭 시 상세 페이지로 이동하는 링크 추가 */}
                <Link
                  to={
                    log.precedent_number
                      ? `/precedent/detail/${log.precedent_number}`
                      : `/consultation/detail/${log.consultation_id}`
                  }
                  className="block w-full transition-all duration-200 hover:pl-2"
                >
                  <ViewLog
                    consultation_id={log.consultation_id}
                    precedent_number={log.precedent_number}
                  />
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(log.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                           transition-opacity duration-200 p-1.5 hover:bg-gray-100 
                           rounded-full text-gray-500 hover:text-red-500"
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

      {/* DeleteConfirm 컴포넌트 수정 */}
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
