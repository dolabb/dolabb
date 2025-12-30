import { baseApi } from './baseApi';
import type {
  SignupRequest,
  LoginRequest,
  VerifyOtpRequest,
  UserResponse,
  ProfileUpdateRequest,
  AffiliateSignupRequest,
  AffiliateResponse,
  User,
  ResetPasswordRequest,
} from '@/types/auth';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // User Signup
    signup: builder.mutation<UserResponse, SignupRequest>({
      query: (data) => ({
        url: '/api/auth/signup/',
        method: 'POST',
        data,
      }),
    }),

    // User Login
    login: builder.mutation<UserResponse, LoginRequest>({
      query: (data) => ({
        url: '/api/auth/login/',
        method: 'POST',
        data,
      }),
    }),

    // Verify OTP
    verifyOtp: builder.mutation<UserResponse, VerifyOtpRequest>({
      query: (data) => ({
        url: '/api/auth/verify-otp/',
        method: 'POST',
        data,
      }),
    }),

    // Resend OTP
    resendOtp: builder.mutation<{ success: boolean; otp: string }, { email: string; user_type: string }>({
      query: (data) => ({
        url: '/api/auth/resend-otp/',
        method: 'POST',
        data,
      }),
    }),

    // Forgot Password
    forgotPassword: builder.mutation<{ success: boolean; message: string; otp: string }, { email: string; language?: string }>({
      query: (data) => ({
        url: '/api/auth/forgot-password/',
        method: 'POST',
        data,
      }),
    }),

    // Reset Password
    resetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordRequest>({
      query: (data) => ({
        url: '/api/auth/reset-password/',
        method: 'POST',
        data,
      }),
    }),

    // Get Profile
    getProfile: builder.query<{ success: boolean; user: User }, void>({
      query: () => '/api/auth/profile/',
      providesTags: ['User'],
    }),

    // Update Profile
    updateProfile: builder.mutation<{ success: boolean; user: User }, ProfileUpdateRequest>({
      query: (data) => ({
        url: '/api/auth/profile/',
        method: 'PATCH',
        data,
      }),
      invalidatesTags: ['User'],
    }),

    // Upload Image
    uploadImage: builder.mutation<
      { success: boolean; message?: string; image_url: string; filename: string; file_id: string },
      FormData
    >({
      query: (formData) => ({
        url: '/api/auth/upload-image/',
        method: 'POST',
        data: formData,
        timeout: 300000, // 5 minutes timeout for image uploads (increased for large files and slow connections)
        // Don't set Content-Type header - let axios/browser set it automatically with boundary
      }),
    }),

    // Affiliate Signup
    affiliateSignup: builder.mutation<AffiliateResponse, AffiliateSignupRequest>({
      query: (data) => ({
        url: '/api/auth/affiliate/signup/',
        method: 'POST',
        data,
      }),
    }),

    // Affiliate Login
    affiliateLogin: builder.mutation<AffiliateResponse, LoginRequest>({
      query: (data) => ({
        url: '/api/auth/affiliate/login/',
        method: 'POST',
        data,
      }),
    }),

    // Affiliate Verify OTP
    affiliateVerifyOtp: builder.mutation<AffiliateResponse, VerifyOtpRequest>({
      query: (data) => ({
        url: '/api/auth/affiliate/verify-otp/',
        method: 'POST',
        data,
      }),
    }),

    // Affiliate Forgot Password
    affiliateForgotPassword: builder.mutation<{ success: boolean; message: string; otp: string }, { email: string; language?: string }>({
      query: (data) => ({
        url: '/api/auth/affiliate/forget-password/',
        method: 'POST',
        data,
      }),
    }),

    // Affiliate Reset Password
    affiliateResetPassword: builder.mutation<{ success: boolean; message: string }, ResetPasswordRequest>({
      query: (data) => ({
        url: '/api/auth/affiliate/reset-password/',
        method: 'POST',
        data,
      }),
    }),

    // Update Language Preference (works with or without token)
    updateLanguage: builder.mutation<
      { success: boolean; message: string; language: string; authenticated: boolean },
      { language: string; skipAuth?: boolean }
    >({
      query: ({ language, skipAuth }) => ({
        url: '/api/auth/language/update/',
        method: 'PUT',
        data: { language },
        // If skipAuth is true, we'll handle removing the token in the base query
        skipAuth,
      }),
    }),

    // Get user profile by user ID (public endpoint)
    getUserProfileById: builder.query<
      { success: boolean; user: User; sellerRating?: any },
      string
    >({
      query: (userId) => ({
        url: `/api/auth/profile/${userId}/`,
        method: 'GET',
        skipAuth: true, // Public endpoint
      }),
      providesTags: (result, error, userId) => [
        { type: 'User', id: userId },
      ],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadImageMutation,
  useAffiliateSignupMutation,
  useAffiliateLoginMutation,
  useAffiliateVerifyOtpMutation,
  useAffiliateForgotPasswordMutation,
  useAffiliateResetPasswordMutation,
  useUpdateLanguageMutation,
  useGetUserProfileByIdQuery,
} = authApi;

