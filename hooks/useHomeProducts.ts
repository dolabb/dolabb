import { useGetFeaturedProductsQuery, useGetTrendingProductsQuery } from '@/lib/api/productsApi';
import { useEffect, useMemo, useState, useRef } from 'react';
import type { Product } from '@/types/products';

/**
 * Fisher-Yates shuffle algorithm for randomizing array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Custom hook to fetch featured and trending products with duplicate filtering
 * Uses stale-while-revalidate pattern: shows cached data instantly, fetches fresh data in background
 * 
 * Backend behavior:
 * - Featured: Most recent products (newest first), sorted by created_at descending
 * - Trending: Best-selling products (most completed orders), sorted by sales count descending
 * - Both: Only active and approved products
 * - Limit: 1-50, default: 5
 */
export function useHomeProducts(limit: number = 10) {
  // Ensure limit is within backend's valid range (1-50)
  const validLimit = Math.max(1, Math.min(50, limit));
  
  // State to store shuffled featured products (persists across re-renders but resets on page reload)
  const [shuffledFeatured, setShuffledFeatured] = useState<Product[] | null>(null);
  
  // Track if this is the initial mount to handle shuffle correctly on fresh data
  const hasShuffledRef = useRef(false);
  const lastFeaturedIdsRef = useRef<string>('');
  
  // Featured products: Most recent (newest first)
  // Using stale-while-revalidate: show cache immediately, but always refetch in background
  const { data: featuredData, isLoading: featuredLoading, error: featuredError, isFetching: featuredFetching } = 
    useGetFeaturedProductsQuery(
      { limit: validLimit },
      {
        // Always refetch on mount to get fresh data (but cache is shown immediately)
        refetchOnMountOrArgChange: true,
      }
    );
  
  // Trending products: Best-selling (most completed orders)
  // Fetch more to ensure we have enough after filtering out duplicates
  const trendingLimit = Math.min(50, validLimit * 3);
  const { data: trendingData, isLoading: trendingLoading, error: trendingError, isFetching: trendingFetching } = 
    useGetTrendingProductsQuery(
      { limit: trendingLimit },
      {
        // Always refetch on mount to get fresh data (but cache is shown immediately)
        refetchOnMountOrArgChange: true,
      }
    ); // Max 50 per backend limit

  // Extract featured product IDs
  const featuredProductIds = useMemo(() => {
    return new Set(featuredData?.products?.map(p => p.id) || []);
  }, [featuredData]);

  // Filter trending products: Only show products with purchaseCount > 0
  // Note: We allow products to appear in both featured and trending if they have purchases
  // This ensures trending products with purchases are always visible
  const filteredTrendingProducts = useMemo(() => {
    if (!trendingData?.products) {
      return [];
    }
    
    const filtered = trendingData.products.filter(
      product => {
        const hasValidPurchaseCount = product.purchaseCount !== undefined &&
                                      product.purchaseCount !== null &&
                                      product.purchaseCount > 0;
        
        // Debug logging
        if (!hasValidPurchaseCount) {
          console.log('Trending product filtered (invalid purchaseCount):', {
            id: product.id,
            title: product.title,
            purchaseCount: product.purchaseCount
          });
        }
        
        return hasValidPurchaseCount;
      }
    );
    
    // Debug: Log filtering results
    console.log('Trending Products Filtering:', {
      total: trendingData.products.length,
      filtered: filtered.length,
      featuredIds: Array.from(featuredProductIds),
      purchaseCounts: trendingData.products.map(p => ({ 
        id: p.id, 
        title: p.title,
        purchaseCount: p.purchaseCount,
        inFeatured: featuredProductIds.has(p.id)
      }))
    });
    
    // Return what we have (even if less than limit) to ensure section is visible
    return filtered.slice(0, limit);
  }, [trendingData, featuredProductIds, limit]);

  // Define featured products for use in useEffect
  const featuredProducts = featuredData?.products || [];

  // Shuffle first 5 featured products on initial load/page reload
  // Re-shuffle when data changes (e.g., after background refetch brings new data)
  useEffect(() => {
    if (featuredData?.products && featuredData.products.length > 0) {
      // Create a unique identifier for current product set
      const currentIds = featuredData.products.map(p => p.id).sort().join(',');
      
      // Only shuffle if:
      // 1. We haven't shuffled yet (initial load), OR
      // 2. The product IDs have changed (data was updated from API)
      if (!hasShuffledRef.current || currentIds !== lastFeaturedIdsRef.current) {
        const products = [...featuredData.products];
        
        if (products.length > 5) {
          // Shuffle only the first 5 items
          const first5 = products.slice(0, 5);
          const rest = products.slice(5);
          const shuffledFirst5 = shuffleArray(first5);
          setShuffledFeatured([...shuffledFirst5, ...rest]);
        } else {
          // If 5 or fewer items, shuffle all of them
          setShuffledFeatured(shuffleArray(products));
        }
        
        hasShuffledRef.current = true;
        lastFeaturedIdsRef.current = currentIds;
      }
    }
  }, [featuredData?.products]);

  // Use shuffled products if available, otherwise use original
  const displayFeaturedProducts = shuffledFeatured || featuredProducts;

  // Log featured items API call
  useEffect(() => {
    if (featuredLoading) {
      console.log('Featured Items API Call:', {
        endpoint: '/api/products/featured/',
        method: 'GET',
        params: { limit: validLimit },
        description: 'Most recent products (newest first)',
      });
    }
  }, [featuredLoading, validLimit]);

  // Log trending items API call
  useEffect(() => {
    if (trendingLoading) {
      console.log('Trending Items API Call:', {
        endpoint: '/api/products/trending/',
        method: 'GET',
        params: { limit: trendingLimit },
        description: 'Best-selling products (most completed orders)',
      });
    }
  }, [trendingLoading, trendingLimit]);

  // Log featured items API full response
  useEffect(() => {
    if (featuredData) {
      console.log('Featured Items API Full Response:', featuredData);
    }
  }, [featuredData]);

  // Log trending items API full response
  useEffect(() => {
    if (trendingData) {
      console.log('Trending Items API Full Response:', trendingData);
    }
  }, [trendingData]);

  return {
    featuredProducts: displayFeaturedProducts,
    trendingProducts: filteredTrendingProducts,
    featuredLoading,
    trendingLoading,
    featuredError,
    trendingError,
    // Fetching states (true when refetching in background)
    featuredFetching,
    trendingFetching,
    // Include pagination info
    featuredPagination: featuredData?.pagination,
    trendingPagination: trendingData?.pagination,
  };
}

