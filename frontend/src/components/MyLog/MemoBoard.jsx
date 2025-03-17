import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetMemosQuery,
  useRemoveMutation,
  useCreateMutation,
  useUpdateMutation,
} from "../../redux/slices/memoApi";
import { removeMemo } from "../../redux/slices/memoSlice";
import MemoModal from "./MemoModal";
import MemoDetail from "./MemoDetail";
import { selectUser } from "../../redux/slices/authSlice";

import { FaBell, FaRegBell, FaExchangeAlt } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import DeleteConfirm from "./DeleteConfirm";


const MemoBoard = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { data: memos = [], isLoading, error } = useGetMemosQuery(user?.id);
  const [remove] = useRemoveMutation();
  const [create] = useCreateMutation();
  const [update] = useUpdateMutation();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest");
  const [viewMode, setViewMode] = useState("recent");
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState(null);

  // ✅ 새 메모 추가
  const handleAddMemo = () => {
    setEditingMemo(null);
    setIsPopupOpen(true);
  };

  // ✅ 메모 수정 모드
  const handleEditMemo = (e, memo) => {
    e.stopPropagation(); // 이벤트 전파를 막아서 상세보기 팝업이 뜨지 않도록 함
    setEditingMemo(memo);
    setIsPopupOpen(true);
  };

  // ✅ 메모 저장 (추가 & 수정)
  const handleSaveMemo = async (memoData) => {
    try {
      if (memoData.id) {
        await update({
          user_id: user.id,
          memo_id: memoData.id,
          ...memoData
        }).unwrap();
      } else {
        await create({ 
          user_id: user.id,
          ...memoData 
        }).unwrap();
      }
      setIsPopupOpen(false);
    } catch (error) {
      console.error("❌ 메모 저장 실패:", error);
    }
  };

  // 메모 필터링 로직
  const filteredMemos = [...memos]
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
    })
    .filter(
      (memo) =>
        viewMode === "recent" ||
        (viewMode === "notification" && memo.notification)
    );

  const handleMemoClick = (memo) => {
    setSelectedMemo(memo);
    setIsDetailPopupOpen(true);
  };

  // 삭제 버튼 클릭 핸들러
  const handleDeleteClick = (e, memo) => {
    e.stopPropagation(); // 이벤트 전파 중지
    setMemoToDelete(memo);
    setIsDeletePopupOpen(true);
  };

  // 삭제 확인 핸들러
  const handleDeleteConfirm = async () => {
    try {
      await remove({
        user_id: user.id,
        memo_id: memoToDelete.id
      }).unwrap();
      dispatch(removeMemo(memoToDelete.id));
      setIsDeletePopupOpen(false);
      setMemoToDelete(null);
    } catch (error) {
      console.error("❌ 메모 삭제 실패:", error);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-[#f5f4f2]">
      <div className="border-b border-gray-300 p-2 flex items-center bg-[#a7a28f]">
        <div className="flex items-center gap-4 ml-4 w-[100px]">
          <button
            onClick={() =>
              setSortOrder(sortOrder === "latest" ? "oldest" : "latest")
            }
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

        <h2 className="font-medium text-white flex-1 text-center ml-[80px]">
          메모장
        </h2>

        <div className="flex items-center gap-4 mr-4">
          {/* 기록/알림 토글 버튼 */}
          <div className="flex bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("recent")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "recent"
                  ? "bg-[#8b7b6e] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              기록
            </button>
            <button
              onClick={() => setViewMode("notification")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "notification"
                  ? "bg-[#8b7b6e] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              알림
            </button>
          </div>
          {/* 메모 추가 버튼 */}
          <button
            onClick={handleAddMemo}
            className="px-4 py-1.5 bg-gray-100 text-black text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            메모 추가
          </button>
        </div>
      </div>

      <div className="h-[400px] p-4 overflow-y-auto">
        <div className="grid grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-4 text-center text-gray-500 mt-[150px]">
              로딩 중...
            </div>
          ) : error ? (
            <div className="col-span-4 text-center text-red-500 mt-[150px]">
              오류 발생: {error.message}
            </div>
          ) : filteredMemos.length === 0 ? (
            <div className="col-span-4 text-center text-gray-500 mt-[160px]">
              작성한 메모가 없습니다.
            </div>
          ) : (
            filteredMemos.map((memo) => (
              <div
                key={memo.id}
                onClick={() => handleMemoClick(memo)}
                className={`group relative ${
                  memo.notification ? "bg-[#ffb9a3]" : "bg-[#f3d984]"
                } border-b-4 border-r-4 border-gray-300 rounded-sm h-[170px] transform rotate-[-1deg] hover:rotate-0 transition-all duration-200 hover:shadow-md cursor-pointer`}
                style={{ boxShadow: "1px 1px 3px rgba(0,0,0,0.1)" }}
              >
                {/* 알림 아이콘 추가 */}
                <div className="absolute top-1 right-1 p-1.5 text-[#8b7b6e]">
                  {memo.notification ? (
                    <FaBell size={16} />
                  ) : (
                    <FaRegBell size={16} />
                  )}
                </div>

                {/* 메모 핀 장식 */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-[#bd0000] rounded-full shadow-md z-10">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#9d0000] rounded-full"></div>
                </div>

                <div className="h-full flex flex-col p-4 pt-2">
                  <div className="text-[13px] text-[#828282] font-thin mb-2">
                    {new Date(memo.created_at).toLocaleDateString()}
                  </div>

                  <h3 className="font-bold text-[#5d4d40] mb-2 text-md">
                    {memo.title}
                  </h3>
                  <div className="flex-1 text-xs text-[#5d4d40] line-clamp-2 overflow-hidden max-h-[2.6em]">
                    {memo.content}
                  </div>

                  {/* 알림 설정 날짜 추가 */}
                  {memo.notification && memo.event_date && (
                    <div className="absolute bottom-2 left-4 text-[13px] text-[#828282] font-thin">
                      알림: {new Date(memo.event_date).toLocaleDateString()}
                    </div>
                  )}

                  {/* 버튼 그룹 */}
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-1 right-2 flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditMemo(e, memo)}
                      className="p-1.5 text-[#8b7b6e] hover:text-[#5d4d40] rounded-full hover:bg-[#ffe4b8] transition-all duration-200"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, memo)}
                      className="p-1.5 text-red-400 hover:text-red-500 rounded-full hover:bg-[#ffe4b8] transition-all duration-200"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isPopupOpen && (
        <MemoModal
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          onSave={handleSaveMemo}
          memoData={editingMemo}
        />
      )}

      <MemoDetail
        isOpen={isDetailPopupOpen}
        memo={selectedMemo}
        onClose={() => {
          setIsDetailPopupOpen(false);
          setSelectedMemo(null);
        }}
      />

      <DeleteConfirm
        isOpen={isDeletePopupOpen}
        onClose={() => {
          setIsDeletePopupOpen(false);
          setMemoToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default MemoBoard;
