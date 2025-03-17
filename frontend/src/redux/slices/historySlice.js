import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  viewed: [],
};

// ✅ 열람 기록을 관리하는 Redux Slice
const historySlice = createSlice({ 
  name: "history",
  initialState,
  reducers: {
    setLogs: (state, action) => {
      state.logs = action.payload;
    },

    // ✅ 새로운 열람 기록을 Redux Store 저장
    setViewedLogs: (state, action) => {
      state.viewed = action.payload;
    },

    // ✅ 특정 열람 기록 삭제
    removeViewed: (state, action) => {
      state.viewed = state.viewed.filter(log => log.id !== action.payload);
    },    

    // ✅ 모든 열람 기록 삭제
    clearViewed: (state) => {
      state.viewed = [];
    },
    
  },
});


export const {
	setLogs,
	removeViewed,
	setViewedLogs,
	clearViewed
} = historySlice.actions;

export default historySlice.reducer;