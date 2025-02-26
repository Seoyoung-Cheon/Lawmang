import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: localStorage.getItem("token") || null, // ✅ JWT 토큰 유지
  isAuthenticated: !!localStorage.getItem("token"),
  user: JSON.parse(localStorage.getItem("user")) || null // 사용자 정보 추가
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.token); // ✅ JWT 토큰 저장
      localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    // 회원정보 업데이트 reducer 추가
    updateUserInfo: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    logout: (state) => {
      console.log("🛑 Redux에서 로그아웃 실행됨!");
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token"); // ✅ 로그아웃 시 토큰 삭제
      localStorage.removeItem("user");
    },
  },
});

export const { setCredentials, updateUserInfo, logout } = authSlice.actions;
export default authSlice.reducer;

// ✅ Redux에서 상태를 조회하는 선택자 추가
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;