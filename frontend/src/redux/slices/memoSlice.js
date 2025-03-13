import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  memos: [],
};

// ✅ 메모 및 열람 기록을 관리하는 Redux Slice
const memoSlice = createSlice({
  name: "memo",
  initialState,
  reducers: {
    // ✅ 메모 목록 설정
    setMemos: (state, action) => {
      state.memos = action.payload;
    },

    // ✅ 메모 삭제
    removeMemo: (state, action) => {
      state.memos = state.memos.filter(memo => memo.id !== action.payload);
    },

    // ✅ 메모 수정
    updateMemo: (state, action) => {
      const updatedMemo = action.payload;
      const index = state.memos.findIndex((memo) => memo.id === updatedMemo.id);
      if (index !== -1) {
        state.memos[index] = updatedMemo;
      }
    },

    // ✅ 알림 설정 변경
    updateAlert: (state, action) => {
      const { memo_id, notification } = action.payload;
      const index = state.memos.findIndex((memo) => memo.id === memo_id);
      if (index !== -1) {
        state.memos[index].notification = notification;
      }
    },
  },
});


export const { 
  setMemos, 
  removeMemo, 
  updateMemo,
  updateAlert,
} = memoSlice.actions;

export default memoSlice.reducer;
