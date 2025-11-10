'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import TermsModal from '@/components/shared/TermsModal';

export default function CartPage() {
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleCheckout = () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }
    // Proceed with checkout
    alert(locale === 'en' ? 'Proceeding to checkout...' : 'المتابعة إلى الدفع...');
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    // Proceed with checkout after accepting terms
    alert(locale === 'en' ? 'Proceeding to checkout...' : 'المتابعة إلى الدفع...');
  };

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-3xl font-bold text-deep-charcoal mb-8'>
          {locale === 'en' ? 'Shopping Cart' : 'سلة التسوق'}
        </h1>
        <div className='bg-white rounded-lg p-8'>
          <div className='text-center mb-6'>
            <p className='text-deep-charcoal/70 mb-4'>
              {locale === 'en' ? 'Your cart is empty' : 'سلة التسوق فارغة'}
            </p>
            {/* Checkout button for demonstration - would show when cart has items */}
            <button
              onClick={handleCheckout}
              className='px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg'
            >
              {locale === 'en' ? 'Proceed to Checkout' : 'المتابعة إلى الدفع'}
            </button>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onClose={() => setShowTermsModal(false)}
        title={locale === 'en' ? 'Accept Terms of Service' : 'قبول شروط الخدمة'}
        description={locale === 'en' ? 'You must accept our Terms of Service to complete your purchase' : 'يجب عليك قبول شروط الخدمة لإكمال عملية الشراء'}
      />
    </div>
  );
}

