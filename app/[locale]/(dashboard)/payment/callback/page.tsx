'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentCallbackPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get parameters from callback URL
        const paymentId = searchParams.get('id');
        const status = searchParams.get('status');
        const offerId = searchParams.get('offerId');
        const product = searchParams.get('product');
        const offerPrice = searchParams.get('offerPrice');
        const shipping = searchParams.get('shipping');

        console.log('Payment callback received:', {
          paymentId,
          status,
          offerId,
          product,
        });

        // Try to get pending payment data from sessionStorage
        let pendingPayment = null;
        try {
          const stored = sessionStorage.getItem('pendingPayment');
          if (stored) {
            pendingPayment = JSON.parse(stored);
            sessionStorage.removeItem('pendingPayment'); // Clean up
          }
        } catch (e) {
          console.error('Error reading pending payment:', e);
        }

        // If we have a payment ID, verify the payment status
        if (paymentId) {
          try {
            // Retry verification up to 5 times with delay (in case 3DS is still processing)
            let verifiedPayment = null;
            let paymentStatus = 'initiated';
            let maxRetries = 5;
            let retryCount = 0;

            while (retryCount < maxRetries && paymentStatus === 'initiated') {
              // Call POST verify endpoint with paymentId and orderId
              const verifyResponse = await fetch('/api/payment/verify/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentId: paymentId,
                  orderId: pendingPayment?.orderId || null,
                }),
              });
              const verifyResult = await verifyResponse.json();
              
              console.log(`Payment verification attempt ${retryCount + 1}:`, verifyResult);
              
              if (verifyResult.success && verifyResult.payment) {
                verifiedPayment = verifyResult.payment;
                paymentStatus = verifiedPayment.status;
                
                // Log complete verification response
                console.log('Complete Payment Verification Response:', {
                  status: verifyResponse.status,
                  statusText: verifyResponse.statusText,
                  headers: Object.fromEntries(verifyResponse.headers.entries()),
                  body: verifyResult,
                  attempt: retryCount + 1,
                });

                // If payment is paid, break out of retry loop
                if (paymentStatus === 'paid') {
                  break;
                }
              }

              // If still initiated, wait before retrying
              if (paymentStatus === 'initiated' && retryCount < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                retryCount++;
              } else {
                break;
              }
            }

            // Only proceed if payment is actually paid (not just initiated)
            if (paymentStatus === 'paid' && verifiedPayment) {
              // Payment is confirmed as paid
              const paymentData = verifiedPayment;
              
              // Get payment info from pendingPayment or use URL params
              const finalOfferId = pendingPayment?.offerId || offerId || '';
              const finalProduct = pendingPayment?.product || product || '';
              const finalOfferPrice = pendingPayment?.offerPrice || offerPrice || '';
              const finalShipping = pendingPayment?.shipping || shipping || '';
              const finalTotalPrice = pendingPayment?.totalPrice || 
                (parseFloat(finalOfferPrice || '0') + parseFloat(finalShipping || '0')).toFixed(2);

              // Get affiliate code
              let affiliateCode = '';
              try {
                const storedItems = JSON.parse(localStorage.getItem('listedItems') || '[]');
                const item = storedItems.find((item: any) => item.title === finalProduct);
                affiliateCode = item?.affiliateCode || '';
              } catch (e) {
                console.error('Error getting affiliate code:', e);
              }

              // Save payment to localStorage
              const paymentRecord = {
                id: `PAY-${Date.now()}`,
                offerId: finalOfferId,
                product: finalProduct,
                size: pendingPayment?.size || '',
                price: pendingPayment?.price || '0',
                offerPrice: finalOfferPrice,
                shipping: finalShipping,
                totalPrice: finalTotalPrice,
                affiliateCode: affiliateCode,
                status: 'ready',
                orderDate: new Date().toISOString().split('T')[0],
                paymentId: paymentId,
                tokenData: {
                  id: paymentData?.source?.token || '',
                  brand: paymentData?.source?.brand || 'card',
                  lastFour: paymentData?.source?.number?.slice(-4) || '',
                  name: paymentData?.source?.name || '',
                  month: paymentData?.source?.month || '',
                  year: paymentData?.source?.year || '',
                  country: paymentData?.source?.company || 'SA',
                  funding: paymentData?.source?.funding || 'debit',
                  status: paymentData?.status || 'paid',
                },
                paymentMethod: paymentData?.source?.brand || 'card',
                paymentStatus: 'paid',
              };

              const existingPayments = JSON.parse(
                localStorage.getItem('payments') || '[]'
              );
              existingPayments.push(paymentRecord);
              localStorage.setItem('payments', JSON.stringify(existingPayments));

              // Call payment webhook
              try {
                const webhookResponse = await fetch('/api/payment/webhook/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: paymentId,
                    status: 'paid',
                    amount: paymentData?.amount || Math.round(parseFloat(finalTotalPrice) * 100),
                  }),
                });

                const webhookText = await webhookResponse.text();
                let webhookResult;
                try {
                  webhookResult = JSON.parse(webhookText);
                } catch (e) {
                  webhookResult = { rawResponse: webhookText };
                }

                console.log('Payment Webhook Response:', {
                  status: webhookResponse.status,
                  statusText: webhookResponse.statusText,
                  headers: Object.fromEntries(webhookResponse.headers.entries()),
                  body: webhookResult,
                });
              } catch (webhookError) {
                console.error('Payment webhook error:', webhookError);
                // Don't fail the whole process if webhook fails
              }

              // Redirect to success page
              router.push(
                `/${locale}/payment/success?offerId=${finalOfferId}&product=${encodeURIComponent(finalProduct)}&offerPrice=${finalOfferPrice}&shipping=${finalShipping}`
              );
              return;
            } else if (paymentStatus === 'initiated') {
              // Payment is still initiated after retries - 3DS may not have completed
              console.error('Payment still in initiated status after retries. 3DS may not have completed.');
              
              // Redirect back to payment page with error message
              const errorParams = new URLSearchParams({
                offerId: offerId || '',
                product: product || '',
                size: searchParams.get('size') || '',
                price: searchParams.get('price') || '',
                offerPrice: offerPrice || '',
                shipping: shipping || '',
                error: 'payment_pending',
              });
              
              router.push(`/${locale}/payment?${errorParams.toString()}`);
              return;
            } else {
              // Payment status is something else (failed, etc.)
              console.error('Payment verification failed or payment status is:', paymentStatus);
              
              const errorParams = new URLSearchParams({
                offerId: offerId || '',
                product: product || '',
                size: searchParams.get('size') || '',
                price: searchParams.get('price') || '',
                offerPrice: offerPrice || '',
                shipping: shipping || '',
                error: 'payment_failed',
              });
              
              router.push(`/${locale}/payment?${errorParams.toString()}`);
              return;
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
          }
        }

        // Fallback: use status from callback URL
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
      } catch (error) {
        console.error('Payment callback error:', error);
        setIsVerifying(false);
        // Redirect back to payment page on error
        const offerId = searchParams.get('offerId');
        const product = searchParams.get('product');
        const offerPrice = searchParams.get('offerPrice');
        const shipping = searchParams.get('shipping');
        router.push(
          `/${locale}/payment?offerId=${offerId}&product=${encodeURIComponent(product || '')}&size=${searchParams.get('size')}&price=${searchParams.get('price')}&offerPrice=${offerPrice}&shipping=${shipping}`
        );
      }
    };

    verifyPayment();
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

