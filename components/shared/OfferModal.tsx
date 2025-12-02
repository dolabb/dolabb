'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { HiXMark } from 'react-icons/hi2';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productPrice: number;
  productTitle: string;
  onSubmit: (offerAmount: number) => Promise<void>;
  isLoading?: boolean;
}

export default function OfferModal({
  isOpen,
  onClose,
  productPrice,
  productTitle,
  onSubmit,
  isLoading = false,
}: OfferModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [offerAmount, setOfferAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setOfferAmount('');
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

    const amount = parseFloat(offerAmount);
    if (!offerAmount || isNaN(amount) || amount <= 0) {
      setError(
        locale === 'en'
          ? 'Please enter a valid offer amount'
          : 'يرجى إدخال مبلغ عرض صحيح'
      );
      return;
    }

    if (amount >= productPrice) {
      setError(
        locale === 'en'
          ? 'Offer amount must be less than the product price'
          : 'يجب أن يكون مبلغ العرض أقل من سعر المنتج'
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
                  {locale === 'en' ? 'Make an Offer' : 'قدم عرضاً'}
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
                <p className='font-semibold text-deep-charcoal mb-3'>
                  {productTitle}
                </p>
                <div className='flex items-center justify-between p-3 bg-rich-sand/10 rounded-lg'>
                  <span className='text-sm text-deep-charcoal/70'>
                    {locale === 'en' ? 'Original Price' : 'السعر الأصلي'}
                  </span>
                  <span className='text-lg font-bold text-saudi-green'>
                    {locale === 'ar' ? 'ر.س' : 'SAR'} {productPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                  <label
                    htmlFor='offerAmount'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Your Offer Amount' : 'مبلغ عرضك'}
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-deep-charcoal/60 text-sm'>
                      {locale === 'ar' ? 'ر.س' : 'SAR'}
                    </span>
                    <input
                      id='offerAmount'
                      type='number'
                      value={offerAmount}
                      onChange={e => {
                        setOfferAmount(e.target.value);
                        setError('');
                      }}
                      placeholder='0.00'
                      min='0'
                      step='0.01'
                      max={productPrice}
                      className={`w-full ${
                        isRTL ? 'pr-12 pl-3' : 'pl-12 pr-3'
                      } py-3 border ${
                        error
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : 'border-rich-sand/30 focus:border-saudi-green focus:ring-saudi-green'
                      } rounded-lg focus:outline-none focus:ring-2 transition-colors`}
                      disabled={isLoading}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                  {error && (
                    <p className='mt-1 text-sm text-red-500'>{error}</p>
                  )}
                  <p className='mt-2 text-xs text-deep-charcoal/60'>
                    {locale === 'en'
                      ? `Maximum offer: SAR ${productPrice.toFixed(2)}`
                      : `الحد الأقصى للعرض: ر.س ${productPrice.toFixed(2)}`}
                  </p>
                </div>

                <div className='flex gap-3 pt-2'>
                  <button
                    type='button'
                    onClick={onClose}
                    disabled={isLoading}
                    className='flex-1 bg-white border border-rich-sand/30 text-deep-charcoal py-2.5 rounded-lg font-medium hover:bg-rich-sand/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {locale === 'en' ? 'Cancel' : 'إلغاء'}
                  </button>
                  <button
                    type='submit'
                    disabled={isLoading || !offerAmount}
                    className='flex-1 bg-saudi-green text-white py-2.5 rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isLoading
                      ? locale === 'en'
                        ? 'Submitting...'
                        : 'جاري الإرسال...'
                      : locale === 'en'
                      ? 'Submit Offer'
                      : 'إرسال العرض'}
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

