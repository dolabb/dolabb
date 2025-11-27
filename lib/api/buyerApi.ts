import { baseApi } from './baseApi';

// Review interfaces
export interface Review {
  id: string;
  orderId: string;
  productId: string;
  buyerId: string;
  buyerName?: string;
  buyerProfileImage?: string;
  sellerId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

// Seller Review interface (with full buyer and product info)
export interface SellerReview {
  id: string;
  orderId: string;
  orderNumber: string;
  buyer: {
    id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  };
  product: {
    id: string;
    title: string;
    image?: string;
  };
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface SellerReviewsResponse {
  success: boolean;
  reviews: SellerReview[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface ProductReviewsResponse {
  success: boolean;
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
}

export interface SellerRatingResponse {
  success: boolean;
  rating: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
    };
  };
}

export interface CreateReviewRequest {
  orderId: string;
  rating: number; // 1-5
  comment?: string; // Max 1000 chars, optional
}

// Dispute interfaces
export type DisputeType = 'product_quality' | 'delivery_issue' | 'payment_dispute';

export interface Dispute {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  disputeType: DisputeType;
  description: string;
  status: 'pending' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
}

export interface CreateDisputeRequest {
  orderId: string;
  disputeType: DisputeType;
  description: string;
}

// Order interface with reviewSubmitted field
export interface BuyerOrder {
  id: string;
  orderNumber: string;
  product: {
    id: string;
    title: string;
    images: string[];
  };
  seller: {
    id: string;
    username: string;
    profileImage?: string;
  };
  orderDate: string;
  status: 'pending' | 'packed' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed';
  totalPrice: number;
  shippingAddress?: any;
  trackingNumber?: string;
  reviewSubmitted: boolean; // New field - shows if review was already submitted
}

export const buyerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get Buyer Orders (with reviewSubmitted field)
    getBuyerOrders: builder.query<
      { orders: BuyerOrder[]; pagination?: any },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/api/user/orders/',
        method: 'GET',
        params,
      }),
      providesTags: ['Order'],
    }),

    // Submit Review
    createReview: builder.mutation<
      { success: boolean; review: Review },
      CreateReviewRequest
    >({
      query: (data) => ({
        url: '/api/user/reviews/create/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Order', 'Review'],
    }),

    // Get Product Reviews
    getProductReviews: builder.query<ProductReviewsResponse, string>({
      query: (productId) => ({
        url: `/api/user/reviews/product/${productId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, productId) => [
        { type: 'Review', id: productId },
      ],
    }),

    // Get Seller Rating
    getSellerRating: builder.query<SellerRatingResponse, string>({
      query: (sellerId) => ({
        url: `/api/user/reviews/seller/${sellerId}/rating/`,
        method: 'GET',
      }),
      providesTags: (result, error, sellerId) => [
        { type: 'Review', id: `seller-${sellerId}` },
      ],
    }),

    // Get Seller Reviews/Comments
    getSellerReviews: builder.query<
      SellerReviewsResponse,
      { sellerId: string; page?: number; limit?: number }
    >({
      query: ({ sellerId, page = 1, limit = 20 }) => ({
        url: `/api/user/reviews/seller/${sellerId}/`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (result, error, { sellerId }) => [
        { type: 'Review', id: `seller-reviews-${sellerId}` },
      ],
    }),

    // Report Seller (Create Dispute)
    createDispute: builder.mutation<
      { success: boolean; dispute: Dispute },
      CreateDisputeRequest
    >({
      query: (data) => ({
        url: '/api/user/disputes/create/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useGetBuyerOrdersQuery,
  useCreateReviewMutation,
  useGetProductReviewsQuery,
  useGetSellerRatingQuery,
  useGetSellerReviewsQuery,
  useCreateDisputeMutation,
} = buyerApi;

