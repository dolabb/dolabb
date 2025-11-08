'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { HiEye } from 'react-icons/hi2';

// Mock listed items data
const listedItems = [
  {
    id: '1',
    title: 'Vintage Denim Jacket',
    price: 45.99,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
    status: 'active',
    views: 123,
  },
  {
    id: '2',
    title: 'Designer Leather Bag',
    price: 89.50,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop&auto=format',
    status: 'active',
    views: 87,
  },
  {
    id: '3',
    title: 'Y2K Platform Sneakers',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop&auto=format',
    status: 'sold',
    views: 234,
  },
];

export default function ListedItems() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {listedItems.map(item => (
          <div
            key={item.id}
            className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden hover:shadow-lg transition-shadow'
          >
            <div className='relative aspect-square bg-rich-sand/20'>
              <Image
                src={item.image}
                alt={item.title}
                fill
                className='object-cover'
                unoptimized
              />
              {item.status === 'sold' && (
                <div className='absolute inset-0 bg-deep-charcoal/60 flex items-center justify-center'>
                  <span className='text-white font-bold text-lg'>
                    {locale === 'en' ? 'SOLD' : 'مباع'}
                  </span>
                </div>
              )}
            </div>
            <div className='p-4'>
              <h3 className='font-semibold text-deep-charcoal mb-2 line-clamp-2'>
                {item.title}
              </h3>
              <div className='flex justify-between items-center mb-3'>
                <span className='text-lg font-bold text-saudi-green'>
                  {locale === 'ar' ? 'ر.س' : 'SAR'} {item.price.toFixed(2)}
                </span>
                <span className='text-xs text-deep-charcoal/60'>
                  {item.views} {locale === 'en' ? 'views' : 'مشاهدة'}
                </span>
              </div>
              <Link
                href={`/${locale}/my-store/item/${item.id}`}
                className='w-full flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors'
              >
                <HiEye className='w-4 h-4' />
                {locale === 'en' ? 'View details' : 'عرض التفاصيل'}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

