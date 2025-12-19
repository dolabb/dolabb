'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import {
  useGetPaymentsQuery,
  useUpdateOrderStatusMutation,
  type Payment,
} from '@/lib/api/ordersApi';
import { useGetOfferDetailQuery } from '@/lib/api/offersApi';
import { toast } from '@/utils/toast';
import { apiClient } from '@/lib/api/client';
import {
  HiCheckCircle,
  HiXCircle,
  HiTruck,
  HiPhoto,
  HiXMark,
  HiArrowLeft,
} from 'react-icons/hi2';
import Image from 'next/image';

export default function OrderStatusPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAppSelector(state => state.auth.user);
  const isRTL = locale === 'ar';

  const offerId = searchParams.get('offerId');
  const orderId = searchParams.get('orderId'); // Support orderId for direct purchases
  const product = searchParams.get('product');

  const { data: paymentsData, isLoading, error, refetch } = useGetPaymentsQuery({});
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  
  // Get detailed offer information including payment status (only for offer-based purchases)
  const { data: offerDetailData, isLoading: isLoadingOfferDetail } = useGetOfferDetailQuery(
    offerId || '',
    { skip: !offerId }
  );

  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentProof, setShipmentProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const payments: Payment[] = paymentsData?.payments || [];
  
  // Also check localStorage for payments (as fallback)
  const [localPayments, setLocalPayments] = useState<any[]>([]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('payments');
        if (stored) {
          setLocalPayments(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error reading payments from localStorage:', e);
      }
    }
  }, []);
  
  // Find the order/payment by orderId (for direct purchases) or offerId (for offer-based purchases)
  // Priority: orderId > offerId
  // Try multiple matching strategies:
  // 1. Match by payment.id === orderId
  // 2. Match by payment.orderNumber === orderId (in case orderId is actually orderNumber)
  // 3. Match by localStorage payment.id or orderId
  const order = orderId
    ? // Direct purchase - find by orderId (try multiple fields)
      payments.find((payment: Payment) => 
        payment.id === orderId || 
        (payment as any).orderNumber === orderId
      ) ||
      localPayments.find((payment: any) => 
        payment.id === orderId || 
        payment.orderId === orderId ||
        payment.orderNumber === orderId
      )
    : // Offer-based purchase - find by offerId
      offerId
      ? payments.find((payment: any) => payment.offerId === offerId) ||
        localPayments.find((payment: any) => payment.offerId === offerId)
      : null;

  // Debug logging
  useEffect(() => {
    if (orderId || offerId) {
      console.log('Order Status Page - Search Parameters:', {
        orderId,
        offerId,
        product,
        paymentsCount: payments.length,
        localPaymentsCount: localPayments.length,
        foundOrder: !!order,
        orderDetails: order ? {
          id: order.id,
          orderNumber: (order as any).orderNumber,
          status: order.status,
          offerId: (order as any).offerId,
        } : null,
      });
    }
  }, [orderId, offerId, product, payments, localPayments, order]);
  
  // Get payment status from offer detail if available
  const offerDetail = offerDetailData?.offer;
  const paymentStatusFromOffer = offerDetail?.paymentStatus;

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.trackingNumber || '');
      setSelectedStatus('delivered');
    }
  }, [order]);
  
  // Update status from offer detail if order is not available
  useEffect(() => {
    if (!order && offerDetail) {
      setSelectedStatus('delivered');
    }
  }, [order, offerDetail]);

  const handleProofUpload = (file: File | null) => {
    if (file) {
      setShipmentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setShipmentProof(null);
      setProofPreview('');
    }
  };

  const handleUpdateStatus = async () => {
    if (!order) {
      toast.error(
        locale === 'en'
          ? 'Order information is required to update status'
          : 'معلومات الطلب مطلوبة لتحديث الحالة'
      );
      return;
    }

    const status = selectedStatus || 'delivered';

    // Note: Proof of shipment is optional for delivered status

    // Log request details
    console.log('=== UPDATE ORDER STATUS REQUEST ===');
    console.log('Order ID:', order.id);
    console.log('Order Number:', (order as any).orderNumber);
    console.log('Status:', status);
    console.log('Tracking Number:', trackingNumber.trim() || 'N/A');
    console.log('Has Shipment Proof:', !!shipmentProof);
    console.log('Current Order Status:', order.status);
    console.log('===================================');

    try {
      // Upload proof if provided (use chat upload endpoint like shipping page does)
      let proofUrl = '';
      if (shipmentProof) {
        console.log('Uploading shipment proof via chat upload endpoint...');
        const formData = new FormData();
        formData.append('file', shipmentProof);

        try {
          const uploadResponse = await apiClient.post('/api/chat/upload/', formData);
          
          console.log('=== SHIPMENT PROOF UPLOAD RESPONSE ===');
          console.log('Status:', uploadResponse.status);
          console.log('Data:', uploadResponse.data);
          console.log('=====================================');
          
          proofUrl = uploadResponse.data.fileUrl || uploadResponse.data.proofUrl || '';
        } catch (uploadError: any) {
          console.error('=== SHIPMENT PROOF UPLOAD ERROR ===');
          console.error('Error:', uploadError);
          console.error('Response:', uploadError.response);
          console.error('Status:', uploadError.response?.status);
          console.error('Data:', uploadError.response?.data);
          console.error('===================================');
          
          // Continue with status update even if proof upload fails
          toast.warning(
            locale === 'en'
              ? 'Proof upload failed, but continuing with status update...'
              : 'فشل رفع الإثبات، ولكن سيتم متابعة تحديث الحالة...'
          );
        }
      }

      // Update order status to delivered
      console.log('Calling updateOrderStatus mutation...');
      const updatePayload = {
        orderId: order.id,
        status: 'delivered',
        trackingNumber: trackingNumber.trim() || undefined,
        shipmentProof: shipmentProof || undefined,
        shipmentProofUrl: proofUrl || undefined,
      };
      console.log('Update Payload:', updatePayload);
      console.log('API Endpoint:', `/api/user/payments/${order.id}/update-status/`);

      const result = await updateOrderStatus(updatePayload).unwrap();

      console.log('=== UPDATE ORDER STATUS SUCCESS ===');
      console.log('Response:', result);
      console.log('===================================');

      toast.success(
        locale === 'en'
          ? 'Order status updated successfully!'
          : 'تم تحديث حالة الطلب بنجاح!'
      );
      refetch();
    } catch (error: any) {
      console.error('=== UPDATE ORDER STATUS ERROR ===');
      console.error('Full Error Object:', error);
      console.error('Error Message:', error?.message);
      console.error('Error Data:', error?.data);
      console.error('Error Response:', error?.response);
      console.error('Response Status:', error?.response?.status);
      console.error('Response Data:', error?.response?.data);
      console.error('Response Headers:', error?.response?.headers);
      console.error('Request URL:', error?.config?.url);
      console.error('Request Method:', error?.config?.method);
      console.error('Request Data:', error?.config?.data);
      console.error('================================');

      const errorMessage = 
        error?.data?.message || 
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        (locale === 'en'
          ? 'Failed to update order status'
          : 'فشل تحديث حالة الطلب');

      console.error('Final Error Message:', errorMessage);

      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      reached_at_courier: 'bg-indigo-100 text-indigo-700',
      out_for_delivery: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      ready: { en: 'Ready', ar: 'جاهز' },
      shipped: { en: 'Shipped', ar: 'تم الشحن' },
      reached_at_courier: { en: 'At Courier', ar: 'وصل للشاحن' },
      out_for_delivery: { en: 'Out for Delivery', ar: 'قيد التسليم' },
      delivered: { en: 'Delivered', ar: 'تم التسليم' },
      cancelled: { en: 'Cancelled', ar: 'ملغي' },
    };
    const label = labels[status] || { en: status, ar: status };
    return locale === 'en' ? label.en : label.ar;
  };

  // Show error only if we don't have order and offer detail is not loading or not available
  // Also check if we're still loading payments data
  if (!order && !isLoading && !isLoadingOfferDetail && !offerDetail) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70 mb-2'>
              {locale === 'en'
                ? 'Order not found'
                : 'الطلب غير موجود'}
            </p>
            {(orderId || offerId) && (
              <p className='text-sm text-deep-charcoal/50 mb-4'>
                {locale === 'en'
                  ? `Looking for: ${orderId ? `Order ID: ${orderId}` : `Offer ID: ${offerId}`}`
                  : `البحث عن: ${orderId ? `رقم الطلب: ${orderId}` : `رقم العرض: ${offerId}`}`}
              </p>
            )}
            <button
              onClick={() => router.back()}
              className='mt-4 px-4 py-2 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors cursor-pointer'
            >
              {locale === 'en' ? 'Go Back' : 'العودة'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state while fetching data
  if (isLoading && !order) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4'></div>
            <p className='text-deep-charcoal/70'>
              {locale === 'en' ? 'Loading order details...' : 'جاري تحميل تفاصيل الطلب...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use payment status from offer detail API if available, otherwise fall back to order payment status
  const paymentStatus = paymentStatusFromOffer || order?.paymentStatus;
  const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed' || 
                 order?.paymentStatus === 'paid' || order?.paymentStatus === 'completed';
  const productInfo =
    order && typeof order.product === 'object' && order.product !== null
      ? order.product
      : { id: '', title: product || offerDetail?.productTitle || '', images: [] };

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-deep-charcoal/70 hover:text-deep-charcoal mb-4 transition-colors cursor-pointer'
          >
            <HiArrowLeft className='w-5 h-5' />
            <span>{locale === 'en' ? 'Back' : 'العودة'}</span>
          </button>
          <h1 className='text-3xl font-bold text-deep-charcoal'>
            {locale === 'en' ? 'Order Status' : 'حالة الطلب'}
          </h1>
        </div>

        <div className='space-y-6'>
          {/* Order Info Card */}
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
            <div className='flex gap-4 mb-6'>
              {productInfo.images && productInfo.images.length > 0 && (
                <div className='relative w-24 h-24 rounded-lg overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                  <Image
                    src={productInfo.images[0]}
                    alt={productInfo.title || ''}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </div>
              )}
              <div className='flex-1'>
                <h2 className='text-xl font-semibold text-deep-charcoal mb-2'>
                  {productInfo.title || product}
                </h2>
                <div className='flex items-center gap-4'>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order?.status || 'pending'
                    )}`}
                  >
                    {getStatusLabel(order?.status || 'pending')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status Section */}
            <div className='border-t border-rich-sand/30 pt-6 mb-6'>
              <h3 className='text-lg font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Payment Status' : 'حالة الدفع'}
              </h3>
              {isLoadingOfferDetail ? (
                <div className='flex items-center gap-3'>
                  <div className='animate-pulse bg-rich-sand/20 h-6 w-32 rounded'></div>
                </div>
              ) : (
                <div className='flex items-center gap-3'>
                  {isPaid ? (
                    <>
                      <HiCheckCircle className='w-6 h-6 text-green-600' />
                      <div>
                        <p className='text-green-600 font-semibold'>
                          {locale === 'en' ? 'Paid' : 'مدفوع'}
                        </p>
                        {(order?.totalPrice || offerDetail?.offerAmount) && (
                          <p className='text-sm text-deep-charcoal/70'>
                            {locale === 'en' ? 'Amount:' : 'المبلغ:'}{' '}
                            {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                            {(order?.totalPrice || offerDetail?.offerAmount || 0).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <HiXCircle className='w-6 h-6 text-red-600' />
                      <div>
                        <p className='text-red-600 font-semibold'>
                          {paymentStatus === 'failed'
                            ? locale === 'en'
                              ? 'Failed'
                              : 'فشل'
                            : locale === 'en'
                            ? 'Pending'
                            : 'قيد الانتظار'}
                        </p>
                        <p className='text-sm text-deep-charcoal/70'>
                          {paymentStatus === 'failed'
                            ? locale === 'en'
                              ? 'Payment failed'
                              : 'فشل الدفع'
                            : locale === 'en'
                            ? 'Payment is pending'
                            : 'الدفع قيد الانتظار'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Shipment Section */}
            <div className='border-t border-rich-sand/30 pt-6'>
              <h3 className='text-lg font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Shipment' : 'الشحن'}
              </h3>

              {/* Tracking Number */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'Tracking Number' : 'رقم التتبع'}
                </label>
                <input
                  type='text'
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={
                    locale === 'en'
                      ? 'Enter tracking number'
                      : 'أدخل رقم التتبع'
                  }
                  className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                  disabled={!isPaid}
                />
              </div>

              {/* Shipment Status */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                  {locale === 'en' ? 'Shipment Status' : 'حالة الشحن'}
                </label>
                <select
                  value='delivered'
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green cursor-pointer'
                  disabled={!isPaid || isUpdating}
                >
                  <option value='delivered'>
                    {locale === 'en' ? 'Delivered' : 'تم التسليم'}
                  </option>
                </select>
              </div>

              {/* Proof of Shipment Upload */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                  {locale === 'en'
                    ? 'Proof of Shipment'
                    : 'إثبات الشحن'}
                  <span className='text-deep-charcoal/60 font-normal ml-1'>
                    {locale === 'en' ? '(Optional)' : '(اختياري)'}
                  </span>
                </label>
                <div className='flex items-center gap-4'>
                  <label className='flex items-center gap-2 px-4 py-2 border border-rich-sand/30 rounded-lg cursor-pointer hover:bg-rich-sand/10 transition-colors'>
                    <HiPhoto className='w-5 h-5 text-deep-charcoal/70' />
                    <span className='text-sm text-deep-charcoal'>
                      {locale === 'en' ? 'Upload Image' : 'رفع صورة'}
                    </span>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) =>
                        handleProofUpload(e.target.files?.[0] || null)
                      }
                      className='hidden'
                      disabled={!isPaid}
                    />
                  </label>
                  {proofPreview && (
                    <div className='relative w-20 h-20 rounded-lg overflow-hidden'>
                      <Image
                        src={proofPreview}
                        alt='Proof preview'
                        fill
                        className='object-cover'
                        unoptimized
                      />
                      <button
                        onClick={() => handleProofUpload(null)}
                        className='absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600'
                      >
                        <HiXMark className='w-4 h-4' />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Button */}
              <button
                onClick={handleUpdateStatus}
                disabled={!isPaid || isUpdating}
                className='w-full px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2'
              >
                {isUpdating ? (
                  <>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                    <span>{locale === 'en' ? 'Updating...' : 'جاري التحديث...'}</span>
                  </>
                ) : (
                  <>
                    <HiTruck className='w-5 h-5' />
                    <span>{locale === 'en' ? 'Update Status' : 'تحديث الحالة'}</span>
                  </>
                )}
              </button>

              {!isPaid && (
                <p className='mt-2 text-sm text-red-600'>
                  {locale === 'en'
                    ? 'Payment is pending. Shipment can only be updated after payment is completed.'
                    : 'الدفع قيد الانتظار. يمكن تحديث الشحن فقط بعد اكتمال الدفع.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

