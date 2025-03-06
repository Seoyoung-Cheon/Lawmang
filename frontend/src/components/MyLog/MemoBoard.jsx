import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetUserMemosQuery,
  useDeleteMemoMutation,
  useCreateMemoMutation,
  useUpdateMemoMutation,
} from "../../redux/slices/mylogApi";
import { removeMemo } from "../../redux/slices/mylogSlice";
import MemoModal from "./MemoModal";
import { selectUser } from "../../redux/slices/authSlice";
import { FaBell, FaRegBell, FaExchangeAlt } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";


const MemoBoard = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { data: memos = [], isLoading, error } = useGetUserMemosQuery(user?.id);

  const [deleteMemo] = useDeleteMemoMutation();
  const [createMemo] = useCreateMemoMutation();
  const [updateMemo] = useUpdateMemoMutation();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest");

  // ✅ 새 메모 추가
  const handleAddMemo = () => {
    setEditingMemo(null);
    setIsPopupOpen(true);
  };

  // ✅ 메모 수정 모드
  const handleEditMemo = (memo) => {
    setEditingMemo(memo);
    setIsPopupOpen(true);
  };

  // ✅ 메모 저장 (추가 & 수정)
  const handleSaveMemo = async (memoData) => {
    try {
      if (memoData.id) {
        await updateMemo(memoData).unwrap();
      } else {
        await createMemo({ ...memoData, user_id: user?.id }).unwrap();
      }
      setIsPopupOpen(false);
    } catch (error) {
      console.error("❌ 메모 저장 실패:", error);
    }
  };

  // ✅ 메모 삭제
  const handleDeleteMemo = async (memoId) => {
    const confirmDelete = window.confirm("정말 이 메모를 삭제하시겠습니까?");
    if (!confirmDelete) return; // 사용자가 취소하면 삭제 중단
  
    try {
      await deleteMemo(memoId).unwrap();
      dispatch(removeMemo(memoId));
    } catch (error) {
      console.error("❌ 메모 삭제 실패:", error);
    }
  };

  // ✅ 정렬 기능
  const sortedMemos = [...memos].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
  });


  return (
    <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-[#f5f4f2]">
      <div className="border-b border-gray-300 p-2 flex items-center bg-[#a7a28f]">
        <button
          onClick={() => setSortOrder(sortOrder === "latest" ? "oldest" : "latest")}
          className="flex items-center gap-2 text-white text-sm ml-4"
        >
          <FaExchangeAlt /> {sortOrder === "latest" ? "최신순" : "오래된순"}
        </button>
        <h2 className="font-medium text-white flex-1 text-center">메모장</h2>
        <button
          onClick={handleAddMemo}
          className="px-4 py-1.5 bg-gray-100 text-black text-sm rounded-md hover:bg-gray-200"
        >
          메모 추가
        </button>
      </div>

      <div className="h-[400px] p-4 overflow-y-auto grid grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-center">로딩 중...</p>
        ) : error ? (
          <p className="text-center text-red-500">오류 발생: {error.message}</p>
        ) : sortedMemos.length === 0 ? (
          <p className="text-center text-gray-500 w-full">아직 기록된 메모가 없습니다.</p>
        ) : (
          sortedMemos.map((memo) => (
            <div
              key={memo.id}
              className="relative bg-[#f3d984] border-b-4 border-r-4 border-gray-300 rounded-sm p-4 h-[170px] flex flex-col justify-between"
            >
              <div className="text-[13px] text-[#828282] font-thin">
                {new Date(memo.created_at).toLocaleDateString()}
              </div>
              <h3 className="font-bold text-[#5d4d40] mb-2 text-md">{memo.title}</h3>
              <p className="text-sm text-[#5d4d40] mb-2">{memo.content?.slice(0, 30)}...</p>
              <div className="absolute bottom-2 right-2 flex gap-2">
                <button
                  onClick={() => handleEditMemo(memo)}
                  className="p-1.5 text-[#8b7b6e] rounded-full bg-[#ffe4b8]"
                >
                  <FiEdit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteMemo(memo.id)}
                  className="p-1.5 text-red-500 rounded-full bg-[#ffe4b8]"
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
          ))
        )}
      </div>

      {isPopupOpen && (
        <MemoModal
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          onSave={handleSaveMemo}
          onDelete={handleDeleteMemo}
          memoData={editingMemo}
        />
      )}
    </div>
  );
};

export default MemoBoard;