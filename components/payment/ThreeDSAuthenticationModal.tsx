'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { HiShieldCheck, HiXMark } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreeDSAuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionUrl: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  amount?: string;
  productName?: string;
}

export default function ThreeDSAuthenticationModal({
  isOpen,
  onClose,
  transactionUrl,
  onSuccess,
  onError,
  amount,
  productName,
}: ThreeDSAuthenticationModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const callbackUrlRef = useRef<string>('');

  // Extract callback URL from transaction URL or construct it
  useEffect(() => {
    if (transactionUrl && typeof window !== 'undefined') {
      // Try to extract callback URL from sessionStorage or construct it
      try {
        const pendingPayment = JSON.parse(
          sessionStorage.getItem('pendingPayment') || '{}'
        );
        const origin = window.location.origin;
        const callbackUrl = `${origin}/${locale}/payment/callback?offerId=${pendingPayment.offerId || ''}&product=${encodeURIComponent(pendingPayment.product || '')}&offerPrice=${pendingPayment.offerPrice || ''}&shipping=${pendingPayment.shipping || ''}`;
        callbackUrlRef.current = callbackUrl;
      } catch (e) {
        console.error('Error constructing callback URL:', e);
      }
    }
  }, [transactionUrl, locale]);

  // Monitor iframe navigation and handle postMessage
  useEffect(() => {
    if (!isOpen || !iframeRef.current) return;

    const iframe = iframeRef.current;
    let pollInterval: NodeJS.Timeout;

    // Listen for postMessage from iframe (if Moyasar supports it)
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin.includes('moyasar.com') || event.origin.includes('localhost')) {
        console.log('Received message from iframe:', event.data);
        if (event.data?.type === '3ds-complete' || event.data?.status === 'success') {
          setIsLoading(false);
          onSuccess();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Poll payment status as fallback
    const pollPaymentStatus = async () => {
      try {
        const pendingPayment = JSON.parse(
          sessionStorage.getItem('pendingPayment') || '{}'
        );
        
        if (pendingPayment.paymentId) {
          const response = await fetch(`/api/payment/verify/?id=${pendingPayment.paymentId}`, {
            method: 'GET',
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.payment?.status === 'paid') {
              // Payment completed, redirect to callback
              setIsLoading(false);
              onSuccess();
              return true;
            }
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
      return false;
    };

    // Start polling after 5 seconds (give iframe time to load and user to complete authentication)
    // Poll every 2 seconds for up to 2 minutes
    let pollCount = 0;
    const maxPolls = 60; // 2 minutes max
    
    pollInterval = setTimeout(() => {
      const startPolling = async () => {
        const completed = await pollPaymentStatus();
        if (!completed && pollCount < maxPolls) {
          pollCount++;
          pollInterval = setTimeout(startPolling, 2000);
        }
      };
      startPolling();
    }, 5000);

    // Also listen for iframe load events
    const handleIframeLoad = () => {
      setIsLoading(false);
    };

    iframe.addEventListener('load', handleIframeLoad);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (pollInterval) clearInterval(pollInterval);
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [isOpen, onSuccess]);

  // Handle iframe errors
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError('Failed to load authentication page');
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='bg-slate-900/20 backdrop-blur fixed inset-0 z-50 overflow-hidden'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className='bg-white w-full h-full cursor-default relative overflow-hidden flex flex-col'
        >
          {/* Compact Header - Keep for consistency */}
          <div className='bg-gradient-to-r from-saudi-green to-saudi-green/90 px-4 py-3 text-white relative flex-shrink-0 flex items-center justify-between'>
            <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
              <div className='bg-white/20 rounded-full p-1.5 sm:p-2 flex-shrink-0'>
                <HiShieldCheck className='w-4 h-4 sm:w-5 sm:h-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <h3 className='text-base sm:text-lg font-bold truncate'>
                  {locale === 'en' ? 'Secure Authentication' : 'المصادقة الآمنة'}
                </h3>
                {(amount || productName) && (
                  <div className='flex items-center gap-2 text-xs sm:text-sm text-white/90 mt-0.5'>
                    {productName && (
                      <span className='truncate max-w-[200px]'>{productName}</span>
                    )}
                    {amount && (
                      <span className='font-semibold'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {amount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className='text-white/80 hover:text-white transition-colors disabled:opacity-50 z-10 ml-2 flex-shrink-0 p-1'
              aria-label={locale === 'en' ? 'Close' : 'إغلاق'}
            >
              <HiXMark className='w-5 h-5 sm:w-6 sm:h-6' />
            </button>
          </div>

          {/* Full-screen Iframe Container */}
          <div className='relative flex-1 w-full h-full bg-rich-sand/10 overflow-hidden'>
            {isLoading && (
              <div className='absolute inset-0 flex items-center justify-center bg-white z-10'>
                <div className='text-center'>
                  <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4'></div>
                  <p className='text-deep-charcoal/70 text-sm'>
                    {locale === 'en' 
                      ? 'Loading secure authentication...' 
                      : 'جاري تحميل المصادقة الآمنة...'}
                  </p>
                </div>
              </div>
            )}

            {!hasError && (
              <iframe
                ref={iframeRef}
                src={transactionUrl}
                className='w-full h-full border-0'
                style={{ 
                  width: '100%', 
                  height: '100%',
                  display: 'block'
                }}
                title={locale === 'en' ? '3D Secure Authentication' : 'المصادقة الآمنة ثلاثية الأبعاد'}
                sandbox='allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups allow-modals'
                onError={handleIframeError}
              />
            )}
          </div>

          {/* Compact Footer */}
          <div className='px-4 py-2 bg-rich-sand/5 border-t border-rich-sand/20 flex-shrink-0'>
            <div className='flex items-center gap-2 text-xs text-deep-charcoal/60'>
              <HiShieldCheck className='w-3 h-3 text-saudi-green flex-shrink-0' />
              <p className='truncate'>
                {locale === 'en' 
                  ? 'Your payment is secured with 3D Secure authentication' 
                  : 'دفعتك محمية بمصادقة 3D Secure'}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

