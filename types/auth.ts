export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  full_name: string;
  profile_image?: string;
  bio?: string;
  location?: string;
  country_code?: string;
  dial_code?: string;
  role: 'buyer' | 'seller';
  status: 'pending' | 'active' | 'suspended';
  join_date?: string;
  joined_date?: string; // API returns this field
  created_at?: string;
  shippingAddress?: string;
  zipCode?: string;
  houseNumber?: string;
  shipping_address?: string;
  zip_code?: string;
  house_number?: string;
}

export interface SignupRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  country_code: string;
  dial_code: string;
  profile_image_url?: string;
  role?: string; // Empty string or undefined
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  username?: string;
  bio?: string;
  location?: string;
  profile_image?: string;
  shipping_address?: string;
  zip_code?: string;
  house_number?: string;
}

export interface UserResponse {
  success: boolean;
  user: User;
  token: string;
  savedProducts?: string[];
  message?: string;
  otp?: string;
}

export interface Affiliate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  affiliate_code: string;
  profile_image?: string;
  totalEarnings?: number;
  totalCommissions?: number;
  pendingEarnings?: number;
  paidEarnings?: number;
  codeUsageCount?: number;
  availableBalance?: number;
  status: 'pending' | 'active' | 'suspended';
  commission_rate?: number;
  bank_details?: {
    bank_name: string;
    account_number: string;
    iban?: string;
    account_holder_name: string;
  };
  created_at?: string;
}

export interface AffiliateSignupRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  country_code: string;
  bank_name: string;
  account_number: string;
  iban: string;
  account_holder_name: string;
  profile_image_url?: string;
}

export interface AffiliateResponse {
  success: boolean;
  affiliate: Affiliate;
  token?: string;
  otp?: string;
  message?: string;
}

export interface AffiliateTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  referredUserId: string;
  referredUserName: string;
  commission: number;
  commissionRate: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

export interface AffiliateTransactionsResponse {
  success: boolean;
  transactions: AffiliateTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface CashoutRequest {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

export interface CashoutResponse {
  success: boolean;
  cashoutRequest: CashoutRequest;
  error?: string;
}

export interface PayoutRequestsResponse {
  success: boolean;
  payoutRequests: Array<{
    id: string;
    affiliateId: string;
    affiliateName: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    paymentMethod: string;
    requestedAt: string;
    processedAt?: string;
    notes?: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface ValidateCodeResponse {
  valid: boolean;
  message: string;
  affiliate?: {
    id: string;
    full_name: string;
    affiliate_code: string;
  };
}

