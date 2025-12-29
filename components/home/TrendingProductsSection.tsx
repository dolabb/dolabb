'use client';

import ProductCard from '@/components/shared/ProductCard';
import { useGetTrendingProductsQuery } from '@/lib/api/productsApi';
import type { Product } from '@/types/products';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

interface TrendingProductsSectionProps {
  /** Optional: Pre-fetched products to display. If provided, skips API call */
  products?: Product[];
  /** Optional: Loading state when using pre-fetched products */
  isLoading?: boolean;
}

export default function TrendingProductsSection({ 
  products: providedProducts, 
  isLoading: providedLoading 
}: TrendingProductsSectionProps = {}) {
  const t = useTranslations('trending');
  const locale = useLocale();
  
  // Only fetch if products not provided
  // Backend: Best-selling products (most completed orders), sorted by sales count descending
  // Limit: 1-50, default: 5
  const { data, isLoading: queryLoading, error } = useGetTrendingProductsQuery(
    { limit: 10 }, // Will be validated to 1-50 range by API
    { skip: !!providedProducts }
  );
  
  const isLoading = providedLoading ?? queryLoading;
  const products = providedProducts ?? data?.products;

  // Filter out products with purchaseCount === 0 or undefined/null
  // Only show products that have been purchased at least once
  // Must be before early returns to maintain hook order
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) {
      return [];
    }
    
    return products.filter(product => {
      const hasValidPurchaseCount = product.purchaseCount !== undefined && 
                                    product.purchaseCount !== null && 
                                    product.purchaseCount > 0;
      
      // Debug logging
      if (!hasValidPurchaseCount && product.purchaseCount !== undefined) {
        console.log('Trending product filtered out:', {
          id: product.id,
          title: product.title,
          purchaseCount: product.purchaseCount
        });
      }
      
      return hasValidPurchaseCount;
    });
  }, [products]);
  
  // Debug: Log filtered products
  useEffect(() => {
    console.log('TrendingProductsSection Debug:', {
      providedProducts: providedProducts?.length || 0,
      dataProducts: data?.products?.length || 0,
      products: products?.length || 0,
      displayProducts: displayProducts.length,
      isLoading,
      queryLoading,
      error: error ? 'Error occurred' : 'No error',
      rawProducts: products,
      filteredProducts: displayProducts,
      purchaseCounts: products?.map(p => ({ 
        id: p.id, 
        title: p.title, 
        purchaseCount: p.purchaseCount,
        purchaseCountType: typeof p.purchaseCount
      })) || []
    });
  }, [products, displayProducts, providedProducts, data, isLoading, queryLoading, error]);

  if (isLoading) {
    return (
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h2 className='text-lg sm:text-xl md:text-3xl font-bold text-deep-charcoal mb-8 font-display'>
            {t('title')}
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6'>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className='bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300'
              >
                <div className='relative aspect-square overflow-hidden bg-rich-sand/20 skeleton-shimmer' />
                <div className='p-4'>
                  <div className='h-4 bg-rich-sand/30 rounded w-3/4 mb-1 skeleton-shimmer' />
                  <div className='h-3 bg-rich-sand/30 rounded w-1/2 mb-2 skeleton-shimmer' />
                  <div className='h-5 bg-rich-sand/30 rounded w-20 skeleton-shimmer' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Only hide section if there's a critical error and no data at all
  if (error && !providedProducts && !data && !isLoading) {
    return null;
  }

  return (
    <section className='py-16 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center mb-8'>
          <h2 className='text-lg sm:text-xl md:text-3xl font-bold text-deep-charcoal font-display'>
            {t('title')}
          </h2>
          <Link
            href={`/${locale}/browse`}
            className='text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors font-display flex items-center gap-1'
          >
            {t('viewAll')} <span>{locale === 'ar' ? '←' : '→'}</span>
          </Link>
        </div>
        {displayProducts.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            <p>{locale === 'en' ? 'No trending products available at the moment.' : 'لا توجد منتجات رائجة في الوقت الحالي.'}</p>
            <p className='text-sm mt-2'>{locale === 'en' ? 'Check back soon!' : 'تحقق مرة أخرى قريبًا!'}</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6'>
            {displayProducts.map((product, index) => {
            // Get first valid image, clean any spaces in URL
            const firstImage =
              product.images?.find(img => img && img.trim() !== '') ||
              product.images?.[0] ||
              '';
            // Clean image URL - remove any spaces that might be in the URL
            const productImage = firstImage
              ? firstImage.replace(/\s+/g, '')
              : '';

            // Prioritize first 5 items (above the fold)
            const isPriority = index < 5;

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                image={productImage}
                title={product.title || 'Untitled Product'}
                price={product.price || 0}
                seller={product.seller?.username || 'Unknown'}
                isLiked={product.isLiked}
                locale={locale}
                priority={isPriority}
                currency={(product as any).Currency || product.currency}
              />
            );
          })}
          </div>
        )}
      </div>
    </section>
  );
}
