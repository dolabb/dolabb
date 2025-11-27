import { baseApi } from './baseApi';

export interface Offer {
  id: string;
  productId: string;
  productTitle?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  offerAmount: number;
  originalPrice?: number;
  shippingCost?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'paid';
  expirationDate?: string;
  counterOfferAmount?: number;
  createdAt: string;
  paymentStatus?: 'pending' | 'paid' | 'completed' | 'failed';
  payment?: {
    status?: 'pending' | 'paid' | 'completed' | 'failed';
  };
  // Additional fields for paid offers
  shippingAddress?: string;
  zipCode?: string;
  houseNumber?: string;
  isPaidOnMoyasar?: boolean;
  moyasarPaymentId?: string;
  orderId?: string;
  orderStatus?: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    trackingNumber?: string;
    shipmentProof?: string;
  };
  buyer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  };
  product?: {
    id: string;
    title: string;
    description?: string;
    images?: string[];
    price: number;
    originalPrice?: number;
    currency?: string;
    category?: string;
    condition?: string;
  };
  shipmentProof?: string;
}

export const offersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOffer: builder.mutation<{ success: boolean; offer: Offer }, { productId: string; offerAmount: number }>({
      query: (data) => ({
        url: '/api/offers/create/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Offer', 'Cart'],
    }),

    getOffers: builder.query<{ success: boolean; offers: Offer[] }, void>({
      query: () => ({
        url: '/api/offers/',
        method: 'GET',
        timeout: 90000, // 90 seconds timeout for offers API
      }),
      providesTags: ['Offer'],
    }),

    getOfferDetail: builder.query<{ success: boolean; offer: Offer }, string>({
      query: (offerId) => `/api/offers/accepted/${offerId}/`,
      providesTags: ['Offer'],
    }),

    acceptOffer: builder.mutation<{ success: boolean; offer: Offer }, string>({
      query: (offerId) => ({
        url: `/api/offers/${offerId}/accept/`,
        method: 'PUT',
      }),
      invalidatesTags: ['Offer'],
    }),

    rejectOffer: builder.mutation<{ success: boolean; offer: Offer }, string>({
      query: (offerId) => ({
        url: `/api/offers/${offerId}/reject/`,
        method: 'PUT',
      }),
      invalidatesTags: ['Offer'],
    }),

    counterOffer: builder.mutation<
      { success: boolean; offer: Offer },
      { offerId: string; counterAmount: number }
    >({
      query: ({ offerId, counterAmount }) => ({
        url: `/api/offers/${offerId}/counter/`,
        method: 'POST',
        data: { counterAmount },
      }),
      invalidatesTags: ['Offer'],
    }),

    // Get all paid/accepted offers (for sellers)
    getPaidOffers: builder.query<{ success: boolean; offers: Offer[]; total?: number }, void>({
      query: () => '/api/offers/accepted/',
      providesTags: ['Offer'],
    }),

    // Get specific paid offer details
    getPaidOfferDetail: builder.query<{ success: boolean; offer: Offer }, string>({
      query: (offerId) => `/api/offers/accepted/${offerId}/`,
      providesTags: ['Offer'],
    }),

    // Upload shipment proof
    uploadShipmentProof: builder.mutation<
      { success: boolean; message: string; order: { id: string; orderNumber: string; status: string; shipmentProof: string } },
      { offerId: string; shipmentProof: File | string }
    >({
      query: ({ offerId, shipmentProof }) => {
        if (shipmentProof instanceof File) {
          const formData = new FormData();
          formData.append('shipmentProof', shipmentProof);
          return {
            url: `/api/offers/accepted/${offerId}/upload-shipment-proof/`,
            method: 'POST',
            data: formData,
            // FormData is handled automatically by apiClient interceptor
          };
        } else {
          // If it's a URL string, send as JSON
          return {
            url: `/api/offers/accepted/${offerId}/upload-shipment-proof/`,
            method: 'POST',
            data: { shipmentProofUrl: shipmentProof },
          };
        }
      },
      invalidatesTags: ['Offer'],
    }),
  }),
});

export const {
  useCreateOfferMutation,
  useGetOffersQuery,
  useGetOfferDetailQuery,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useCounterOfferMutation,
  useGetPaidOffersQuery,
  useGetPaidOfferDetailQuery,
  useUploadShipmentProofMutation,
} = offersApi;

