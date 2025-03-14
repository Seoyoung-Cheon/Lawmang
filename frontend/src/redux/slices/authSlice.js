import { createSlice } from "@reduxjs/toolkit";

// 초기 토큰과 만료시간 체크
const token = localStorage.getItem("token");
const tokenExpiration = localStorage.getItem("tokenExpiration");
const isValidToken = token && tokenExpiration && Date.now() < parseInt(tokenExpiration, 10);

const initialState = {
  token: isValidToken ? token : null,
  isAuthenticated: !!isValidToken,
  user: isValidToken ? JSON.parse(localStorage.getItem("user")) : null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      // 토큰 만료시간 1시간 후 설정
      const expirationTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("tokenExpiration", expirationTime);
    },
    updateUserInfo: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiration");
    },
  },
});

export const { setCredentials, updateUserInfo, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectUser = (state) => state.auth.user;