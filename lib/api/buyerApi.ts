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

export interface DisputeMessage {
  id: string;
  message: string;
  senderType: 'buyer' | 'admin';
  senderId: string;
  senderName: string;
  createdAt: string;
}

export interface DisputeTimeline {
  action: string;
  date: string;
  by: string;
}

export interface DisputeDetail {
  id: string;
  caseNumber: string;
  type: DisputeType;
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
  order: {
    id: string;
    orderNumber: string;
  };
  item: {
    id: string;
    title: string;
    price: number;
  };
  description: string;
  status: 'open' | 'resolved' | 'closed';
  adminNotes: string;
  resolution: string;
  created_at: string;
  updated_at: string;
  messages: DisputeMessage[];
  timeline: DisputeTimeline[];
}

export interface DisputeListItem {
  _id: string;
  caseNumber: string;
  type: DisputeType;
  buyerName: string;
  sellerName: string;
  orderId: string;
  itemTitle: string;
  description: string;
  status: 'open' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface DisputesListResponse {
  success: boolean;
  disputes: DisputeListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface DisputeDetailResponse {
  success: boolean;
  dispute: DisputeDetail;
}

export interface CreateDisputeRequest {
  orderId: string;
  disputeType: DisputeType;
  description: string;
}

export interface AddDisputeCommentRequest {
  message: string;
}

export interface AddDisputeCommentResponse {
  success: boolean;
  message: string;
  comment: DisputeMessage;
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
  reviewSubmitted?: boolean; // Shows if review was already submitted
  reviewStatus?: 'submitted' | 'not_submitted'; // Review status
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  } | null;
  disputeStatus?: 'none' | 'open' | 'resolved' | 'closed'; // Dispute status
  dispute?: {
    id: string;
    caseNumber: string;
    type: 'product_quality' | 'delivery_issue' | 'payment_dispute';
    status: 'open' | 'resolved' | 'closed';
    createdAt: string;
  } | null;
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

    // Get Seller Rating (public endpoint)
    getSellerRating: builder.query<SellerRatingResponse, string>({
      query: (sellerId) => ({
        url: `/api/user/reviews/seller/${sellerId}/rating/`,
        method: 'GET',
        skipAuth: true, // Public endpoint
      }),
      providesTags: (result, error, sellerId) => [
        { type: 'Review', id: `seller-${sellerId}` },
      ],
    }),

    // Get Seller Reviews/Comments (public endpoint)
    getSellerReviews: builder.query<
      SellerReviewsResponse,
      { sellerId: string; page?: number; limit?: number }
    >({
      query: ({ sellerId, page = 1, limit = 20 }) => ({
        url: `/api/user/reviews/seller/${sellerId}/`,
        method: 'GET',
        params: { page, limit },
        skipAuth: true, // Public endpoint
      }),
      providesTags: (result, error, { sellerId }) => [
        { type: 'Review', id: `seller-reviews-${sellerId}` },
      ],
    }),

    // Report Seller (Create Dispute)
    createDispute: builder.mutation<
      { success: boolean; message: string; dispute: any },
      CreateDisputeRequest
    >({
      query: (data) => ({
        url: '/api/user/disputes/create/',
        method: 'POST',
        data: {
          orderId: data.orderId,
          disputeType: data.disputeType,
          description: data.description,
        },
      }),
      invalidatesTags: ['Order', 'Dispute'],
    }),

    // Get My Disputes
    getMyDisputes: builder.query<
      DisputesListResponse,
      { page?: number; limit?: number; status?: 'open' | 'resolved' | 'closed' }
    >({
      query: (params = {}) => ({
        url: '/api/user/disputes/',
        method: 'GET',
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          ...(params.status && { status: params.status }),
        },
      }),
      providesTags: ['Dispute'],
    }),

    // Get My Dispute Details
    getMyDisputeDetails: builder.query<DisputeDetailResponse, string>({
      query: (disputeId) => ({
        url: `/api/user/disputes/${disputeId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, disputeId) => [
        { type: 'Dispute', id: disputeId },
      ],
    }),

    // Add Dispute Comment (Buyer)
    addDisputeComment: builder.mutation<
      AddDisputeCommentResponse,
      { disputeId: string; data: AddDisputeCommentRequest }
    >({
      query: ({ disputeId, data }) => ({
        url: `/api/user/disputes/${disputeId}/comments/`,
        method: 'POST',
        data,
      }),
      invalidatesTags: (result, error, { disputeId }) => [
        { type: 'Dispute', id: disputeId },
      ],
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
  useGetMyDisputesQuery,
  useGetMyDisputeDetailsQuery,
  useAddDisputeCommentMutation,
} = buyerApi;

