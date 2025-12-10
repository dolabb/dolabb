'use client';

import ProductCard from '@/components/shared/ProductCard';
import { useGetFeaturedProductsQuery } from '@/lib/api/productsApi';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect } from 'react';

export default function FeaturedProductsSection() {
  const t = useTranslations('featured');
  const locale = useLocale();
  const { data, isLoading, error } = useGetFeaturedProductsQuery({
    limit: 8,
    page: 1,
  });

  // Log featured items response and errors
  useEffect(() => {
    if (data) {
      console.log('Featured Items Response:', data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.error('Featured Items Error:', error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <section className='py-16 bg-off-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center mb-8'>
            <h2 className='text-lg sm:text-xl md:text-3xl font-bold text-deep-charcoal font-display'>
              {t('title')}
            </h2>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
            {[...Array(8)].map((_, i) => (
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

  if (error || !data?.products || data.products.length === 0) {
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
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
          {data.products.map((product, index) => {
            // Get first valid image, clean any spaces in URL
            const firstImage =
              product.images?.find(img => img && img.trim() !== '') ||
              product.images?.[0] ||
              '';
            // Clean image URL - remove any spaces that might be in the URL
            const productImage = firstImage
              ? firstImage.replace(/\s+/g, '')
              : '';

            // Prioritize first 4 items (above the fold)
            const isPriority = index < 4;

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
