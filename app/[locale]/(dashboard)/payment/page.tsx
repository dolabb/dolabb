'use client';

import { apiClient } from '@/lib/api/client';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { HiShieldCheck } from 'react-icons/hi2';
import { toast } from '@/utils/toast';
import { useAppSelector } from '@/lib/store/hooks';
import { formatPrice } from '@/utils/formatPrice';
import Script from 'next/script';

declare global {
  interface Window {
    Moyasar: any;
  }
}

export default function PaymentPage() {
  const locale = useLocale();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isMoyasarLoaded, setIsMoyasarLoaded] = useState(false);
  const moyasarInitialized = useRef(false);

  // Get offer data from URL params
  const offerId = searchParams.get('offerId');
  const product = searchParams.get('product');
  const size = searchParams.get('size');
  const price = searchParams.get('price');
  const offerPrice = searchParams.get('offerPrice');
  const shipping = searchParams.get('shipping');
  const orderIdFromUrl = searchParams.get('orderId');

  // Moyasar publishable key
  const publishableKey = 'pk_live_UUEN6v2pZSdxNdmEbMyyGcLw1fvd79CxJbb16BuG';

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
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchOrderSummary();
  }, [offerId]);

  // Handle error messages from callback
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'payment_pending') {
      toast.warning(
        locale === 'en'
          ? 'Payment is still processing. Please wait a moment and check your payment status.'
          : 'الدفع لا يزال قيد المعالجة. يرجى الانتظار قليلاً والتحقق من حالة الدفع.',
        { duration: 5000 }
      );
    } else if (error === 'payment_failed') {
      const errorMessage = searchParams.get('errorMessage');
      const decodedMessage = errorMessage ? decodeURIComponent(errorMessage) : null;
      
      toast.error(
        decodedMessage || 
        (locale === 'en'
          ? 'Payment verification failed. Please check your card details and try again.'
          : 'فشل التحقق من الدفع. يرجى التحقق من تفاصيل البطاقة والمحاولة مرة أخرى.'),
        { duration: 8000 }
      );
    }
  }, [searchParams, locale]);

  // Initialize Moyasar payment form
  useEffect(() => {
    if (!isMoyasarLoaded || moyasarInitialized.current || !orderSummary) return;
    if (typeof window === 'undefined' || !window.Moyasar) return;

    // Calculate amounts
    const displayOfferPrice = orderSummary?.offerPrice || parseFloat(offerPrice || '0');
    const displayShipping = orderSummary?.shippingPrice || parseFloat(shipping || '0');
    const displayPlatformFee = orderSummary?.platformFee || 0;
    const taxPercentage = orderSummary?.productTaxPercentage || (orderSummary?.platformTax?.percentage) || 0;
    const subtotal = displayOfferPrice + displayShipping + displayPlatformFee;
    const tax = taxPercentage > 0 ? subtotal * (taxPercentage / 100) : 0;
    const totalAmount = Math.round((subtotal + tax) * 100); // Convert to halalas

    // Get orderId
    const orderId = orderIdFromUrl || 
      (typeof window !== 'undefined' ? sessionStorage.getItem('orderId') : null) ||
      `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build callback URL
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = `${origin}/${locale}/payment/callback?offerId=${offerId || ''}&product=${encodeURIComponent(product || '')}&offerPrice=${offerPrice || ''}&shipping=${shipping || ''}`;

    try {
      window.Moyasar.init({
        element: '.moyasar-form',
        amount: totalAmount,
        currency: 'SAR',
        description: `${product} - ${locale === 'en' ? 'Order Payment' : 'دفع الطلب'}`,
        publishable_api_key: publishableKey,
        callback_url: callbackUrl,
        methods: ['creditcard', 'applepay', 'stcpay'],
        apple_pay: {
          country: 'SA',
          label: 'Dolabb',
          validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
        },
        metadata: {
          orderId: orderId,
          offerId: offerId || '',
          product: product || '',
          size: size || '',
          price: price || '',
          offerPrice: offerPrice || '',
          shipping: shipping || '',
          locale: locale,
        },
        on_completed: function(payment: any) {
          console.log('Payment completed:', payment);
          // Store payment info in sessionStorage for callback
          const paymentData = {
            orderId: orderId,
            paymentId: payment?.id,
            offerId: offerId || '',
            product: product || '',
            size: size || '',
            price: price || '0',
            offerPrice: offerPrice || '0',
            shipping: shipping || '0',
            totalPrice: (totalAmount / 100).toFixed(2),
          };
          sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));
        },
        on_failure: function(error: any) {
          console.error('Payment failed:', error);
          toast.error(
            locale === 'en'
              ? 'Payment failed. Please try again.'
              : 'فشل الدفع. يرجى المحاولة مرة أخرى.',
            { duration: 5000 }
          );
        },
      });
      moyasarInitialized.current = true;
    } catch (error) {
      console.error('Error initializing Moyasar:', error);
    }
  }, [isMoyasarLoaded, orderSummary, offerId, product, size, price, offerPrice, shipping, locale, orderIdFromUrl, publishableKey]);

  // Normalize image URL
  const normalizeImageUrl = (url: string | undefined | null): string => {
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
      return '';
    }
    const trimmed = url.trim().replace(/\s+/g, '');
    let normalized = trimmed.startsWith('http://')
      ? trimmed.replace('http://', 'https://')
      : trimmed;

    if (normalized.startsWith('/') && !normalized.startsWith('//')) {
      normalized = `https://dolabb-backend-2vsj.onrender.com${normalized}`;
    }

    if (normalized.includes('cdn.dolabb.com')) {
      try {
        const urlObj = new URL(normalized);
        const path = urlObj.pathname + urlObj.search;
        return `/api/cdn${path}`;
      } catch {
        const path = normalized.replace('https://cdn.dolabb.com', '').replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return normalized;
  };

  if (!isAuthenticated || !offerId || !product || !offerPrice) {
    return null;
  }

  // Use order summary data if available, otherwise fall back to URL params
  const displayProduct = orderSummary?.productTitle || product;
  const displayOriginalPrice = orderSummary?.originalPrice || parseFloat(price || '0');
  const displayOfferPrice = orderSummary?.offerPrice || parseFloat(offerPrice || '0');
  const displayShipping = orderSummary?.shippingPrice || parseFloat(shipping || '0');
  const displayPlatformFee = orderSummary?.platformFee || 0;
  const taxPercentage = orderSummary?.productTaxPercentage || (orderSummary?.platformTax?.percentage) || 0;
  const subtotal = displayOfferPrice + displayShipping + displayPlatformFee;
  const tax = taxPercentage > 0 ? subtotal * (taxPercentage / 100) : 0;
  const totalPrice = (subtotal + tax).toFixed(2);
  const orderCurrency = orderSummary?.currency || orderSummary?.productCurrency || 'SAR';
  const normalizedProductImage = orderSummary?.productImage 
    ? normalizeImageUrl(orderSummary.productImage) 
    : '';

  return (
    <>
      {/* Moyasar Scripts */}
      <Script
        src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
        onLoad={() => setIsMoyasarLoaded(true)}
      />
      <link
        rel="stylesheet"
        href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
      />

      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
          <h1 className='text-3xl font-bold text-deep-charcoal mb-8'>
            {locale === 'en' ? 'Payment' : 'الدفع'}
          </h1>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Payment Form - Moyasar Widget */}
            <div className='lg:col-span-2'>
              <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
                <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                  {locale === 'en' ? 'Payment Details' : 'تفاصيل الدفع'}
                </h2>

                {/* Security Badge */}
                <div className='flex items-center gap-2 mb-6 p-3 bg-saudi-green/5 rounded-lg border border-saudi-green/20'>
                  <HiShieldCheck className='w-5 h-5 text-saudi-green' />
                  <span className='text-sm text-deep-charcoal/70'>
                    {locale === 'en' 
                      ? 'Secure payment powered by Moyasar. Your card details are encrypted.'
                      : 'دفع آمن مدعوم من ميسر. تفاصيل بطاقتك مشفرة.'}
                  </span>
                </div>

                {/* Moyasar Payment Form Container */}
                {isLoadingSummary ? (
                  <div className='text-center py-12'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4'></div>
                    <p className='text-deep-charcoal/60'>
                      {locale === 'en' ? 'Loading payment form...' : 'جاري تحميل نموذج الدفع...'}
                    </p>
                  </div>
                ) : (
                  <div className='moyasar-form' style={{ minHeight: '300px' }}>
                    {!isMoyasarLoaded && (
                      <div className='text-center py-12'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4'></div>
                        <p className='text-deep-charcoal/60'>
                          {locale === 'en' ? 'Loading payment methods...' : 'جاري تحميل طرق الدفع...'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Methods Info */}
                <div className='mt-6 pt-4 border-t border-rich-sand/30'>
                  <p className='text-xs text-deep-charcoal/50 text-center'>
                    {locale === 'en' 
                      ? 'We accept Visa, Mastercard, mada, Apple Pay, and STC Pay'
                      : 'نقبل فيزا، ماستركارد، مدى، آبل باي، وSTC Pay'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className='lg:col-span-1'>
              <div className='bg-white rounded-lg border border-rich-sand/30 p-6 sticky top-20'>
                <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                  {locale === 'en' ? 'Order Summary' : 'ملخص الطلب'}
                </h2>

                {isLoadingSummary ? (
                  <div className='text-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-saudi-green mx-auto'></div>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {/* Product Info */}
                    <div>
                      {normalizedProductImage && (
                        <img
                          src={normalizedProductImage}
                          alt={displayProduct}
                          className='w-full h-32 object-cover rounded-lg mb-3'
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <p className='font-semibold text-deep-charcoal'>{displayProduct}</p>
                      {size && (
                        <p className='text-sm text-deep-charcoal/60'>
                          {locale === 'en' ? 'Size' : 'المقاس'}: {size}
                        </p>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className='border-t border-rich-sand/30 pt-4 space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Original Price' : 'السعر الأصلي'}
                        </span>
                        <span className='text-deep-charcoal line-through'>
                          {formatPrice(displayOriginalPrice, locale, 2, orderCurrency)}
                        </span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Offer Price' : 'سعر العرض'}
                        </span>
                        <span className='font-semibold text-saudi-green'>
                          {formatPrice(displayOfferPrice, locale, 2, orderCurrency)}
                        </span>
                      </div>
                      <div className='flex justify-between text-sm'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Shipping' : 'الشحن'}
                        </span>
                        <span className='text-deep-charcoal'>
                          +{formatPrice(displayShipping, locale, 2, orderCurrency)}
                        </span>
                      </div>
                      {displayPlatformFee > 0 && (
                        <div className='flex justify-between text-sm'>
                          <span className='text-deep-charcoal/70'>
                            {locale === 'en' ? 'Platform Fee' : 'رسوم المنصة'}
                          </span>
                          <span className='text-deep-charcoal'>
                            +{formatPrice(displayPlatformFee, locale, 2, orderCurrency)}
                          </span>
                        </div>
                      )}
                      {tax > 0 && (
                        <div className='flex justify-between text-sm'>
                          <span className='text-deep-charcoal/70'>
                            {orderSummary?.platformTax?.label || 
                             (locale === 'en' ? `Tax (${taxPercentage}%)` : `الضريبة (${taxPercentage}%)`)}
                          </span>
                          <span className='text-deep-charcoal'>
                            +{formatPrice(tax, locale, 2, orderCurrency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className='border-t border-rich-sand/30 pt-4'>
                      <div className='flex justify-between items-center'>
                        <span className='text-lg font-semibold text-deep-charcoal'>
                          {locale === 'en' ? 'Total' : 'الإجمالي'}
                        </span>
                        <span className='text-xl font-bold text-saudi-green'>
                          {formatPrice(parseFloat(totalPrice), locale, 2, orderCurrency)}
                        </span>
                      </div>
                    </div>

                    {/* Amount to Pay Highlight */}
                    <div className='bg-saudi-green/10 rounded-lg p-4 mt-4'>
                      <p className='text-sm text-deep-charcoal/70 mb-1'>
                        {locale === 'en' ? 'Amount to Pay' : 'المبلغ المطلوب'}
                      </p>
                      <p className='text-2xl font-bold text-saudi-green'>
                        {formatPrice(parseFloat(totalPrice), locale, 2, orderCurrency)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
