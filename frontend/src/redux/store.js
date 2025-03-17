import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { authApi } from "./slices/authApi";
import memoReducer from "./slices/memoSlice";
import { memoApi } from "./slices/memoApi";
import historyReducer from "./slices/historySlice";
import { historyApi } from "./slices/historyApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [memoApi.reducerPath]: memoApi.reducer,
    [historyApi.reducerPath]: historyApi.reducer,
    auth: authReducer,
    memo: memoReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // RTK Query에 대한 직렬화 검사 무시
        ignoredActions: ['historyApi/executeQuery/fulfilled', 'memoApi/executeQuery/fulfilled'],
      },
    }).concat(
      authApi.middleware,
      memoApi.middleware,
      historyApi.middleware
    ),
});

export default store;