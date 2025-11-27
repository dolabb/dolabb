'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { HiXMark, HiStar } from 'react-icons/hi2';
import { AnimatePresence, motion } from 'framer-motion';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  productTitle: string;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  orderId,
  productTitle,
  onSubmit,
  isLoading = false,
}: ReviewModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError(
        locale === 'en'
          ? 'Please select a rating'
          : 'يرجى اختيار تقييم'
      );
      return;
    }

    if (comment.length > 1000) {
      setError(
        locale === 'en'
          ? 'Comment must be less than 1000 characters'
          : 'يجب أن يكون التعليق أقل من 1000 حرف'
      );
      return;
    }

    try {
      await onSubmit(rating, comment || undefined);
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
                {locale === 'en' ? 'Submit Review' : 'إرسال التقييم'}
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
              {/* Rating */}
              <div>
                <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'Rating' : 'التقييم'} *
                </label>
                <div className='flex gap-2'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type='button'
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className='focus:outline-none'
                      disabled={isLoading}
                    >
                      <HiStar
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label
                  htmlFor='comment'
                  className='block text-sm font-medium text-deep-charcoal mb-2'
                >
                  {locale === 'en' ? 'Comment (Optional)' : 'تعليق (اختياري)'}
                </label>
                <textarea
                  id='comment'
                  value={comment}
                  onChange={e => {
                    setComment(e.target.value);
                    setError('');
                  }}
                  placeholder={
                    locale === 'en'
                      ? 'Share your experience...'
                      : 'شارك تجربتك...'
                  }
                  rows={4}
                  maxLength={1000}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green transition-colors resize-none ${
                    error ? 'border-red-500' : 'border-rich-sand/30'
                  }`}
                  disabled={isLoading}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <p className='mt-1 text-xs text-deep-charcoal/60'>
                  {comment.length}/1000 {locale === 'en' ? 'characters' : 'حرف'}
                </p>
              </div>

              {error && (
                <p className='text-sm text-red-500'>{error}</p>
              )}

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
                  disabled={isLoading || rating === 0}
                  className='flex-1 bg-saudi-green text-white py-2.5 rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                >
                  {isLoading
                    ? locale === 'en'
                      ? 'Submitting...'
                      : 'جاري الإرسال...'
                    : locale === 'en'
                    ? 'Submit Review'
                    : 'إرسال التقييم'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

