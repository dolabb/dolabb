'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { HiTruck } from 'react-icons/hi2';
import { useGetPaymentsQuery, useShipOrderMutation, type Payment } from '@/lib/api/ordersApi';
import { toast } from '@/utils/toast';
import Link from 'next/link';

// Extended Payment type for localStorage compatibility
interface LocalStoragePayment extends Payment {
  // Legacy fields from localStorage
  productTitle?: string;
  buyerName?: string;
  offerId?: string;
  size?: string;
  price?: string;
  offerPrice?: string;
  shipping?: string;
  tokenId?: string;
  tokenData?: {
    id: string;
    brand: string;
    lastFour: string;
    name: string;
    month: string;
    year: string;
    country: string;
    funding: string;
    status: string;
    expiresAt: string;
  };
  paymentMethod?: string;
}

export default function PaymentsTab() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [trackingNumber, setTrackingNumber] = useState<Record<string, string>>({});
  const [shipmentProofFile, setShipmentProofFile] = useState<Record<string, File | null>>({});
  const [shipmentProofUrl, setShipmentProofUrl] = useState<Record<string, string>>({});
  const [uploadMethod, setUploadMethod] = useState<Record<string, 'file' | 'url'>>({});

  // Fetch payments from API
  const { data: paymentsData, isLoading, error, refetch } = useGetPaymentsQuery({});
  const [shipOrder, { isLoading: isShipping }] = useShipOrderMutation();

  // Get payments from API or fallback to localStorage
  const payments = (paymentsData?.payments || []) as (Payment | LocalStoragePayment)[];

  // Also load from localStorage as fallback
  useEffect(() => {
    if (payments.length === 0) {
      const storedPayments = JSON.parse(
        localStorage.getItem('payments') || '[]'
      ) as Payment[];
      // This is handled by the API query, but we keep this as fallback
    }
  }, [payments.length]);

  const handleShip = async (orderId: string) => {
    const tracking = trackingNumber[orderId]?.trim();
    if (!tracking) {
      toast.error(
        locale === 'en' 
          ? 'Please enter a tracking number' 
          : 'يرجى إدخال رقم التتبع'
      );
      return;
    }

    // IMPORTANT: Shipment proof is now required for earnings
    const method = uploadMethod[orderId] || 'file';
    const file = shipmentProofFile[orderId];
    const url = shipmentProofUrl[orderId]?.trim();

    if (!file && !url) {
      toast.error(
        locale === 'en'
          ? 'Shipment proof is required. Upload proof to unlock earnings for this order.'
          : 'إثبات الشحن مطلوب. قم برفع الإثبات لفتح الأرباح لهذا الطلب.'
      );
      return;
    }

    try {
      await shipOrder({
        orderId,
        trackingNumber: tracking,
        shipmentProof: method === 'file' ? file : undefined,
        shipmentProofUrl: method === 'url' ? url : undefined,
      }).unwrap();
      toast.success(
        locale === 'en' 
          ? 'Order shipped successfully! Earnings for this order are now available for payout.'
          : 'تم شحن الطلب بنجاح! الأرباح لهذا الطلب متاحة الآن للدفع.'
      );
      setTrackingNumber(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      setShipmentProofFile(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      setShipmentProofUrl(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      setUploadMethod(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message || 
        (locale === 'en' ? 'Failed to ship order' : 'فشل شحن الطلب')
      );
    }
  };

  // Helper to get product info
  const getProductInfo = (payment: Payment) => {
    if (payment.product && typeof payment.product === 'object' && 'title' in payment.product) {
      return {
        title: payment.product.title,
        image: payment.product.images?.[0] || payment.product.image || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
        id: payment.product.id || '',
      };
    }
    return {
      title: payment.productTitle || (typeof payment.product === 'string' ? payment.product : 'Product'),
          image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
      id: '',
    };
    };

  // Helper to get buyer info
  const getBuyerInfo = (payment: Payment) => {
    if (payment.buyer && typeof payment.buyer === 'object') {
      return payment.buyer.username || payment.buyerName || 'Buyer';
    }
    return payment.buyerName || 'Buyer';
    };

  if (isLoading) {
    return (
      <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
        <p className='text-deep-charcoal/70'>
          {locale === 'en' ? 'Loading payments...' : 'جاري تحميل المدفوعات...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
        <p className='text-red-600'>
          {locale === 'en' 
            ? 'Failed to load payments. Please try again.' 
            : 'فشل تحميل المدفوعات. يرجى المحاولة مرة أخرى.'}
        </p>
      </div>
    );
  }

  // Filter only orders that are ready to ship or pending (not shipped)
  const ordersToShip = payments.filter(
    (payment) => payment.status === 'ready' || payment.status === 'pending'
  );

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
        {locale === 'en' ? 'Orders to Ship' : 'الطلبات للشحن'}
      </h2>
      {ordersToShip.length === 0 ? (
        <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'No orders to ship yet.'
              : 'لا توجد طلبات للشحن بعد.'}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {ordersToShip.map((order) => {
            const productInfo = getProductInfo(order);
            const buyerInfo = getBuyerInfo(order);

            return (
          <div
            key={order.id}
            className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
          >
                {productInfo.id ? (
                  <Link
                    href={`/${locale}/product/${productInfo.id}`}
                    className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
                  >
                    <Image
                      src={productInfo.image}
                      alt={productInfo.title}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </Link>
                ) : (
            <div className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'>
              <Image
                      src={productInfo.image}
                      alt={productInfo.title}
                fill
                className='object-cover'
                unoptimized
              />
            </div>
                )}
            <div className='flex-1'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
                    {productInfo.id ? (
                      <Link
                        href={`/${locale}/product/${productInfo.id}`}
                        className='font-semibold text-deep-charcoal hover:text-saudi-green transition-colors'
                      >
                        {productInfo.title}
                      </Link>
                    ) : (
                <h3 className='font-semibold text-deep-charcoal'>
                        {productInfo.title}
                </h3>
                    )}
                <span className='text-lg font-bold text-saudi-green'>
                      {locale === 'ar' ? 'ر.س' : 'SAR'} {order.totalPrice.toFixed(2)}
                </span>
              </div>
              <div className='text-sm text-deep-charcoal/70 space-y-1'>
                <p>
                      {locale === 'en' ? 'Order ID' : 'رقم الطلب'}: {order.orderNumber || order.id}
                </p>
                <p>
                      {locale === 'en' ? 'Buyer' : 'المشتري'}: @{buyerInfo}
                    </p>
                    <p>
                      {locale === 'en' ? 'Order Date' : 'تاريخ الطلب'}: {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                    {order.shippingAddress && (
                      <p>
                        {locale === 'en' ? 'Shipping Address' : 'عنوان الشحن'}: {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                      </p>
                )}
              </div>
            </div>
            <div className='flex flex-col gap-2 sm:w-32'>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                  order.status === 'ready'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {order.status === 'ready'
                  ? locale === 'en'
                    ? 'Ready to Ship'
                    : 'جاهز للشحن'
                  : locale === 'en'
                    ? 'Pending'
                    : 'قيد الانتظار'}
              </span>
              {order.status === 'ready' && (
                    <div className='flex flex-col gap-2'>
                      <input
                        type='text'
                        placeholder={locale === 'en' ? 'Tracking number' : 'رقم التتبع'}
                        value={trackingNumber[order.id] || ''}
                        onChange={(e) =>
                          setTrackingNumber(prev => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        className='w-full px-2 py-1 text-xs border border-rich-sand/30 rounded focus:outline-none focus:ring-1 focus:ring-saudi-green'
                      />
                      
                      {/* Upload Method Selection */}
                      <select
                        value={uploadMethod[order.id] || 'file'}
                        onChange={(e) =>
                          setUploadMethod(prev => ({
                            ...prev,
                            [order.id]: e.target.value as 'file' | 'url',
                          }))
                        }
                        className='w-full px-2 py-1 text-xs border border-rich-sand/30 rounded focus:outline-none focus:ring-1 focus:ring-saudi-green'
                      >
                        <option value='file'>{locale === 'en' ? 'Upload File' : 'رفع ملف'}</option>
                        <option value='url'>{locale === 'en' ? 'Provide URL' : 'تقديم رابط'}</option>
                      </select>

                      {/* Shipment Proof Upload */}
                      {(uploadMethod[order.id] || 'file') === 'file' ? (
                        <input
                          type='file'
                          accept='image/*'
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setShipmentProofFile(prev => ({
                              ...prev,
                              [order.id]: file,
                            }));
                          }}
                          className='w-full px-2 py-1 text-xs border border-rich-sand/30 rounded focus:outline-none focus:ring-1 focus:ring-saudi-green'
                          required
                        />
                      ) : (
                        <input
                          type='url'
                          placeholder={locale === 'en' ? 'Shipment proof URL' : 'رابط إثبات الشحن'}
                          value={shipmentProofUrl[order.id] || ''}
                          onChange={(e) =>
                            setShipmentProofUrl(prev => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          className='w-full px-2 py-1 text-xs border border-rich-sand/30 rounded focus:outline-none focus:ring-1 focus:ring-saudi-green'
                          required
                        />
                      )}

                      {/* Warning Message */}
                      <div className='bg-yellow-50 border border-yellow-200 rounded p-2'>
                        <p className='text-xs text-yellow-800'>
                          {locale === 'en'
                            ? '⚠️ Shipment proof is required to unlock earnings'
                            : '⚠️ إثبات الشحن مطلوب لفتح الأرباح'}
                        </p>
                      </div>

                <button
                  onClick={() => handleShip(order.id)}
                        disabled={
                          isShipping ||
                          !trackingNumber[order.id]?.trim() ||
                          (!shipmentProofFile[order.id] && !shipmentProofUrl[order.id]?.trim())
                        }
                        className='flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <HiTruck className='w-4 h-4' />
                        {isShipping 
                          ? (locale === 'en' ? 'Shipping...' : 'جاري الشحن...')
                          : (locale === 'en' ? 'Ship' : 'شحن')}
                </button>
                    </div>
              )}
              {order.status === 'shipped' && (
                <span className='px-3 py-1 rounded-full text-xs font-medium text-center bg-blue-100 text-blue-700'>
                  {locale === 'en' ? 'Shipped' : 'تم الشحن'}
                </span>
              )}
            </div>
          </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

