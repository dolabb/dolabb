'use client';

import {
  useAddDisputeCommentMutation,
  useGetMyDisputeDetailsQuery,
  useUploadDisputeEvidenceMutation,
} from '@/lib/api/buyerApi';
import { useAppSelector } from '@/lib/store/hooks';
import { formatPrice } from '@/utils/formatPrice';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  HiArrowLeft,
  HiChatBubbleLeftRight,
  HiCheckCircle,
  HiClock,
  HiCloudArrowUp,
  HiDocument,
  HiInformationCircle,
  HiListBullet,
  HiPaperAirplane,
  HiXCircle,
  HiXMark,
} from 'react-icons/hi2';

interface DisputeDetailContentProps {
  disputeId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export default function DisputeDetailContent({
  disputeId,
}: DisputeDetailContentProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const user = useAppSelector(state => state.auth.user);
  const isSeller = user?.role === 'seller';
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'evidence' | 'messages' | 'timeline'
  >('overview');
  // Image zoom state for evidence images
  const [zoomedEvidenceId, setZoomedEvidenceId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const evidenceImageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { data, isLoading, error, refetch } =
    useGetMyDisputeDetailsQuery(disputeId, {
      refetchOnMountOrArgChange: true, // Always refetch on mount to ensure fresh data (fixes status mismatch)
    });
  const [addComment] = useAddDisputeCommentMutation();
  const [uploadEvidence] = useUploadDisputeEvidenceMutation();

  const dispute = data?.dispute;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { color: string; icon: any; label: { en: string; ar: string } }
    > = {
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
      product_quality: {
        en: 'Product Quality Issue',
        ar: 'مشكلة في جودة المنتج',
      },
      delivery_issue: { en: 'Delivery Issue', ar: 'مشكلة في التسليم' },
      payment_dispute: { en: 'Payment Dispute', ar: 'نزاع في الدفع' },
    };
    return typeMap[type] || { en: type, ar: type };
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return locale === 'en'
        ? 'File size must be less than 10MB'
        : 'يجب أن يكون حجم الملف أقل من 10 ميجابايت';
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

    if (!isImage && !isDocument) {
      return locale === 'en'
        ? 'Only images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX) are allowed'
        : 'يُسمح فقط بالصور (JPEG, PNG, GIF, WebP) والمستندات (PDF, DOC, DOCX)';
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error(locale === 'en' ? 'Please select a file' : 'يرجى اختيار ملف');
      return;
    }

    setIsUploading(true);
    try {
      await uploadEvidence({
        disputeId,
        data: {
          file: selectedFile,
          description: evidenceDescription.trim() || undefined,
        },
      }).unwrap();
      toast.success(
        locale === 'en'
          ? 'Evidence uploaded successfully'
          : 'تم رفع الدليل بنجاح'
      );
      setSelectedFile(null);
      setEvidenceDescription('');
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          (locale === 'en' ? 'Failed to upload evidence' : 'فشل رفع الدليل')
      );
    } finally {
      setIsUploading(false);
    }
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
        locale === 'en'
          ? 'Comment added successfully'
          : 'تم إضافة التعليق بنجاح'
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle evidence image hover for zoom
  const handleEvidenceImageHover = (evidenceId: string) => {
    setZoomedEvidenceId(evidenceId);
  };

  // Handle evidence image leave
  const handleEvidenceImageLeave = () => {
    setZoomedEvidenceId(null);
  };

  // Handle mouse move for zoom effect
  const handleEvidenceImageMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    evidenceId: string
  ) => {
    const container = evidenceImageRefs.current.get(evidenceId);
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  if (isLoading) {
    return (
      <div
        className='bg-off-white min-h-screen  py-8'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Back Button Skeleton */}
          <div className='mb-6'>
            <div className='h-5 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
          </div>

          {/* Dispute Header Card Skeleton */}
          <div className='bg-white rounded-xl border border-rich-sand/30 shadow-sm p-6 mb-6'>
            <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6'>
              <div className='flex-1 space-y-3'>
                <div className='h-8 bg-rich-sand/30 rounded w-48 skeleton-shimmer' />
                <div className='h-6 bg-rich-sand/30 rounded w-64 skeleton-shimmer' />
              </div>
              <div className='h-10 bg-rich-sand/30 rounded-full w-24 skeleton-shimmer' />
            </div>

            {/* Dispute Info Grid Skeleton */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-rich-sand/30'>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className='bg-rich-sand/5 rounded-lg p-3 space-y-2'
                >
                  <div className='h-3 bg-rich-sand/30 rounded w-20 skeleton-shimmer' />
                  <div className='h-5 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
                </div>
              ))}
            </div>
          </div>

          {/* Tabs Navigation Skeleton */}
          <div className='bg-white rounded-xl border border-rich-sand/30 shadow-sm mb-6 overflow-hidden'>
            <div className='flex flex-wrap border-b border-rich-sand/30'>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className='flex-1 min-w-[120px] px-4 py-4 flex items-center justify-center gap-2'
                >
                  <div className='h-5 w-5 bg-rich-sand/30 rounded skeleton-shimmer' />
                  <div className='h-5 bg-rich-sand/30 rounded w-20 skeleton-shimmer hidden sm:block' />
                </div>
              ))}
            </div>
          </div>

          {/* Tab Content Skeleton */}
          <div className='bg-white rounded-xl border border-rich-sand/30 shadow-sm p-6'>
            <div className='space-y-6'>
              {/* Title Skeleton */}
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-1 h-6 bg-rich-sand/30 rounded skeleton-shimmer' />
                <div className='h-6 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
              </div>

              {/* Content Lines Skeleton */}
              <div className='space-y-3'>
                <div className='h-4 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-3/4 skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-5/6 skeleton-shimmer' />
              </div>

              {/* Card Skeleton */}
              <div className='bg-rich-sand/5 rounded-lg border border-rich-sand/20 p-6 space-y-4'>
                <div className='h-5 bg-rich-sand/30 rounded w-40 skeleton-shimmer' />
                <div className='space-y-2'>
                  <div className='h-4 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
                  <div className='h-4 bg-rich-sand/30 rounded w-4/5 skeleton-shimmer' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div
        className='bg-off-white min-h-screen py-8'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
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
  const evidence = dispute.evidence || [];

  const tabs = [
    {
      id: 'overview' as const,
      label: { en: 'Overview', ar: 'نظرة عامة' },
      icon: HiInformationCircle,
      count: null,
    },
    {
      id: 'evidence' as const,
      label: { en: 'Evidence', ar: 'الأدلة' },
      icon: HiDocument,
      count: evidence.length,
    },
    {
      id: 'messages' as const,
      label: { en: 'Messages', ar: 'الرسائل' },
      icon: HiChatBubbleLeftRight,
      count: dispute.messages?.length || 0,
    },
    {
      id: 'timeline' as const,
      label: { en: 'Timeline', ar: 'الجدول الزمني' },
      icon: HiListBullet,
      count: dispute.timeline?.length || null,
    },
  ];

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <Link
          href={`/${locale}/disputes`}
          className='inline-flex items-center gap-2 text-deep-charcoal/70 hover:text-saudi-green transition-colors mb-6'
        >
          <HiArrowLeft className='w-5 h-5' />
          <span>
            {locale === 'en' ? 'Back to Disputes' : 'العودة إلى النزاعات'}
          </span>
        </Link>

        {/* Dispute Header Card */}
        <div className='bg-white rounded-xl border border-rich-sand/30 shadow-sm p-6 mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6'>
            <div className='flex-1'>
              <h1 className='text-2xl font-bold text-deep-charcoal mb-2'>
                {dispute.caseNumber}
              </h1>
              <p className='text-deep-charcoal/70 text-lg'>
                {typeLabel[locale as 'en' | 'ar'] || typeLabel.en}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 w-fit ${statusBadge.color}`}
            >
              <StatusIcon className='w-4 h-4' />
              {statusBadge.label[locale as 'en' | 'ar'] || statusBadge.label.en}
            </span>
          </div>

          {/* Dispute Info Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-rich-sand/30'>
            <div className='bg-rich-sand/5 rounded-lg p-3'>
              <p className='text-xs text-deep-charcoal/60 mb-1 uppercase tracking-wide'>
                {locale === 'en' ? 'Order Number' : 'رقم الطلب'}
              </p>
              <p className='font-semibold text-deep-charcoal'>
                {dispute.order.orderNumber}
              </p>
            </div>
            {isSeller ? (
              <div className='bg-rich-sand/5 rounded-lg p-3'>
                <p className='text-xs text-deep-charcoal/60 mb-1 uppercase tracking-wide'>
                  {locale === 'en' ? 'Buyer' : 'المشتري'}
                </p>
                <p className='font-semibold text-deep-charcoal'>
                  {dispute.buyer.name}
                </p>
              </div>
            ) : (
              <div className='bg-rich-sand/5 rounded-lg p-3'>
                <p className='text-xs text-deep-charcoal/60 mb-1 uppercase tracking-wide'>
                  {locale === 'en' ? 'Seller' : 'البائع'}
                </p>
                <p className='font-semibold text-deep-charcoal'>
                  {dispute.seller.name}
                </p>
              </div>
            )}
            <div className='bg-rich-sand/5 rounded-lg p-3'>
              <p className='text-xs text-deep-charcoal/60 mb-1 uppercase tracking-wide'>
                {locale === 'en' ? 'Item' : 'المنتج'}
              </p>
              <p className='font-semibold text-deep-charcoal line-clamp-1'>
                {dispute.item.title}
              </p>
            </div>
            <div className='bg-rich-sand/5 rounded-lg p-3'>
              <p className='text-xs text-deep-charcoal/60 mb-1 uppercase tracking-wide'>
                {locale === 'en' ? 'Price' : 'السعر'}
              </p>
              <p className='font-semibold text-saudi-green text-lg'>
                {formatPrice(dispute.item.price, locale, 2)}
              </p>
            </div>
            <div className='bg-rich-sand/5 rounded-lg p-3'>
              <p className='text-xs text-deep-charcoal/60 mb-1 uppercase tracking-wide'>
                {locale === 'en' ? 'Created' : 'تم الإنشاء'}
              </p>
              <p className='font-semibold text-deep-charcoal text-sm'>
                {new Date(dispute.created_at).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {dispute.updated_at !== dispute.created_at && (
              <div className='bg-rich-sand/5 rounded-lg p-3'>
                <p className='text-xs text-deep-charcoal/60 mb-1 uppercase tracking-wide'>
                  {locale === 'en' ? 'Last Updated' : 'آخر تحديث'}
                </p>
                <p className='font-semibold text-deep-charcoal text-sm'>
                  {new Date(dispute.updated_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className='bg-white rounded-xl border border-rich-sand/30 shadow-sm mb-6 overflow-hidden'>
          <div className='flex flex-wrap border-b border-rich-sand/30'>
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] px-4 py-4 flex items-center justify-center gap-2 font-medium transition-colors relative ${
                    isActive
                      ? 'text-saudi-green border-b-2 border-saudi-green bg-rich-sand/5'
                      : 'text-deep-charcoal/60 hover:text-deep-charcoal hover:bg-rich-sand/5'
                  }`}
                >
                  <TabIcon className='w-5 h-5' />
                  <span className='hidden sm:inline'>
                    {tab.label[locale as 'en' | 'ar'] || tab.label.en}
                  </span>
                  {tab.count !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-saudi-green/20 text-saudi-green'
                          : 'bg-deep-charcoal/10 text-deep-charcoal/60'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className='bg-white rounded-xl border border-rich-sand/30 shadow-sm p-6'>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className='space-y-6'>
              {/* Description */}
              <div>
                <h2 className='text-lg font-semibold text-deep-charcoal mb-4 flex items-center gap-2'>
                  <span className='w-1 h-6 bg-saudi-green rounded-full'></span>
                  {locale === 'en' ? 'Description' : 'الوصف'}
                </h2>
                <p className='text-deep-charcoal/80 whitespace-pre-wrap leading-relaxed'>
                  {dispute.description}
                </p>
              </div>

              {/* Resolution (if resolved) */}
              {dispute.resolution && (
                <div className='bg-green-50 rounded-lg border border-green-200 p-6'>
                  <h2 className='text-lg font-semibold text-green-800 mb-3 flex items-center gap-2'>
                    <HiCheckCircle className='w-5 h-5' />
                    {locale === 'en' ? 'Resolution' : 'الحل'}
                  </h2>
                  <p className='text-green-700 whitespace-pre-wrap leading-relaxed'>
                    {dispute.resolution}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Evidence Tab */}
          {activeTab === 'evidence' && (
            <div className='space-y-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-deep-charcoal flex items-center gap-2'>
                  <span className='w-1 h-6 bg-saudi-green rounded-full'></span>
                  {locale === 'en' ? 'Evidence' : 'الأدلة'} ({evidence.length})
                </h2>
              </div>

              {/* Evidence Gallery */}
              {evidence.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6'>
                  {evidence.map(item => (
                    <div
                      key={item.id}
                      className='group relative bg-rich-sand/5 rounded-lg border border-rich-sand/20 overflow-hidden hover:border-saudi-green/50 transition-all'
                    >
                      {item.type === 'image' ? (
                        <div
                          ref={el => {
                            if (el) {
                              evidenceImageRefs.current.set(item.id, el);
                            } else {
                              evidenceImageRefs.current.delete(item.id);
                            }
                          }}
                          className={`aspect-square relative overflow-hidden ${
                            zoomedEvidenceId === item.id
                              ? 'cursor-zoom-out'
                              : 'cursor-zoom-in'
                          }`}
                          style={{
                            cursor:
                              zoomedEvidenceId === item.id
                                ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23006747' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3Cline x1='8' y1='11' x2='14' y2='11'/%3E%3Cline x1='11' y1='8' x2='11' y2='14'/%3E%3C/svg%3E") 12 12, zoom-out`
                                : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23006747' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3Cline x1='11' y1='8' x2='11' y2='14'/%3E%3Cline x1='8' y1='11' x2='14' y2='11'/%3E%3C/svg%3E") 12 12, zoom-in`,
                          }}
                          onMouseEnter={() => handleEvidenceImageHover(item.id)}
                          onMouseLeave={handleEvidenceImageLeave}
                          onMouseMove={e =>
                            handleEvidenceImageMouseMove(e, item.id)
                          }
                        >
                          <Image
                            src={item.url}
                            alt={item.originalFilename}
                            fill
                            className='object-cover transition-transform duration-200 ease-out'
                            sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw'
                            style={{
                              transform:
                                zoomedEvidenceId === item.id
                                  ? `scale(2.5)`
                                  : 'scale(1)',
                              transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                            }}
                            draggable={false}
                          />
                        </div>
                      ) : (
                        <div className='aspect-square flex flex-col items-center justify-center p-4'>
                          <HiDocument className='w-12 h-12 text-deep-charcoal/40 mb-2' />
                          <p className='text-xs text-deep-charcoal/60 text-center line-clamp-2'>
                            {item.originalFilename}
                          </p>
                        </div>
                      )}
                      {item.description && (
                        <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2'>
                          <p className='text-xs text-white line-clamp-1'>
                            {item.description}
                          </p>
                        </div>
                      )}
                      {/* Uploader Info */}
                      {item.uploadedBy && (
                        <div className='absolute top-2 left-2 right-2 z-10'>
                          <div className='bg-black/60 backdrop-blur-sm rounded px-2 py-1 flex items-center gap-1.5'>
                            {item.uploadedBy.type && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                  item.uploadedBy.type === 'buyer'
                                    ? 'bg-blue-500/80 text-white'
                                    : item.uploadedBy.type === 'seller'
                                    ? 'bg-green-500/80 text-white'
                                    : 'bg-purple-500/80 text-white'
                                }`}
                              >
                                {item.uploadedBy.type === 'buyer'
                                  ? locale === 'en'
                                    ? 'Buyer'
                                    : 'مشتري'
                                  : item.uploadedBy.type === 'seller'
                                  ? locale === 'en'
                                    ? 'Seller'
                                    : 'بائع'
                                  : locale === 'en'
                                  ? 'Admin'
                                  : 'مدير'}
                              </span>
                            )}
                            <span className='text-[10px] text-white truncate'>
                              {item.uploadedBy.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 mb-6'>
                  <HiDocument className='w-12 h-12 text-deep-charcoal/30 mx-auto mb-3' />
                  <p className='text-deep-charcoal/60'>
                    {locale === 'en'
                      ? 'No evidence uploaded yet'
                      : 'لم يتم رفع أي دليل بعد'}
                  </p>
                </div>
              )}

              {/* Upload Evidence Form (only if dispute is open) */}
              {dispute.status === 'open' ? (
                <div className='border-t border-rich-sand/30 pt-6'>
                  <h3 className='text-md font-semibold text-deep-charcoal mb-4'>
                    {locale === 'en' ? 'Upload Evidence' : 'رفع دليل'}
                  </h3>
                  <form onSubmit={handleUploadEvidence} className='space-y-4'>
                    <div>
                      <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                        {locale === 'en' ? 'File' : 'الملف'}{' '}
                        <span className='text-red-500'>*</span>
                      </label>
                      {!selectedFile ? (
                        <label className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-rich-sand/40 rounded-lg cursor-pointer bg-rich-sand/5 hover:bg-rich-sand/10 hover:border-saudi-green/50 transition-colors'>
                          <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                            <HiCloudArrowUp className='w-10 h-10 text-deep-charcoal/40 mb-2' />
                            <p className='mb-2 text-sm text-deep-charcoal/70'>
                              <span className='font-semibold'>
                                {locale === 'en'
                                  ? 'Click to upload'
                                  : 'انقر للرفع'}
                              </span>{' '}
                              {locale === 'en'
                                ? 'or drag and drop'
                                : 'أو اسحب وأفلت'}
                            </p>
                            <p className='text-xs text-deep-charcoal/50'>
                              {locale === 'en'
                                ? 'Images (JPEG, PNG, GIF, WebP) or Documents (PDF, DOC, DOCX) - Max 10MB'
                                : 'صور (JPEG, PNG, GIF, WebP) أو مستندات (PDF, DOC, DOCX) - الحد الأقصى 10 ميجابايت'}
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type='file'
                            className='hidden'
                            onChange={handleFileSelect}
                            accept='.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx'
                          />
                        </label>
                      ) : (
                        <div className='border border-rich-sand/30 rounded-lg p-4 bg-rich-sand/5'>
                          <div className='flex items-start gap-4'>
                            {previewUrl ? (
                              <div className='relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0'>
                                <Image
                                  src={previewUrl}
                                  alt='Preview'
                                  fill
                                  className='object-cover'
                                />
                              </div>
                            ) : (
                              <div className='w-20 h-20 rounded-lg bg-rich-sand/20 flex items-center justify-center flex-shrink-0'>
                                <HiDocument className='w-8 h-8 text-deep-charcoal/40' />
                              </div>
                            )}
                            <div className='flex-1 min-w-0'>
                              <p className='font-medium text-deep-charcoal truncate'>
                                {selectedFile.name}
                              </p>
                              <p className='text-sm text-deep-charcoal/60'>
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                            <button
                              type='button'
                              onClick={handleRemoveFile}
                              className='text-red-500 hover:text-red-700 transition-colors flex-shrink-0'
                            >
                              <HiXMark className='w-5 h-5' />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                        {locale === 'en'
                          ? 'Description (Optional)'
                          : 'الوصف (اختياري)'}
                      </label>
                      <textarea
                        value={evidenceDescription}
                        onChange={e => setEvidenceDescription(e.target.value)}
                        placeholder={
                          locale === 'en'
                            ? 'Add a description for this evidence...'
                            : 'أضف وصفًا لهذا الدليل...'
                        }
                        rows={3}
                        className='w-full px-4 py-3 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green transition-colors resize-none'
                        dir={isRTL ? 'rtl' : 'ltr'}
                        disabled={isUploading}
                      />
                    </div>

                    <button
                      type='submit'
                      disabled={isUploading || !selectedFile}
                      className='flex items-center gap-2 px-6 py-3 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <HiCloudArrowUp className='w-5 h-5' />
                      {isUploading
                        ? locale === 'en'
                          ? 'Uploading...'
                          : 'جاري الرفع...'
                        : locale === 'en'
                        ? 'Upload Evidence'
                        : 'رفع الدليل'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className='border-t border-rich-sand/30 pt-6'>
                  <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                    <p className='text-sm text-deep-charcoal/70'>
                      {locale === 'en'
                        ? dispute.status === 'resolved'
                          ? 'This dispute has been resolved. Evidence can no longer be uploaded.'
                          : 'This dispute is closed. Evidence can no longer be uploaded.'
                        : dispute.status === 'resolved'
                        ? 'تم حل هذا النزاع. لا يمكن رفع الأدلة بعد الآن.'
                        : 'تم إغلاق هذا النزاع. لا يمكن رفع الأدلة بعد الآن.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className='space-y-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-deep-charcoal flex items-center gap-2'>
                  <span className='w-1 h-6 bg-saudi-green rounded-full'></span>
                  {locale === 'en' ? 'Messages' : 'الرسائل'} (
                  {dispute.messages?.length || 0})
                </h2>
              </div>

              {dispute.messages && dispute.messages.length > 0 ? (
                <div className='space-y-4 mb-6'>
                  {dispute.messages.map(message => (
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
                          <p className='font-medium text-deep-charcoal'>
                            {message.senderName}
                          </p>
                          <p className='text-xs text-deep-charcoal/60'>
                            {message.senderType === 'admin'
                              ? locale === 'en'
                                ? 'Admin'
                                : 'مدير'
                              : message.senderId === user?.id
                              ? locale === 'en'
                                ? 'You'
                                : 'أنت'
                              : isSeller
                              ? locale === 'en'
                                ? 'Buyer'
                                : 'المشتري'
                              : locale === 'en'
                              ? 'Seller'
                              : 'البائع'}
                          </p>
                        </div>
                        <p className='text-xs text-deep-charcoal/50'>
                          {new Date(message.createdAt).toLocaleDateString(
                            locale,
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                      <p className='text-deep-charcoal/80 whitespace-pre-wrap'>
                        {message.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-deep-charcoal/60 text-center py-4 mb-6'>
                  {locale === 'en' ? 'No messages yet' : 'لا توجد رسائل بعد'}
                </p>
              )}

              {/* Add Comment Form (only if dispute is open) */}
              {dispute.status === 'open' ? (
                <div className='border-t border-rich-sand/30 pt-6'>
                  <h3 className='text-md font-semibold text-deep-charcoal mb-4'>
                    {locale === 'en' ? 'Add Comment' : 'إضافة تعليق'}
                  </h3>
                  <form onSubmit={handleSubmitComment} className='space-y-4'>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
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
              ) : (
                <div className='border-t border-rich-sand/30 pt-6'>
                  <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                    <p className='text-sm text-deep-charcoal/70'>
                      {locale === 'en'
                        ? dispute.status === 'resolved'
                          ? 'This dispute has been resolved. Comments can no longer be added.'
                          : 'This dispute is closed. Comments can no longer be added.'
                        : dispute.status === 'resolved'
                        ? 'تم حل هذا النزاع. لا يمكن إضافة تعليقات بعد الآن.'
                        : 'تم إغلاق هذا النزاع. لا يمكن إضافة تعليقات بعد الآن.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className='space-y-6'>
              {dispute.timeline && dispute.timeline.length > 0 ? (
                <>
                  <div className='flex items-center justify-between mb-4'>
                    <h2 className='text-lg font-semibold text-deep-charcoal flex items-center gap-2'>
                      <span className='w-1 h-6 bg-saudi-green rounded-full'></span>
                      {locale === 'en' ? 'Timeline' : 'الجدول الزمني'}
                    </h2>
                  </div>
                  <div className='space-y-4'>
                    {dispute.timeline.map((event, index) => (
                      <div key={index} className='flex items-start gap-4'>
                        <div className='flex flex-col items-center'>
                          <div className='w-3 h-3 rounded-full bg-saudi-green flex-shrink-0 mt-1'></div>
                          {index < dispute.timeline.length - 1 && (
                            <div className='w-0.5 h-full bg-rich-sand/30 flex-1 min-h-[2rem]'></div>
                          )}
                        </div>
                        <div className='flex-1 pb-4'>
                          <p className='text-sm font-medium text-deep-charcoal mb-1'>
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
                </>
              ) : (
                <div className='text-center py-12'>
                  <HiListBullet className='w-16 h-16 text-deep-charcoal/30 mx-auto mb-4' />
                  <p className='text-deep-charcoal/60'>
                    {locale === 'en'
                      ? 'No timeline events available'
                      : 'لا توجد أحداث في الجدول الزمني'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
