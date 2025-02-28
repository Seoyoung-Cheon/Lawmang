import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiEdit2 } from "react-icons/fi";
import MemoPopup from "./MemoPopup";
import DeleteConfirmPopup from "./DeleteConfirmPopup";
import MemoDetailPopup from "./MemoDetailPopup";
import { selectIsAuthenticated } from "../../redux/slices/authSlice";

const Mypage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated); // Redux 인증 상태 사용
  const [memos, setMemos] = useState([]); // 빈 배열로 시작
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [memoToDelete, setMemoToDelete] = useState(null);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [isDetailPopupOpen, setIsDetailPopupOpen] = useState(false);

  // 새 메모 추가
  const handleAddMemo = () => {
    setEditingMemo(null); // 새 메모 생성 모드
    setIsPopupOpen(true);
  };

  // 메모 수정 모드
  const handleEditClick = (memo) => {
    setEditingMemo(memo);
    setIsPopupOpen(true);
  };

  // 팝업에서 메모 저장
  const handleSaveMemo = (memoData) => {
    if (editingMemo) {
      // 기존 메모 수정
      setMemos(
        memos.map((memo) =>
          memo.id === editingMemo.id
            ? {
                ...memo,
                title: memoData.title,
                content: memoData.content,
              }
            : memo
        )
      );
    } else {
      // 새 메모 추가
      setMemos([
        ...memos,
        {
          id: Date.now(),
          title: memoData.title,
          content: memoData.content,
        },
      ]);
    }
    setIsPopupOpen(false);
    setEditingMemo(null);
  };

  // 메모 삭제
  const handleDeleteClick = (memo) => {
    setMemoToDelete(memo);
    setIsDeletePopupOpen(true);
  };

  const handleDeleteConfirm = () => {
    setMemos(memos.filter((memo) => memo.id !== memoToDelete.id));
    setIsDeletePopupOpen(false);
    setMemoToDelete(null);
  };

  // 메모 클릭 핸들러
  const handleMemoClick = (memo) => {
    setSelectedMemo(memo);
    setIsDetailPopupOpen(true);
  };

  // 상세보기에서 수정 버튼 클릭 시
  const handleDetailEdit = () => {
    setIsDetailPopupOpen(false);
    handleEditClick(selectedMemo);
  };

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [!isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      <div className="container min-h-[100vh]">
        <div className="left-layout">
          <div className="px-0 pt-[110px] pb-10">
            {/* 메모장 섹션 */}
            <div className="mb-8">
              <div className="border border-gray-300 rounded-lg  overflow-hidden bg-[#f5f4f2]">
                <div className="border-b border-gray-300 p-2 flex justify-between items-center bg-[#a7a28f]">
                  <h2 className="font-medium flex-1 text-center text-white">
                    메모장
                  </h2>
                  <button
                    onClick={handleAddMemo}
                    className="px-3 py-1 bg-gray-100 text-black text-sm rounded-md hover:bg-gray-200 transition-colors"
                  >
                    메모 추가
                  </button>
                </div>
                <div className="h-[400px] p-4 overflow-y-auto">
                  {/* 메모 카드 리스트 */}
                  <div className="grid grid-cols-4 gap-6">
                    {memos.length === 0 ? (
                      <div className="col-span-4 text-center text-gray-500 mt-[150px]">
                        메모가 없습니다. 새 메모를 추가해보세요!
                      </div>
                    ) : (
                      memos.map((memo) => (
                        <div
                          key={memo.id}
                          onClick={() => handleMemoClick(memo)}
                          className="group relative bg-[#f3d984] border-b-4 border-r-4 border-gray-300 rounded-sm h-[150px] transform rotate-[-1deg] hover:rotate-0 transition-all duration-200 hover:shadow-md cursor-pointer"
                          style={{
                            boxShadow: "1px 1px 3px rgba(0,0,0,0.1)",
                          }}
                        >
                          {/* 메모 핀 장식 */}
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6  bg-[#bd0000]  rounded-full shadow-md z-10">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#9d0000] rounded-full"></div>
                          </div>

                          {/* 메모 내용 */}
                          <div className="h-full flex flex-col p-4 pt-5">
                            <h3 className="font-bold text-[#5d4d40] truncate mb-2">
                              {memo.title}
                            </h3>
                            <div className="flex-1 text-sm text-[#5d4d40] line-clamp-3 max-h-[4.5em] overflow-hidden">
                              {memo.content}
                            </div>

                            {/* 버튼 그룹 */}
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-2 right-2 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // 이벤트 전파 중지
                                  handleEditClick(memo);
                                }}
                                className="p-1 text-[#8b7b6e] hover:text-[#5d4d40] rounded-full hover:bg-[#ffe4b8] transition-all duration-200 flex items-center gap-1"
                              >
                                <span className="text-sm">수정하기</span>
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // 이벤트 전파 중지
                                  handleDeleteClick(memo);
                                }}
                                className="p-1.5 text-red-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all duration-200"
                              >
                                <svg
                                  className="w-4 h-4"
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
              </div>
            </div>

            {/* 열람목록 섹션 */}
            <div>
              <div className="border border-gray-300 rounded-lg bg-[#f5f4f2] overflow-hidden">
                <div className="border-b border-gray-300 p-2 bg-[#a7a28f] text-white">
                  <h2 className="text-center font-medium">열람목록</h2>
                </div>
                <div className="h-[250px] p-4 overflow-y-auto">
                  {/* 열람 목록이 없는 경우 */}
                  <div className="text-center text-gray-500 mt-[120px]">
                    열람한 내역이 없습니다.
                  </div>

                  {/* 열람 목록이 있는 경우 아래 형식으로 표시 */}
                  {/* <div className="border-b border-gray-200 py-2">
                    <p className="text-sm">열람한 항목 제목</p>
                    <p className="text-xs text-gray-500">열람 날짜</p>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="right-layout">{/* 빈 공간으로 남겨둠 */}</div>
        <MemoPopup
          isOpen={isPopupOpen}
          onClose={() => {
            setIsPopupOpen(false);
            setEditingMemo(null);
          }}
          onSave={handleSaveMemo}
          initialTitle={editingMemo?.title || ""}
          initialContent={editingMemo?.content || ""}
        />
        <DeleteConfirmPopup
          isOpen={isDeletePopupOpen}
          onClose={() => {
            setIsDeletePopupOpen(false);
            setMemoToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
        <MemoDetailPopup
          isOpen={isDetailPopupOpen}
          memo={selectedMemo}
          onClose={() => {
            setIsDetailPopupOpen(false);
            setSelectedMemo(null);
          }}
          onEdit={handleDetailEdit}
        />
      </div>
    </div>
  );
};

export default Mypage;
