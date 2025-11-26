export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  tags?: string[];
  seller: {
    id: string;
    username: string;
    profileImage?: string;
    rating?: number;
    totalSales?: number;
  };
  isSaved?: boolean;
  isLiked?: boolean;
  likes?: number;
  shippingInfo?: {
    cost: number;
    estimatedDays: number;
    locations: string[];
  };
  affiliateCode?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'active';
  quantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  condition?: string;
  search?: string;
  sortBy?: 'newest' | 'price: low to high' | 'price: high to low' | 'relevance';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

