'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { HiXMark } from 'react-icons/hi2';

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalOfferAmount: number;
  originalPrice?: number;
  productTitle?: string;
  onSubmit: (counterAmount: number) => Promise<void>;
  isLoading?: boolean;
}

export default function CounterOfferModal({
  isOpen,
  onClose,
  originalOfferAmount,
  originalPrice,
  productTitle,
  onSubmit,
  isLoading = false,
}: CounterOfferModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [counterAmount, setCounterAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCounterAmount('');
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(counterAmount);
    if (!counterAmount || isNaN(amount) || amount <= 0) {
      setError(
        locale === 'en'
          ? 'Please enter a valid counter offer amount'
          : 'يرجى إدخال مبلغ عرض مقابل صحيح'
      );
      return;
    }

    try {
      await onSubmit(amount);
      onClose();
    } catch (err) {
      // Error handling is done in the parent component
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                  {locale === 'en' ? 'Counter Offer' : 'عرض مقابل'}
                </h3>
                <button
                  onClick={onClose}
                  className='p-2 hover:bg-rich-sand/10 rounded-lg transition-colors'
                  disabled={isLoading}
                >
                  <HiXMark className='w-5 h-5 text-deep-charcoal' />
                </button>
              </div>

              {productTitle && (
                <div className='mb-4'>
                  <p className='text-sm text-deep-charcoal/70 mb-2'>
                    {locale === 'en' ? 'Product' : 'المنتج'}
                  </p>
                  <p className='font-semibold text-deep-charcoal'>
                    {productTitle}
                  </p>
                </div>
              )}

              {originalPrice && originalPrice > 0 && (
                <div className='mb-4 p-3 bg-rich-sand/10 rounded-lg'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-deep-charcoal/70'>
                      {locale === 'en' ? 'Original Offer' : 'العرض الأصلي'}
                    </span>
                    <span className='text-lg font-bold text-deep-charcoal/60'>
                      {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                      {originalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label
                    htmlFor='counterAmount'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en'
                      ? 'Your Counter Offer Amount'
                      : 'مبلغ العرض المقابل'}
                  </label>
                  <div className='relative'>
                    <span
                      className={`absolute ${
                        isRTL ? 'right-3' : 'left-3'
                      } top-1/2 -translate-y-1/2 text-deep-charcoal/60 text-sm`}
                    >
                      {locale === 'ar' ? 'ر.س' : 'SAR'}
                    </span>
                    <input
                      id='counterAmount'
                      type='number'
                      value={counterAmount}
                      onChange={e => {
                        setCounterAmount(e.target.value);
                        setError('');
                      }}
                      placeholder='0.00'
                      min='0'
                      step='0.01'
                      className={`w-full ${
                        isRTL ? 'pr-12 pl-3' : 'pl-12 pr-3'
                      } py-3 border ${
                        error
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-rich-sand/30 focus:border-saudi-green focus:ring-saudi-green'
                      } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                      disabled={isLoading}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className='mt-1 text-sm text-red-500'>{error}</p>
                  )}
                </div>

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
                    disabled={isLoading || !counterAmount}
                    className='flex-1 bg-saudi-green text-white py-2.5 rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                  >
                    {isLoading
                      ? locale === 'en'
                        ? 'Sending...'
                        : 'جاري الإرسال...'
                      : locale === 'en'
                      ? 'Send Counter Offer'
                      : 'إرسال العرض المقابل'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
