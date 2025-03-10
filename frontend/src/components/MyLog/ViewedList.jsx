import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import {
  useGetUserViewedLogsQuery,
  useDeleteViewedLogMutation,
  useDeleteAllViewedLogsMutation,
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
  const [deleteAllViewedLogs] = useDeleteAllViewedLogsMutation();
  const [caseDataMap, setCaseDataMap] = useState({});

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
                <Link to={log.precedent_number ? `/precedent/detail/${log.precedent_number}` : `/consultation/detail/${log.consultation_id}`} className="block w-full transition-all duration-200 group-hover:pl-2">
                  <ViewLog
                    consultation_id={log.consultation_id}
                    precedent_number={log.precedent_number}
                    precedentData={caseDataMap[log.precedent_number]}
                  />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
      <DeleteConfirm isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={handleDeleteAll} />
    </>
  );
};

export default ViewedList;
