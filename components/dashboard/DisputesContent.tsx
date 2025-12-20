'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiChatBubbleLeftRight, HiClock, HiCheckCircle, HiXCircle } from 'react-icons/hi2';
import { useGetMyDisputesQuery } from '@/lib/api/buyerApi';
import { toast } from '@/utils/toast';
import Pagination from '@/components/shared/Pagination';
import type { DisputeListItem } from '@/lib/api/buyerApi';

export default function DisputesContent() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'closed' | 'all'>('all');
  const itemsPerPage = 10;

  const { data, isLoading, error, refetch } = useGetMyDisputesQuery({
    page: currentPage,
    limit: itemsPerPage,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const disputes = data?.disputes || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: any; label: { en: string; ar: string } }> = {
      open: {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: HiClock,
        label: { en: 'Open', ar: 'مفتوح' },
      },
      resolved: {
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: HiCheckCircle,
        label: { en: 'Resolved', ar: 'محلول' },
      },
      closed: {
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: HiXCircle,
        label: { en: 'Closed', ar: 'مغلق' },
      },
    };
    return statusMap[status] || statusMap.open;
  };

  const getDisputeTypeLabel = (type: string) => {
    const typeMap: Record<string, { en: string; ar: string }> = {
      product_quality: { en: 'Product Quality', ar: 'جودة المنتج' },
      delivery_issue: { en: 'Delivery Issue', ar: 'مشكلة في التسليم' },
      payment_dispute: { en: 'Payment Dispute', ar: 'نزاع في الدفع' },
    };
    return typeMap[type] || { en: type, ar: type };
  };

  if (error) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-red-300 p-6 text-center'>
            <p className='text-red-600'>
              {locale === 'en' ? 'Failed to load disputes. Please try again.' : 'فشل تحميل النزاعات. يرجى المحاولة مرة أخرى.'}
            </p>
            <button
              onClick={() => refetch()}
              className='mt-4 px-4 py-2 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors'
            >
              {locale === 'en' ? 'Retry' : 'إعادة المحاولة'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-2xl md:text-3xl font-bold text-deep-charcoal mb-2'>
            {locale === 'en' ? 'My Disputes' : 'نزاعاتي'}
          </h1>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'View and manage your dispute cases'
              : 'عرض وإدارة قضايا النزاع الخاصة بك'}
          </p>
        </div>

        {/* Status Filter */}
        <div className='mb-6 flex flex-wrap gap-2'>
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-saudi-green text-white'
                : 'bg-white text-deep-charcoal border border-rich-sand/30 hover:bg-rich-sand/10'
            }`}
          >
            {locale === 'en' ? 'All' : 'الكل'}
          </button>
          <button
            onClick={() => {
              setStatusFilter('open');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'open'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-deep-charcoal border border-rich-sand/30 hover:bg-rich-sand/10'
            }`}
          >
            {locale === 'en' ? 'Open' : 'مفتوح'}
          </button>
          <button
            onClick={() => {
              setStatusFilter('resolved');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-green-500 text-white'
                : 'bg-white text-deep-charcoal border border-rich-sand/30 hover:bg-rich-sand/10'
            }`}
          >
            {locale === 'en' ? 'Resolved' : 'محلول'}
          </button>
          <button
            onClick={() => {
              setStatusFilter('closed');
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'closed'
                ? 'bg-gray-500 text-white'
                : 'bg-white text-deep-charcoal border border-rich-sand/30 hover:bg-rich-sand/10'
            }`}
          >
            {locale === 'en' ? 'Closed' : 'مغلق'}
          </button>
        </div>

        {/* Disputes List */}
        {isLoading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className='bg-white rounded-lg border border-rich-sand/30 p-6'
              >
                <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                  <div className='flex-1 space-y-3'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='h-6 bg-rich-sand/30 rounded w-1/3 skeleton-shimmer' />
                      <div className='h-6 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
                    </div>
                    <div className='h-4 bg-rich-sand/30 rounded w-1/4 skeleton-shimmer' />
                    <div className='space-y-2'>
                      <div className='h-4 bg-rich-sand/30 rounded w-2/3 skeleton-shimmer' />
                      <div className='h-4 bg-rich-sand/30 rounded w-1/2 skeleton-shimmer' />
                      <div className='h-4 bg-rich-sand/30 rounded w-3/4 skeleton-shimmer' />
                    </div>
                    <div className='flex items-center gap-4 mt-4'>
                      <div className='h-4 bg-rich-sand/30 rounded w-20 skeleton-shimmer' />
                      <div className='h-4 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
                    </div>
                  </div>
                  <div className='flex-shrink-0'>
                    <div className='h-10 bg-rich-sand/30 rounded-lg w-32 skeleton-shimmer' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-12 text-center'>
            <HiChatBubbleLeftRight className='w-16 h-16 text-deep-charcoal/30 mx-auto mb-4' />
            <p className='text-deep-charcoal/70 text-lg mb-2'>
              {locale === 'en' ? 'No disputes found' : 'لا توجد نزاعات'}
            </p>
            <p className='text-deep-charcoal/50 text-sm'>
              {locale === 'en'
                ? 'You have not created any disputes yet.'
                : 'لم تقم بإنشاء أي نزاعات حتى الآن.'}
            </p>
          </div>
        ) : (
          <>
            <div className='space-y-4 mb-6'>
              {disputes.map((dispute: DisputeListItem) => {
                const statusBadge = getStatusBadge(dispute.status);
                const StatusIcon = statusBadge.icon;
                const typeLabel = getDisputeTypeLabel(dispute.type);

                return (
                  <Link
                    key={dispute._id}
                    href={`/${locale}/disputes/${dispute._id}`}
                    className='block bg-white rounded-lg border border-rich-sand/30 p-6 hover:shadow-md transition-shadow cursor-pointer'
                  >
                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                      <div className='flex-1'>
                        <div className='flex items-start gap-3 mb-3'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              <h3 className='text-lg font-semibold text-deep-charcoal'>
                                {dispute.caseNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusBadge.color}`}
                              >
                                <StatusIcon className='w-3 h-3' />
                                {statusBadge.label[locale as 'en' | 'ar'] || statusBadge.label.en}
                              </span>
                            </div>
                            <p className='text-sm text-deep-charcoal/60 mb-1'>
                              {typeLabel[locale as 'en' | 'ar'] || typeLabel.en}
                            </p>
                          </div>
                        </div>

                        <div className='space-y-2 text-sm text-deep-charcoal/70'>
                          <p>
                            <span className='font-medium'>
                              {locale === 'en' ? 'Item:' : 'المنتج:'}
                            </span>{' '}
                            {dispute.itemTitle}
                          </p>
                          <p>
                            <span className='font-medium'>
                              {locale === 'en' ? 'Seller:' : 'البائع:'}
                            </span>{' '}
                            {dispute.sellerName}
                          </p>
                          <p className='line-clamp-2'>{dispute.description}</p>
                        </div>

                        <div className='flex items-center gap-4 mt-4 text-xs text-deep-charcoal/50'>
                          <span className='flex items-center gap-1'>
                            <HiChatBubbleLeftRight className='w-4 h-4' />
                            {dispute.messageCount || 0}{' '}
                            {locale === 'en' ? 'messages' : 'رسائل'}
                          </span>
                          <span>
                            {locale === 'en' ? 'Created:' : 'تم الإنشاء:'}{' '}
                            {new Date(dispute.createdAt).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className='flex-shrink-0'>
                        <span className='inline-flex items-center px-4 py-2 bg-saudi-green/10 text-saudi-green rounded-lg text-sm font-medium'>
                          {locale === 'en' ? 'View Details' : 'عرض التفاصيل'} →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

