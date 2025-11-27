'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import { HiCheckCircle, HiXCircle, HiClock } from 'react-icons/hi2';
import { useGetSellerPayoutRequestsQuery } from '@/lib/api/sellerApi';
import Pagination from '@/components/shared/Pagination';

export default function PayoutRequestsTab() {
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: payoutsData, isLoading: isLoadingPayouts } = useGetSellerPayoutRequestsQuery(
    { page: currentPage, limit: itemsPerPage },
    {
      skip: false,
    }
  );

  const payoutRequests = payoutsData?.payoutRequests || [];
  const pagination = payoutsData?.pagination;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <HiCheckCircle className='w-5 h-5 text-green-600' />;
      case 'rejected':
        return <HiXCircle className='w-5 h-5 text-red-600' />;
      default:
        return <HiClock className='w-5 h-5 text-yellow-600' />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return locale === 'en' ? 'Approved' : 'موافق عليه';
      case 'rejected':
        return locale === 'en' ? 'Rejected' : 'مرفوض';
      default:
        return locale === 'en' ? 'Pending' : 'قيد الانتظار';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (isLoadingPayouts) {
    return (
      <div className='space-y-4'>
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className='bg-white rounded-lg border border-rich-sand/30 p-4'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='w-5 h-5 bg-rich-sand/30 rounded skeleton-shimmer' />
                <div className='space-y-2'>
                  <div className='h-5 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
                  <div className='h-4 bg-rich-sand/30 rounded w-48 skeleton-shimmer' />
                  <div className='h-3 bg-rich-sand/30 rounded w-40 skeleton-shimmer' />
                </div>
              </div>
              <div className='h-6 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payoutRequests.length === 0) {
    return (
      <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
        <p className='text-deep-charcoal/70'>
          {locale === 'en' ? 'No payout requests found.' : 'لا توجد طلبات دفع.'}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {payoutRequests.map((request) => (
        <div
          key={request.id}
          className='flex items-center justify-between p-4 bg-rich-sand/10 rounded-lg border border-rich-sand/20'
        >
          <div className='flex items-center gap-4'>
            {getStatusIcon(request.status)}
            <div>
              <p className='font-medium text-deep-charcoal'>
                {locale === 'ar' ? 'ر.س' : 'SAR'} {request.amount.toFixed(2)}
              </p>
              <p className='text-sm text-deep-charcoal/60'>
                {locale === 'en' ? 'Method' : 'الطريقة'}: {request.paymentMethod}
              </p>
              <p className='text-xs text-deep-charcoal/50'>
                {locale === 'en' ? 'Requested' : 'تاريخ الطلب'}:{' '}
                {new Date(request.requestedAt).toLocaleDateString()}
              </p>
              {request.processedAt && (
                <p className='text-xs text-deep-charcoal/50'>
                  {locale === 'en' ? 'Processed' : 'تم المعالجة'}:{' '}
                  {new Date(request.processedAt).toLocaleDateString()}
                </p>
              )}
              {request.notes && (
                <p className='text-xs text-deep-charcoal/50 mt-1'>
                  {locale === 'en' ? 'Notes' : 'ملاحظات'}: {request.notes}
                </p>
              )}
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              request.status
            )}`}
          >
            {getStatusLabel(request.status)}
          </span>
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

