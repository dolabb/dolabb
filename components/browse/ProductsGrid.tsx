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
    search?: string;
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
  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='max-w-md mx-auto'>
          <div className='mb-4'>
            <svg
              className='mx-auto h-12 w-12 text-red-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <p className='text-lg font-semibold text-deep-charcoal mb-2'>
            {locale === 'en' ? 'Error loading products' : 'خطأ في تحميل المنتجات'}
          </p>
          <p className='text-deep-charcoal/70 text-sm'>
            {locale === 'en'
              ? 'Please try again later or refresh the page.'
              : 'يرجى المحاولة مرة أخرى لاحقاً أو تحديث الصفحة.'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {filters.search && (
          <div className='text-center py-4'>
            <div className='inline-flex items-center gap-2 text-deep-charcoal/70'>
              <div className='animate-spin rounded-full h-5 w-5 border-2 border-saudi-green border-t-transparent' />
              <span className='text-sm'>
                {locale === 'en'
                  ? `Searching for "${filters.search}"...`
                  : `جاري البحث عن "${filters.search}"...`}
              </span>
            </div>
          </div>
        )}
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
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='max-w-md mx-auto'>
          <div className='mb-4'>
            <svg
              className='mx-auto h-16 w-16 text-deep-charcoal/30'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
          <p className='text-lg font-semibold text-deep-charcoal mb-2'>
            {filters.search
              ? locale === 'en'
                ? `No products found for "${filters.search}"`
                : `لم يتم العثور على منتجات لـ "${filters.search}"`
              : locale === 'en'
                ? 'No products found'
                : 'لم يتم العثور على منتجات'}
          </p>
          <p className='text-deep-charcoal/70 text-sm'>
            {filters.search
              ? locale === 'en'
                ? 'Try adjusting your search terms or browse all products.'
                : 'حاول تعديل مصطلحات البحث أو تصفح جميع المنتجات.'
              : locale === 'en'
                ? 'Try adjusting your filters to see more products.'
                : 'حاول تعديل المرشحات لرؤية المزيد من المنتجات.'}
          </p>
        </div>
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
              currency={(product as any).Currency || product.currency}
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

