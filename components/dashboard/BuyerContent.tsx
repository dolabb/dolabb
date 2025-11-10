'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { HiPencil } from 'react-icons/hi2';
import Pagination from '@/components/shared/Pagination';

export default function BuyerContent() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'orders' | 'offers'>('orders');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Mock orders data
  const orders = [
    {
      id: 'ORD-001',
      product: {
        id: '1',
        title: 'Vintage Denim Jacket',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
        price: 45.99,
      },
      orderDate: '2024-01-15',
      status: 'active',
    },
    {
      id: 'ORD-002',
      product: {
        id: '2',
        title: 'Designer Leather Bag',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop&auto=format',
        price: 89.50,
      },
      orderDate: '2024-01-14',
      status: 'active',
    },
    {
      id: 'ORD-003',
      product: {
        id: '3',
        title: 'Y2K Platform Sneakers',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop&auto=format',
        price: 65.00,
      },
      orderDate: '2024-01-13',
      status: 'sold',
    },
  ];

  // Mock offers data
  const offers = [
    {
      id: 'OFF-001',
      product: {
        id: '1',
        title: 'Vintage Denim Jacket',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
        price: 45.99,
      },
      offerAmount: 40.00,
      buyer: 'buyer123',
      date: '2024-01-15',
      status: 'pending',
    },
    {
      id: 'OFF-002',
      product: {
        id: '2',
        title: 'Designer Leather Bag',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop&auto=format',
        price: 89.50,
      },
      offerAmount: 75.00,
      buyer: 'fashion_lover',
      date: '2024-01-14',
      status: 'pending',
    },
  ];

  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Tabs */}
        <div className='flex gap-4 mb-6 border-b border-rich-sand/30'>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Orders' : 'الطلبات'}
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'offers'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Offers' : 'العروض'}
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className='space-y-4 mb-6'>
              {paginatedOrders.map(order => (
                <div
                  key={order.id}
                  className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
                >
                  <Link
                    href={`/${locale}/product/${order.product.id}`}
                    className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
                  >
                    <Image
                      src={order.product.image}
                      alt={order.product.title}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </Link>
                  <div className='flex-1'>
                    <Link
                      href={`/${locale}/product/${order.product.id}`}
                      className='block'
                    >
                      <h3 className='font-semibold text-deep-charcoal mb-2 hover:text-saudi-green transition-colors'>
                        {order.product.title}
                      </h3>
                    </Link>
                    <div className='text-sm text-deep-charcoal/70 space-y-1'>
                      <p>
                        {locale === 'en' ? 'Order ID' : 'رقم الطلب'}: {order.id}
                      </p>
                      <p>
                        {locale === 'en' ? 'Order Date' : 'تاريخ الطلب'}: {order.orderDate}
                      </p>
                      <p className='text-lg font-bold text-saudi-green'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {order.product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2 sm:w-32'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                        order.status === 'sold'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status === 'sold'
                        ? locale === 'en'
                          ? 'Sold'
                          : 'مباع'
                        : locale === 'en'
                          ? 'Active'
                          : 'نشط'}
                    </span>
                    <Link
                      href={`/${locale}/my-store/item/${order.product.id}`}
                      className='flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors'
                    >
                      <HiPencil className='w-4 h-4' />
                      {locale === 'en' ? 'Edit listing' : 'تعديل القائمة'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className='space-y-4'>
            {offers.map(offer => (
              <div
                key={offer.id}
                className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
              >
                <Link
                  href={`/${locale}/product/${offer.product.id}`}
                  className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
                >
                  <Image
                    src={offer.product.image}
                    alt={offer.product.title}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </Link>
                <div className='flex-1'>
                  <Link
                    href={`/${locale}/product/${offer.product.id}`}
                    className='block'
                  >
                    <h3 className='font-semibold text-deep-charcoal mb-2 hover:text-saudi-green transition-colors'>
                      {offer.product.title}
                    </h3>
                  </Link>
                  <div className='text-sm text-deep-charcoal/70 space-y-1'>
                    <p>
                      {locale === 'en' ? 'Buyer' : 'المشتري'}: @{offer.buyer}
                    </p>
                    <p>
                      {locale === 'en' ? 'Date' : 'التاريخ'}: {offer.date}
                    </p>
                    <div className='flex items-center gap-2 mt-2'>
                      <span className='text-deep-charcoal/60 line-through'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.product.price.toFixed(2)}
                      </span>
                      <span className='text-lg font-bold text-saudi-green'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.offerAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='flex flex-col gap-2 sm:w-32'>
                  <span className='px-3 py-1 rounded-full text-xs font-medium text-center bg-yellow-100 text-yellow-700'>
                    {locale === 'en' ? 'Pending' : 'قيد الانتظار'}
                  </span>
                  <div className='flex gap-2'>
                    <button className='flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors cursor-pointer'>
                      {locale === 'en' ? 'Accept' : 'قبول'}
                    </button>
                    <button className='flex-1 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer'>
                      {locale === 'en' ? 'Counter' : 'مقابل'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

