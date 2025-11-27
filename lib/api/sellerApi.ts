import { baseApi } from './baseApi';

export interface SellerPayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface SellerPayoutResponse {
  success: boolean;
  payoutRequest: SellerPayoutRequest;
  error?: string;
}

export interface SellerPayoutsResponse {
  success: boolean;
  payoutRequests: SellerPayoutRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface SellerEarnings {
  totalEarnings: number;
  totalPayouts: number;
  pendingPayouts: number;
  availableBalance: number;
  pendingShipmentProof: number; // NEW: Amount locked until shipment proof uploaded
}

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Request Payout
    requestSellerPayout: builder.mutation<
      SellerPayoutResponse,
      { amount: number; paymentMethod: string }
    >({
      query: (data) => ({
        url: '/api/seller/payout/request/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Seller'],
    }),

    // Get Payout Requests
    getSellerPayoutRequests: builder.query<
      SellerPayoutsResponse,
      { page?: number; limit?: number; status?: 'pending' | 'approved' | 'rejected' }
    >({
      query: ({ page = 1, limit = 20, status }) => ({
        url: '/api/seller/payout-requests/',
        method: 'GET',
        params: { page, limit, status },
      }),
      providesTags: ['Seller'],
    }),

    // Get Seller Earnings
    getSellerEarnings: builder.query<{ success: boolean; earnings: SellerEarnings }, void>({
      query: () => ({
        url: '/api/seller/earnings/',
        method: 'GET',
      }),
      providesTags: ['Seller'],
    }),
  }),
});

export const {
  useRequestSellerPayoutMutation,
  useGetSellerPayoutRequestsQuery,
  useGetSellerEarningsQuery,
} = sellerApi;

