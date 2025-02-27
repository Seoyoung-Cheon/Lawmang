import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "http://localhost:8000/api"; // FastAPI 백엔드 URL

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ 
    baseUrl: BASE_URL,
    credentials: 'include',  // 쿠키 포함
    prepareHeaders: (headers) => {
      const token = document.cookie.match(/access_token=(.*?)(;|$)/)?.[1];
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'], // 캐시 태그 추가
  endpoints: (builder) => ({
    // ✅ 이메일 인증 코드 요청 API
    sendEmailCode: builder.mutation({
      query: ({ email }) => ({
        url: "/auth/send-code",
        method: "POST",
        body: { email },
      }),
    }),

    // ✅ 닉네임 중복 확인 API 추가
    checkNickname: builder.query({
      query: (nickname) => `/auth/check-nickname?nickname=${nickname}`,
    }),

    // ✅ 회원가입 API (이메일 인증 코드 필요)
    registerUser: builder.mutation({
      query: ({ email, password, nickname, code }) => ({
        url: "/auth/register",
        method: "POST",
        body: { email, password, nickname, code },
      }),
    }),

    // ✅ 로그인 API (JWT 토큰 반환)
    loginUser: builder.mutation({
      query: ({ email, password }) => ({
        url: "/auth/login",
        method: "POST",
        body: { email, password },
      }),
    }),

    // ✅ 로그아웃 API (JWT 토큰 무효화)
    logoutUser: builder.mutation({
      query: (token) => ({
        url: "/auth/logout",
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      }),
    }),

    // ✅ 현재 로그인한 사용자 정보 조회 API
    getCurrentUser: builder.query({
      query: () => ({
        url: "/auth/me",
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
      providesTags: ['User'], // 이 쿼리가 User 태그를 제공
    }),

    // ✅ 회원정보 수정 API 추가
    updateUser: builder.mutation({
      query: (data) => ({
        url: "/auth/update",
        method: "PUT",
        body: JSON.stringify(data), // ✅ JSON 변환 필수
        headers: {
          "Content-Type": "application/json", // ✅ JSON 형식 지정
          Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ 인증 토큰 추가
        },
      }),
      invalidatesTags: ['User'], // User 태그를 무효화하여 getCurrentUser를 다시 호출하도록 함
    }),

    // ✅ 이메일 인증 코드 확인 엔드포인트 추가
    verifyEmailCode: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: data,
      }),
    }),
    
    // ✅ 비밀번호 재설정 코드 요청 API
    sendResetCode: builder.mutation({
      query: (data) => ({
        url: '/send-reset-code',
        method: 'POST',
        body: data,
      }),
    }),

    // ✅ 비밀번호 재설정 코드 확인 API
    verifyResetCode: builder.mutation({
      query: (data) => ({
        url: '/verify-reset-code',
        method: 'POST',
        body: data,
      }),
    }),

    // ✅ 비밀번호 변경 API
    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

    // ✅ 챗봇 API 추가
    sendMessage: builder.mutation({
      query: ({ message, category }) => ({
        url: `/chatbot/${category}`,
        method: "POST",
        body: { message },
      }),
    }),

    // 현재 비밀번호 확인 endpoint 추가
    verifyCurrentPassword: builder.mutation({
      query: (credentials) => ({
        url: "/auth/verify-password",
        method: "POST",
        body: credentials,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
    }),
  }),
});

// ✅ 사용 가능한 API 내보내기
export const {
  useSendEmailCodeMutation,
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetCurrentUserQuery,
  useVerifyEmailCodeMutation,
  useSendResetCodeMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
  useLogoutUserMutation,
  useSendMessageMutation,
  useUpdateUserMutation,
  useCheckNicknameQuery,
  useVerifyCurrentPasswordMutation,
} = authApi;