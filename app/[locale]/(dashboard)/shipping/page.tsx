'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  HiCheckCircle,
  HiXCircle,
  HiTruck,
  HiMapPin,
  HiUser,
  HiCalendar,
  HiCurrencyDollar,
  HiPhoto,
  HiXMark,
} from 'react-icons/hi2';
import {
  useGetPaymentsQuery,
  useUpdateOrderStatusMutation,
  type Payment,
} from '@/lib/api/ordersApi';
import { useAppSelector } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import { apiClient } from '@/lib/api/client';

export default function ShippingPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const isRTL = locale === 'ar';

  // Check if user is seller
  if (user?.role !== 'seller') {
    router.push(`/${locale}/buyer`);
    return null;
  }

  const { data: paymentsData, isLoading, error, refetch } = useGetPaymentsQuery({});
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [shipmentProofs, setShipmentProofs] = useState<Record<string, File | null>>({});
  const [proofPreviews, setProofPreviews] = useState<Record<string, string>>({});
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({});

  const payments: Payment[] = paymentsData?.payments || [];

  // Filter orders that are ready to ship or already shipped
  const ordersToManage = payments.filter(
    (payment) =>
      payment.status === 'ready' ||
      payment.status === 'shipped' ||
      payment.status === 'reached_at_courier' ||
      payment.status === 'out_for_delivery'
  );

  const handleProofUpload = (orderId: string, file: File | null) => {
    if (file) {
      setShipmentProofs(prev => ({ ...prev, [orderId]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreviews(prev => ({
          ...prev,
          [orderId]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setShipmentProofs(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      setProofPreviews(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
    }
  };

  const handleUpdateStatus = async (orderId: string) => {
    const status = selectedStatus[orderId] || 'shipped';
    const trackingNumber = trackingNumbers[orderId]?.trim();

    if (status === 'shipped' && !trackingNumber) {
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
      if (shipmentProofs[orderId]) {
        const formData = new FormData();
        formData.append('file', shipmentProofs[orderId]!);
        try {
          const uploadResponse = await apiClient.post('/api/chat/upload/', formData);
          proofUrl = uploadResponse.data.fileUrl || '';
        } catch (uploadError) {
          console.error('Error uploading proof:', uploadError);
          // Continue without proof if upload fails
        }
      }

      await updateOrderStatus({
        orderId,
        status,
        trackingNumber: trackingNumber || undefined,
      }).unwrap();

      toast.success(
        locale === 'en'
          ? 'Order status updated successfully!'
          : 'تم تحديث حالة الطلب بنجاح!'
      );

      // Clear form
      setTrackingNumbers(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      setSelectedStatus(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      handleProofUpload(orderId, null);

      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
        (locale === 'en' ? 'Failed to update order status' : 'فشل تحديث حالة الطلب')
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'reached_at_courier':
        return 'bg-purple-100 text-purple-700';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ready':
        return locale === 'en' ? 'Ready to Ship' : 'جاهز للشحن';
      case 'shipped':
        return locale === 'en' ? 'Shipped' : 'تم الشحن';
      case 'reached_at_courier':
        return locale === 'en' ? 'At Courier' : 'وصل للبريد';
      case 'out_for_delivery':
        return locale === 'en' ? 'Out for Delivery' : 'قيد التوصيل';
      case 'delivered':
        return locale === 'en' ? 'Delivered' : 'تم التسليم';
      default:
        return status;
    }
  };

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'ready':
        return [
          { value: 'shipped', label: locale === 'en' ? 'Mark as Shipped' : 'تمييز كشحنت' },
        ];
      case 'shipped':
        return [
          {
            value: 'reached_at_courier',
            label: locale === 'en' ? 'Reached at Courier' : 'وصل للبريد',
          },
        ];
      case 'reached_at_courier':
        return [
          {
            value: 'out_for_delivery',
            label: locale === 'en' ? 'Out for Delivery' : 'قيد التوصيل',
          },
        ];
      case 'out_for_delivery':
        return [
          { value: 'delivered', label: locale === 'en' ? 'Mark as Delivered' : 'تمييز كمسلم' },
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70'>
              {locale === 'en' ? 'Loading orders...' : 'جاري تحميل الطلبات...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-red-600'>
              {locale === 'en'
                ? 'Failed to load orders. Please try again.'
                : 'فشل تحميل الطلبات. يرجى المحاولة مرة أخرى.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-deep-charcoal mb-2'>
            {locale === 'en' ? 'Shipping Management' : 'إدارة الشحن'}
          </h1>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'Manage your orders and track shipments'
              : 'إدارة طلباتك وتتبع الشحنات'}
          </p>
        </div>

        {ordersToManage.length === 0 ? (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70'>
              {locale === 'en'
                ? 'No orders to manage yet.'
                : 'لا توجد طلبات للإدارة بعد.'}
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {ordersToManage.map((order) => {
              const productInfo =
                typeof order.product === 'object' && order.product !== null
                  ? order.product
                  : { id: '', title: 'Product', images: [] };
              const buyerInfo =
                typeof order.buyer === 'object' && order.buyer !== null
                  ? order.buyer
                  : { id: '', username: 'Buyer', profileImage: '' };

              const isPaid = order.paymentStatus === 'completed' || order.status !== 'pending';
              const nextStatusOptions = getNextStatusOptions(order.status);

              return (
                <div
                  key={order.id}
                  className='bg-white rounded-lg border border-rich-sand/30 p-6 shadow-sm'
                >
                  <div className='flex flex-col lg:flex-row gap-6'>
                    {/* Product Image */}
                    <div className='flex-shrink-0'>
                      {productInfo.id ? (
                        <Link
                          href={`/${locale}/product/${productInfo.id}`}
                          className='relative w-32 h-32 bg-rich-sand/20 rounded-lg overflow-hidden block'
                        >
                          <Image
                            src={productInfo.images?.[0] || '/placeholder-product.png'}
                            alt={productInfo.title}
                            fill
                            className='object-cover'
                            unoptimized
                          />
                        </Link>
                      ) : (
                        <div className='relative w-32 h-32 bg-rich-sand/20 rounded-lg overflow-hidden'>
                          <Image
                            src='/placeholder-product.png'
                            alt='Product'
                            fill
                            className='object-cover'
                            unoptimized
                          />
                        </div>
                      )}
                    </div>

                    {/* Order Details */}
                    <div className='flex-1 space-y-4'>
                      {/* Header */}
                      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                        <div className='flex-1'>
                          {productInfo.id ? (
                            <Link
                              href={`/${locale}/product/${productInfo.id}`}
                              className='text-xl font-semibold text-deep-charcoal hover:text-saudi-green transition-colors block mb-2'
                            >
                              {productInfo.title}
                            </Link>
                          ) : (
                            <h3 className='text-xl font-semibold text-deep-charcoal mb-2'>
                              {productInfo.title}
                            </h3>
                          )}
                          <div className='flex items-center gap-4 text-sm text-deep-charcoal/70'>
                            <span className='flex items-center gap-1'>
                              <HiUser className='w-4 h-4' />
                              {buyerInfo.username}
                            </span>
                            <span className='flex items-center gap-1'>
                              <HiCalendar className='w-4 h-4' />
                              {new Date(order.orderDate).toLocaleDateString()}
                            </span>
                            <span className='flex items-center gap-1'>
                              <HiCurrencyDollar className='w-4 h-4' />
                              {locale === 'ar' ? 'ر.س' : 'SAR'} {order.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className='flex flex-col items-end gap-2'>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                          {/* Payment Status */}
                          <div className='flex items-center gap-1.5'>
                            {isPaid ? (
                              <>
                                <HiCheckCircle className='w-4 h-4 text-green-600' />
                                <span className='text-xs text-green-600 font-medium'>
                                  {locale === 'en' ? 'Paid' : 'مدفوع'}
                                </span>
                              </>
                            ) : (
                              <>
                                <HiXCircle className='w-4 h-4 text-red-600' />
                                <span className='text-xs text-red-600 font-medium'>
                                  {locale === 'en' ? 'Not Paid' : 'غير مدفوع'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <div className='bg-rich-sand/10 rounded-lg p-4'>
                          <div className='flex items-start gap-2 mb-2'>
                            <HiMapPin className='w-5 h-5 text-saudi-green flex-shrink-0 mt-0.5' />
                            <div>
                              <h4 className='font-semibold text-deep-charcoal mb-1'>
                                {locale === 'en' ? 'Shipping Address' : 'عنوان الشحن'}
                              </h4>
                              <p className='text-sm text-deep-charcoal/70'>
                                {order.shippingAddress.fullName}
                                <br />
                                {order.shippingAddress.address}
                                <br />
                                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                                <br />
                                {order.shippingAddress.country}
                                {order.shippingAddress.phone && (
                                  <>
                                    <br />
                                    {locale === 'en' ? 'Phone' : 'الهاتف'}:{' '}
                                    {order.shippingAddress.phone}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Tracking Number (if already shipped) */}
                      {order.trackingNumber && (
                        <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
                          <div className='flex items-center gap-2'>
                            <HiTruck className='w-5 h-5 text-blue-600' />
                            <div>
                              <span className='text-sm font-medium text-blue-900'>
                                {locale === 'en' ? 'Tracking Number' : 'رقم التتبع'}:
                              </span>
                              <span className='text-sm text-blue-700 ml-2 font-mono'>
                                {order.trackingNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Update Status Form */}
                      {isPaid && nextStatusOptions.length > 0 && (
                        <div className='border-t border-rich-sand/30 pt-4 space-y-4'>
                          <h4 className='font-semibold text-deep-charcoal'>
                            {locale === 'en' ? 'Update Shipment Status' : 'تحديث حالة الشحن'}
                          </h4>

                          {/* Status Selection */}
                          <div>
                            <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                              {locale === 'en' ? 'Next Status' : 'الحالة التالية'}
                            </label>
                            <select
                              value={selectedStatus[order.id] || nextStatusOptions[0].value}
                              onChange={(e) =>
                                setSelectedStatus(prev => ({
                                  ...prev,
                                  [order.id]: e.target.value,
                                }))
                              }
                              className='w-full px-3 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                            >
                              {nextStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Tracking Number Input */}
                          {(!order.trackingNumber ||
                            selectedStatus[order.id] === 'shipped') && (
                            <div>
                              <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                                {locale === 'en' ? 'Tracking Number' : 'رقم التتبع'} *
                              </label>
                              <input
                                type='text'
                                value={trackingNumbers[order.id] || order.trackingNumber || ''}
                                onChange={(e) =>
                                  setTrackingNumbers(prev => ({
                                    ...prev,
                                    [order.id]: e.target.value,
                                  }))
                                }
                                placeholder={
                                  locale === 'en'
                                    ? 'Enter tracking number'
                                    : 'أدخل رقم التتبع'
                                }
                                className='w-full px-3 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                              />
                            </div>
                          )}

                          {/* Proof of Shipment Upload */}
                          <div>
                            <label className='block text-sm font-medium text-deep-charcoal mb-2'>
                              {locale === 'en'
                                ? 'Proof of Shipment (Optional)'
                                : 'إثبات الشحن (اختياري)'}
                            </label>
                            <div className='flex items-center gap-4'>
                              <label className='flex items-center justify-center gap-2 px-4 py-2 bg-rich-sand/20 hover:bg-rich-sand/30 rounded-lg cursor-pointer transition-colors'>
                                <HiPhoto className='w-5 h-5 text-deep-charcoal' />
                                <span className='text-sm text-deep-charcoal'>
                                  {locale === 'en' ? 'Upload Image' : 'رفع صورة'}
                                </span>
                                <input
                                  type='file'
                                  accept='image/*'
                                  className='hidden'
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleProofUpload(order.id, file);
                                  }}
                                />
                              </label>
                              {proofPreviews[order.id] && (
                                <div className='relative w-20 h-20 rounded-lg overflow-hidden border border-rich-sand/30'>
                                  <Image
                                    src={proofPreviews[order.id]}
                                    alt='Proof'
                                    fill
                                    className='object-cover'
                                    unoptimized
                                  />
                                  <button
                                    onClick={() => handleProofUpload(order.id, null)}
                                    className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
                                  >
                                    <HiXMark className='w-3 h-3' />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Update Button */}
                          <button
                            onClick={() => handleUpdateStatus(order.id)}
                            disabled={isUpdating}
                            className='flex items-center justify-center gap-2 px-6 py-2.5 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
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
                        </div>
                      )}

                      {/* Not Paid Warning */}
                      {!isPaid && (
                        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                          <div className='flex items-center gap-2'>
                            <HiXCircle className='w-5 h-5 text-yellow-600' />
                            <p className='text-sm text-yellow-800'>
                              {locale === 'en'
                                ? 'Payment is pending. Shipment can only be updated after payment is completed.'
                                : 'الدفع معلق. يمكن تحديث الشحن فقط بعد اكتمال الدفع.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

