import { createApi } from '@reduxjs/toolkit/query/react';
import type { AxiosError } from 'axios';
import { apiClient } from './client';

// Custom base query using axios
const axiosBaseQuery =
  ({ baseUrl }: { baseUrl: string }) =>
  async (
    args: string | { url: string; method?: string; data?: any; params?: any; timeout?: number }
  ) => {
    try {
      // Handle both string URL and object format
      let url: string;
      let method = 'GET';
      let data: any;
      let params: any;
      let timeout: number | undefined;

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
      } else {
        throw new Error('Invalid query arguments');
      }

      if (!url || typeof url !== 'string') {
        throw new Error('URL is required and must be a string');
      }

      const finalUrl = url.startsWith('/') ? url : '/' + url;
      const result = await apiClient({
        url: finalUrl,
        method,
        data,
        params,
        timeout, // Pass timeout to axios
      });
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
  ],
  endpoints: () => ({}),
});
