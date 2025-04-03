import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setMemos } from "./memoSlice";

export const memoApi = createApi({
  reducerPath: "memoApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: "/api/mylog",
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  
  tagTypes: ['Memos'],
  endpoints: (builder) => ({
    // ✅ 사용자 메모 조회
    getMemos: builder.query({
      query: (userId) => `/memo/${userId}`,
      providesTags: ["Memos"],
      async onQueryStarted(userId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setMemos(data));
        } catch (error) {
          console.error("메모 조회 실패:", error);
        }
      },
    }),

    // ✅ 메모 생성
    create: builder.mutation({
      query: (data) => ({
        url: `/memo/${data.user_id}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ['Memos'],
    }),

    // ✅ 메모 수정
    update: builder.mutation({
      query: ({ user_id, memo_id, ...data }) => ({
        url: `/memo/${user_id}/${memo_id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Memos"],
    }),    

    // ✅ 메모 삭제
    remove: builder.mutation({
      query: ({ user_id, memo_id }) => ({
        url: `/memo/${user_id}/${memo_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Memos"],
    }),

    // ✅ 알림 설정 변경
    updateAlert: builder.mutation({
      query: ({ user_id, memo_id, notification }) => ({
        url: `/memo/${user_id}/${memo_id}/alert`,
        method: "PATCH",
        body: { notification },
      }),
      invalidatesTags: ["Memos"],
    }),

    // ✅ 알림 전송 프로세스 호출
    triggerNotifications: builder.mutation({
      query: (user_id) => ({
        url: `/memo/${user_id}/trigger-notifications`,
        method: "POST",
      }),
      invalidatesTags: ["Memos"],
    }),
  }),
});


export const { 
  useGetMemosQuery,
  useCreateMutation,
  useUpdateMutation,
  useRemoveMutation,
  useUpdateAlertMutation,
  useTriggerNotificationsMutation,
} = memoApi;
