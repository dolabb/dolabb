import { baseApi } from './baseApi';
import type { Product, ProductFilters, PaginationMeta } from '@/types/products';

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get Products
    getProducts: builder.query<Product[], ProductFilters>({
      query: (params) => ({
        url: '/api/products/',
        method: 'GET',
        params,
      }),
      providesTags: ['Product'],
    }),

    // Get Product Detail
    getProductDetail: builder.query<Product, string>({
      query: (productId) => ({
        url: `/api/products/${productId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, productId) => [{ type: 'Product', id: productId }],
    }),

    // Create Product
    createProduct: builder.mutation<{ success: boolean; product: Product }, any>({
      query: (data) => ({
        url: '/api/products/create/',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Product'],
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
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }],
    }),

    // Delete Product
    deleteProduct: builder.mutation<{ success: boolean; message: string }, string>({
      query: (productId) => ({
        url: `/api/products/${productId}/delete/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    // Get Seller Products
    getSellerProducts: builder.query<Product[], { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/api/products/seller/',
        method: 'GET',
        params,
      }),
      providesTags: ['Product'],
    }),

    // Save Product (Add to Wishlist/Cart)
    saveProduct: builder.mutation<{ success: boolean; isSaved: boolean }, string>({
      query: (productId) => ({
        url: `/api/products/${productId}/save/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, productId) => [
        { type: 'Product', id: productId },
        'Cart',
      ],
    }),

    // Unsave Product (Remove from Wishlist/Cart)
    unsaveProduct: builder.mutation<{ success: boolean; isSaved: boolean }, string>({
      query: (productId) => ({
        url: `/api/products/${productId}/unsave/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, productId) => [
        { type: 'Product', id: productId },
        'Cart',
      ],
    }),

    // Get Featured Products
    getFeaturedProducts: builder.query<
      { products: Product[]; pagination: PaginationMeta },
      { limit?: number; page?: number }
    >({
      query: (params) => ({
        url: '/api/products/featured/',
        method: 'GET',
        params,
      }),
    }),

    // Get Trending Products
    getTrendingProducts: builder.query<
      { products: Product[]; pagination: PaginationMeta },
      { limit?: number; page?: number }
    >({
      query: (params) => ({
        url: '/api/products/trending/',
        method: 'GET',
        params,
      }),
    }),

    // Get Categories, Brands, Colors, and Sizes
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
  useGetCartQuery,
} = productsApi;

