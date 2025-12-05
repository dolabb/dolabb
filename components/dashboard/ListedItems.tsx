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
  
  const { data, isLoading, error } = useGetSellerProductsQuery({
    page: currentPage,
    limit: 20,
    status: 'active', // As per user request
  });

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden'
          >
            <div className='relative aspect-square bg-rich-sand/20 skeleton-shimmer' />
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

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {data.map(product => {
          // Get first valid image, clean any spaces in URL
          const firstImage = product.images?.find(img => img && img.trim() !== '') || product.images?.[0] || '';
          const productImage = firstImage ? firstImage.replace(/\s+/g, '') : '';
          const isSold = product.status === 'sold' || product.quantity === 0;

          return (
            <div
              key={product.id}
              className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden hover:shadow-lg transition-shadow'
            >
              <div className='relative aspect-square bg-rich-sand/20'>
                {productImage ? (
                  <Image
                    src={productImage}
                    alt={product.title}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-rich-sand to-saudi-green/10'>
                    <span className='text-deep-charcoal/40 text-xs text-center px-2 line-clamp-2'>
                      {product.title || 'No Image'}
                    </span>
                  </div>
                )}
                {isSold && (
                  <div className='absolute inset-0 bg-deep-charcoal/60 flex items-center justify-center'>
                    <span className='text-white font-bold text-lg'>
                      {locale === 'en' ? 'SOLD' : 'مباع'}
                    </span>
                  </div>
                )}
                {product.status === 'pending' && (
                  <div className='absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold'>
                    {locale === 'en' ? 'Pending' : 'قيد الانتظار'}
                  </div>
                )}
                {product.status === 'rejected' && (
                  <div className='absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold'>
                    {locale === 'en' ? 'Rejected' : 'مرفوض'}
                  </div>
                )}
              </div>
              <div className='p-4'>
                <h3 className='font-semibold text-deep-charcoal mb-2 line-clamp-2'>
                  {product.title}
                </h3>
                <div className='flex justify-between items-center mb-3'>
                  <span className='text-lg font-bold text-saudi-green'>
                    {formatPrice(product.price, locale)}
                  </span>
                  {product.quantity !== undefined && (
                    <span className='text-xs text-deep-charcoal/60'>
                      {product.quantity}{' '}
                      {locale === 'en' ? 'in stock' : 'متوفر'}
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

