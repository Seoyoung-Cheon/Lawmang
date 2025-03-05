import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "http://localhost:8000/api"; // FastAPI 백엔드 URL

export const mylogApi = createApi({
  reducerPath: "mylogApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['UserLogs'], // 캐시 태그 추가
  endpoints: (builder) => ({
    // ✅ 특정 사용자의 활동 로그 가져오기
    getUserLogs: builder.query({
      query: (userId) => `/mylog/${userId}`,
      providesTags: ['UserLogs'], 
    }),

    // ✅ 새로운 활동 로그 생성하기
    createUserLog: builder.mutation({
      query: (logData) => ({
        url: "/mylog",
        method: "POST",
        body: logData,
      }),
      invalidatesTags: ['UserLogs'], // 새 로그 추가 시, 캐시 무효화 -> 자동 갱신
    }),
  }),
});

// ✅ 훅 내보내기
export const { 
  useGetUserLogsQuery, 
  useCreateUserLogMutation 
} = mylogApi;
