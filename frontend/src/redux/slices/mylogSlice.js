import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  logs: [],
};

const mylogSlice = createSlice({
  name: "mylog",
  initialState,
  reducers: {
    setLogs: (state, action) => {
      state.logs = action.payload;
    },
    removeMemo: (state, action) => {
      state.logs = state.logs.map((memo) =>
        memo.id === action.payload ? { ...memo, is_deleted: true } : memo
      );
    },
    updateMemoInState: (state, action) => {
      const updatedMemo = action.payload;
      const index = state.logs.findIndex((memo) => memo.id === updatedMemo.id);
      if (index !== -1) {
        state.logs[index] = updatedMemo;
      }
    },
  },
});

export const { setLogs, removeMemo, updateMemoInState } = mylogSlice.actions;
export default mylogSlice.reducer;
