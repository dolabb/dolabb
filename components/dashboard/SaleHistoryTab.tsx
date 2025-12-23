'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiCheckCircle, HiExclamationTriangle, HiEye, HiClock, HiArrowUpTray } from 'react-icons/hi2';
import { useGetPaymentsQuery, type Payment } from '@/lib/api/ordersApi';
import Pagination from '@/components/shared/Pagination';

export default function SaleHistoryTab() {
  const locale = useLocale();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: paymentsData, isLoading } = useGetPaymentsQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  // Fetch all payments to get accurate count of pending proof uploads
  const { data: allPaymentsData } = useGetPaymentsQuery({
    page: 1,
    limit: 1000, // Large limit to get all payments for counting
  });

  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination;
  
  // Helper function to determine if proof is needed
  // Show indicator when shipment_proof is empty AND status is shipped, ready, or packed
  const needsProof = (payment: Payment) => {
    return (
      !payment.shipmentProof &&
      (payment.status === 'shipped' ||
        payment.status === 'ready' ||
        payment.status === 'packed')
    );
  };
  
  // Calculate pending proof uploads from all payments
  const allPayments = allPaymentsData?.payments || [];
  const pendingProofPayments = allPayments.filter(needsProof);
  const pendingProofCount = pendingProofPayments.length;
  const totalLockedAmount = pendingProofPayments.reduce(
    (sum, payment) => sum + (payment.sellerPayout || 0),
    0
  );

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
      {/* Warning Banner for Pending Proof Uploads */}
      {pendingProofCount > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
          <div className='flex items-start gap-3'>
            <HiClock className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
            <div className='flex-1'>
              <h4 className='font-semibold text-yellow-800 mb-1'>
                {locale === 'en' ? '⚠️ Action Required: Upload Shipment Proof' : '⚠️ إجراء مطلوب: رفع إثبات الشحن'}
              </h4>
              <p className='text-sm text-yellow-700 mb-2'>
                {locale === 'en'
                  ? `You have ${pendingProofCount} order${pendingProofCount > 1 ? 's' : ''} with pending shipment proof upload${pendingProofCount > 1 ? 's' : ''}. ${totalLockedAmount > 0 ? `Total amount locked: ${totalLockedAmount.toFixed(2)} SAR. ` : ''}Upload proof to unlock your earnings.`
                  : `لديك ${pendingProofCount} طلب${pendingProofCount > 1 ? 'ات' : ''} يتطلب${pendingProofCount > 1 ? 'ن' : ''} رفع إثبات الشحن. ${totalLockedAmount > 0 ? `المبلغ الإجمالي المحجوز: ${totalLockedAmount.toFixed(2)} ر.س. ` : ''}قم برفع الإثبات لفتح أرباحك.`}
              </p>
            </div>
          </div>
        </div>
      )}
      
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
                      : payment.status === 'ready'
                      ? 'bg-purple-100 text-purple-700'
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
                    : payment.status === 'ready'
                    ? locale === 'en'
                      ? 'Ready'
                      : 'جاهز'
                    : payment.status === 'paid'
                    ? locale === 'en'
                      ? 'Paid'
                      : 'مدفوع'
                    : payment.status}
                </span>
                
                {/* Shipment Proof Status Badge */}
                {payment.shipmentProof ? (
                  <span className='flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                    <HiCheckCircle className='w-4 h-4' />
                    {locale === 'en' ? 'Shipment Proof Uploaded' : 'تم رفع إثبات الشحن'}
                  </span>
                ) : needsProof(payment) ? (
                  <span className='flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse'>
                    <HiExclamationTriangle className='w-4 h-4' />
                    {locale === 'en' ? 'Upload Proof Required' : 'مطلوب رفع الإثبات'}
                  </span>
                ) : null}
              </div>
              
              {/* Warning Message and Upload Button for Orders Needing Proof */}
              {needsProof(payment) && (
                <div className='mt-3 bg-red-50 border-2 border-red-200 rounded-lg p-4'>
                  <div className='flex items-start gap-2 mb-3'>
                    <HiExclamationTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <p className='text-sm text-red-800 font-semibold mb-1'>
                        {locale === 'en' ? '⚠️ Action Required: Upload Proof' : '⚠️ إجراء مطلوب: رفع الإثبات'}
                      </p>
                      <p className='text-xs text-red-700'>
                        {locale === 'en'
                          ? `This order requires shipment proof to be uploaded. Upload proof to complete the delivery process and unlock ${payment.sellerPayout.toFixed(2)} SAR earnings.`
                          : `يتطلب هذا الطلب رفع إثبات الشحن. قم برفع الإثبات لإكمال عملية التسليم وفتح ${payment.sellerPayout.toFixed(2)} ر.س من الأرباح.`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Navigate to order status page with order ID to upload proof
                      router.push(`/${locale}/order-status?orderId=${payment.id}`);
                    }}
                    className='w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform'
                  >
                    <HiArrowUpTray className='w-5 h-5' />
                    {locale === 'en' ? 'Upload Proof' : 'رفع الإثبات'}
                  </button>
                </div>
              )}
              
              {/* View Status Button for other orders (when proof is not needed but order exists) */}
              {!needsProof(payment) && !payment.shipmentProof && (
                <div className='mt-4'>
                  <button
                    onClick={() => {
                      // Navigate to order status page with order ID
                      router.push(`/${locale}/order-status?orderId=${payment.id}`);
                    }}
                    className='w-full sm:w-auto px-4 py-2.5 bg-deep-charcoal text-white rounded-lg font-medium hover:bg-deep-charcoal/90 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg'
                  >
                    <HiEye className='w-4 h-4' />
                    {locale === 'en' ? 'View Status' : 'عرض الحالة'}
                  </button>
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

