import { baseApi } from './baseApi';
import type {
  ValidateCodeResponse,
  CashoutResponse,
  AffiliateTransactionsResponse,
  PayoutRequestsResponse,
  Affiliate,
  EarningsBreakdownResponse,
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
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) => ({
        url: '/api/affiliate/transactions/',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Affiliate'],
    }),

    // Get Cashout Requests (My Cashout Request History)
    getPayoutRequests: builder.query<
      PayoutRequestsResponse,
      { page?: number; limit?: number; status?: 'pending' | 'approved' | 'rejected' }
    >({
      query: ({ page = 1, limit = 20, status }) => ({
        url: '/api/affiliate/cashout-requests/',
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

    // Get Earnings Breakdown (Time-Based)
    getEarningsBreakdown: builder.query<
      EarningsBreakdownResponse,
      {
        period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
        limit?: number;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: ({ period = 'monthly', limit = 12, startDate, endDate }) => ({
        url: '/api/affiliate/earnings-breakdown/',
        method: 'GET',
        params: {
          period,
          limit,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        },
      }),
      providesTags: ['Affiliate'],
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
  useGetEarningsBreakdownQuery,
  useLazyGetEarningsBreakdownQuery,
} = affiliatesApi;

