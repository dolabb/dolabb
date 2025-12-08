'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/utils/toast';

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
              // Call POST verify endpoint with paymentId, orderId, and offerId
              const verifyResponse = await fetch('/api/payment/verify/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentId: paymentId,
                  orderId: pendingPayment?.orderId || null,
                  offerId: pendingPayment?.offerId || offerId || null,
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

            // Check if payment failed
            if (paymentStatus === 'failed' && verifiedPayment) {
              // Payment failed - show error message
              const failureMessage = verifiedPayment.source?.message || 
                                    verifiedPayment.message || 
                                    (locale === 'en' 
                                      ? 'Payment was declined. Please check your card details and try again.' 
                                      : 'تم رفض الدفع. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى.');
              
              // Extract specific error messages
              let errorToastMessage = failureMessage;
              if (failureMessage.includes('INVALID CARD') || failureMessage.includes('NOT FOUND')) {
                errorToastMessage = locale === 'en'
                  ? 'Invalid card or card not found. Please check your card details and try again.'
                  : 'بطاقة غير صالحة أو غير موجودة. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى.';
              } else if (failureMessage.includes('DECLINED')) {
                errorToastMessage = locale === 'en'
                  ? 'Payment was declined. Please check your card details or try a different payment method.'
                  : 'تم رفض الدفع. يرجى التحقق من تفاصيل البطاقة أو جرب طريقة دفع أخرى.';
              } else if (failureMessage.includes('INSUFFICIENT')) {
                errorToastMessage = locale === 'en'
                  ? 'Insufficient funds. Please check your account balance and try again.'
                  : 'رصيد غير كافٍ. يرجى التحقق من رصيد حسابك والمحاولة مرة أخرى.';
              }
              
              toast.error(errorToastMessage, {
                duration: 8000,
              });
              
              // Redirect back to payment page with error
              const errorParams = new URLSearchParams({
                offerId: offerId || '',
                product: product || '',
                size: searchParams.get('size') || '',
                price: searchParams.get('price') || '',
                offerPrice: offerPrice || '',
                shipping: shipping || '',
                error: 'payment_failed',
                errorMessage: encodeURIComponent(errorToastMessage),
              });
              
              router.push(`/${locale}/payment?${errorParams.toString()}`);
              return;
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

              // Call Django backend payment webhook (with idempotency check)
              // Backend behavior:
              // - On payment completion: Adds earnings to affiliate's total_earnings and pending_earnings
              // - Creates/updates transaction with status 'pending'
              // - Transaction status changes to 'paid' only after review + shipment proof
              // Prevent duplicate webhook calls to avoid double-counting affiliate earnings
              const webhookKey = `webhook_called_${paymentId}`;
              const webhookAlreadyCalled = sessionStorage.getItem(webhookKey);
              
              if (!webhookAlreadyCalled) {
                try {
                  console.log('Calling Django backend payment webhook with:', {
                    id: paymentId,
                    status: 'paid',
                    amount: paymentData?.amount || Math.round(parseFloat(finalTotalPrice) * 100),
                    offerId: finalOfferId,
                  });

                  const webhookResponse = await apiClient.post('/api/payment/webhook/', {
                    id: paymentId,
                    status: 'paid',
                    amount: paymentData?.amount || Math.round(parseFloat(finalTotalPrice) * 100),
                    offerId: finalOfferId, // CRITICAL: Include offerId for backend to update offer status
                  });

                  console.log('Payment Webhook Response:', {
                    status: webhookResponse.status,
                    statusText: webhookResponse.statusText,
                    headers: webhookResponse.headers,
                    data: webhookResponse.data,
                  });

                  // Mark webhook as called to prevent duplicate calls
                  sessionStorage.setItem(webhookKey, 'true');
                  
                  // Store webhook success info
                  if (webhookResponse.data?.success) {
                    console.log('Webhook successful - affiliate earnings updated (status: pending)');
                  }
                } catch (webhookError: any) {
                console.error('Payment webhook error:', webhookError);
                
                // Extract error details
                const errorResponse = webhookError.response?.data || {};
                const errorMessage = errorResponse.error || errorResponse.message || webhookError.message;
                const errorStatus = webhookError.response?.status;
                
                // Log detailed error
                console.error('Webhook error details:', {
                  message: webhookError.message,
                  response: errorResponse,
                  status: errorStatus,
                });
                
                // Show warning toast but don't block payment success
                // The payment was successful, but backend webhook failed
                if (errorStatus === 500) {
                  // Backend error - likely missing method or server issue
                  toast.warning(
                    locale === 'en'
                      ? 'Payment successful, but there was an issue updating the order status. Your payment has been processed. Please contact support if you have any concerns.'
                      : 'تم الدفع بنجاح، ولكن حدثت مشكلة في تحديث حالة الطلب. تمت معالجة الدفع الخاص بك. يرجى الاتصال بالدعم إذا كان لديك أي مخاوف.',
                    {
                      duration: 8000, // Longer duration for important message
                    }
                  );
                } else {
                  // Other webhook errors
                  toast.warning(
                    locale === 'en'
                      ? 'Payment successful, but there was an issue with the backend webhook. Your payment has been processed.'
                      : 'تم الدفع بنجاح، ولكن حدثت مشكلة في webhook الخلفي. تمت معالجة الدفع الخاص بك.',
                    {
                      duration: 6000,
                    }
                  );
                }
                
                  // Don't fail the whole process if webhook fails
                  // Payment is still successful, just webhook notification failed
                  // Note: We don't mark webhook as called on error, so it can be retried
                }
              } else {
                console.log('Webhook already called for this payment ID, skipping to prevent duplicate earnings');
              }

              // Redirect to success page with payment IDs
              const successParams = new URLSearchParams({
                offerId: finalOfferId,
                product: finalProduct,
                offerPrice: finalOfferPrice,
                shipping: finalShipping,
                orderId: pendingPayment?.orderId || '',
                paymentId: paymentRecord.id || '',
                moyasarPaymentId: paymentId || paymentData?.id || '',
              });
              router.push(`/${locale}/payment/success?${successParams.toString()}`);
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
            } else if (paymentStatus === 'failed' && verifiedPayment) {
              // Payment failed - show error message
              const failureMessage = verifiedPayment.source?.message || 
                                    verifiedPayment.message || 
                                    (locale === 'en' 
                                      ? 'Payment was declined. Please check your card details and try again.' 
                                      : 'تم رفض الدفع. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى.');
              
              // Extract specific error messages
              let errorToastMessage = failureMessage;
              if (failureMessage.includes('INVALID CARD') || failureMessage.includes('NOT FOUND')) {
                errorToastMessage = locale === 'en'
                  ? 'Invalid card or card not found. Please check your card details and try again.'
                  : 'بطاقة غير صالحة أو غير موجودة. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى.';
              } else if (failureMessage.includes('DECLINED')) {
                errorToastMessage = locale === 'en'
                  ? 'Payment was declined. Please check your card details or try a different payment method.'
                  : 'تم رفض الدفع. يرجى التحقق من تفاصيل البطاقة أو جرب طريقة دفع أخرى.';
              } else if (failureMessage.includes('INSUFFICIENT')) {
                errorToastMessage = locale === 'en'
                  ? 'Insufficient funds. Please check your account balance and try again.'
                  : 'رصيد غير كافٍ. يرجى التحقق من رصيد حسابك والمحاولة مرة أخرى.';
              }
              
              toast.error(errorToastMessage, {
                duration: 8000,
              });
              
              const errorParams = new URLSearchParams({
                offerId: offerId || '',
                product: product || '',
                size: searchParams.get('size') || '',
                price: searchParams.get('price') || '',
                offerPrice: offerPrice || '',
                shipping: shipping || '',
                error: 'payment_failed',
                errorMessage: encodeURIComponent(errorToastMessage),
              });
              
              router.push(`/${locale}/payment?${errorParams.toString()}`);
              return;
            } else {
              // Payment status is something else (unknown status)
              console.error('Payment verification failed or payment status is:', paymentStatus);
              
              const errorMessage = locale === 'en'
                ? 'Payment could not be processed. Please try again or contact support.'
                : 'لم يتم معالجة الدفع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.';
              
              toast.error(errorMessage, {
                duration: 8000,
              });
              
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
          // Payment successful - redirect to success page with payment IDs
          const successParams = new URLSearchParams({
            offerId: offerId || '',
            product: product || '',
            offerPrice: offerPrice || '',
            shipping: shipping || '',
            orderId: pendingPayment?.orderId || '',
            paymentId: pendingPayment?.paymentId || '',
            moyasarPaymentId: paymentId || '',
          });
          router.push(`/${locale}/payment/success?${successParams.toString()}`);
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

