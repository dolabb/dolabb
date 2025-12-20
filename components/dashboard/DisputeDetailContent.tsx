'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiArrowLeft, HiClock, HiCheckCircle, HiXCircle, HiPaperAirplane } from 'react-icons/hi2';
import {
  useGetMyDisputeDetailsQuery,
  useAddDisputeCommentMutation,
} from '@/lib/api/buyerApi';
import { toast } from '@/utils/toast';
import { formatPrice } from '@/utils/formatPrice';

interface DisputeDetailContentProps {
  disputeId: string;
}

export default function DisputeDetailContent({ disputeId }: DisputeDetailContentProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error, refetch } = useGetMyDisputeDetailsQuery(disputeId);
  const [addComment] = useAddDisputeCommentMutation();

  const dispute = data?.dispute;

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
      product_quality: { en: 'Product Quality Issue', ar: 'مشكلة في جودة المنتج' },
      delivery_issue: { en: 'Delivery Issue', ar: 'مشكلة في التسليم' },
      payment_dispute: { en: 'Payment Dispute', ar: 'نزاع في الدفع' },
    };
    return typeMap[type] || { en: type, ar: type };
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error(
        locale === 'en' ? 'Please enter a message' : 'يرجى إدخال رسالة'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment({
        disputeId,
        data: { message: comment.trim() },
      }).unwrap();
      toast.success(
        locale === 'en' ? 'Comment added successfully' : 'تم إضافة التعليق بنجاح'
      );
      setComment('');
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          (locale === 'en' ? 'Failed to add comment' : 'فشل إضافة التعليق')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8'>
            <div className='animate-pulse space-y-4'>
              <div className='h-8 bg-rich-sand/30 rounded w-1/3' />
              <div className='h-4 bg-rich-sand/30 rounded w-2/3' />
              <div className='h-4 bg-rich-sand/30 rounded w-1/2' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-red-300 p-6 text-center'>
            <p className='text-red-600 mb-4'>
              {locale === 'en'
                ? 'Failed to load dispute details. Please try again.'
                : 'فشل تحميل تفاصيل النزاع. يرجى المحاولة مرة أخرى.'}
            </p>
            <button
              onClick={() => router.back()}
              className='px-4 py-2 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors'
            >
              {locale === 'en' ? 'Go Back' : 'العودة'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(dispute.status);
  const StatusIcon = statusBadge.icon;
  const typeLabel = getDisputeTypeLabel(dispute.type);

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <Link
          href={`/${locale}/disputes`}
          className='inline-flex items-center gap-2 text-deep-charcoal/70 hover:text-saudi-green transition-colors mb-6'
        >
          <HiArrowLeft className='w-5 h-5' />
          <span>{locale === 'en' ? 'Back to Disputes' : 'العودة إلى النزاعات'}</span>
        </Link>

        {/* Dispute Header */}
        <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4'>
            <div>
              <h1 className='text-2xl font-bold text-deep-charcoal mb-2'>
                {dispute.caseNumber}
              </h1>
              <p className='text-deep-charcoal/70'>{typeLabel[locale as 'en' | 'ar'] || typeLabel.en}</p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 ${statusBadge.color}`}
            >
              <StatusIcon className='w-4 h-4' />
              {statusBadge.label[locale as 'en' | 'ar'] || statusBadge.label.en}
            </span>
          </div>

          {/* Dispute Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-rich-sand/30'>
            <div>
              <p className='text-sm text-deep-charcoal/60 mb-1'>
                {locale === 'en' ? 'Order Number' : 'رقم الطلب'}
              </p>
              <p className='font-medium text-deep-charcoal'>{dispute.order.orderNumber}</p>
            </div>
            <div>
              <p className='text-sm text-deep-charcoal/60 mb-1'>
                {locale === 'en' ? 'Seller' : 'البائع'}
              </p>
              <p className='font-medium text-deep-charcoal'>{dispute.seller.name}</p>
            </div>
            <div>
              <p className='text-sm text-deep-charcoal/60 mb-1'>
                {locale === 'en' ? 'Item' : 'المنتج'}
              </p>
              <p className='font-medium text-deep-charcoal'>{dispute.item.title}</p>
            </div>
            <div>
              <p className='text-sm text-deep-charcoal/60 mb-1'>
                {locale === 'en' ? 'Price' : 'السعر'}
              </p>
              <p className='font-medium text-saudi-green'>
                {formatPrice(dispute.item.price, locale, 2)}
              </p>
            </div>
            <div>
              <p className='text-sm text-deep-charcoal/60 mb-1'>
                {locale === 'en' ? 'Created' : 'تم الإنشاء'}
              </p>
              <p className='font-medium text-deep-charcoal'>
                {new Date(dispute.created_at).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {dispute.updated_at !== dispute.created_at && (
              <div>
                <p className='text-sm text-deep-charcoal/60 mb-1'>
                  {locale === 'en' ? 'Last Updated' : 'آخر تحديث'}
                </p>
                <p className='font-medium text-deep-charcoal'>
                  {new Date(dispute.updated_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
          <h2 className='text-lg font-semibold text-deep-charcoal mb-3'>
            {locale === 'en' ? 'Description' : 'الوصف'}
          </h2>
          <p className='text-deep-charcoal/80 whitespace-pre-wrap'>{dispute.description}</p>
        </div>

        {/* Resolution (if resolved) */}
        {dispute.resolution && (
          <div className='bg-green-50 rounded-lg border border-green-200 p-6 mb-6'>
            <h2 className='text-lg font-semibold text-green-800 mb-3'>
              {locale === 'en' ? 'Resolution' : 'الحل'}
            </h2>
            <p className='text-green-700 whitespace-pre-wrap'>{dispute.resolution}</p>
          </div>
        )}

        {/* Messages/Comments */}
        <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
          <h2 className='text-lg font-semibold text-deep-charcoal mb-4'>
            {locale === 'en' ? 'Messages' : 'الرسائل'} ({dispute.messages?.length || 0})
          </h2>

          {dispute.messages && dispute.messages.length > 0 ? (
            <div className='space-y-4'>
              {dispute.messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.senderType === 'admin'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-rich-sand/10 border border-rich-sand/30'
                  }`}
                >
                  <div className='flex items-start justify-between mb-2'>
                    <div>
                      <p className='font-medium text-deep-charcoal'>{message.senderName}</p>
                      <p className='text-xs text-deep-charcoal/60'>
                        {message.senderType === 'admin'
                          ? locale === 'en'
                            ? 'Admin'
                            : 'مدير'
                          : locale === 'en'
                          ? 'You'
                          : 'أنت'}
                      </p>
                    </div>
                    <p className='text-xs text-deep-charcoal/50'>
                      {new Date(message.createdAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <p className='text-deep-charcoal/80 whitespace-pre-wrap'>{message.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-deep-charcoal/60 text-center py-4'>
              {locale === 'en' ? 'No messages yet' : 'لا توجد رسائل بعد'}
            </p>
          )}
        </div>

        {/* Add Comment Form (only if dispute is open) */}
        {dispute.status === 'open' && (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
            <h2 className='text-lg font-semibold text-deep-charcoal mb-4'>
              {locale === 'en' ? 'Add Comment' : 'إضافة تعليق'}
            </h2>
            <form onSubmit={handleSubmitComment} className='space-y-4'>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  locale === 'en'
                    ? 'Type your message here...'
                    : 'اكتب رسالتك هنا...'
                }
                rows={4}
                className='w-full px-4 py-3 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green transition-colors resize-none'
                dir={isRTL ? 'rtl' : 'ltr'}
                disabled={isSubmitting}
              />
              <button
                type='submit'
                disabled={isSubmitting || !comment.trim()}
                className='flex items-center gap-2 px-6 py-3 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <HiPaperAirplane className='w-5 h-5' />
                {isSubmitting
                  ? locale === 'en'
                    ? 'Sending...'
                    : 'جاري الإرسال...'
                  : locale === 'en'
                  ? 'Send Comment'
                  : 'إرسال التعليق'}
              </button>
            </form>
          </div>
        )}

        {/* Timeline (if available) */}
        {dispute.timeline && dispute.timeline.length > 0 && (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mt-6'>
            <h2 className='text-lg font-semibold text-deep-charcoal mb-4'>
              {locale === 'en' ? 'Timeline' : 'الجدول الزمني'}
            </h2>
            <div className='space-y-3'>
              {dispute.timeline.map((event, index) => (
                <div key={index} className='flex items-start gap-3'>
                  <div className='w-2 h-2 rounded-full bg-saudi-green mt-2 flex-shrink-0' />
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-deep-charcoal'>
                      {event.action === 'dispute_created'
                        ? locale === 'en'
                          ? 'Dispute Created'
                          : 'تم إنشاء النزاع'
                        : event.action === 'dispute_updated'
                        ? locale === 'en'
                          ? 'Dispute Updated'
                          : 'تم تحديث النزاع'
                        : event.action}
                    </p>
                    <p className='text-xs text-deep-charcoal/60'>
                      {new Date(event.date).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

