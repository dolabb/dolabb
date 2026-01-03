'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { HiEye } from 'react-icons/hi2';
import { useGetSellerProductsQuery } from '@/lib/api/productsApi';
import { useState } from 'react';
import { formatPrice } from '@/utils/formatPrice';

export default function ListedItems() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [currentPage, setCurrentPage] = useState(1);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  
  // Remove status filter to show all products including out of stock
  const { data, isLoading, error } = useGetSellerProductsQuery({
    page: currentPage,
    limit: 20,
    // Don't filter by status - show all products including sold/out of stock
  });

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden'
          >
            <div className='relative aspect-square bg-white skeleton-shimmer' />
            <div className='p-4 space-y-3'>
              <div className='h-5 bg-rich-sand/30 rounded w-3/4 skeleton-shimmer' />
              <div className='flex justify-between items-center'>
                <div className='h-6 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-16 skeleton-shimmer' />
              </div>
              <div className='h-10 bg-rich-sand/30 rounded w-full mt-2 skeleton-shimmer' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-deep-charcoal/70'>
          {locale === 'en'
            ? 'No products found. Start listing your items!'
            : 'لم يتم العثور على منتجات. ابدأ في إدراج العناصر الخاصة بك!'}
        </p>
      </div>
    );
  }

  // Calculate isOutOfStock from quantity if not provided by backend
  const productsWithStockStatus = data.map(product => ({
    ...product,
    isOutOfStock: product.isOutOfStock ?? (product.quantity === null || product.quantity === undefined || product.quantity <= 0),
  }));

  // Filter products based on showOutOfStock toggle
  const filteredProducts = showOutOfStock
    ? productsWithStockStatus
    : productsWithStockStatus.filter(p => !p.isOutOfStock);

  return (
    <div>
      {/* Filter Toggle */}
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-deep-charcoal'>
          {locale === 'en' ? 'My Products' : 'منتجاتي'}
        </h2>
        <label className='flex items-center gap-2 cursor-pointer'>
          <input
            type='checkbox'
            checked={showOutOfStock}
            onChange={e => setShowOutOfStock(e.target.checked)}
            className='w-4 h-4 text-saudi-green focus:ring-saudi-green rounded cursor-pointer'
          />
          <span className='text-sm text-deep-charcoal'>
            {locale === 'en' ? 'Show out of stock' : 'إظهار المنتجات غير المتوفرة'}
          </span>
        </label>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredProducts.map(product => {
          // Get first valid image, clean any spaces in URL
          const firstImage = product.images?.find(img => img && img.trim() !== '') || product.images?.[0] || '';
          const productImage = firstImage ? firstImage.replace(/\s+/g, '') : '';
          const isOutOfStock = product.isOutOfStock ?? (product.quantity === null || product.quantity === undefined || product.quantity <= 0);

          return (
            <div
              key={product.id}
              className={`bg-white rounded-lg border border-rich-sand/30 overflow-hidden hover:shadow-lg transition-shadow relative ${
                isOutOfStock ? 'opacity-75' : ''
              }`}
            >
              {/* Out of Stock Badge */}
              {isOutOfStock && (
                <div className='absolute top-2 left-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg'>
                  {locale === 'en' ? 'Out of Stock' : 'غير متوفر'}
                </div>
              )}
              
              <div className='relative aspect-square bg-white'>
                {productImage ? (
                  <Image
                    src={productImage}
                    alt={product.title}
                    fill
                    className={`object-contain ${isOutOfStock ? 'opacity-60' : ''}`}
                    unoptimized
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                    <span className='text-deep-charcoal/40 text-xs text-center px-2 line-clamp-2'>
                      {product.title || 'No Image'}
                    </span>
                  </div>
                )}
                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                  <div className='absolute inset-0 bg-black/10 pointer-events-none' />
                )}
                {product.status === 'pending' && (
                  <div className='absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold z-10'>
                    {locale === 'en' ? 'Pending' : 'قيد الانتظار'}
                  </div>
                )}
                {product.status === 'rejected' && (
                  <div className='absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold z-10'>
                    {locale === 'en' ? 'Rejected' : 'مرفوض'}
                  </div>
                )}
                {product.status === 'removed' && (
                  <div className='absolute top-2 right-2 bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold z-10 capitalize'>
                    {product.status}
                  </div>
                )}
                {product.status && product.status !== 'pending' && product.status !== 'rejected' && product.status !== 'removed' && (
                  <div className='absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded text-xs font-semibold z-10 capitalize'>
                    {product.status}
                  </div>
                )}
              </div>
              <div className='p-4'>
                <h3 className='font-semibold text-deep-charcoal mb-2 line-clamp-2'>
                  {product.title}
                </h3>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-lg font-bold text-saudi-green'>
                    {formatPrice(product.price, locale, 2, product.currency || (product as any).Currency)}
                  </span>
                  {product.quantity !== undefined && (
                    <span className={`text-xs ${isOutOfStock ? 'text-red-500 font-semibold' : 'text-deep-charcoal/60'}`}>
                      {product.quantity}{' '}
                      {locale === 'en' 
                        ? (isOutOfStock ? 'out of stock' : 'in stock')
                        : (isOutOfStock ? 'غير متوفر' : 'متوفر')}
                    </span>
                  )}
                </div>
                <Link
                  href={`/${locale}/my-store/item/${product.id}`}
                  className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors'
                >
                  <HiEye className='w-4 h-4' />
                  {locale === 'en' ? 'View details' : 'عرض التفاصيل'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

