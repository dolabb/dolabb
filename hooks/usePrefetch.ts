import { useCallback } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { productsApi } from '@/lib/api/productsApi';

/**
 * Hook to prefetch data on link hover for instant navigation
 * Usage: const prefetch = usePrefetch(); then onMouseEnter={prefetch.home}
 */
export function usePrefetch() {
  const dispatch = useAppDispatch();

  // Prefetch home page data
  const prefetchHome = useCallback(() => {
    dispatch(productsApi.endpoints.getFeaturedProducts.initiate({ limit: 10 }));
    dispatch(productsApi.endpoints.getTrendingProducts.initiate({ limit: 30 }));
    dispatch(productsApi.endpoints.getHeroSection.initiate());
    dispatch(productsApi.endpoints.getAllCategories.initiate());
  }, [dispatch]);

  // Prefetch product detail
  const prefetchProduct = useCallback((productId: string) => {
    dispatch(productsApi.endpoints.getProductDetail.initiate(productId));
  }, [dispatch]);

  // Prefetch category products
  const prefetchCategory = useCallback((categoryKey: string) => {
    dispatch(productsApi.endpoints.getCategoryDetails.initiate(categoryKey));
    dispatch(productsApi.endpoints.getCategoryFilters.initiate({ categoryKey }));
  }, [dispatch]);

  // Prefetch browse/products page
  const prefetchBrowse = useCallback(() => {
    dispatch(productsApi.endpoints.getProducts.initiate({ page: 1, limit: 20 }));
    dispatch(productsApi.endpoints.getAllCategories.initiate());
  }, [dispatch]);

  return {
    home: prefetchHome,
    product: prefetchProduct,
    category: prefetchCategory,
    browse: prefetchBrowse,
  };
}
