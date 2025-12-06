'use client';

import ProductCard from '@/components/shared/ProductCard';
import { Product } from '@/types/products';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

interface ProductsGridProps {
  products: Product[];
  isLoading: boolean;
  error: unknown;
  filters: {
    page: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  locale: string;
}

export default function ProductsGrid({
  products,
  isLoading,
  error,
  filters,
  onPageChange,
  locale,
}: ProductsGridProps) {
  if (isLoading) {
    return (
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
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-deep-charcoal/70'>
          {locale === 'en'
            ? 'No products found'
            : 'لم يتم العثور على منتجات'}
        </p>
      </div>
    );
  }

  return (
    <div className='relative'>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
        {products.map(product => {
          const firstImage =
            product.images?.find(img => img && img.trim() !== '') ||
            product.images?.[0] ||
            '';
          const productImage = firstImage
            ? firstImage.replace(/\s+/g, '')
            : '';

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
            />
          );
        })}
      </div>

      {/* Pagination */}
      {products.length > 0 && (
        <div className='flex items-center justify-center gap-2 mt-8' dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(1, filters.page - 1))}
            disabled={filters.page === 1}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
              filters.page === 1
                ? 'border-rich-sand/30 bg-off-white text-deep-charcoal/30 cursor-not-allowed'
                : 'border-rich-sand bg-white text-deep-charcoal hover:border-saudi-green hover:bg-saudi-green hover:text-white hover:scale-105 cursor-pointer'
            }`}
            aria-label={locale === 'en' ? 'Previous page' : 'الصفحة السابقة'}
          >
            {locale === 'ar' ? (
              <HiChevronRight className='w-5 h-5' />
            ) : (
              <HiChevronLeft className='w-5 h-5' />
            )}
          </button>

          {/* Page Number */}
          <button
            className='min-w-[2.5rem] h-10 px-3 rounded-lg border bg-saudi-green border-saudi-green text-white shadow-lg shadow-saudi-green/30 scale-105 font-medium cursor-pointer transition-all duration-200'
            aria-label={`${locale === 'en' ? 'Page' : 'صفحة'} ${filters.page}`}
            aria-current='page'
          >
            {filters.page}
          </button>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(filters.page + 1)}
            disabled={products.length < filters.limit}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
              products.length < filters.limit
                ? 'border-rich-sand/30 bg-off-white text-deep-charcoal/30 cursor-not-allowed'
                : 'border-rich-sand bg-white text-deep-charcoal hover:border-saudi-green hover:bg-saudi-green hover:text-white hover:scale-105 cursor-pointer'
            }`}
            aria-label={locale === 'en' ? 'Next page' : 'الصفحة التالية'}
          >
            {locale === 'ar' ? (
              <HiChevronLeft className='w-5 h-5' />
            ) : (
              <HiChevronRight className='w-5 h-5' />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

