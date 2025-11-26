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
  const product = searchParams.get('product');

  const { data: paymentsData, isLoading, error, refetch } = useGetPaymentsQuery({});
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

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
  
  // Find the order/payment by offerId (check both API and localStorage)
  const order = payments.find((payment: any) => payment.offerId === offerId) ||
    localPayments.find((payment: any) => payment.offerId === offerId);

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.trackingNumber || '');
      setSelectedStatus(order.status || 'ready');
    }
  }, [order]);

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
    if (!order) return;

    const status = selectedStatus || order.status || 'shipped';

    if (status === 'shipped' && !trackingNumber.trim()) {
      toast.error(
        locale === 'en'
          ? 'Please enter a tracking number'
          : 'يرجى إدخال رقم التتبع'
      );
      return;
    }

    try {
      // Upload proof if provided
      let proofUrl = '';
      if (shipmentProof) {
        const formData = new FormData();
        formData.append('file', shipmentProof);

        const uploadResponse = await apiClient.post(
          `/api/user/payments/${order.id}/shipment-proof/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        proofUrl = uploadResponse.data.proofUrl || '';
      }

      // Update order status
      await updateOrderStatus({
        orderId: order.id,
        status: status,
        trackingNumber: trackingNumber.trim() || undefined,
      }).unwrap();

      toast.success(
        locale === 'en'
          ? 'Order status updated successfully!'
          : 'تم تحديث حالة الطلب بنجاح!'
      );
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          (locale === 'en'
            ? 'Failed to update order status'
            : 'فشل تحديث حالة الطلب')
      );
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

  if (!order) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70'>
              {locale === 'en'
                ? 'Order not found'
                : 'الطلب غير موجود'}
            </p>
            <button
              onClick={() => router.back()}
              className='mt-4 px-4 py-2 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors'
            >
              {locale === 'en' ? 'Go Back' : 'العودة'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid' || order.paymentStatus === 'completed';
  const productInfo =
    typeof order.product === 'object' && order.product !== null
      ? order.product
      : { id: '', title: product || '', images: [] };

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-6'>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-deep-charcoal/70 hover:text-deep-charcoal mb-4 transition-colors'
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
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status Section */}
            <div className='border-t border-rich-sand/30 pt-6 mb-6'>
              <h3 className='text-lg font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Payment Status' : 'حالة الدفع'}
              </h3>
              <div className='flex items-center gap-3'>
                {isPaid ? (
                  <>
                    <HiCheckCircle className='w-6 h-6 text-green-600' />
                    <div>
                      <p className='text-green-600 font-semibold'>
                        {locale === 'en' ? 'Paid' : 'مدفوع'}
                      </p>
                      {order.totalPrice && (
                        <p className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Amount:' : 'المبلغ:'}{' '}
                          {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                          {order.totalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <HiXCircle className='w-6 h-6 text-red-600' />
                    <div>
                      <p className='text-red-600 font-semibold'>
                        {locale === 'en' ? 'Pending' : 'قيد الانتظار'}
                      </p>
                      <p className='text-sm text-deep-charcoal/70'>
                        {locale === 'en'
                          ? 'Payment is pending'
                          : 'الدفع قيد الانتظار'}
                      </p>
                    </div>
                  </>
                )}
              </div>
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
                  value={selectedStatus || order.status}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                  disabled={!isPaid || isUpdating}
                >
                  <option value='ready'>
                    {locale === 'en' ? 'Ready' : 'جاهز'}
                  </option>
                  <option value='shipped'>
                    {locale === 'en' ? 'Shipped' : 'تم الشحن'}
                  </option>
                  <option value='reached_at_courier'>
                    {locale === 'en' ? 'Reached at Courier' : 'وصل للشاحن'}
                  </option>
                  <option value='out_for_delivery'>
                    {locale === 'en' ? 'Out for Delivery' : 'قيد التسليم'}
                  </option>
                  <option value='delivered'>
                    {locale === 'en' ? 'Delivered' : 'تم التسليم'}
                  </option>
                </select>
              </div>

              {/* Proof of Shipment Upload */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                  {locale === 'en'
                    ? 'Proof of Shipment (Optional)'
                    : 'إثبات الشحن (اختياري)'}
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
                className='w-full px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                <HiTruck className='w-5 h-5' />
                {isUpdating
                  ? locale === 'en'
                    ? 'Updating...'
                    : 'جاري التحديث...'
                  : locale === 'en'
                  ? 'Update Status'
                  : 'تحديث الحالة'}
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

