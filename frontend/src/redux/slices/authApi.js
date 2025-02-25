import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "http://localhost:8000/api"; // FastAPI 백엔드 URL

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    // ✅ 이메일 인증 코드 요청 API
    sendEmailCode: builder.mutation({
      query: ({ email }) => ({
        url: "/auth/send-code",
        method: "POST",
        body: { email },
      }),
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

    // ✅ 현재 로그인한 사용자 정보 조회 API
    getCurrentUser: builder.query({
      query: ({ token }) => ({
        url: "/auth/me",
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
    }),

    // ✅ 이메일 인증 코드 확인 엔드포인트 추가
    verifyEmailCode: builder.mutation({
      query: (data) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body: data,
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
} = authApi;