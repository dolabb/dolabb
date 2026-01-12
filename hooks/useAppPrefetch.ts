'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { productsApi } from '@/lib/api/productsApi';

/**
 * Hook to prefetch common data on app initialization
 * This ensures data is ready before user navigates
 */
export function useAppPrefetch() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Prefetch home page data immediately on app load
    // This runs once and caches data for instant navigation
    dispatch(productsApi.endpoints.getFeaturedProducts.initiate({ limit: 5 }));
    dispatch(productsApi.endpoints.getTrendingProducts.initiate({ limit: 5 }));
    dispatch(productsApi.endpoints.getAllCategories.initiate());
    dispatch(productsApi.endpoints.getHeroSection.initiate());
  }, [dispatch]);
}
