import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';

// 공통 에러 처리 함수
const handleError = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '서버 연결에 실패했습니다.');
  }
  return response.json();
};

// 공통 요청 설정
const commonRequestConfig = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

// 기본 쿼리에 재시도 로직 추가
const baseQueryWithRetry = retry(
  fetchBaseQuery({ 
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    credentials: 'include',
    timeout: 60000, // 60초로 증가
  }),
  { 
    maxRetries: 2,
    backoff: (attemptNumber) => Math.min(1000 * (2 ** attemptNumber), 30000),
  }
);

export const deepResearchApi = createApi({
  reducerPath: 'deepResearchApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Research'], // 캐시 무효화를 위한 태그 추가
  endpoints: (builder) => ({
    submitLegalResearch: builder.mutation({
      query: (formData) => ({
        url: '/api/deepresearch/structured-research/legal',
        ...commonRequestConfig,
        body: formData,
        responseHandler: handleError,
      }),
      // 에러 변환
      transformErrorResponse: (response) => {
        return response.data?.detail || '법률 검토 요청 중 오류가 발생했습니다.';
      },
      // 요청 취소 설정
      extraOptions: {
        maxRetries: 1,
        timeout: 120000, // 120초로 증가
      },
      // 캐시 설정
      invalidatesTags: ['Research'],
      // 에러 처리 개선
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('API Request failed:', error);
          // 여기서 필요한 추가 에러 처리
        }
      },
    }),

    submitTaxResearch: builder.mutation({
      query: (formData) => ({
        url: '/api/deepresearch/structured-research/tax',
        ...commonRequestConfig,
        body: formData,
        responseHandler: handleError,
      }),
      transformErrorResponse: (response) => {
        return response.data?.detail || '세무 검토 요청 중 오류가 발생했습니다.';
      },
      extraOptions: {
        maxRetries: 1,
        timeout: 30000,
      },
      invalidatesTags: ['Research'],
    }),
  }),
});

// 커스텀 훅 추가
export const useResearchMutation = (type) => {
  const [submitLegal, legalResult] = deepResearchApi.useSubmitLegalResearchMutation();
  const [submitTax, taxResult] = deepResearchApi.useSubmitTaxResearchMutation();

  return type === 'legal' 
    ? [submitLegal, legalResult]
    : [submitTax, taxResult];
};

export const {
  useSubmitLegalResearchMutation,
  useSubmitTaxResearchMutation,
} = deepResearchApi; 