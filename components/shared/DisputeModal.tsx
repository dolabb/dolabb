'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { HiXMark } from 'react-icons/hi2';
import { AnimatePresence, motion } from 'framer-motion';
import type { DisputeType } from '@/lib/api/buyerApi';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  productTitle: string;
  onSubmit: (disputeType: DisputeType, description: string) => Promise<void>;
  isLoading?: boolean;
}

export default function DisputeModal({
  isOpen,
  onClose,
  orderId,
  productTitle,
  onSubmit,
  isLoading = false,
}: DisputeModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [disputeType, setDisputeType] = useState<DisputeType>('product_quality');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const disputeTypes: { value: DisputeType; label: { en: string; ar: string } }[] = [
    { value: 'product_quality', label: { en: 'Product Quality Issue', ar: 'مشكلة في جودة المنتج' } },
    { value: 'delivery_issue', label: { en: 'Delivery Issue', ar: 'مشكلة في التسليم' } },
    { value: 'payment_dispute', label: { en: 'Payment Dispute', ar: 'نزاع في الدفع' } },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError(
        locale === 'en'
          ? 'Please provide a description'
          : 'يرجى تقديم وصف'
      );
      return;
    }

    try {
      await onSubmit(disputeType, description);
    } catch (err) {
      // Error handling is done in parent
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className='bg-slate-900/20 backdrop-blur pt-40 p-4 fixed inset-0 z-50 grid place-items-center overflow-y-scroll cursor-pointer'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ scale: 0, rotate: '12.5deg' }}
          animate={{ scale: 1, rotate: '0deg' }}
          exit={{ scale: 0, rotate: '0deg' }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          onClick={e => e.stopPropagation()}
          className='bg-white rounded-2xl shadow-2xl w-full max-w-md cursor-default relative overflow-hidden'
        >
          <div className='relative z-10 p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold text-deep-charcoal'>
                {locale === 'en' ? 'Report Issue' : 'الإبلاغ عن مشكلة'}
              </h3>
              <button
                onClick={onClose}
                className='p-2 hover:bg-rich-sand/10 rounded-lg transition-colors'
                disabled={isLoading}
              >
                <HiXMark className='w-5 h-5 text-deep-charcoal' />
              </button>
            </div>

            <div className='mb-4'>
              <p className='text-sm text-deep-charcoal/70 mb-2'>
                {locale === 'en' ? 'Product' : 'المنتج'}
              </p>
              <p className='font-semibold text-deep-charcoal'>
                {productTitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* Dispute Type */}
              <div>
                <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'Issue Type' : 'نوع المشكلة'} *
                </label>
                <select
                  value={disputeType}
                  onChange={e => setDisputeType(e.target.value as DisputeType)}
                  className='w-full px-4 py-3 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green transition-colors'
                  disabled={isLoading}
                >
                  {disputeTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label[locale as 'en' | 'ar'] || type.label.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-deep-charcoal mb-2'
                >
                  {locale === 'en' ? 'Description' : 'الوصف'} *
                </label>
                <textarea
                  id='description'
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    setError('');
                  }}
                  placeholder={
                    locale === 'en'
                      ? 'Please describe the issue in detail...'
                      : 'يرجى وصف المشكلة بالتفصيل...'
                  }
                  rows={5}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green transition-colors resize-none ${
                    error ? 'border-red-500' : 'border-rich-sand/30'
                  }`}
                  disabled={isLoading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  required
                />
              </div>

              {error && (
                <p className='text-sm text-red-500'>{error}</p>
              )}

              <p className='text-xs text-deep-charcoal/60'>
                {locale === 'en'
                  ? 'This report will be reviewed by an administrator.'
                  : 'سيتم مراجعة هذا البلاغ من قبل المدير.'}
              </p>

              <div className='flex gap-3 pt-2'>
                <button
                  type='button'
                  onClick={onClose}
                  disabled={isLoading}
                  className='flex-1 bg-white border border-rich-sand/30 text-deep-charcoal py-2.5 rounded-lg font-medium hover:bg-rich-sand/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                >
                  {locale === 'en' ? 'Cancel' : 'إلغاء'}
                </button>
                <button
                  type='submit'
                  disabled={isLoading || !description.trim()}
                  className='flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                >
                  {isLoading
                    ? locale === 'en'
                      ? 'Submitting...'
                      : 'جاري الإرسال...'
                    : locale === 'en'
                    ? 'Submit Report'
                    : 'إرسال البلاغ'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

