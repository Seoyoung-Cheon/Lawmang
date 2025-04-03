import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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

export const deepResearchApi = createApi({
  reducerPath: 'deepResearchApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api',
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Research'],
  endpoints: (builder) => ({
    submitLegalResearch: builder.mutation({
      query: (formData) => ({
        url: '/deepresearch/structured-research/legal',
        method: 'POST',
        body: formData,
      }),
      transformErrorResponse: (response) => {
        return response.data?.detail || '법률 검토 요청 중 오류가 발생했습니다.';
      },
      invalidatesTags: ['Research'],
    }),

    submitTaxResearch: builder.mutation({
      query: (formData) => ({
        url: '/deepresearch/structured-research/tax',
        method: 'POST',
        body: formData,
      }),
      transformErrorResponse: (response) => {
        return response.data?.detail || '세무 검토 요청 중 오류가 발생했습니다.';
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