'use client';

import { apiClient } from '@/lib/api/client';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HiCreditCard, HiLockClosed, HiShieldCheck } from 'react-icons/hi2';
import { toast } from '@/utils/toast';
import ThreeDSAuthenticationModal from '@/components/payment/ThreeDSAuthenticationModal';
import { useAppSelector } from '@/lib/store/hooks';

export default function PaymentPage() {
  const locale = useLocale();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [show3DSModal, setShow3DSModal] = useState(false);
  const [transactionUrl, setTransactionUrl] = useState<string>('');
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Get offer data from URL params
  const offerId = searchParams.get('offerId');
  const product = searchParams.get('product');
  const size = searchParams.get('size');
  const price = searchParams.get('price');
  const offerPrice = searchParams.get('offerPrice');
  const shipping = searchParams.get('shipping');
  const orderIdFromUrl = searchParams.get('orderId');

  // Moyasar keys
  // IMPORTANT: Use test keys for testing, live keys for production
  // For testing, use: pk_test_... with sk_test_...
  // For production, use: pk_live_... with sk_live_...
  // Currently using test secret key, so we need test publishable key
  // TODO: Replace with your test publishable key (pk_test_...)
  const publishableKey = 'pk_live_UUEN6v2pZSdxNdmEbMyyGcLw1fvd79CxJbb16BuG'; // Test key
  // Note: Secret key (sk_test_uCbs4YG4Ss71psXWdK3J8z8uZg1ABqSCtbPtCeS7) should ONLY be used on the backend
  // Never expose the secret key in frontend code!

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    month: '',
    year: '',
    cvc: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format card number (add spaces every 4 digits)
    if (name === 'number') {
      const formatted = value
        .replace(/\s/g, '')
        .replace(/(.{4})/g, '$1 ')
        .trim();
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Format month and year (only numbers, limit length)
    else if (name === 'month') {
      const formatted = value.replace(/\D/g, '').slice(0, 2);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'year') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    }
    // Format CVC (only numbers, limit to 3-4 digits)
    else if (name === 'cvc') {
      const formatted = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate Name - must be at least two words
    if (!formData.name.trim()) {
      newErrors.name =
        locale === 'en'
          ? 'Cardholder name is required'
          : 'اسم حامل البطاقة مطلوب';
    } else {
      const nameWords = formData.name
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);
      if (nameWords.length < 2) {
        newErrors.name =
          locale === 'en'
            ? 'Use any name made of at least two words'
            : 'استخدم أي اسم يتكون من كلمتين على الأقل';
      }
    }

    // Validate Card Number
    if (!formData.number.trim()) {
      newErrors.number =
        locale === 'en' ? 'Card number is required' : 'رقم البطاقة مطلوب';
    } else if (formData.number.replace(/\s/g, '').length < 13) {
      newErrors.number =
        locale === 'en'
          ? 'Please enter a valid card number'
          : 'يرجى إدخال رقم بطاقة صحيح';
    }

    // Validate Year - must be a future year
    if (!formData.year) {
      newErrors.year =
        locale === 'en' ? 'Expiry year is required' : 'سنة الانتهاء مطلوبة';
    } else if (formData.year.length < 4) {
      newErrors.year =
        locale === 'en'
          ? 'Please enter a valid year (YYYY)'
          : 'يرجى إدخال سنة صحيحة (YYYY)';
    } else {
      const currentYear = new Date().getFullYear();
      const expiryYear = parseInt(formData.year);
      if (isNaN(expiryYear) || expiryYear < currentYear) {
        newErrors.year =
          locale === 'en' ? 'Any future year' : 'أي سنة مستقبلية';
      }
    }

    // Validate Month - must be a future month relative to the expiry year
    if (!formData.month) {
      newErrors.month =
        locale === 'en' ? 'Expiry month is required' : 'شهر الانتهاء مطلوب';
    } else {
      const month = parseInt(formData.month);
      if (isNaN(month) || month < 1 || month > 12) {
        newErrors.month =
          locale === 'en'
            ? 'Please enter a valid month (01-12)'
            : 'يرجى إدخال شهر صحيح (01-12)';
      } else if (formData.year && formData.year.length === 4) {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
        const expiryYear = parseInt(formData.year);
        const expiryMonth = month;

        // Check if the expiry date is in the past
        if (
          expiryYear < currentYear ||
          (expiryYear === currentYear && expiryMonth < currentMonth)
        ) {
          newErrors.month =
            locale === 'en'
              ? 'Any future month relative the expiry year'
              : 'أي شهر مستقبلي بالنسبة لسنة الانتهاء';
        }
      }
    }

    // Validate CVC - 3 digits (or 4 for Amex)
    if (!formData.cvc) {
      newErrors.cvc = locale === 'en' ? 'CVC is required' : 'رمز CVC مطلوب';
    } else {
      const cvcLength = formData.cvc.length;
      const isNumeric = /^\d+$/.test(formData.cvc);

      if (!isNumeric) {
        newErrors.cvc =
          locale === 'en'
            ? 'CVC must contain only numbers'
            : 'يجب أن يحتوي رمز CVC على أرقام فقط';
      } else {
        // Check if it's Amex (starts with 34 or 37) - needs 4 digits
        const cardNumber = formData.number.replace(/\s/g, '');
        const isAmex =
          cardNumber.startsWith('34') || cardNumber.startsWith('37');

        if (isAmex) {
          if (cvcLength !== 4) {
            newErrors.cvc =
              locale === 'en'
                ? 'Four digits for Amex'
                : 'أربعة أرقام لبطاقة Amex';
          }
        } else {
          if (cvcLength !== 3) {
            newErrors.cvc =
              locale === 'en'
                ? 'Any Three digits code'
                : 'أي رمز مكون من ثلاثة أرقام';
          }
        }
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Skip token creation and create payment directly with card details
      // This avoids the callback_url requirement and token validation issues
      console.log('Creating payment directly with card details');

      // Use real orderId from checkout (stored in sessionStorage or URL)
      const orderId =
        orderIdFromUrl ||
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('orderId')
          : null) ||
        `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (!orderIdFromUrl && !sessionStorage.getItem('orderId')) {
        console.warn(
          'No orderId found from checkout. Using temporary orderId.'
        );
      }

      // Process payment directly using card details
      const paymentResponse = await fetch('/api/payment/process/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          cardDetails: {
            name: formData.name.trim(),
            number: formData.number.replace(/\s/g, ''),
            month: formData.month.padStart(2, '0'),
            year: formData.year,
            cvc: formData.cvc,
          },
          amount: Math.round(parseFloat(totalPrice) * 100), // Convert to halalas
          description: `${product} - ${
            locale === 'en' ? 'Offer Accepted' : 'عرض مقبول'
          }`,
          metadata: {
            locale: locale,
            product: product || 'Product Name',
            offerId: offerId || '',
            offerPrice: offerPrice || '',
            shipping: shipping || '',
            size: size || '',
            price: price || '',
            origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
        }),
      });

      // Log complete response
      const responseText = await paymentResponse.text();
      let paymentResult;
      try {
        paymentResult = JSON.parse(responseText);
      } catch (e) {
        paymentResult = { rawResponse: responseText };
      }

      console.log('Complete Payment API Response:', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText,
        headers: Object.fromEntries(paymentResponse.headers.entries()),
        body: paymentResult,
      });

      if (!paymentResponse.ok) {
        console.error('Payment API Error:', paymentResult);

        // Extract error details from API response
        const errorDetails = paymentResult.details || {};
        const errorMessage = paymentResult.error || errorDetails.message || errorDetails.type;
        const validationErrors = errorDetails.errors || {};

        // Build detailed error message
        let errorMessages: string[] = [];

        // Add main error message with specific handling for common errors
        if (errorMessage) {
          if (errorMessage === 'You cannot purchase your own product') {
            errorMessages.push(
              locale === 'en'
                ? 'You cannot purchase your own product'
                : 'لا يمكنك شراء منتجك الخاص'
            );
          } else if (errorMessage === 'Invalid offer' || errorMessage === 'Invalid Offer') {
            errorMessages.push(
              locale === 'en'
                ? 'Invalid offer. The offer may have expired or is no longer available. Please go back to messages and try again.'
                : 'عرض غير صالح. قد يكون العرض قد انتهى أو لم يعد متاحًا. يرجى العودة إلى الرسائل والمحاولة مرة أخرى.'
            );
          } else {
            errorMessages.push(errorMessage);
          }
        }

        // Add validation errors if they exist
        if (Object.keys(validationErrors).length > 0) {
          const validationMessages = Object.entries(validationErrors)
            .map(([field, messages]: [string, any]) => {
              const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
              const messagesArray = Array.isArray(messages) ? messages : [messages];
              return `${fieldLabel}: ${messagesArray.join(', ')}`;
            })
            .join('; ');
          
          if (validationMessages) {
            errorMessages.push(validationMessages);
          }
        }

        // If no specific error message, use generic one
        if (errorMessages.length === 0) {
          errorMessages.push(
            locale === 'en'
              ? 'Payment processing failed. Please check your details and try again.'
              : 'فشل معالجة الدفع. يرجى التحقق من التفاصيل والمحاولة مرة أخرى.'
          );
        }

        // Show error in toast
        const finalErrorMessage = errorMessages.join('\n');
        toast.error(finalErrorMessage, {
          duration: 5000,
        });

        throw new Error(finalErrorMessage);
      }

      console.log('Payment processed successfully:', paymentResult);

      // Extract payment data
      const payment = paymentResult.payment;
      const paymentStatus = payment?.status;
      const transactionUrl = payment?.source?.transaction_url;

      // Check if payment requires 3DS authentication
      if (paymentStatus === 'initiated' && transactionUrl) {
        console.log(
          'Payment requires 3DS authentication, opening modal with transaction URL'
        );

        // Store payment info in sessionStorage for callback to retrieve
        const tempPaymentData = {
          orderId: orderId,
          paymentId: payment?.id,
          offerId: offerId || '',
          product: product || '',
          size: size || '',
          price: price || '0',
          offerPrice: offerPrice || '0',
          shipping: shipping || '0',
          totalPrice: totalPrice,
        };

        sessionStorage.setItem(
          'pendingPayment',
          JSON.stringify(tempPaymentData)
        );
        setIsProcessing(false);

        // Open 3DS authentication modal instead of redirecting
        setTransactionUrl(transactionUrl);
        setShow3DSModal(true);
        return; // Don't continue with success flow
      }

      // If payment is already paid (no 3DS required), proceed with success flow
      if (paymentStatus === 'paid') {
        // Get affiliate code from product/item data
        // In production, this would come from the database
        // For now, we'll try to get it from stored items or metadata
        let affiliateCode = '';
        try {
          // Check if there's stored item data with affiliate code
          const storedItems = JSON.parse(
            localStorage.getItem('listedItems') || '[]'
          );
          const item = storedItems.find((item: any) => item.title === product);
          affiliateCode = item?.affiliateCode || '';
        } catch (e) {
          console.error('Error getting affiliate code:', e);
        }

        // Save payment to localStorage for dashboard
        const paymentData = {
          id: `PAY-${Date.now()}`,
          offerId: offerId || '',
          product: product || '',
          size: size || '',
          price: price || '0',
          offerPrice: offerPrice || '0',
          shipping: shipping || '0',
          totalPrice: totalPrice,
          affiliateCode: affiliateCode, // Include affiliate code in payment data
          status: 'ready', // Set to 'ready' so it appears in dashboard as ready to ship
          orderDate: new Date().toISOString().split('T')[0],
          paymentId: payment?.id || '',
          tokenData: {
            id: payment?.source?.token || '',
            brand: payment?.source?.brand || 'card',
            lastFour: payment?.source?.number?.slice(-4) || '',
            name: formData.name.trim(),
            month: formData.month.padStart(2, '0'),
            year: formData.year,
            country: payment?.source?.company || 'SA',
            funding: payment?.source?.funding || 'debit',
            status: payment?.status || 'paid',
          },
          paymentMethod: payment?.source?.brand || 'card',
          paymentStatus: payment?.status || 'paid',
        };

        // Get existing payments from localStorage
        const existingPayments = JSON.parse(
          localStorage.getItem('payments') || '[]'
        );

        // Add new payment
        existingPayments.push(paymentData);

        // Save back to localStorage
        localStorage.setItem('payments', JSON.stringify(existingPayments));

        // Call payment webhook (Django backend)
        const paymentAmount =
          payment?.amount || Math.round(parseFloat(totalPrice) * 100);
        await callPaymentWebhook(
          payment?.id || '',
          'paid',
          paymentAmount,
          offerId || ''
        );

        // Redirect to success page with payment IDs
        const successParams = new URLSearchParams({
          offerId: offerId || '',
          product: product || '',
          offerPrice: offerPrice || '',
          shipping: shipping || '',
          orderId: orderId || '',
          paymentId: paymentData.id || '',
          moyasarPaymentId: payment?.id || '',
        });
        router.push(`/${locale}/payment/success?${successParams.toString()}`);
      } else {
        // Payment status is neither 'paid' nor 'initiated' - unexpected state
        console.warn('Unexpected payment status:', paymentStatus);
        setIsProcessing(false);
        toast.error(
          locale === 'en'
            ? 'Payment status is unclear. Please check your payment or contact support.'
            : 'حالة الدفع غير واضحة. يرجى التحقق من الدفع أو الاتصال بالدعم.',
          {
            duration: 5000,
          }
        );
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      
      // Show error in toast if not already shown
      const errorMessage =
        error.message ||
        (locale === 'en'
          ? 'Payment processing failed. Please check your card details and try again.'
          : 'فشل معالجة الدفع. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى.');
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  };

  const callPaymentWebhook = async (
    paymentId: string,
    status: string,
    amount: number,
    offerId: string
  ) => {
    // Backend behavior:
    // - On payment completion: Adds earnings to affiliate's total_earnings and pending_earnings
    // - Creates/updates transaction with status 'pending'
    // - Transaction status changes to 'paid' only after review + shipment proof
    // Prevent duplicate webhook calls to avoid double-counting affiliate earnings
    const webhookKey = `webhook_called_${paymentId}`;
    const webhookAlreadyCalled = typeof window !== 'undefined' 
      ? sessionStorage.getItem(webhookKey) 
      : null;
    
    if (webhookAlreadyCalled) {
      console.log('Webhook already called for this payment ID, skipping to prevent duplicate earnings');
      return { success: true, message: 'Webhook already processed' };
    }

    try {
      console.log('Calling Django backend payment webhook with:', {
        id: paymentId,
        status: status,
        amount: amount,
        offerId: offerId,
      });

      // Call Django backend webhook directly
      const webhookResponse = await apiClient.post('/api/payment/webhook/', {
        id: paymentId,
        status: status,
        amount: amount,
        offerId: offerId, // CRITICAL: Include offerId for backend to update offer status
      });

      console.log('Payment Webhook Response:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        headers: webhookResponse.headers,
        data: webhookResponse.data,
      });

      // Mark webhook as called to prevent duplicate calls
      if (typeof window !== 'undefined' && webhookResponse.data?.success) {
        sessionStorage.setItem(webhookKey, 'true');
        console.log('Webhook successful - affiliate earnings updated (status: pending)');
      }

      return webhookResponse.data;
    } catch (error: any) {
      console.error('Payment webhook error:', error);
      
      // Extract error details
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.error || errorResponse.message || error.message;
      const errorStatus = error.response?.status;
      
      // Log detailed error
      console.error('Webhook error details:', {
        message: error.message,
        response: errorResponse,
        status: errorStatus,
      });
      
      // Show warning toast but don't block payment success
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
      } else if (errorStatus) {
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
      
      // Don't fail the payment flow if webhook fails
      return { error: errorMessage || error.message };
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  useEffect(() => {
    // Redirect if no offer data
    if (!offerId || !product || !offerPrice) {
      router.push(`/${locale}/messages`);
    }
  }, [offerId, product, offerPrice, locale, router]);

  // Fetch order summary from API to get tax percentage and platform fee
  useEffect(() => {
    const fetchOrderSummary = async () => {
      if (!offerId) return;

      setIsLoadingSummary(true);
      try {
        const response = await apiClient.get(`/api/offers/${offerId}/order-summary/`);
        if (response.data.success && response.data.orderSummary) {
          setOrderSummary(response.data.orderSummary);
        }
      } catch (error: any) {
        console.error('Error fetching order summary:', error);
        // Don't show error toast, just use fallback data from URL params
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchOrderSummary();
  }, [offerId]);

  useEffect(() => {
    // Check for error parameters from callback
    const error = searchParams.get('error');
    if (error === 'payment_pending') {
      toast.warning(
        locale === 'en'
          ? 'Payment is still processing. Please wait a moment and check your payment status.'
          : 'الدفع لا يزال قيد المعالجة. يرجى الانتظار قليلاً والتحقق من حالة الدفع.',
        {
          duration: 5000,
        }
      );
    } else if (error === 'payment_failed') {
      alert(
        locale === 'en'
          ? 'Payment verification failed. Please try again or contact support.'
          : 'فشل التحقق من الدفع. يرجى المحاولة مرة أخرى أو الاتصال بالدعم.'
      );
    }
  }, [searchParams, locale]);

  if (!isAuthenticated || !offerId || !product || !offerPrice) {
    return null;
  }

  // Use order summary data if available, otherwise fall back to URL params
  const displayOfferPrice = orderSummary?.offerPrice || parseFloat(offerPrice || '0');
  const displayShipping = orderSummary?.shippingPrice || parseFloat(shipping || '0');
  const displayPlatformFee = orderSummary?.platformFee || 0;
  const taxPercentage = orderSummary?.productTaxPercentage || (orderSummary?.platformTax?.percentage) || 0;

  // Calculate subtotal (offer price + shipping + platform fee)
  const subtotal = displayOfferPrice + displayShipping + displayPlatformFee;
  
  // Calculate tax based on product's tax percentage (if set)
  const tax = taxPercentage > 0 ? subtotal * (taxPercentage / 100) : 0;
  
  // Calculate total including tax
  const totalPrice = (subtotal + tax).toFixed(2);

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-3xl font-bold text-deep-charcoal mb-8'>
          {locale === 'en' ? 'Payment' : 'الدفع'}
        </h1>
        <div className='max-w-2xl mx-auto'>
          {/* Payment Form */}
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
            <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
              {locale === 'en' ? 'Complete Payment' : 'إتمام الدفع'}
            </h2>

            {/* Moyasar Payment Form */}
            <form
              id='moyasar-token-form'
              acceptCharset='UTF-8'
              action='https://api.moyasar.com/v1/tokens'
              method='POST'
              onSubmit={handleSubmit}
              className='space-y-5'
            >
              <input
                type='hidden'
                name='publishable_api_key'
                value={publishableKey}
              />
              <input type='hidden' name='save_only' value='true' />

              {/* Cardholder Name */}
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-deep-charcoal mb-2'
                >
                  {locale === 'en' ? 'Cardholder Name' : 'اسم حامل البطاقة'}
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <HiCreditCard className='h-5 w-5 text-deep-charcoal/40' />
                  </div>
                  <input
                    type='text'
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={locale === 'en' ? 'John Doe' : 'محمد أحمد'}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      formErrors.name ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className='mt-1 text-sm text-coral-red'>
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Card Number */}
              <div>
                <label
                  htmlFor='number'
                  className='block text-sm font-medium text-deep-charcoal mb-2'
                >
                  {locale === 'en' ? 'Card Number' : 'رقم البطاقة'}
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <HiCreditCard className='h-5 w-5 text-deep-charcoal/40' />
                  </div>
                  <input
                    type='text'
                    id='number'
                    name='number'
                    value={formData.number}
                    onChange={handleChange}
                    placeholder='1234 5678 9012 3456'
                    maxLength={19}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      formErrors.number
                        ? 'border-coral-red'
                        : 'border-rich-sand'
                    }`}
                    dir='ltr'
                  />
                </div>
                {formErrors.number && (
                  <p className='mt-1 text-sm text-coral-red'>
                    {formErrors.number}
                  </p>
                )}
              </div>

              {/* Expiry Date and CVC */}
              <div className='grid grid-cols-2 gap-4'>
                {/* Expiry Month */}
                <div>
                  <label
                    htmlFor='month'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Month' : 'الشهر'}
                  </label>
                  <input
                    type='text'
                    id='month'
                    name='month'
                    value={formData.month}
                    onChange={handleChange}
                    placeholder='MM'
                    maxLength={2}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      formErrors.month ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                    dir='ltr'
                  />
                  {formErrors.month && (
                    <p className='mt-1 text-sm text-coral-red'>
                      {formErrors.month}
                    </p>
                  )}
                </div>

                {/* Expiry Year */}
                <div>
                  <label
                    htmlFor='year'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Year' : 'السنة'}
                  </label>
                  <input
                    type='text'
                    id='year'
                    name='year'
                    value={formData.year}
                    onChange={handleChange}
                    placeholder='YYYY'
                    maxLength={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      formErrors.year ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                    dir='ltr'
                  />
                  {formErrors.year && (
                    <p className='mt-1 text-sm text-coral-red'>
                      {formErrors.year}
                    </p>
                  )}
                </div>
              </div>

              {/* CVC */}
              <div>
                <label
                  htmlFor='cvc'
                  className='block text-sm font-medium text-deep-charcoal mb-2'
                >
                  {locale === 'en' ? 'CVC' : 'رمز CVC'}
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <HiLockClosed className='h-5 w-5 text-deep-charcoal/40' />
                  </div>
                  <input
                    type='text'
                    id='cvc'
                    name='cvc'
                    value={formData.cvc}
                    onChange={handleChange}
                    placeholder='123'
                    maxLength={4}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      formErrors.cvc ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                    dir='ltr'
                  />
                </div>
                {formErrors.cvc && (
                  <p className='mt-1 text-sm text-coral-red'>
                    {formErrors.cvc}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                id='moyasar-payment-button'
                type='submit'
                disabled={isProcessing}
                className='w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display cursor-pointer'
              >
                {isProcessing
                  ? locale === 'en'
                    ? 'Processing...'
                    : 'جاري المعالجة...'
                  : locale === 'en'
                  ? 'Complete Payment'
                  : 'إتمام الدفع'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3DS Authentication Modal */}
      <ThreeDSAuthenticationModal
        isOpen={show3DSModal}
        onClose={() => {
          setShow3DSModal(false);
          // Optionally redirect to callback to check payment status
          const pendingPayment = JSON.parse(
            sessionStorage.getItem('pendingPayment') || '{}'
          );
          if (pendingPayment.paymentId) {
            const callbackParams = new URLSearchParams({
              id: pendingPayment.paymentId,
              offerId: pendingPayment.offerId || '',
              product: pendingPayment.product || '',
              offerPrice: pendingPayment.offerPrice || '',
              shipping: pendingPayment.shipping || '',
            });
            router.push(`/${locale}/payment/callback?${callbackParams.toString()}`);
          }
        }}
        transactionUrl={transactionUrl}
        onSuccess={() => {
          setShow3DSModal(false);
          // Redirect to callback URL to verify payment
          const pendingPayment = JSON.parse(
            sessionStorage.getItem('pendingPayment') || '{}'
          );
          if (pendingPayment.paymentId) {
            const callbackParams = new URLSearchParams({
              id: pendingPayment.paymentId,
              offerId: pendingPayment.offerId || '',
              product: pendingPayment.product || '',
              offerPrice: pendingPayment.offerPrice || '',
              shipping: pendingPayment.shipping || '',
            });
            router.push(`/${locale}/payment/callback?${callbackParams.toString()}`);
          } else {
            // Fallback: construct callback URL from stored data
            const callbackParams = new URLSearchParams({
              offerId: offerId || '',
              product: product || '',
              offerPrice: offerPrice || '',
              shipping: shipping || '',
            });
            router.push(`/${locale}/payment/callback?${callbackParams.toString()}`);
          }
        }}
        onError={(error) => {
          console.error('3DS Authentication error:', error);
          toast.error(
            locale === 'en'
              ? 'Authentication failed. Please try again.'
              : 'فشلت المصادقة. يرجى المحاولة مرة أخرى.',
            { duration: 5000 }
          );
        }}
        amount={totalPrice}
        productName={product || ''}
      />
    </div>
  );
}
