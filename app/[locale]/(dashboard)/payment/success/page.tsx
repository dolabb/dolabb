'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HiCheckCircle } from 'react-icons/hi2';

export default function PaymentSuccessPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';

  const offerId = searchParams.get('offerId');
  const product = searchParams.get('product');
  const offerPrice = searchParams.get('offerPrice');
  const shipping = searchParams.get('shipping');

  const totalPrice = (
    parseFloat(offerPrice || '0') + parseFloat(shipping || '0')
  ).toFixed(2);

  // Calculate and record affiliate commission on payment success
  useEffect(() => {
    const calculateAffiliateCommission = async () => {
      try {
        // Get payment data from localStorage
        const payments = JSON.parse(localStorage.getItem('payments') || '[]');
        const currentPayment = payments.find((p: any) => p.offerId === offerId);
        
        if (!currentPayment) return;

        // Get product/item data to find affiliate code
        // In production, this would come from the database
        // For now, we'll check if there's an affiliate code in the payment metadata
        const affiliateCode = currentPayment.affiliateCode;
        
        if (!affiliateCode) return;

        // Calculate platform fee (example: 5% of sale price, minimum 5 SAR)
        const salePrice = parseFloat(offerPrice || '0');
        const platformFeePercentage = 0.05; // 5%
        const platformFee = Math.max(salePrice * platformFeePercentage, 5);

        // Calculate affiliate commission: 25% of platform fee
        const commission = platformFee * 0.25;

        // Record commission via API
        const response = await fetch('/api/affiliate/earnings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            affiliateCode,
            platformFee,
            saleId: offerId || `SALE-${Date.now()}`,
          }),
        });

        if (response.ok) {
          console.log('Affiliate commission recorded:', commission);
        }
      } catch (error) {
        console.error('Error recording affiliate commission:', error);
      }
    };

    calculateAffiliateCommission();
  }, [offerId, offerPrice]);

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
          {/* Success Icon */}
          <div className='flex justify-center mb-6'>
            <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center'>
              <HiCheckCircle className='w-12 h-12 text-green-600' />
            </div>
          </div>

          {/* Success Message */}
          <h1 className='text-3xl font-bold text-deep-charcoal mb-4'>
            {locale === 'en' ? 'Payment Successful!' : 'تم الدفع بنجاح!'}
          </h1>
          <p className='text-lg text-deep-charcoal/70 mb-8'>
            {locale === 'en'
              ? 'Thank you for your purchase. Your order has been confirmed.'
              : 'شكراً لك على الشراء. تم تأكيد طلبك.'}
          </p>

          {/* Order Details */}
          <div className='bg-rich-sand/10 rounded-lg p-6 mb-8 text-left'>
            <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
              {locale === 'en' ? 'Order Details' : 'تفاصيل الطلب'}
            </h2>
            <div className='space-y-2 text-sm text-deep-charcoal/70'>
              {offerId && (
                <p>
                  <span className='font-medium'>
                    {locale === 'en' ? 'Order ID:' : 'رقم الطلب:'}
                  </span>{' '}
                  {offerId}
                </p>
              )}
              {product && (
                <p>
                  <span className='font-medium'>
                    {locale === 'en' ? 'Product:' : 'المنتج:'}
                  </span>{' '}
                  {product}
                </p>
              )}
              <p>
                <span className='font-medium'>
                  {locale === 'en' ? 'Amount Paid:' : 'المبلغ المدفوع:'}
                </span>{' '}
                <span className='text-saudi-green font-bold'>
                  {locale === 'ar' ? 'ر.س' : 'SAR'} {totalPrice}
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href={`/${locale}/messages`}
              className='px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer'
            >
              {locale === 'en' ? 'Back to Messages' : 'العودة إلى الرسائل'}
            </Link>
            <Link
              href={`/${locale}`}
              className='px-6 py-3 bg-white border-2 border-saudi-green text-saudi-green rounded-lg font-semibold hover:bg-saudi-green/5 transition-colors cursor-pointer'
            >
              {locale === 'en' ? 'Continue Shopping' : 'متابعة التسوق'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

