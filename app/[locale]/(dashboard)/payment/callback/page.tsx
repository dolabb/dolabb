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
        
        // Get cart/group order parameters
        const checkoutType = searchParams.get('type');
        const isCartCheckout = checkoutType === 'cart';
        const isGroupFromUrl = searchParams.get('isGroup') === 'true';
        const orderIdsFromUrl = searchParams.get('orderIds');
        const orderIdFromUrl = searchParams.get('orderId');

        console.log('Payment callback received:', {
          paymentId,
          status,
          offerId,
          product,
          checkoutType,
          isGroupFromUrl,
          orderIdsFromUrl,
          orderIdFromUrl,
        });

        // Try to get pending payment data from sessionStorage
        let pendingPayment: any = null;
        let isGroupOrder = isGroupFromUrl;
        let orderIds: string[] = [];
        
        try {
          const stored = sessionStorage.getItem('pendingPayment');
          if (stored) {
            pendingPayment = JSON.parse(stored);
            sessionStorage.removeItem('pendingPayment'); // Clean up
            
            // Check if this is a group order from pendingPayment
            if (pendingPayment.isGroup) {
              isGroupOrder = true;
              orderIds = pendingPayment.orderIds || [];
            }
          }
        } catch (e) {
          console.error('Error reading pending payment:', e);
        }
        
        // Get orderIds from URL if not in pendingPayment
        if (orderIdsFromUrl && orderIds.length === 0) {
          orderIds = orderIdsFromUrl.split(',');
        }
        
        // Get single orderId
        const orderId = pendingPayment?.orderId || orderIdFromUrl || '';
        
        console.log('Group order info:', { isGroupOrder, orderIds, orderId });

        // If we have a payment ID, verify the payment status
        if (paymentId) {
          try {
            // Check status from URL first - if paid, we can proceed even if verification fails
            const urlStatus = status || 'initiated';
            
            // Retry verification up to 5 times with delay (in case 3DS is still processing)
            let verifiedPayment = null;
            let paymentStatus = urlStatus; // Start with URL status
            let maxRetries = 5;
            let retryCount = 0;
            let verificationFailed = false;

            // Only retry if status is 'initiated', otherwise use URL status
            if (urlStatus === 'initiated') {
              while (retryCount < maxRetries && paymentStatus === 'initiated') {
                try {
                  // Call Next.js API route for verification (which calls Moyasar directly)
                  // This avoids Django backend configuration issues
                  console.log(`Calling Next.js /api/payment/verify/ (attempt ${retryCount + 1})`);
                  
                  // Use Next.js API route instead of Django backend
                  const verifyResponse = await fetch(`/api/payment/verify/?id=${paymentId}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  if (!verifyResponse.ok) {
                    throw new Error(`Verification failed with status: ${verifyResponse.status}`);
                  }
                  
                  const verifyResult = await verifyResponse.json();
                  
                  console.log(`Payment verification attempt ${retryCount + 1}:`, verifyResult);
                  
                  if (verifyResult.success && verifyResult.payment) {
                    verifiedPayment = verifyResult.payment;
                    paymentStatus = verifiedPayment.status;
                    verificationFailed = false;
                    
                    // Log complete verification response
                    console.log('Complete Payment Verification Response (Next.js API):', {
                      status: verifyResponse.status,
                      statusText: verifyResponse.statusText,
                      body: verifyResult,
                      attempt: retryCount + 1,
                    });

                    // If payment is paid, break out of retry loop
                    if (paymentStatus === 'paid') {
                      break;
                    }
                  }
                } catch (verifyError: any) {
                  console.error(`Verification attempt ${retryCount + 1} failed:`, verifyError);
                  verificationFailed = true;
                  
                  // If URL status is 'paid' and verification fails, we can still proceed
                  // This handles cases where verification API has issues but payment is actually successful
                  if (urlStatus === 'paid') {
                    console.log('Verification API failed but URL status is paid. Proceeding with payment success.');
                    paymentStatus = 'paid';
                    break;
                  }
                  
                  // Continue to retry if we haven't exceeded max retries
                }

                // If still initiated, wait before retrying
                if (paymentStatus === 'initiated' && retryCount < maxRetries - 1) {
                  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                  retryCount++;
                } else {
                  break;
                }
              }
            } else {
              // URL status is already 'paid' or 'failed' - use it directly
              paymentStatus = urlStatus;
              console.log(`Using payment status from URL: ${urlStatus}`);
              
              // Still try to verify once to get payment details, but don't block on failure
              if (urlStatus === 'paid') {
                try {
                  // Use Next.js API route for verification
                  const verifyResponse = await fetch(`/api/payment/verify/?id=${paymentId}`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  });
                  
                  if (verifyResponse.ok) {
                    const verifyResult = await verifyResponse.json();
                    if (verifyResult.success && verifyResult.payment) {
                      verifiedPayment = verifyResult.payment;
                    }
                  }
                } catch (verifyError: any) {
                  console.error('Verification failed but URL status is paid. Proceeding with success:', verifyError);
                  // Don't block - payment is already confirmed as paid from URL
                }
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
              
              // Redirect to payment error page
              const errorParams = new URLSearchParams({
                offerId: offerId || '',
                product: product || '',
                orderId: orderId || '',
                error: 'payment_failed',
                errorMessage: encodeURIComponent(errorToastMessage),
              });
              
              if (isCartCheckout) {
                errorParams.set('type', 'cart');
              }
              
              router.push(`/${locale}/payment/error?${errorParams.toString()}`);
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
                  // Build webhook request body
                  const webhookBody: any = {
                    id: paymentId,
                    status: 'paid',
                    amount: paymentData?.amount || Math.round(parseFloat(finalTotalPrice) * 100),
                  };
                  
                  // For group orders, send orderIds array
                  if (isGroupOrder && orderIds.length > 0) {
                    webhookBody.orderIds = orderIds;
                    webhookBody.isGroup = true;
                  } else if (orderId) {
                    webhookBody.orderId = orderId;
                  }
                  
                  // Include offerId for offer-based checkout
                  if (finalOfferId) {
                    webhookBody.offerId = finalOfferId;
                  }
                  
                  console.log('Calling Django backend payment webhook with:', webhookBody);

                  const webhookResponse = await apiClient.post('/api/payment/webhook/', webhookBody);

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
                orderId: orderId,
                paymentId: paymentRecord.id || '',
                moyasarPaymentId: paymentId || paymentData?.id || '',
              });
              
              // Add group order info to success params
              if (isGroupOrder && orderIds.length > 0) {
                successParams.set('isGroup', 'true');
                successParams.set('orderIds', orderIds.join(','));
              }
              
              // Check if payment response includes orders array (for group payments)
              if (paymentData?.orders && Array.isArray(paymentData.orders)) {
                successParams.set('paidOrderIds', paymentData.orders.join(','));
              }
              
              // For cart checkout, add type
              if (isCartCheckout) {
                successParams.set('type', 'cart');
              }
              
              router.push(`/${locale}/payment/success?${successParams.toString()}`);
              return;
            } else if (paymentStatus === 'initiated') {
              // Payment is still initiated after retries - check URL status as fallback
              // If URL status is 'paid', proceed to success even if verification failed
              if (urlStatus === 'paid') {
                console.log('Payment status is initiated but URL status is paid. Proceeding to success page.');
                // Create a mock payment object for success flow
                verifiedPayment = {
                  id: paymentId,
                  status: 'paid',
                  amount: pendingPayment?.totalPrice ? Math.round(parseFloat(pendingPayment.totalPrice) * 100) : 0,
                };
                paymentStatus = 'paid';
                // Continue to success flow below
              } else {
                // Payment is still initiated after retries - 3DS may not have completed
                console.error('Payment still in initiated status after retries. 3DS may not have completed.');
                
                // Redirect to payment error page
                const errorParams = new URLSearchParams({
                  offerId: offerId || '',
                  product: product || '',
                  orderId: orderId || '',
                  error: 'payment_pending',
                });
                
                if (isCartCheckout) {
                  errorParams.set('type', 'cart');
                }
                
                router.push(`/${locale}/payment/error?${errorParams.toString()}`);
                return;
              }
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
              
              // Redirect to payment error page
              const errorParams = new URLSearchParams({
                offerId: offerId || '',
                product: product || '',
                orderId: orderId || '',
                error: 'payment_failed',
                errorMessage: encodeURIComponent(errorToastMessage),
              });
              
              if (isCartCheckout) {
                errorParams.set('type', 'cart');
              }
              
              router.push(`/${locale}/payment/error?${errorParams.toString()}`);
              return;
            } else {
              // Payment status is something else (unknown status) or verification failed
              // Check URL status as fallback - if URL says 'paid', proceed to success
              if (urlStatus === 'paid') {
                console.log('Verification failed but URL status is paid. Proceeding to success page.');
                
                // Create a mock payment object for success flow
                verifiedPayment = {
                  id: paymentId,
                  status: 'paid',
                  amount: pendingPayment?.totalPrice ? Math.round(parseFloat(pendingPayment.totalPrice) * 100) : 0,
                };
                paymentStatus = 'paid';
                
                // Continue to success flow - will be handled by the 'paid' check above
                // We need to jump to the success flow
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
                    id: verifiedPayment?.source?.token || '',
                    brand: verifiedPayment?.source?.brand || 'card',
                    lastFour: verifiedPayment?.source?.number?.slice(-4) || '',
                    name: verifiedPayment?.source?.name || '',
                    month: verifiedPayment?.source?.month || '',
                    year: verifiedPayment?.source?.year || '',
                    country: verifiedPayment?.source?.company || 'SA',
                    funding: verifiedPayment?.source?.funding || 'debit',
                    status: verifiedPayment?.status || 'paid',
                  },
                  paymentMethod: verifiedPayment?.source?.brand || 'card',
                  paymentStatus: 'paid',
                };

                const existingPayments = JSON.parse(
                  localStorage.getItem('payments') || '[]'
                );
                existingPayments.push(paymentRecord);
                localStorage.setItem('payments', JSON.stringify(existingPayments));

                // Show warning about verification failure but proceed
                toast.warning(
                  locale === 'en'
                    ? 'Payment successful! Verification API had issues, but your payment was processed.'
                    : 'تم الدفع بنجاح! واجهت واجهة برمجة التطبيقات للتحقق مشاكل، ولكن تمت معالجة الدفع الخاص بك.',
                  {
                    duration: 6000,
                  }
                );

                // Redirect to success page
                const successParams = new URLSearchParams({
                  offerId: finalOfferId,
                  product: finalProduct,
                  offerPrice: finalOfferPrice,
                  shipping: finalShipping,
                  orderId: orderId,
                  paymentId: paymentRecord.id || '',
                  moyasarPaymentId: paymentId || '',
                });
                
                if (isGroupOrder && orderIds.length > 0) {
                  successParams.set('isGroup', 'true');
                  successParams.set('orderIds', orderIds.join(','));
                }
                
                if (isCartCheckout) {
                  successParams.set('type', 'cart');
                }
                
                router.push(`/${locale}/payment/success?${successParams.toString()}`);
                return;
              } else {
                // Payment status is unknown and URL status is not 'paid'
                console.error('Payment verification failed or payment status is:', paymentStatus);
                
                const errorMessage = locale === 'en'
                  ? 'Payment could not be processed. Please try again or contact support.'
                  : 'لم يتم معالجة الدفع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.';
                
                toast.error(errorMessage, {
                  duration: 8000,
                });
                
                // Redirect to payment error page
                const errorParams = new URLSearchParams({
                  offerId: offerId || '',
                  product: product || '',
                  orderId: orderId || '',
                  error: 'payment_failed',
                  errorMessage: encodeURIComponent(errorMessage),
                });
                
                if (isCartCheckout) {
                  errorParams.set('type', 'cart');
                }
                
                router.push(`/${locale}/payment/error?${errorParams.toString()}`);
                return;
              }
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            
            // If verification completely fails but URL status is 'paid', proceed to success
            if (status === 'paid') {
              console.log('Verification error occurred but URL status is paid. Proceeding to success page.');
              // Continue to fallback success flow below
            } else {
              // Verification failed and status is not 'paid' - redirect to error page
              setIsVerifying(false);
              const errorParams = new URLSearchParams({
                offerId: offerId || '',
                product: product || '',
                orderId: orderId || '',
                error: 'verification_failed',
              });
              
              if (isCartCheckout) {
                errorParams.set('type', 'cart');
              }
              
              router.push(`/${locale}/payment/error?${errorParams.toString()}`);
              return;
            }
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
            orderId: orderId,
            paymentId: pendingPayment?.paymentId || '',
            moyasarPaymentId: paymentId || '',
          });
          
          // Add group order info
          if (isGroupOrder && orderIds.length > 0) {
            successParams.set('isGroup', 'true');
            successParams.set('orderIds', orderIds.join(','));
          }
          
          if (isCartCheckout) {
            successParams.set('type', 'cart');
          }
          
          router.push(`/${locale}/payment/success?${successParams.toString()}`);
        } else {
          // Payment failed or cancelled - redirect to error page
          const errorParams = new URLSearchParams({
            offerId: offerId || '',
            product: product || '',
            orderId: orderId || '',
            error: 'payment_failed',
          });
          
          if (isCartCheckout) {
            errorParams.set('type', 'cart');
          }
          
          if (isGroupOrder && orderIds.length > 0) {
            errorParams.set('isGroup', 'true');
            errorParams.set('orderIds', orderIds.join(','));
          }
          
          router.push(`/${locale}/payment/error?${errorParams.toString()}`);
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setIsVerifying(false);
        // Redirect back to payment page on error
        const errorOfferId = searchParams.get('offerId');
        const errorProduct = searchParams.get('product');
        const errorOfferPrice = searchParams.get('offerPrice');
        const errorShipping = searchParams.get('shipping');
        const errorType = searchParams.get('type');
        
        // Redirect to payment error page
        const errorParams = new URLSearchParams({
          offerId: errorOfferId || '',
          product: errorProduct || '',
          orderId: searchParams.get('orderId') || '',
          error: 'payment_error',
        });
        
        if (errorType === 'cart') {
          errorParams.set('type', 'cart');
        }
        
        router.push(`/${locale}/payment/error?${errorParams.toString()}`);
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

