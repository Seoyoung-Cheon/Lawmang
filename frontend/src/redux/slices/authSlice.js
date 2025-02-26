import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: localStorage.getItem("token") || null, // ✅ JWT 토큰 유지
  isAuthenticated: !!localStorage.getItem("token")
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.token); // ✅ JWT 토큰 저장
    },
    logout: (state) => {
      console.log("🛑 Redux에서 로그아웃 실행됨!");
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token"); // ✅ 로그아웃 시 토큰 삭제
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

// ✅ Redux에서 상태를 조회하는 선택자 추가
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;