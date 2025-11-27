'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { HiCheckCircle, HiExclamationTriangle } from 'react-icons/hi2';
import { useGetPaymentsQuery } from '@/lib/api/ordersApi';
import Pagination from '@/components/shared/Pagination';

export default function SaleHistoryTab() {
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: paymentsData, isLoading } = useGetPaymentsQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination;

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
          >
            <div className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg skeleton-shimmer' />
            <div className='flex-1 space-y-3'>
              <div className='h-6 bg-rich-sand/30 rounded w-3/4 skeleton-shimmer' />
              <div className='space-y-2'>
                <div className='h-4 bg-rich-sand/30 rounded w-1/2 skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-1/3 skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-1/4 skeleton-shimmer' />
              </div>
              <div className='flex items-center gap-4 mt-2'>
                <div className='h-12 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
                <div className='h-12 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
                <div className='h-12 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
              </div>
              <div className='h-6 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
        <p className='text-deep-charcoal/70'>
          {locale === 'en' ? 'No sales found.' : 'لا توجد مبيعات.'}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {payments.map((payment) => (
        <div
          key={payment.id}
          className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
        >
          <div className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'>
            {payment.product.images && payment.product.images.length > 0 ? (
              <Image
                src={payment.product.images[0]}
                alt={payment.product.title}
                fill
                className='object-cover'
                unoptimized
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center'>
                <span className='text-deep-charcoal/40 text-xs'>
                  {locale === 'en' ? 'No Image' : 'لا توجد صورة'}
                </span>
              </div>
            )}
          </div>
          <div className='flex-1'>
            <h3 className='font-semibold text-deep-charcoal mb-2'>
              {payment.product.title}
            </h3>
            <div className='text-sm text-deep-charcoal/70 space-y-1'>
              <p>
                {locale === 'en' ? 'Order Number' : 'رقم الطلب'}: {payment.orderNumber}
              </p>
              <p>
                {locale === 'en' ? 'Date' : 'التاريخ'}:{' '}
                {new Date(payment.orderDate).toLocaleDateString()}
              </p>
              <p>
                {locale === 'en' ? 'Buyer' : 'المشتري'}: {payment.buyer.username}
              </p>
              <div className='flex items-center gap-4 mt-2'>
                <div>
                  <p className='text-xs text-deep-charcoal/60'>
                    {locale === 'en' ? 'Total Price' : 'السعر الإجمالي'}
                  </p>
                  <p className='text-lg font-bold text-deep-charcoal'>
                    {locale === 'ar' ? 'ر.س' : 'SAR'} {payment.totalPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-deep-charcoal/60'>
                    {locale === 'en' ? 'Platform Fee' : 'رسوم المنصة'}
                  </p>
                  <p className='text-sm text-deep-charcoal/70'>
                    {locale === 'ar' ? 'ر.س' : 'SAR'} {payment.platformFee.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-deep-charcoal/60'>
                    {locale === 'en' ? 'Your Payout' : 'مبلغ الدفع لك'}
                  </p>
                  <p className='text-lg font-bold text-saudi-green'>
                    {locale === 'ar' ? 'ر.س' : 'SAR'} {payment.sellerPayout.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : payment.status === 'shipped'
                      ? 'bg-blue-100 text-blue-700'
                      : payment.status === 'paid'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {payment.status === 'delivered'
                    ? locale === 'en'
                      ? 'Delivered'
                      : 'تم التسليم'
                    : payment.status === 'shipped'
                    ? locale === 'en'
                      ? 'Shipped'
                      : 'تم الشحن'
                    : payment.status === 'paid'
                    ? locale === 'en'
                      ? 'Paid'
                      : 'مدفوع'
                    : payment.status}
                </span>
                
                {/* Shipment Proof Status */}
                {(payment.status === 'paid' || payment.status === 'shipped' || payment.status === 'delivered') && (
                  <>
                    {payment.shipmentProof ? (
                      <span className='flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                        <HiCheckCircle className='w-4 h-4' />
                        {locale === 'en' ? 'Shipment Proof Uploaded' : 'تم رفع إثبات الشحن'}
                      </span>
                    ) : (
                      <span className='flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700'>
                        <HiExclamationTriangle className='w-4 h-4' />
                        {locale === 'en' ? 'Pending Shipment Proof' : 'إثبات الشحن معلق'}
                      </span>
                    )}
                  </>
                )}
              </div>
              
              {/* Warning Message for Orders Without Shipment Proof */}
              {(payment.status === 'paid' || payment.status === 'shipped' || payment.status === 'delivered') && !payment.shipmentProof && (
                <div className='mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                  <div className='flex items-start gap-2'>
                    <HiExclamationTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <p className='text-sm text-yellow-800 font-medium mb-1'>
                        {locale === 'en' ? 'Action Required' : 'إجراء مطلوب'}
                      </p>
                      <p className='text-xs text-yellow-700'>
                        {locale === 'en'
                          ? `Upload shipment proof to unlock ${payment.sellerPayout.toFixed(2)} SAR earnings for this order.`
                          : `قم برفع إثبات الشحن لفتح ${payment.sellerPayout.toFixed(2)} ر.س من الأرباح لهذا الطلب.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

