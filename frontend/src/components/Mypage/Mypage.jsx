import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { FiEdit2 } from "react-icons/fi";
import MemoPopup from "./MemoPopup";

const Mypage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [memos, setMemos] = useState([
    //임시 메모
    { id: 1, content: "메모 예시 1", isEditing: false },
    { id: 2, content: "메모 예시 2", isEditing: false },
  ]);
  const [newMemoContent, setNewMemoContent] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState(null);

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
  const handleSaveMemo = (content) => {
    if (editingMemo) {
      // 기존 메모 수정
      setMemos(
        memos.map((memo) =>
          memo.id === editingMemo.id ? { ...memo, content } : memo
        )
      );
    } else {
      // 새 메모 추가
      setMemos([
        ...memos,
        {
          id: Date.now(),
          content,
          isEditing: false,
        },
      ]);
    }
  };

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="container min-h-[100vh]">
      <div className="left-layout ">
        <div className="px-0 pt-[120px] pb-10">
          {/* 메모장 섹션 */}
          <div className="mb-8">
            <div className="border border-gray-300 rounded-lg">
              <div className="border-b border-gray-300 p-2 flex justify-between items-center">
                <h2 className="font-medium flex-1 text-center">메모장</h2>
                <button
                  onClick={handleAddMemo}
                  className="px-3 py-1 bg-Main text-white text-sm rounded-md hover:bg-Main_hover transition-colors"
                >
                  메모 추가
                </button>
              </div>
              <div className="h-[400px] p-4 overflow-y-auto">
                {/* 메모 카드 리스트 */}
                <div className="grid grid-cols-4 gap-4">
                  {memos.map((memo) => (
                    <div
                      key={memo.id}
                      className="bg-white border border-gray-200 rounded-md shadow-sm h-[150px]"
                    >
                      <div className="h-full flex flex-col p-2">
                        <div className="flex-1 text-sm overflow-hidden">
                          {memo.content}
                        </div>
                        <button
                          onClick={() => handleEditClick(memo)}
                          className="self-end p-1 text-gray-500 hover:text-gray-700"
                        >
                          <FiEdit2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 열람목록 섹션 */}
          <div>
            <div className="border border-gray-300 rounded-lg">
              <div className="border-b border-gray-300 p-2 bg-gray-100">
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
        initialContent={editingMemo?.content || ""}
      />
    </div>
  );
};

export default Mypage;
