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
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'sold';
  quantity?: number;
  taxPercentage?: number;
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
  color?: string;
  condition?: string;
  onSale?: boolean;
  search?: string;
  sortBy?: 'newest' | 'price: low to high' | 'price: high to low' | 'relevance' | 'price-low' | 'price-high';
  page?: number;
  limit?: number;
  format?: 'legacy';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// Category API Types
export interface SubCategory {
  id: string;
  name: string;
  key: string;
  href: string;
  productCount?: number;
}

export interface FeaturedItem {
  id: string;
  name: string;
  key: string;
  href: string;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  key: string;
  href: string;
  subCategories: SubCategory[];
  featured: FeaturedItem[];
  totalProducts?: number;
}

export interface CategoryFilters {
  brands: Array<{ name: string; count: number }>;
  sizes: Array<{ name: string; count: number }>;
  colors: Array<{ name: string; count: number }>;
  conditions: Array<{ name: string; count: number }>;
  priceRange: {
    min: number;
    max: number;
  };
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  pagination: PaginationMeta;
  filters?: {
    availableBrands: string[];
    availableSizes: string[];
    availableColors: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

export interface CategoriesResponse {
  success: boolean;
  categories: Category[];
}

export interface CategoryDetailsResponse {
  success: boolean;
  category: Category;
}

export interface CategoryFiltersResponse {
  success: boolean;
  filters: CategoryFilters;
}

