import { baseApi } from './baseApi';
import type {
  ValidateCodeResponse,
  CashoutResponse,
  AffiliateTransactionsResponse,
  PayoutRequestsResponse,
  Affiliate,
} from '@/types/auth';

export const affiliatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Validate Affiliate Code
    validateAffiliateCode: builder.mutation<
      ValidateCodeResponse,
      { code: string }
    >({
      query: (data) => ({
        url: '/api/affiliate/validate-code/',
        method: 'POST',
        data,
      }),
    }),

    // Request Cashout
    requestCashout: builder.mutation<
      CashoutResponse,
      { amount: number; paymentMethod: string }
    >({
      query: (data) => ({
        url: '/api/affiliate/cashout/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Affiliate'],
    }),

    // Get Affiliate Transactions
    getAffiliateTransactions: builder.query<
      AffiliateTransactionsResponse,
      { affiliateId: string; page?: number; limit?: number }
    >({
      query: ({ affiliateId, page = 1, limit = 20 }) => ({
        url: `/api/affiliate/${affiliateId}/transactions/`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Affiliate'],
    }),

    // Get Payout Requests
    getPayoutRequests: builder.query<
      PayoutRequestsResponse,
      { page?: number; limit?: number; status?: 'pending' | 'approved' | 'rejected' }
    >({
      query: ({ page = 1, limit = 20, status }) => ({
        url: '/api/affiliate/payout-requests/',
        method: 'GET',
        params: { page, limit, status },
      }),
      providesTags: ['Affiliate'],
    }),

    // Get Affiliate Profile
    getAffiliateProfile: builder.query<
      { success: boolean; affiliate: Affiliate },
      void
    >({
      query: () => ({
        url: '/api/affiliate/profile/',
        method: 'GET',
      }),
      providesTags: ['Affiliate'],
    }),

    // Update Affiliate Profile
    updateAffiliateProfile: builder.mutation<
      { success: boolean; affiliate: Affiliate },
      {
        full_name?: string;
        phone?: string;
        country_code?: string;
        profile_image?: string;
        bank_name?: string;
        account_number?: string;
        iban?: string;
        account_holder_name?: string;
      }
    >({
      query: (data) => ({
        url: '/api/affiliate/profile/',
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Affiliate'],
    }),
  }),
});

export const {
  useValidateAffiliateCodeMutation,
  useRequestCashoutMutation,
  useGetAffiliateTransactionsQuery,
  useLazyGetAffiliateTransactionsQuery,
  useGetPayoutRequestsQuery,
  useLazyGetPayoutRequestsQuery,
  useGetAffiliateProfileQuery,
  useUpdateAffiliateProfileMutation,
} = affiliatesApi;

