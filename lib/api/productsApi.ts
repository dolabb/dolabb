import type {
  CategoriesResponse,
  CategoryDetailsResponse,
  CategoryFiltersResponse,
  PaginationMeta,
  Product,
  ProductFilters,
  ProductsResponse,
} from '@/types/products';
import { baseApi } from './baseApi';

export const productsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    // Get Products (Updated with new format)
    getProducts: builder.query<
      ProductsResponse | Product[],
      ProductFilters & { format?: 'legacy' }
    >({
      query: params => {
        const { format, ...queryParams } = params;
        return {
          url: '/api/products/',
          method: 'GET',
          params:
            format === 'legacy'
              ? { ...queryParams, format: 'legacy' }
              : queryParams,
        };
      },
      providesTags: ['Product'],
      // Cache for 10 minutes - instant loads on navigation
      keepUnusedDataFor: 600,
    }),

    // Get Product Detail
    getProductDetail: builder.query<Product, string>({
      query: productId => ({
        url: `/api/products/${productId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, productId) => [
        { type: 'Product', id: productId },
      ],
    }),

    // Create Product
    createProduct: builder.mutation<
      { success: boolean; product: Product },
      any
    >({
      query: data => ({
        url: '/api/products/create/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Product', 'FeaturedProducts', 'TrendingProducts'],
    }),

    // Update Product
    updateProduct: builder.mutation<
      { success: boolean; product: Product },
      { productId: string; data: any }
    >({
      query: ({ productId, data }) => ({
        url: `/api/products/${productId}/update/`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
        'Product',
        'FeaturedProducts',
        'TrendingProducts',
      ],
    }),

    // Delete Product
    deleteProduct: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: productId => ({
        url: `/api/products/${productId}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product', 'FeaturedProducts', 'TrendingProducts'],
    }),

    // Get Seller Products
    getSellerProducts: builder.query<
      Product[],
      { page?: number; limit?: number; status?: string }
    >({
      query: params => ({
        url: '/api/products/seller/',
        method: 'GET',
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Products by Seller ID (public endpoint)
    getProductsBySellerId: builder.query<
      { success: boolean; products: Product[]; pagination: PaginationMeta },
      { sellerId: string; page?: number; limit?: number; status?: string }
    >({
      query: ({ sellerId, page = 1, limit = 10, status = 'active' }) => ({
        url: `/api/user/seller/${sellerId}/products/`,
        method: 'GET',
        params: { page, limit, status },
        skipAuth: true, // Public endpoint
      }),
      providesTags: (result, error, { sellerId }) => [
        { type: 'Product', id: `sellerProducts-${sellerId}` },
      ],
    }),

    // Save Product (Add to Wishlist/Cart)
    saveProduct: builder.mutation<
      { success: boolean; isSaved: boolean },
      string
    >({
      query: productId => ({
        url: `/api/products/${productId}/save/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, productId) => [
        { type: 'Product', id: productId },
        'Cart',
      ],
    }),

    // Unsave Product (Remove from Wishlist/Cart)
    unsaveProduct: builder.mutation<
      { success: boolean; isSaved: boolean },
      string
    >({
      query: productId => ({
        url: `/api/products/${productId}/unsave/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, productId) => [
        { type: 'Product', id: productId },
        'Cart',
      ],
    }),

    // Get Featured Products
    // Backend: Most recent products (newest first), sorted by created_at descending
    // Only active and approved products
    // Limit: 1-50, default: 5
    getFeaturedProducts: builder.query<
      { products: Product[]; pagination: PaginationMeta },
      { limit?: number }
    >({
      query: params => {
        // Ensure limit is within valid range (1-50)
        const limit = params?.limit 
          ? Math.max(1, Math.min(50, params.limit))
          : undefined;
        return {
          url: '/api/products/featured/',
          method: 'GET',
          params: limit ? { limit } : {},
        };
      },
      providesTags: ['FeaturedProducts', 'Product'],
      // Cache for 10 minutes - instant loads on navigation
      keepUnusedDataFor: 600,
    }),

    // Get Trending Products
    // Backend: Best-selling products (most completed orders)
    // Sorted by sales count (completed orders) descending, then by created_at for tie-breaking
    // Only active and approved products
    // Limit: 1-50, default: 5
    getTrendingProducts: builder.query<
      { products: Product[]; pagination: PaginationMeta },
      { limit?: number }
    >({
      query: params => {
        // Ensure limit is within valid range (1-50)
        const limit = params?.limit 
          ? Math.max(1, Math.min(50, params.limit))
          : undefined;
        return {
          url: '/api/products/trending/',
          method: 'GET',
          params: limit ? { limit } : {},
        };
      },
      providesTags: ['TrendingProducts', 'Product'],
      // Cache for 10 minutes - instant loads on navigation
      keepUnusedDataFor: 600,
    }),

    // Get All Categories (New endpoint)
    getAllCategories: builder.query<CategoriesResponse, void>({
      query: () => ({
        url: '/api/categories/',
        method: 'GET',
      }),
      // Cache for 5 minutes as categories don't change frequently
      keepUnusedDataFor: 300,
      providesTags: ['Product'],
    }),

    // Get Category Details
    getCategoryDetails: builder.query<CategoryDetailsResponse, string>({
      query: categoryKey => ({
        url: `/api/categories/${categoryKey}/`,
        method: 'GET',
      }),
      // Cache for 2 minutes
      keepUnusedDataFor: 120,
      providesTags: ['Product'],
    }),

    // Get Category Filters
    getCategoryFilters: builder.query<
      CategoryFiltersResponse,
      { categoryKey: string; subcategory?: string }
    >({
      query: ({ categoryKey, subcategory }) => ({
        url: `/api/categories/${categoryKey}/filters/`,
        method: 'GET',
        params: subcategory ? { subcategory } : {},
      }),
      // Cache for 1 minute
      keepUnusedDataFor: 60,
      providesTags: ['Product'],
    }),

    // Get Categories, Brands, Colors, and Sizes (Legacy - kept for backward compatibility)
    getCategories: builder.query<
      {
        success: boolean;
        categories: Array<{
          category: string;
          subcategories: string[];
        }>;
        brands: string[];
        colors: string[];
        sizes: string[];
      },
      void
    >({
      query: () => ({
        url: '/api/products/categories/',
        method: 'GET',
      }),
      keepUnusedDataFor: 300,
    }),

    // Get Cart Items
    getCart: builder.query<
      {
        success: boolean;
        cart: Array<{
          id: string;
          title: string;
          price: number;
          image: string;
        }>;
        totalAmount: number;
        itemCount: number;
      },
      void
    >({
      query: () => ({
        url: '/api/products/cart/',
        method: 'GET',
      }),
      providesTags: ['Cart'],
    }),

    // Get Hero Section
    getHeroSection: builder.query<
      {
        success: boolean;
        heroSection: {
          id: string;
          backgroundType: 'gradient' | 'image' | 'single';
          imageUrl?: string;
          singleColor?: string;
          gradientColors?: string[];
          gradientDirection?: string;
          title: string;
          subtitle: string;
          buttonText?: string;
          buttonLink?: string;
          textColor: string;
          isActive: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      },
      void
    >({
      query: () => ({
        url: '/api/products/hero-section/',
        method: 'GET',
      }),
      // Cache for 5 minutes as hero section doesn't change frequently
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductDetailQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetSellerProductsQuery,
  useSaveProductMutation,
  useUnsaveProductMutation,
  useGetFeaturedProductsQuery,
  useGetTrendingProductsQuery,
  useGetCategoriesQuery,
  useGetAllCategoriesQuery,
  useGetCategoryDetailsQuery,
  useGetCategoryFiltersQuery,
  useGetCartQuery,
  useGetHeroSectionQuery,
  useGetProductsBySellerIdQuery,
} = productsApi;
