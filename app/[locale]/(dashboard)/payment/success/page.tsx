'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi2';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image';

interface PaymentSuccessResponse {
  success: boolean;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
  };
  product?: {
    id: string;
    title: string;
    image: string;
    price: number;
    originalPrice: number;
  };
  payment?: {
    status: string;
    paidAmount: number;
    currency: string;
    moyasarPaymentId: string;
  };
  error?: {
    hasError: boolean;
    message?: string;
    code?: string;
    details?: any;
  };
}

export default function PaymentSuccessPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';

  const [paymentData, setPaymentData] = useState<PaymentSuccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get parameters from URL or storage
  const orderId = searchParams.get('orderId') || searchParams.get('order_id') || 
                  (typeof window !== 'undefined' ? sessionStorage.getItem('orderId') : null);
  const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id') || 
                    (typeof window !== 'undefined' ? localStorage.getItem('lastPaymentId') : null);
  const moyasarPaymentId = searchParams.get('moyasarPaymentId') || searchParams.get('moyasar_payment_id') || 
                            searchParams.get('id') || // From callback
                            (typeof window !== 'undefined' ? localStorage.getItem('lastMoyasarPaymentId') : null);
  
  // Group order parameters
  const isGroupOrder = searchParams.get('isGroup') === 'true';
  const orderIdsParam = searchParams.get('orderIds');
  const paidOrderIdsParam = searchParams.get('paidOrderIds');
  const checkoutType = searchParams.get('type');
  const isCartCheckout = checkoutType === 'cart';
  
  // Parse order IDs arrays
  const orderIds = orderIdsParam ? orderIdsParam.split(',') : [];
  const paidOrderIds = paidOrderIdsParam ? paidOrderIdsParam.split(',') : [];

  // Call payment success API
  useEffect(() => {
    const fetchPaymentSuccess = async () => {
      if (!orderId && !paymentId && !moyasarPaymentId) {
        setError(locale === 'en' 
          ? 'Missing payment information' 
          : 'معلومات الدفع مفقودة');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Prepare request body
        const requestBody: any = {};
        if (orderId) requestBody.orderId = orderId;
        if (paymentId) requestBody.paymentId = paymentId;
        if (moyasarPaymentId) requestBody.moyasarPaymentId = moyasarPaymentId;
        
        // Add group order info
        if (isGroupOrder && orderIds.length > 0) {
          requestBody.isGroup = true;
          requestBody.orderIds = orderIds;
        }
        if (paidOrderIds.length > 0) {
          requestBody.paidOrderIds = paidOrderIds;
        }
        if (isCartCheckout) {
          requestBody.type = 'cart';
        }

        // Try POST first, fallback to GET with query params
        let response;
        try {
          response = await apiClient.post('/api/payments/success/', requestBody);
        } catch (postError: any) {
          // If POST fails, try GET with query params
          const params = new URLSearchParams();
          if (orderId) params.append('orderId', orderId);
          if (paymentId) params.append('paymentId', paymentId);
          if (moyasarPaymentId) params.append('moyasarPaymentId', moyasarPaymentId);
          
          response = await apiClient.get(`/api/payments/success/?${params.toString()}`);
        }

        if (response.data.success) {
          setPaymentData(response.data);
        } else {
          setError(response.data.error?.message || 
                  (locale === 'en' ? 'Failed to fetch payment details' : 'فشل جلب تفاصيل الدفع'));
        }
      } catch (error: any) {
        console.error('Error fetching payment success:', error);
        setError(error.response?.data?.error?.message || 
                error.message || 
                (locale === 'en' ? 'Failed to fetch payment details' : 'فشل جلب تفاصيل الدفع'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentSuccess();
  }, [orderId, paymentId, moyasarPaymentId, locale, isGroupOrder, orderIds, paidOrderIds, isCartCheckout]);

  // Determine if payment was successful
  const isPaymentSuccessful = paymentData?.payment?.status === 'completed' || 
                               paymentData?.payment?.status === 'paid';
  const hasError = paymentData?.error?.hasError || false;

  if (isLoading) {
    return (
      <div className='bg-off-white min-h-screen py-8 flex items-center justify-center' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4'></div>
          <p className='text-deep-charcoal/70'>
            {locale === 'en' ? 'Loading payment details...' : 'جاري تحميل تفاصيل الدفع...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <div className='flex justify-center mb-6'>
              <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'>
                <HiXCircle className='w-12 h-12 text-red-600' />
              </div>
            </div>
            <h1 className='text-3xl font-bold text-deep-charcoal mb-4'>
              {locale === 'en' ? 'Error' : 'خطأ'}
            </h1>
            <p className='text-lg text-deep-charcoal/70 mb-8'>
              {error || (locale === 'en' ? 'Failed to load payment details' : 'فشل تحميل تفاصيل الدفع')}
            </p>
            <Link
              href={`/${locale}`}
              className='inline-block px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg'
            >
              {locale === 'en' ? 'Go Home' : 'العودة للرئيسية'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
          {/* Status Icon */}
          <div className='flex justify-center mb-6'>
            {isPaymentSuccessful && !hasError ? (
              <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center'>
                <HiCheckCircle className='w-12 h-12 text-green-600' />
              </div>
            ) : (
              <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center'>
                <HiXCircle className='w-12 h-12 text-red-600' />
              </div>
            )}
          </div>

          {/* Status Message */}
          <h1 className='text-3xl font-bold text-deep-charcoal mb-4'>
            {isPaymentSuccessful && !hasError
              ? (locale === 'en' ? 'Payment Successful!' : 'تم الدفع بنجاح!')
              : (locale === 'en' ? 'Payment Failed' : 'فشل الدفع')}
          </h1>
          <p className='text-lg text-deep-charcoal/70 mb-8'>
            {isPaymentSuccessful && !hasError
              ? (locale === 'en'
                  ? 'Thank you for your purchase. Your order has been confirmed.'
                  : 'شكراً لك على الشراء. تم تأكيد طلبك.')
              : (paymentData.error?.message ||
                 (locale === 'en'
                   ? 'Your payment could not be processed. Please try again.'
                   : 'لم يتم معالجة الدفع. يرجى المحاولة مرة أخرى.'))}
          </p>

          {/* Group Order Info */}
          {isGroupOrder && orderIds.length > 1 && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left'>
              <p className='text-sm text-blue-800'>
                <span className='font-medium'>
                  {locale === 'en' 
                    ? `This payment covers ${orderIds.length} orders from different sellers.` 
                    : `يغطي هذا الدفع ${orderIds.length} طلبات من بائعين مختلفين.`}
                </span>
              </p>
            </div>
          )}

          {/* Order Details */}
          {paymentData.order && (
            <div className='bg-rich-sand/10 rounded-lg p-6 mb-6 text-left'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Order Details' : 'تفاصيل الطلب'}
              </h2>
              <div className='space-y-2 text-sm text-deep-charcoal/70'>
                {paymentData.order.orderNumber && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Order Number:' : 'رقم الطلب:'}
                    </span>{' '}
                    {paymentData.order.orderNumber}
                  </p>
                )}
                {paymentData.order.status && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Order Status:' : 'حالة الطلب:'}
                    </span>{' '}
                    <span className='capitalize'>{paymentData.order.status}</span>
                  </p>
                )}
                {paymentData.order.paymentStatus && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Payment Status:' : 'حالة الدفع:'}
                    </span>{' '}
                    <span className='capitalize'>{paymentData.order.paymentStatus}</span>
                  </p>
                )}
                {isGroupOrder && orderIds.length > 1 && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Related Orders:' : 'الطلبات المرتبطة:'}
                    </span>{' '}
                    {orderIds.length} {locale === 'en' ? 'orders' : 'طلبات'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Product Details */}
          {paymentData.product && (
            <div className='bg-rich-sand/10 rounded-lg p-6 mb-6 text-left'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Product Details' : 'تفاصيل المنتج'}
              </h2>
              <div className='flex gap-4 items-start'>
                {paymentData.product.image && (
                  <div className='relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden'>
                    <Image
                      src={paymentData.product.image}
                      alt={paymentData.product.title}
                      fill
                      className='object-cover'
                    />
                  </div>
                )}
                <div className='flex-1 space-y-2 text-sm text-deep-charcoal/70'>
                  <p className='font-semibold text-deep-charcoal text-base'>
                    {paymentData.product.title}
                  </p>
                  {paymentData.product.originalPrice && (
                    <p>
                      <span className='font-medium'>
                        {locale === 'en' ? 'Original Price:' : 'السعر الأصلي:'}
                      </span>{' '}
                      <span className='line-through'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {paymentData.product.originalPrice.toFixed(2)}
                      </span>
                    </p>
                  )}
                  {paymentData.product.price && (
                    <p>
                      <span className='font-medium'>
                        {locale === 'en' ? 'Price:' : 'السعر:'}
                      </span>{' '}
                      <span className='text-saudi-green font-bold'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {paymentData.product.price.toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          {paymentData.payment && (
            <div className='bg-rich-sand/10 rounded-lg p-6 mb-8 text-left'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Payment Details' : 'تفاصيل الدفع'}
              </h2>
              <div className='space-y-2 text-sm text-deep-charcoal/70'>
                {paymentData.payment.status && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Status:' : 'الحالة:'}
                    </span>{' '}
                    <span className='capitalize'>{paymentData.payment.status}</span>
                  </p>
                )}
                {paymentData.payment.paidAmount !== undefined && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Amount Paid:' : 'المبلغ المدفوع:'}
                    </span>{' '}
                    <span className='text-saudi-green font-bold'>
                      {paymentData.payment.currency || 'SAR'} {paymentData.payment.paidAmount.toFixed(2)}
                    </span>
                  </p>
                )}
                {paymentData.payment.moyasarPaymentId && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Payment ID:' : 'رقم الدفع:'}
                    </span>{' '}
                    <span className='font-mono text-xs'>{paymentData.payment.moyasarPaymentId}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Details */}
          {hasError && paymentData.error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-left'>
              <h2 className='text-xl font-semibold text-red-800 mb-4'>
                {locale === 'en' ? 'Error Details' : 'تفاصيل الخطأ'}
              </h2>
              <div className='space-y-2 text-sm text-red-700'>
                {paymentData.error.message && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Message:' : 'الرسالة:'}
                    </span>{' '}
                    {paymentData.error.message}
                  </p>
                )}
                {paymentData.error.code && (
                  <p>
                    <span className='font-medium'>
                      {locale === 'en' ? 'Error Code:' : 'رمز الخطأ:'}
                    </span>{' '}
                    {paymentData.error.code}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href={`/${locale}`}
              className='px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer text-center'
            >
              {locale === 'en' ? 'Continue Shopping' : 'متابعة التسوق'}
            </Link>
            {hasError && (
              <Link
                href={`/${locale}/payment?orderId=${orderId || ''}`}
                className='px-6 py-3 bg-deep-charcoal text-white rounded-lg font-semibold hover:bg-deep-charcoal/90 transition-colors shadow-md hover:shadow-lg cursor-pointer text-center'
              >
                {locale === 'en' ? 'Try Again' : 'حاول مرة أخرى'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

