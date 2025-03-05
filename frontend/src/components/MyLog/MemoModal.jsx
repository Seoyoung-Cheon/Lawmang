import React, { useState, useEffect } from "react";

const MemoModal = ({ isOpen, onClose, onSave, onDelete, memoData }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [notificationDate, setNotificationDate] = useState("");
  const [createdDate, setCreatedDate] = useState("");

  useEffect(() => {
    if (memoData) {
      setTitle(memoData.title || "");
      setContent(memoData.content || "");
      setIsNotificationEnabled(memoData.notification || false);
      setNotificationDate(memoData.event_date || "");
      setCreatedDate(memoData.created_at ? new Date(memoData.created_at).toLocaleDateString() : "");
    } else {
      setTitle("");
      setContent("");
      setIsNotificationEnabled(false);
      setNotificationDate("");
      setCreatedDate("");
    }
  }, [memoData]);

  const handleSave = () => {
    onSave({
      id: memoData?.id || null,
      title,
      content,
      event_date: isNotificationEnabled ? notificationDate : null,
      notification: isNotificationEnabled,
    });
    onClose();
  };

  const handleDelete = () => {
    if (memoData) {
      onDelete(memoData.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-xl font-bold mb-4">{memoData ? "메모 수정" : "새 메모 추가"}</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full border p-2 rounded-md mb-2"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
          className="w-full border p-2 rounded-md mb-2 h-[100px]"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isNotificationEnabled}
            onChange={(e) => setIsNotificationEnabled(e.target.checked)}
          />
          <label>알림 설정</label>
          {isNotificationEnabled && (
            <input
              type="date"
              value={notificationDate}
              onChange={(e) => setNotificationDate(e.target.value)}
            />
          )}
        </div>
        {createdDate && <p className="text-gray-600 text-sm">작성 날짜: {createdDate}</p>}
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded-md"
          >
            닫기
          </button>
          {memoData ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                수정
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded-md"
            >
              추가
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoModal;