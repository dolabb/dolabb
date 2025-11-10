'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentCallbackPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle payment callback from Moyasar
    const status = searchParams.get('status');
    const offerId = searchParams.get('offerId');
    const product = searchParams.get('product');
    const offerPrice = searchParams.get('offerPrice');
    const shipping = searchParams.get('shipping');

    if (status === 'paid') {
      // Payment successful - redirect to success page
      router.push(
        `/${locale}/payment/success?offerId=${offerId}&product=${encodeURIComponent(product || '')}&offerPrice=${offerPrice}&shipping=${shipping}`
      );
    } else {
      // Payment failed or cancelled - redirect back to payment page
      router.push(
        `/${locale}/payment?offerId=${offerId}&product=${encodeURIComponent(product || '')}&size=${searchParams.get('size')}&price=${searchParams.get('price')}&offerPrice=${offerPrice}&shipping=${shipping}`
      );
    }
  }, [searchParams, locale, router]);

  return (
    <div className='bg-off-white min-h-screen flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4'></div>
        <p className='text-deep-charcoal/70'>
          {locale === 'en'
            ? 'Processing payment...'
            : 'جاري معالجة الدفع...'}
        </p>
      </div>
    </div>
  );
}

