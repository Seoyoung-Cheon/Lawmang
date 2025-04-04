import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const deepResearchApi = createApi({
  reducerPath: 'deepResearchApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: "/api",
    credentials: 'include',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      return headers;
    },
    timeout: 600000,
  }),
  tagTypes: ['LegalResearch', 'TaxResearch'],
  endpoints: (builder) => ({
    submitLegalResearch: builder.mutation({
      query: (formData) => ({
        url: "/deepresearch/structured-research/legal",
        method: 'POST',
        body: formData,
      }),
      transformErrorResponse: (response) => {
        if (response.status === 504 || response.status === 502) {
          return '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        }
        return response.data?.detail || '법률 검토 요청 중 오류가 발생했습니다.';
      },
      invalidatesTags: ['LegalResearch'],
    }),

    submitTaxResearch: builder.mutation({
      query: (formData) => ({
        url: "/deepresearch/structured-research/tax",
        method: 'POST',
        body: formData,
      }),
      transformErrorResponse: (response) => {
        if (response.status === 504 || response.status === 502) {
          return '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        }
        return response.data?.detail || '세무 검토 요청 중 오류가 발생했습니다.';
      },
      invalidatesTags: ['TaxResearch'],
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