import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
    timeout: 300000,
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
        if (response.status === 504) {
          return '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        }
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
        if (response.status === 504) {
          return '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        }
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