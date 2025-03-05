import React, { useState, useEffect } from "react";

const MemoModal = ({ isOpen, onClose, onSave, onDelete, memoData }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [notificationDate, setNotificationDate] = useState("");

  useEffect(() => {
    if (memoData) {
      setTitle(memoData.title || "");
      setContent(memoData.content || "");
      setIsNotificationEnabled(memoData.notification || false);
      setNotificationDate(memoData.event_date || "");
    } else {
      setTitle("");
      setContent("");
      setIsNotificationEnabled(false);
      setNotificationDate("");
    }
  }, [memoData]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-xl font-bold mb-4">{memoData ? "메모 수정" : "새 메모 추가"}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({
            id: memoData?.id || null,
            title,
            content,
            notification: isNotificationEnabled,
            event_date: notificationDate || null
          });
          onClose();
        }}>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full border p-2 rounded-md mb-2" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용" className="w-full border p-2 rounded-md mb-2 h-[100px]" />

          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4 w-full">저장</button>
        </form>
      </div>
    </div>
  );
};

export default MemoModal;
