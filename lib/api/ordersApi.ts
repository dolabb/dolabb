import { baseApi } from './baseApi';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

export interface Order {
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
  status: 'pending' | 'paid' | 'cancelled' | 'ready' | 'shipped' | 'reached_at_courier' | 'out_for_delivery' | 'delivered';
  totalPrice: number;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
}

export interface Payment extends Order {
  buyer: {
    id: string;
    username: string;
    profileImage?: string;
  };
  platformFee: number;
  sellerPayout: number;
  affiliateCode?: string;
  shipmentProof?: string; // NEW: Shipment proof URL
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'paid';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<
      { orders: Order[]; pagination: PaginationMeta },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/api/user/orders/',
        method: 'GET',
        params,
      }),
      providesTags: ['Order'],
    }),

    getPayments: builder.query<
      { payments: Payment[]; pagination: PaginationMeta },
      { status?: string; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: '/api/user/payments/',
        method: 'GET',
        params,
      }),
      providesTags: ['Order'],
    }),

    shipOrder: builder.mutation<
      { success: boolean; payment: Payment; message?: string },
      { orderId: string; trackingNumber: string; shipmentProof?: File; shipmentProofUrl?: string }
    >({
      query: ({ orderId, trackingNumber, shipmentProof, shipmentProofUrl }) => {
        const formData = new FormData();
        formData.append('trackingNumber', trackingNumber);
        
        if (shipmentProof) {
          formData.append('shipmentProof', shipmentProof);
        } else if (shipmentProofUrl) {
          formData.append('shipmentProofUrl', shipmentProofUrl);
        }

        // Use endpoint from documentation: /api/products/payments/<order_id>/ship/
        return {
          url: `/api/products/payments/${orderId}/ship/`,
          method: 'PUT',
          data: formData,
        };
      },
      invalidatesTags: ['Order', 'Seller'],
    }),

    updateOrderStatus: builder.mutation<
      { success: boolean; order: Payment },
      { orderId: string; status: string; trackingNumber?: string; shipmentProof?: File; shipmentProofUrl?: string }
    >({
      query: ({ orderId, status, trackingNumber, shipmentProof, shipmentProofUrl }) => {
        // Use endpoint matching shipOrder pattern: /api/products/payments/<order_id>/status/
        // Support both JSON and FormData depending on whether shipmentProof is provided
        if (shipmentProof || shipmentProofUrl) {
          const formData = new FormData();
          formData.append('status', status);
          if (trackingNumber) {
            formData.append('trackingNumber', trackingNumber);
          }
          if (shipmentProof) {
            formData.append('shipmentProof', shipmentProof);
          } else if (shipmentProofUrl) {
            formData.append('shipmentProofUrl', shipmentProofUrl);
          }
          
          return {
            url: `/api/user/payments/${orderId}/update-status/`,
            method: 'PUT',
            data: formData,
          };
        } else {
          // JSON request for status update without file
          return {
            url: `/api/user/payments/${orderId}/update-status/`,
            method: 'PUT',
            data: { 
              status, 
              ...(trackingNumber && { trackingNumber }) 
            },
          };
        }
      },
      invalidatesTags: ['Order'],
    }),

    checkout: builder.mutation<{ success: boolean; orderId: string; checkoutData: any }, any>({
      query: (data) => ({
        url: '/api/payment/checkout/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Order'],
    }),

    processPayment: builder.mutation<{ success: boolean; payment: any }, any>({
      query: (data) => ({
        url: '/api/payment/process/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetPaymentsQuery,
  useShipOrderMutation,
  useUpdateOrderStatusMutation,
  useCheckoutMutation,
  useProcessPaymentMutation,
} = ordersApi;

