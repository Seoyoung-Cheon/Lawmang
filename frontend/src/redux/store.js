import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { authApi } from "./slices/authApi";
import mylogReducer from "./slices/mylogSlice";
import { mylogApi } from "./slices/mylogApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer, // ✅ JWT 토큰 저장
    mylog: mylogReducer, // ✅ 활동 로그 상태 저장
    [mylogApi.reducerPath]: mylogApi.reducer, // ✅ RTK Query API 추가
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, mylogApi.middleware),
});

export default store;