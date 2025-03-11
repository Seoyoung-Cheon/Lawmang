import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setViewedLogs } from "../slices/mylogSlice";

const BASE_URL = "http://localhost:8000/api";

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
  
  tagTypes: ['UserMemos', 'UserViewed'],
  endpoints: (builder) => ({
    // ✅ 특정 사용자의 삭제되지 않은 메모 가져오기
    getUserMemos: builder.query({
      query: (userId) => `/mylog/memo/${userId}`,
      transformResponse: (response) => response.filter((memo) => !memo.is_deleted),
      providesTags: ["UserMemos"],
    }),

    // ✅ 새로운 메모 추가
    createMemo: builder.mutation({
      query: (memoData) => ({
        url: "/mylog/memo",
        method: "POST",
        body: memoData,
      }),
      invalidatesTags: ['UserMemos'],
    }),

    // ✅ 메모 수정
    updateMemo: builder.mutation({
      query: ({ id, title, content, event_date, notification }) => ({
        url: `/mylog/memo/${id}`,
        method: "PUT",
        body: {
          title,
          content: content || "", 
          event_date: event_date ?? null,
          notification: notification ?? false,
        },
      }),
      invalidatesTags: ["UserMemos"],
    }),    

    // ✅ 메모 삭제 (is_deleted = True로 변경)
    deleteMemo: builder.mutation({
      query: (memoId) => ({
        url: `/mylog/memo/${memoId}`,
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: { is_deleted: true },
      }),
      invalidatesTags: ["UserMemos"],
    }),
    

    // ✅ 특정 사용자의 열람 기록 가져오기
    getUserViewedLogs: builder.query({
      query: (userId) => `/mylog/viewed/${userId}`,
      providesTags: ['UserViewed'],
      async onQueryStarted(userId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setViewedLogs(data)); // ✅ Redux Store에 저장
        } catch (error) {
          // console.error("❌ 열람 기록 가져오기 실패:", error);
        }
      },
    }),

    // ✅ 새로운 열람 기록 추가
    createViewedLog: builder.mutation({
      query: (logData) => ({
        url: `/mylog/viewed/${logData.user_id}`,
        method: "POST",
        body: logData,
      }),
      invalidatesTags: ['UserViewed'],
      async onQueryStarted(logData, { queryFulfilled, dispatch, getState }) {
        const { mylog } = getState();
        const isAlreadyViewed = mylog.viewedLogs.some(
          (log) =>
            (log.consultation_id && log.consultation_id === logData.consultation_id) ||
            (log.precedent_number && log.precedent_number === logData.precedent_number)
        );
      
        if (isAlreadyViewed) {
          console.log("이미 존재하는 열람 기록입니다. API 요청을 취소합니다.");
          return;
        }
      
        try {
          await queryFulfilled;
        } catch (error) {
          if (error.error?.status === 500) {
            console.log("중복 요청 감지: 서버에서 처리되었습니다.");
          }
        }
      }
    }),

    // ✅ 특정 열람 기록 삭제
    deleteViewedLog: builder.mutation({
      query: (logId) => ({
        url: `/mylog/viewed/${logId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserViewed"],
    }),

    // ✅ 특정 사용자의 모든 열람 기록 삭제
    deleteAllViewedLogs: builder.mutation({
      query: (userId) => ({
        url: `/mylog/viewed/user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserViewed"],
    }),

  }),
});


export const { 
  useGetUserMemosQuery, 
  useCreateMemoMutation,
  useUpdateMemoMutation,
  useDeleteMemoMutation,
  useGetUserViewedLogsQuery,
  useCreateViewedLogMutation,
  useDeleteViewedLogMutation,
  useDeleteAllViewedLogsMutation,
} = mylogApi;
