import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = "http://localhost:8000/api"; // FastAPI 백엔드 URL

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({
    // ✅ 인증 코드 요청 API
    sendEmailCode: builder.mutation({
      query: (email) => ({
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

    // ✅ 로그인 API
    loginUser: builder.mutation({
      query: (userData) => ({
        url: "/auth/login",
        method: "POST",
        body: userData,
      }),
    }),
  }),
});

// ✅ 사용 가능한 API 내보내기
export const {
  useSendEmailCodeMutation,  // ✅ 추가됨
  useRegisterUserMutation,
  useLoginUserMutation
} = authApi;
