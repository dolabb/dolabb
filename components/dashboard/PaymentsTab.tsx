'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { HiTruck } from 'react-icons/hi2';

interface Payment {
  id: string;
  offerId: string;
  product: string;
  size: string;
  price: string;
  offerPrice: string;
  shipping: string;
  totalPrice: string;
  status: 'pending' | 'ready' | 'shipped' | 'completed';
  orderDate: string;
  tokenId: string;
  tokenData?: {
    id: string;
    brand: string;
    lastFour: string;
    name: string;
    month: string;
    year: string;
    country: string;
    funding: string;
    status: string;
    expiresAt: string;
  };
  paymentMethod: string;
}

export default function PaymentsTab() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [ordersToShip, setOrdersToShip] = useState<Payment[]>([]);

  useEffect(() => {
    // Load payments from localStorage
    const storedPayments = JSON.parse(
      localStorage.getItem('payments') || '[]'
    ) as Payment[];

    // Convert payment data to order format
    const orders = storedPayments.map((payment) => ({
      ...payment,
      product: {
        title: payment.product,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format', // Default image
        price: parseFloat(payment.totalPrice),
      },
      buyer: 'buyer', // You can get this from the offer data if available
    }));

    setOrdersToShip(orders);
  }, []);

  // Listen for storage changes to update when new payments are added
  useEffect(() => {
    const handleStorageChange = () => {
      const storedPayments = JSON.parse(
        localStorage.getItem('payments') || '[]'
      ) as Payment[];

      const orders = storedPayments.map((payment) => ({
        ...payment,
        product: {
          title: payment.product,
          image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
          price: parseFloat(payment.totalPrice),
        },
        buyer: 'buyer',
      }));

      setOrdersToShip(orders);
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes in the same tab
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleShip = (orderId: string) => {
    // Update order status to shipped
    const updatedOrders = ordersToShip.map((order) =>
      order.id === orderId ? { ...order, status: 'shipped' as const } : order
    );
    setOrdersToShip(updatedOrders);

    // Update localStorage
    const storedPayments = JSON.parse(
      localStorage.getItem('payments') || '[]'
    ) as Payment[];
    const updatedPayments = storedPayments.map((payment) =>
      payment.id === orderId ? { ...payment, status: 'shipped' as const } : payment
    );
    localStorage.setItem('payments', JSON.stringify(updatedPayments));
  };

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
        {locale === 'en' ? 'Orders to Ship' : 'الطلبات للشحن'}
      </h2>
      {ordersToShip.length === 0 ? (
        <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'No orders to ship yet.'
              : 'لا توجد طلبات للشحن بعد.'}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {ordersToShip.map((order) => (
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
                {order.tokenData && (
                  <>
                    <p>
                      {locale === 'en' ? 'Payment Method' : 'طريقة الدفع'}: {order.tokenData.brand.toUpperCase()} •••• {order.tokenData.lastFour}
                    </p>
                    <p>
                      {locale === 'en' ? 'Cardholder' : 'حامل البطاقة'}: {order.tokenData.name}
                    </p>
                  </>
                )}
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
                <button
                  onClick={() => handleShip(order.id)}
                  className='flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer'
                >
                  <HiTruck className='w-4 h-4' />
                  {locale === 'en' ? 'Ship' : 'شحن'}
                </button>
              )}
              {order.status === 'shipped' && (
                <span className='px-3 py-1 rounded-full text-xs font-medium text-center bg-blue-100 text-blue-700'>
                  {locale === 'en' ? 'Shipped' : 'تم الشحن'}
                </span>
              )}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

