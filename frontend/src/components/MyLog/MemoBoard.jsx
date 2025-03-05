import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  useGetUserMemosQuery,
  useDeleteMemoMutation,
  useCreateMemoMutation,
  useUpdateMemoMutation,
} from "../../redux/slices/mylogApi";
import { removeMemo, updateMemoInState } from "../../redux/slices/mylogSlice";
import MemoModal from "./MemoModal";
import { selectUser } from "../../redux/slices/authSlice";
import { FaBell, FaRegBell } from "react-icons/fa";

const MemoBoard = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { data: memos = [], isLoading, error } = useGetUserMemosQuery(user?.id);

  const [deleteMemo] = useDeleteMemoMutation();
  const [createMemo] = useCreateMemoMutation();
  const [updateMemo] = useUpdateMemoMutation();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);

  // ✅ 새 메모 추가 모드 (빈 값으로 모달 열기)
  const handleAddMemo = () => {
    setEditingMemo(null);
    setIsPopupOpen(true);
  };

  // ✅ 기존 메모 수정 모드 (데이터 로드)
  const handleEditMemo = (memo) => {
    setEditingMemo(memo);
    setIsPopupOpen(true);
  };

  // ✅ 메모 저장 (추가 & 수정)
  const handleSaveMemo = async (memoData) => {
    try {
      if (memoData.id) {
        await updateMemo({
          id: memoData.id,
          title: memoData.title,
          content: memoData.content || "",
          event_date: memoData.event_date ?? null,
          notification: memoData.notification ?? false,
        }).unwrap();
      } else {
        await createMemo({
          user_id: user?.id,
          title: memoData.title,
          content: memoData.content || "",
          event_date: memoData.event_date ?? null,
          notification: memoData.notification ?? false,
        }).unwrap();
      }
    } catch (error) {
      console.error("❌ 메모 저장 실패:", error);
    }
  };  
  

  // ✅ 메모 삭제 (프론트에서 숨기기, DB에서는 삭제 X)
  const handleDeleteMemo = async (memoId, event) => {
    if (event) event.stopPropagation();
    dispatch(removeMemo(memoId));

    try {
      await deleteMemo(memoId).unwrap();
    } catch (error) {
      console.error("❌ 메모 삭제 실패:", error);
    }
  };

  return (
    <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-[#f5f4f2]">
      <div className="border-b border-gray-300 p-2 flex items-center bg-[#a7a28f]">
        <h2 className="font-medium text-white flex-1 text-center">메모장</h2>
        <button onClick={handleAddMemo} className="px-4 py-1.5 bg-gray-100 text-black text-sm rounded-md hover:bg-gray-200">
          메모 추가
        </button>
      </div>

      {/* ✅ 메모 리스트 */}
      <div className="h-[400px] p-4 overflow-y-auto grid grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-center">로딩 중...</p>
        ) : error ? (
          <p className="text-center text-red-500">오류 발생: {error.message}</p>
        ) : memos.length === 0 ? (
          <p className="text-center text-gray-500 w-full">아직 기록된 메모가 없습니다.</p>
        ) : (
          memos.map((memo) => (
            <div
              key={memo.id}
              onClick={() => handleEditMemo(memo)}
              className={`group relative ${memo.notification ? "bg-[#ffb9a3]" : "bg-[#f3d984]"} border-b-4 border-r-4 border-gray-300 rounded-sm h-[170px]`}
            >
              <div className="absolute top-1 right-1 p-1.5 text-[#8b7b6e]">
                {memo.notification ? <FaBell size={16} /> : <FaRegBell size={16} />}
              </div>
              <div className="h-full flex flex-col p-4 pt-2">
                <h3 className="font-bold text-[#5d4d40] mb-2 text-md">{memo.title}</h3>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ MemoModal 연동 */}
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
