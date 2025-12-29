'use client';

import ProductCard from '@/components/shared/ProductCard';
import { useGetFeaturedProductsQuery } from '@/lib/api/productsApi';
import type { Product } from '@/types/products';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect } from 'react';

interface FeaturedProductsSectionProps {
  /** Optional: Pre-fetched products to display. If provided, skips API call */
  products?: Product[];
  /** Optional: Loading state when using pre-fetched products */
  isLoading?: boolean;
}

export default function FeaturedProductsSection({ 
  products: providedProducts, 
  isLoading: providedLoading 
}: FeaturedProductsSectionProps = {}) {
  const t = useTranslations('featured');
  const locale = useLocale();
  
  // Only fetch if products not provided
  // Backend: Most recent products (newest first), sorted by created_at descending
  // Limit: 1-50, default: 5
  const { data, isLoading: queryLoading, error } = useGetFeaturedProductsQuery(
    { limit: 10 }, // Will be validated to 1-50 range by API
    { skip: !!providedProducts }
  );
  
  const isLoading = providedLoading ?? queryLoading;
  const products = providedProducts ?? data?.products;

  if (isLoading) {
    return (
      <section className='py-16 bg-off-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center mb-8'>
            <h2 className='text-lg sm:text-xl md:text-3xl font-bold text-deep-charcoal font-display'>
              {t('title')}
            </h2>
          </div>
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

  if ((error && !providedProducts) || !products || products.length === 0) {
    return null;
  }

  return (
    <section className='py-16 bg-off-white'>
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
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6'>
          {products.map((product, index) => {
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
      </div>
    </section>
  );
}
