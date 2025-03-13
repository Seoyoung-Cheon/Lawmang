import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setViewedLogs } from "./historySlice";

const BASE_URL = "http://localhost:8000/api/mylog";


export const historyApi = createApi({
  reducerPath: "historyApi",
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
  
  tagTypes: ['History'],
  endpoints: (builder) => ({
    // ✅ 사용자의 열람 기록 조회
    getViewed: builder.query({
      query: (userId) => `/history/${userId}`,
      providesTags: ['History'],
      async onQueryStarted(userId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setViewedLogs(data));
        } catch (error) {
          console.error("열람 기록 조회 실패:", error);
        }
      },
    }),

    // ✅ 열람 기록 생성
    createViewed: builder.mutation({
      query: (data) => ({
        url: `/history/${data.user_id}`,
        method: "POST",
        body: {
          consultation_id: data.consultation_id,
          precedent_id: data.precedent_id
        },
      }),
      invalidatesTags: ['History'],
    }),

    // ✅ 열람 기록 삭제
    deleteViewed: builder.mutation({
      query: (historyId) => ({
        url: `/history/${historyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["History"],
    }),

    // ✅ 사용자의 모든 열람 기록 삭제 - 엔드포인트 수정
    deleteAllViewed: builder.mutation({
      query: (userId) => ({
        url: `/history/user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["History"],
    }),
  }),
});


export const { 
  useGetViewedQuery,
  useCreateViewedMutation,
  useDeleteViewedMutation,
  useDeleteAllViewedMutation,
} = historyApi;
