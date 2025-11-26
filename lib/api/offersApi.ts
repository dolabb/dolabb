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
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  expirationDate?: string;
  counterOfferAmount?: number;
  createdAt: string;
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
      query: () => '/api/offers/',
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
  }),
});

export const {
  useCreateOfferMutation,
  useGetOffersQuery,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useCounterOfferMutation,
} = offersApi;

