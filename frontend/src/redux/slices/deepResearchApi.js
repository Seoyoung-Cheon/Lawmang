import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const deepResearchApi = createApi({
  reducerPath: 'deepResearchApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:8000',
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    submitLegalResearch: builder.mutation({
      query: (formData) => ({
        url: '/api/deepresearch/structured-research/legal',
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/json',
        },
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Network response was not ok');
          }
          return response.json();
        },
      }),
    }),
    submitTaxResearch: builder.mutation({
      query: (formData) => ({
        url: '/api/deepresearch/structured-research/tax',
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/json',
        },
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Network response was not ok');
          }
          return response.json();
        },
      }),
    }),
  }),
});

export const {
  useSubmitLegalResearchMutation,
  useSubmitTaxResearchMutation,
} = deepResearchApi; 