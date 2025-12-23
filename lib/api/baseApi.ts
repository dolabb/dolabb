import { createApi } from '@reduxjs/toolkit/query/react';
import type { AxiosError } from 'axios';
import { apiClient } from './client';

const BASE_URL = 'https://dolabb-backend-2vsj.onrender.com';

// Custom base query using axios
const axiosBaseQuery =
  ({ baseUrl }: { baseUrl: string }) =>
  async (
    args: string | { url: string; method?: string; data?: any; params?: any; timeout?: number; skipAuth?: boolean }
  ) => {
    try {
      // Handle both string URL and object format
      let url: string;
      let method = 'GET';
      let data: any;
      let params: any;
      let timeout: number | undefined;
      let skipAuth = false;

      if (typeof args === 'string') {
        // If args is a string, it's just the URL
        url = args;
      } else if (args && typeof args === 'object') {
        // If args is an object, extract properties
        url = args.url;
        method = args.method || 'GET';
        data = args.data;
        params = args.params;
        timeout = args.timeout;
        skipAuth = args.skipAuth || false;
      } else {
        throw new Error('Invalid query arguments');
      }

      if (!url || typeof url !== 'string') {
        throw new Error('URL is required and must be a string');
      }

      const finalUrl = url.startsWith('/') ? url : '/' + url;
      // If timeout is 0, pass 0 to axios (no timeout)
      // If timeout is provided, use it, otherwise default to 60 seconds
      const axiosTimeout = timeout !== undefined ? timeout : 60000;
      
      // Create request config
      const requestConfig: any = {
        url: finalUrl,
        method,
        data,
        params,
        timeout: axiosTimeout,
        skipAuth, // Pass skipAuth flag to interceptor
      };

      // Log API requests for payments endpoint
      if (finalUrl.includes('/api/user/payments/')) {
        console.log('=== PAYMENTS API REQUEST ===');
        console.log('URL:', finalUrl);
        console.log('Method:', method);
        console.log('Params:', params);
        console.log('Full URL will be:', `${BASE_URL}${finalUrl}${params ? '?' + new URLSearchParams(params as any).toString() : ''}`);
        console.log('============================');
      }

      const result = await apiClient(requestConfig);
      
      // Log API responses for payments endpoint
      if (finalUrl.includes('/api/user/payments/')) {
        console.log('=== PAYMENTS API RESPONSE ===');
        console.log('Status:', result.status);
        console.log('Data:', result.data);
        console.log('=============================');
      }
      return { data: result.data };
    } catch (axiosError: any) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({
    baseUrl: 'https://dolabb-backend-2vsj.onrender.com',
  }),
  tagTypes: [
    'User',
    'Product',
    'Order',
    'Offer',
    'Conversation',
    'Message',
    'Notification',
    'Affiliate',
    'Cart',
    'Seller',
    'Review',
    'FeaturedProducts',
    'TrendingProducts',
    'Dispute',
  ],
  endpoints: () => ({}),
});
