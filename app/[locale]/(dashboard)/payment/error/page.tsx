'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiXCircle, HiArrowLeft } from 'react-icons/hi';

export default function PaymentErrorPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Get error message from URL params
    const error = searchParams.get('error');
    const errorMsg = searchParams.get('errorMessage');
    
    if (errorMsg) {
      setErrorMessage(decodeURIComponent(errorMsg));
    } else {
      // Set default error message based on error type
      switch (error) {
        case 'payment_failed':
          setErrorMessage(
            locale === 'en'
              ? 'Payment was declined. Please check your card details and try again.'
              : 'تم رفض الدفع. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى.'
          );
          break;
        case 'payment_pending':
          setErrorMessage(
            locale === 'en'
              ? 'Payment is still processing. Please wait a moment and check your payment status.'
              : 'الدفع قيد المعالجة. يرجى الانتظار قليلاً والتحقق من حالة الدفع.'
          );
          break;
        case 'verification_failed':
          setErrorMessage(
            locale === 'en'
              ? 'Payment verification failed. Please contact support if your payment was processed.'
              : 'فشل التحقق من الدفع. يرجى الاتصال بالدعم إذا تمت معالجة الدفع.'
          );
          break;
        case 'payment_error':
        default:
          setErrorMessage(
            locale === 'en'
              ? 'An error occurred during payment processing. Please try again or contact support.'
              : 'حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.'
          );
          break;
      }
    }
  }, [searchParams, locale]);

  const handleRetry = () => {
    const offerId = searchParams.get('offerId');
    const product = searchParams.get('product');
    const orderId = searchParams.get('orderId');
    const checkoutType = searchParams.get('type');
    
    if (checkoutType === 'cart' && orderId) {
      router.push(`/${locale}/payment?type=cart&orderId=${orderId}`);
    } else if (offerId) {
      router.push(
        `/${locale}/payment?offerId=${offerId}&product=${encodeURIComponent(product || '')}`
      );
    } else {
      router.push(`/${locale}/payment`);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className='bg-off-white min-h-screen flex items-center justify-center p-4'>
      <div className='bg-white rounded-xl border border-rich-sand/30 shadow-lg max-w-md w-full p-8 text-center'>
        <div className='flex justify-center mb-6'>
          <div className='w-20 h-20 rounded-full bg-red-100 flex items-center justify-center'>
            <HiXCircle className='w-12 h-12 text-red-500' />
          </div>
        </div>
        
        <h1 className='text-2xl font-bold text-deep-charcoal mb-4'>
          {locale === 'en' ? 'Payment Failed' : 'فشل الدفع'}
        </h1>
        
        <p className='text-deep-charcoal/70 mb-8'>
          {errorMessage || (
            locale === 'en'
              ? 'An error occurred during payment processing.'
              : 'حدث خطأ أثناء معالجة الدفع.'
          )}
        </p>
        
        <div className='flex flex-col sm:flex-row gap-3'>
          <button
            onClick={handleRetry}
            className='flex-1 px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors'
          >
            {locale === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
          </button>
          
          <button
            onClick={handleGoBack}
            className='flex-1 px-6 py-3 border-2 border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 transition-colors flex items-center justify-center gap-2'
          >
            <HiArrowLeft className='w-5 h-5' />
            {locale === 'en' ? 'Go Back' : 'رجوع'}
          </button>
        </div>
        
        <p className='text-sm text-deep-charcoal/50 mt-6'>
          {locale === 'en'
            ? 'If you believe this is an error, please contact our support team.'
            : 'إذا كنت تعتقد أن هذا خطأ، يرجى الاتصال بفريق الدعم.'}
        </p>
      </div>
    </div>
  );
}

