import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = 'https://dolabb-backend-2vsj.onrender.com';

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds default (increased for chat messages)
});

// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
    // If FormData is being sent, remove Content-Type header to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Skip adding token if skipAuth flag is set
    if (config.skipAuth) {
      return config;
    }
    
    // Get token from localStorage (check for affiliate token first, then user token)
    if (typeof window !== 'undefined') {
      const affiliateToken = localStorage.getItem('affiliate_token');
      const userToken = localStorage.getItem('token');
      const token = affiliateToken || userToken;
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log complete error details for debugging
    console.error('=== API ERROR ===');
    console.error('URL:', originalRequest?.url);
    console.error('Method:', originalRequest?.method);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    console.error('=================');

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't redirect if we're already on a login page or if the request is to login endpoint
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isLoginPage = currentPath.includes('/login') || currentPath.includes('/affiliate/login');
      const isLoginRequest = originalRequest.url?.includes('/api/auth/login') || 
                            originalRequest.url?.includes('/api/auth/affiliate/login');
      
      // Skip redirect for login requests or if already on login page
      if (isLoginRequest || isLoginPage) {
        return Promise.reject(error);
      }

      // Clear auth data
      if (typeof window !== 'undefined') {
        const isAffiliate = localStorage.getItem('affiliate_token');
        
        if (isAffiliate) {
          // Clear affiliate data
          localStorage.removeItem('affiliate_token');
          localStorage.removeItem('affiliate');
          // Redirect to affiliate login only if not already there
          if (!currentPath.includes('/affiliate/login')) {
            const locale = window.location.pathname.split('/')[1] || 'en';
            window.location.href = `/${locale}/affiliate/login`;
          }
        } else {
          // Clear user data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirect to user login only if not already there
          if (!currentPath.includes('/login')) {
            const locale = window.location.pathname.split('/')[1] || 'en';
            window.location.href = `/${locale}/login`;
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

