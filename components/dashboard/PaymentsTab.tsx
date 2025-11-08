'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { HiTruck } from 'react-icons/hi2';

// Mock orders data
const ordersToShip = [
  {
    id: 'ORD-001',
    product: {
      title: 'Vintage Denim Jacket',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
      price: 45.99,
    },
    buyer: 'john_doe',
    orderDate: '2024-01-15',
    status: 'pending',
  },
  {
    id: 'ORD-002',
    product: {
      title: 'Designer Leather Bag',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop&auto=format',
      price: 89.50,
    },
    buyer: 'jane_smith',
    orderDate: '2024-01-14',
    status: 'ready',
  },
];

export default function PaymentsTab() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
        {locale === 'en' ? 'Orders to Ship' : 'الطلبات للشحن'}
      </h2>
      <div className='space-y-4'>
        {ordersToShip.map(order => (
          <div
            key={order.id}
            className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
          >
            <div className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'>
              <Image
                src={order.product.image}
                alt={order.product.title}
                fill
                className='object-cover'
                unoptimized
              />
            </div>
            <div className='flex-1'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
                <h3 className='font-semibold text-deep-charcoal'>
                  {order.product.title}
                </h3>
                <span className='text-lg font-bold text-saudi-green'>
                  {locale === 'ar' ? 'ر.س' : 'SAR'} {order.product.price.toFixed(2)}
                </span>
              </div>
              <div className='text-sm text-deep-charcoal/70 space-y-1'>
                <p>
                  {locale === 'en' ? 'Order ID' : 'رقم الطلب'}: {order.id}
                </p>
                <p>
                  {locale === 'en' ? 'Buyer' : 'المشتري'}: @{order.buyer}
                </p>
                <p>
                  {locale === 'en' ? 'Order Date' : 'تاريخ الطلب'}: {order.orderDate}
                </p>
              </div>
            </div>
            <div className='flex flex-col gap-2 sm:w-32'>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                  order.status === 'ready'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {order.status === 'ready'
                  ? locale === 'en'
                    ? 'Ready to Ship'
                    : 'جاهز للشحن'
                  : locale === 'en'
                    ? 'Pending'
                    : 'قيد الانتظار'}
              </span>
              {order.status === 'ready' && (
                <button className='flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors'>
                  <HiTruck className='w-4 h-4' />
                  {locale === 'en' ? 'Ship' : 'شحن'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

