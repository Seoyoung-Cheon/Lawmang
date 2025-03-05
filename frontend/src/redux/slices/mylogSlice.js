import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  logs: [], // 사용자 활동 로그 저장
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const mylogSlice = createSlice({
  name: "mylog",
  initialState,
  reducers: {
    setLogs: (state, action) => {
      state.logs = action.payload;
      state.status = "succeeded";
    },
    clearLogs: (state) => {
      state.logs = [];
      state.status = "idle";
    },
  },
});

export const { setLogs, clearLogs } = mylogSlice.actions;
export default mylogSlice.reducer;

// ✅ Redux에서 상태를 조회하는 선택자 추가
export const selectLogs = (state) => state.mylog.logs;
export const selectLogsStatus = (state) => state.mylog.status;
