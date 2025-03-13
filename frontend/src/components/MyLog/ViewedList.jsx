import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../redux/slices/authSlice";
import {
  useDeleteViewedMutation,
  useDeleteAllViewedMutation,
} from "../../redux/slices/historyApi";
import ViewLog from "./ViewLog";
import { Link } from "react-router-dom";
import DeleteConfirm from "./DeleteConfirm";
import { fetchPrecedentInfo } from "../Precedent/precedentApi";
import { useGetViewedQuery } from "../../redux/slices/historyApi";
import { FaExchangeAlt } from "react-icons/fa";

const ViewedList = ({ viewedLogs = [], isLoading, error }) => {
  const user = useSelector(selectUser);
  const [deleteViewed] = useDeleteViewedMutation();
  const [deleteAllViewed] = useDeleteAllViewedMutation();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [isAllDelete, setIsAllDelete] = useState(false);
  const [caseDataMap, setCaseDataMap] = useState({});
  const [sortOrder, setSortOrder] = useState("latest");

  const { data: viewedLogsData = [], isLoading: viewedLogsLoading, error: viewedLogsError } = useGetViewedQuery(user?.id, { 
    skip: !user?.id 
  });

  // ✅ 정렬 로직이 포함된 필터링
  const filteredLogs = useMemo(() => {
    return [...viewedLogsData]
      .sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
      })
      .filter((log, index, self) => {
        if (log.consultation_id) {
          return index === self.findIndex((l) => l.consultation_id === log.consultation_id);
        }
        return index === self.findIndex((l) => l.precedent_id === log.precedent_id);
      });
  }, [viewedLogsData, sortOrder]);

  // ✅ 판례 정보를 개별적으로 가져오기
  useEffect(() => {
    const fetchCaseData = async () => {
      const pendingPrecedents = filteredLogs.filter(
        log => log.precedent_id && !caseDataMap[log.precedent_id]
      );

      if (pendingPrecedents.length === 0) return;

      const newCaseDataMap = { ...caseDataMap };

      await Promise.all(
        pendingPrecedents.map(async (log) => {
          try {
            const data = await fetchPrecedentInfo(log.precedent_id);
            if (data) {
              newCaseDataMap[log.precedent_id] = {
                title: data?.title || "제목 없음",
                caseNumber: data?.caseNumber || "사건번호 없음",
                court: data?.court || "법원 정보 없음",
                date: data?.date || "날짜 없음",
              };
            }
          } catch (error) {
            console.error("📌 판례 정보 가져오기 실패:", error);
            newCaseDataMap[log.precedent_id] = { title: "정보 없음" };
          }
        })
      );

      if (Object.keys(newCaseDataMap).length !== Object.keys(caseDataMap).length) {
        setCaseDataMap(newCaseDataMap);
      }
    };

    fetchCaseData();
  }, [filteredLogs, caseDataMap]);
  
  
  // ✅ 열람 기록 삭제
  const handleDelete = async (logId) => {
    setLogToDelete(logId);
    setIsDeleteConfirmOpen(true);
  };

  // ✅ 전체 삭제
  const handleDeleteAll = () => {
    if (!user?.id || filteredLogs.length === 0) return;
    setIsAllDelete(true);
    setIsDeleteConfirmOpen(true);
  };

  // ✅ 삭제 확인 핸들러
  const handleConfirmDelete = async () => {
    try {
      if (isAllDelete) {
        await deleteAllViewed(user.id).unwrap();
      } else {
        await deleteViewed(logToDelete).unwrap();
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
        <div className="border-b border-gray-300 p-2 flex items-center bg-[#a7a28f]">
          <div className="flex items-center gap-4 ml-4 w-[100px]">
            <button
              onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white opacity-80 hover:opacity-100 transition-all"
            >
              <FaExchangeAlt
                className={`transition-transform duration-300 ${
                  sortOrder === "oldest" ? "rotate-180" : ""
                }`}
              />
              <span className="font-medium w-[60px]">
                {sortOrder === "latest" ? "최신순" : "오래된순"}
              </span>
            </button>
          </div>

          <h2 className="font-medium text-white flex-1 text-center">
            열람목록
          </h2>

          <div className="flex items-center gap-4 mr-4">
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

        <div className="h-[250px] px-4 pt-1 pb-4 overflow-y-auto viewed-logs-container">
          {viewedLogsLoading ? (
            <p className="text-center">로딩 중...</p>
          ) : viewedLogsError ? (
            <p className="text-center text-red-500">
              {viewedLogsError.status === 404 ? "열람 기록이 없습니다." : "오류가 발생했습니다."}
            </p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500 mt-[100px]">열람한 기록이 없습니다.</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border-b border-gray-200 relative group hover:bg-white hover:shadow-md rounded-lg">
                <Link
                  to={
                    log.consultation_id
                      ? `/consultation/detail/${log.consultation_id}`
                      : `/precedent/detail/${log.precedent_id}`
                  }
                  className="block w-full transition-all duration-200 group-hover:pl-2"
                >
                  <ViewLog
                    consultation_id={log.consultation_id}
                    precedent_id={log.precedent_id}
                    precedentData={caseDataMap[log.precedent_id]}
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
