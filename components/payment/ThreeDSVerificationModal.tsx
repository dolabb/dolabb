'use client';

import { useLocale } from 'next-intl';
import { HiShieldCheck, HiXMark } from 'react-icons/hi2';

interface ThreeDSVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  amount?: string;
  productName?: string;
}

export default function ThreeDSVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  isLoading = false,
  amount,
  productName,
}: ThreeDSVerificationModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full border border-rich-sand/30 overflow-hidden my-auto max-h-[95vh] flex flex-col'>
        {/* Header */}
        <div className='bg-gradient-to-r from-saudi-green to-saudi-green/90 p-4 sm:p-6 text-white relative flex-shrink-0'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 hover:text-white transition-colors disabled:opacity-50 z-10'
            aria-label={locale === 'en' ? 'Close' : 'إغلاق'}
          >
            <HiXMark className='w-5 h-5 sm:w-6 sm:h-6' />
          </button>
          <div className='flex items-center gap-2 sm:gap-3 pr-8 sm:pr-10'>
            <div className='bg-white/20 rounded-full p-2 sm:p-3 flex-shrink-0'>
              <HiShieldCheck className='w-5 h-5 sm:w-6 sm:h-6' />
            </div>
            <div className='min-w-0'>
              <h3 className='text-lg sm:text-xl font-bold truncate'>
                {locale === 'en' ? 'Account Verification' : 'التحقق من الحساب'}
              </h3>
              <p className='text-white/90 text-xs sm:text-sm mt-1'>
                {locale === 'en' ? '3D Secure Authentication' : 'المصادقة الآمنة ثلاثية الأبعاد'}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className='p-4 sm:p-6 overflow-y-auto flex-1'>
          <div className='mb-4 sm:mb-6'>
            <div className='flex items-center justify-center mb-3 sm:mb-4'>
              <div className='bg-saudi-green/10 rounded-full p-3 sm:p-4'>
                <HiShieldCheck className='w-10 h-10 sm:w-12 sm:h-12 text-saudi-green' />
              </div>
            </div>
            
            <p className='text-deep-charcoal text-center mb-3 sm:mb-4 font-medium text-sm sm:text-base'>
              {locale === 'en' 
                ? 'Account verification successful!' 
                : 'تم التحقق من الحساب بنجاح!'}
            </p>
            
            <div className='bg-rich-sand/20 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4'>
              <p className='text-deep-charcoal/80 text-xs sm:text-sm mb-2'>
                {locale === 'en' ? 'Payment Details:' : 'تفاصيل الدفع:'}
              </p>
              {productName && (
                <p className='text-deep-charcoal font-semibold mb-1 text-sm sm:text-base break-words'>
                  {productName}
                </p>
              )}
              {amount && (
                <p className='text-saudi-green font-bold text-base sm:text-lg'>
                  {locale === 'ar' ? 'ر.س' : 'SAR'} {amount}
                </p>
              )}
            </div>

            <p className='text-deep-charcoal/70 text-center text-xs sm:text-sm leading-relaxed'>
              {locale === 'en'
                ? 'Can we proceed with processing this payment? Please confirm to complete your transaction securely.'
                : 'هل يمكننا المتابعة مع معالجة هذا الدفع؟ يرجى التأكيد لإتمام معاملتك بأمان.'}
            </p>
          </div>

          {/* Buttons */}
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2'>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className='flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 hover:border-rich-sand/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
            >
              {locale === 'en' ? 'No, Cancel' : 'لا، إلغاء'}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className='flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base'
            >
              {isLoading 
                ? (locale === 'en' ? 'Processing...' : 'جاري المعالجة...')
                : (locale === 'en' ? 'Yes, Proceed' : 'نعم، متابعة')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

