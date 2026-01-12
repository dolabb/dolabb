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
  payoutRequest?: SellerPayoutRequest;
  error?: string;
  missing_bank_details?: boolean;
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

export interface SellerBankDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName?: string;
  iban?: string;
  swiftCode?: string;
}

// Backend response format (snake_case)
interface SellerBankDetailsApiResponse {
  success: boolean;
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_holder_name?: string;
    iban?: string;
    swift_code?: string;
  };
  // Also handle camelCase format in case it's already transformed
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName?: string;
    iban?: string;
    swiftCode?: string;
  };
  error?: string;
}

export interface SellerBankDetailsResponse {
  success: boolean;
  bankDetails?: SellerBankDetails;
  // Keep raw format for fallback handling in components
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_holder_name?: string;
    iban?: string;
    swift_code?: string;
  };
  error?: string;
}

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get Bank Details
    getSellerBankDetails: builder.query<SellerBankDetailsResponse, void>({
      query: () => ({
        url: '/api/seller/bank-details/',
        method: 'GET',
      }),
      transformResponse: (response: SellerBankDetailsApiResponse): SellerBankDetailsResponse => {
        // Handle both snake_case (from API) and camelCase (if already transformed) formats
        const rawBankDetails = response.bank_details;
        const camelBankDetails = response.bankDetails;
        
        // Prefer camelCase if available, otherwise transform from snake_case
        let bankDetails: SellerBankDetails | undefined;
        
        if (camelBankDetails && camelBankDetails.bankName) {
          bankDetails = camelBankDetails;
        } else if (rawBankDetails && rawBankDetails.bank_name) {
          bankDetails = {
            bankName: rawBankDetails.bank_name || '',
            accountNumber: rawBankDetails.account_number || '',
            accountHolderName: rawBankDetails.account_holder_name,
            iban: rawBankDetails.iban,
            swiftCode: rawBankDetails.swift_code,
          };
        }
        
        return {
          success: response.success,
          error: response.error,
          bankDetails,
          // Also keep raw format for fallback
          bank_details: rawBankDetails,
        };
      },
      providesTags: ['Seller'],
    }),

    // Add/Update Bank Details
    updateSellerBankDetails: builder.mutation<SellerBankDetailsResponse, SellerBankDetails>({
      query: (data) => ({
        url: '/api/seller/bank-details/',
        method: 'POST',
        data: {
          bank_name: data.bankName,
          account_number: data.accountNumber,
          account_holder_name: data.accountHolderName,
          iban: data.iban,
          swift_code: data.swiftCode,
        },
      }),
      transformResponse: (response: SellerBankDetailsApiResponse): SellerBankDetailsResponse => {
        // Handle both snake_case (from API) and camelCase (if already transformed) formats
        const rawBankDetails = response.bank_details;
        const camelBankDetails = response.bankDetails;
        
        // Prefer camelCase if available, otherwise transform from snake_case
        let bankDetails: SellerBankDetails | undefined;
        
        if (camelBankDetails && camelBankDetails.bankName) {
          bankDetails = camelBankDetails;
        } else if (rawBankDetails && rawBankDetails.bank_name) {
          bankDetails = {
            bankName: rawBankDetails.bank_name || '',
            accountNumber: rawBankDetails.account_number || '',
            accountHolderName: rawBankDetails.account_holder_name,
            iban: rawBankDetails.iban,
            swiftCode: rawBankDetails.swift_code,
          };
        }
        
        return {
          success: response.success,
          error: response.error,
          bankDetails,
          bank_details: rawBankDetails,
        };
      },
      invalidatesTags: ['Seller'],
    }),

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
  useGetSellerBankDetailsQuery,
  useUpdateSellerBankDetailsMutation,
  useRequestSellerPayoutMutation,
  useGetSellerPayoutRequestsQuery,
  useGetSellerEarningsQuery,
} = sellerApi;

