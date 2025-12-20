'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiCheckCircle, HiEye, HiTruck } from 'react-icons/hi2';
import { useGetPaymentsQuery } from '@/lib/api/ordersApi';
import { useCreateReviewMutation, useCreateDisputeMutation } from '@/lib/api/buyerApi';
import { toast } from '@/utils/toast';
import { formatPrice } from '@/utils/formatPrice';
import Pagination from '@/components/shared/Pagination';
import ReviewModal from '@/components/shared/ReviewModal';
import DisputeModal from '@/components/shared/DisputeModal';

export default function PurchaseHistoryTab() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: paymentsData, isLoading, refetch } = useGetPaymentsQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  const [createReview, { isLoading: isSubmittingReview }] = useCreateReviewMutation();
  const [createDispute, { isLoading: isSubmittingDispute }] = useCreateDisputeMutation();

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);

  // Dispute modal state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<any>(null);

  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination;

  // Filter only paid orders for buyers
  const paidOrders = payments.filter(
    (payment) => payment.paymentStatus === 'completed' || payment.paymentStatus === 'paid' || payment.status === 'paid'
  );

  // Handle review submission
  const handleSubmitReview = async (orderId: string, rating: number, comment?: string) => {
    try {
      await createReview({
        orderId,
        rating,
        comment: comment || undefined,
      }).unwrap();
      toast.success(
        locale === 'en' ? 'Review submitted successfully!' : 'تم إرسال التقييم بنجاح!'
      );
      refetch();
      setIsReviewModalOpen(false);
      setSelectedOrderForReview(null);
    } catch (error: any) {
      toast.error(
        error?.data?.message || (locale === 'en' ? 'Failed to submit review' : 'فشل إرسال التقييم')
      );
    }
  };

  // Handle dispute/report submission
  const handleSubmitDispute = async (
    orderId: string,
    disputeType: 'product_quality' | 'delivery_issue' | 'payment_dispute',
    description: string
  ) => {
    try {
      await createDispute({
        orderId,
        disputeType,
        description,
      }).unwrap();
      toast.success(
        locale === 'en'
          ? 'Report submitted successfully! Admin will review it.'
          : 'تم إرسال البلاغ بنجاح! سيقوم المدير بمراجعته.'
      );
      refetch();
      setIsDisputeModalOpen(false);
      setSelectedOrderForDispute(null);
    } catch (error: any) {
      toast.error(
        error?.data?.message || (locale === 'en' ? 'Failed to submit report' : 'فشل إرسال البلاغ')
      );
    }
  };

  // Normalize image URL - convert cdn.dolabb.com URLs to use Next.js proxy
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    let trimmed = url.trim().replace(/\s+/g, '');
    if (trimmed.includes('cdn.dolabb.com')) {
      try {
        const urlObj = new URL(trimmed);
        const path = urlObj.pathname + urlObj.search;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `/api/cdn${cleanPath}`;
      } catch (error) {
        const path = trimmed
          .replace('https://cdn.dolabb.com', '')
          .replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return trimmed;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: { en: string; ar: string } }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: { en: 'Pending', ar: 'قيد الانتظار' } },
      paid: { color: 'bg-emerald-100 text-emerald-700', label: { en: 'Paid', ar: 'مدفوع' } },
      packed: { color: 'bg-blue-100 text-blue-700', label: { en: 'Packed', ar: 'معبأ' } },
      ready: { color: 'bg-purple-100 text-purple-700', label: { en: 'Ready', ar: 'جاهز' } },
      shipped: { color: 'bg-indigo-100 text-indigo-700', label: { en: 'Shipped', ar: 'شُحن' } },
      reached_at_courier: {
        color: 'bg-cyan-100 text-cyan-700',
        label: { en: 'At Courier', ar: 'عند الناقل' },
      },
      out_for_delivery: {
        color: 'bg-orange-100 text-orange-700',
        label: { en: 'Out for Delivery', ar: 'قيد التسليم' },
      },
      delivered: { color: 'bg-green-100 text-green-700', label: { en: 'Delivered', ar: 'تم التسليم' } },
      cancelled: { color: 'bg-red-100 text-red-700', label: { en: 'Cancelled', ar: 'ملغي' } },
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-700', label: { en: status, ar: status } };
  };

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
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (paidOrders.length === 0) {
    return (
      <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
        <p className='text-deep-charcoal/70'>
          {locale === 'en' ? 'No paid orders found.' : 'لا توجد طلبات مدفوعة.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        {paidOrders.map((payment) => {
          const statusBadge = getStatusBadge(payment.status);
          const productInfo =
            typeof payment.product === 'object' && payment.product !== null
              ? payment.product
              : { id: '', title: 'Product', images: [] };
          const sellerInfo =
            typeof payment.seller === 'object' && payment.seller !== null
              ? payment.seller
              : { id: '', username: 'Seller', profileImage: '' };

          const firstImageRaw = productInfo.images?.[0] || '';
          const firstImage = firstImageRaw ? normalizeImageUrl(firstImageRaw) : '';
          const isPaid = payment.paymentStatus === 'completed' || payment.paymentStatus === 'paid' || payment.status === 'paid';
          const canReview = isPaid && !(payment as any).reviewSubmitted;
          const canReport = isPaid;

          return (
            <div
              key={payment.id}
              className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
            >
              <Link
                href={`/${locale}/product/${productInfo.id}`}
                className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
              >
                {firstImage ? (
                  firstImage.startsWith('/api/cdn') ? (
                    <img
                      src={firstImage}
                      alt={productInfo.title}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Image
                      src={firstImage}
                      alt={productInfo.title}
                      fill
                      className='object-cover'
                      unoptimized
                      onError={() => {
                        console.error('Product image failed to load:', firstImage);
                      }}
                    />
                  )
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <span className='text-deep-charcoal/40 text-xs'>
                      {locale === 'en' ? 'No Image' : 'لا توجد صورة'}
                    </span>
                  </div>
                )}
              </Link>
              <div className='flex-1'>
                <Link href={`/${locale}/product/${productInfo.id}`} className='block'>
                  <h3 className='font-semibold text-deep-charcoal mb-2 hover:text-saudi-green transition-colors'>
                    {productInfo.title}
                  </h3>
                </Link>
                <div className='text-sm text-deep-charcoal/70 space-y-1'>
                  <p>
                    {locale === 'en' ? 'Order Number' : 'رقم الطلب'}: {payment.orderNumber || payment.id}
                  </p>
                  <p>
                    {locale === 'en' ? 'Date' : 'التاريخ'}:{' '}
                    {new Date(payment.orderDate).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p>
                    {locale === 'en' ? 'Seller' : 'البائع'}: {sellerInfo.username}
                  </p>
                  {payment.trackingNumber && (
                    <p>
                      {locale === 'en' ? 'Tracking' : 'رقم التتبع'}: {payment.trackingNumber}
                    </p>
                  )}
                  <p className='text-lg font-bold text-saudi-green mt-2'>
                    {formatPrice(
                      payment.totalPrice || 0,
                      locale,
                      2,
                      (payment as any).currency || (productInfo as any)?.currency
                    )}
                  </p>
                </div>
                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  {/* Payment Status Badge */}
                  {isPaid && (
                    <span className='flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300'>
                      <HiCheckCircle className='w-4 h-4' />
                      {locale === 'en' ? 'Paid' : 'مدفوع'}
                    </span>
                  )}

                  {/* Shipping Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                    {statusBadge.label[locale as 'en' | 'ar'] || statusBadge.label.en}
                  </span>

                  {/* Shipment Proof Status (if available) */}
                  {payment.shipmentProof && (
                    <span className='flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700'>
                      <HiTruck className='w-4 h-4' />
                      {locale === 'en' ? 'Shipped' : 'تم الشحن'}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className='mt-4 flex flex-wrap gap-2'>
                  {/* View Status Button */}
                  <button
                    onClick={() => {
                      router.push(`/${locale}/order-status?orderId=${payment.id}`);
                    }}
                    className='flex items-center gap-2 px-4 py-2 bg-deep-charcoal text-white rounded-lg text-sm font-medium hover:bg-deep-charcoal/90 transition-colors cursor-pointer'
                  >
                    <HiEye className='w-4 h-4' />
                    {locale === 'en' ? 'View Status' : 'عرض الحالة'}
                  </button>

                  {/* Review Button */}
                  {canReview && (
                    <button
                      onClick={() => {
                        setSelectedOrderForReview(payment);
                        setIsReviewModalOpen(true);
                      }}
                      className='flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors cursor-pointer'
                    >
                      {locale === 'en' ? 'Review' : 'تقييم'}
                    </button>
                  )}

                  {/* Report/Dispute Button */}
                  {canReport && (
                    <button
                      onClick={() => {
                        setSelectedOrderForDispute(payment);
                        setIsDisputeModalOpen(true);
                      }}
                      className='flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer'
                    >
                      {locale === 'en' ? 'Report Issue' : 'الإبلاغ عن مشكلة'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className='mt-6'>
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Review Modal */}
      {selectedOrderForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedOrderForReview(null);
          }}
          orderId={selectedOrderForReview.id}
          productTitle={
            typeof selectedOrderForReview.product === 'object' && selectedOrderForReview.product !== null
              ? selectedOrderForReview.product.title
              : 'Product'
          }
          onSubmit={async (rating, comment) => {
            await handleSubmitReview(selectedOrderForReview.id, rating, comment);
          }}
          isLoading={isSubmittingReview}
        />
      )}

      {/* Dispute Modal */}
      {selectedOrderForDispute && (
        <DisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => {
            setIsDisputeModalOpen(false);
            setSelectedOrderForDispute(null);
          }}
          orderId={selectedOrderForDispute.id}
          productTitle={
            typeof selectedOrderForDispute.product === 'object' && selectedOrderForDispute.product !== null
              ? selectedOrderForDispute.product.title
              : 'Product'
          }
          onSubmit={async (disputeType, description) => {
            await handleSubmitDispute(selectedOrderForDispute.id, disputeType, description);
          }}
          isLoading={isSubmittingDispute}
        />
      )}
    </>
  );
}

