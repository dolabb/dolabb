'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useRef } from 'react';
import { HiArrowLeft, HiTruck, HiPhoto } from 'react-icons/hi2';
import { useGetPaidOfferDetailQuery, useUploadShipmentProofMutation } from '@/lib/api/offersApi';
import { toast } from '@/utils/toast';

interface OfferShipmentPageProps {
  offerId: string;
}

export default function OfferShipmentPage({ offerId }: OfferShipmentPageProps) {
  const locale = useLocale();
  const router = useRouter();
  const { data: offerData, isLoading: isLoadingDetails, refetch } = useGetPaidOfferDetailQuery(offerId);
  const [uploadShipmentProof, { isLoading: isUploading }] = useUploadShipmentProofMutation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const offer = offerData?.offer;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(
          locale === 'en'
            ? 'Please select an image file'
            : 'يرجى اختيار ملف صورة'
        );
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(
        locale === 'en'
          ? 'Please select a file to upload'
          : 'يرجى اختيار ملف للرفع'
      );
      return;
    }

    try {
      await uploadShipmentProof({
        offerId,
        shipmentProof: selectedFile,
      }).unwrap();
      toast.success(
        locale === 'en'
          ? 'Shipment proof uploaded successfully!'
          : 'تم رفع إثبات الشحن بنجاح!'
      );
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      refetch();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
        (locale === 'en'
          ? 'Failed to upload shipment proof'
          : 'فشل رفع إثبات الشحن')
      );
    }
  };

  const handleBack = () => {
    router.push(`/${locale}/buyer`);
  };

  return (
    <div className='bg-off-white min-h-screen' dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header with Back Button */}
        <div className='mb-6'>
          <button
            onClick={handleBack}
            className='flex items-center gap-2 text-deep-charcoal hover:text-saudi-green transition-colors mb-4'
          >
            <HiArrowLeft className='w-5 h-5' />
            <span className='font-medium'>
              {locale === 'en' ? 'Back to Offers' : 'العودة إلى العروض'}
            </span>
          </button>
          <h1 className='text-2xl md:text-3xl font-bold text-deep-charcoal'>
            {locale === 'en' ? 'Offer Details & Shipment' : 'تفاصيل العرض والشحن'}
          </h1>
        </div>

        {/* Content */}
        {isLoadingDetails ? (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70'>
              {locale === 'en' ? 'Loading offer details...' : 'جاري تحميل تفاصيل العرض...'}
            </p>
          </div>
        ) : offer ? (
          <div className='space-y-6'>
            {/* Product Information */}
            <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Product Information' : 'معلومات المنتج'}
              </h2>
              <div className='flex flex-col sm:flex-row gap-6'>
                {offer.product?.images && offer.product.images.length > 0 && (
                  <div className='relative w-full sm:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 bg-rich-sand/20'>
                    <Image
                      src={offer.product.images[0]}
                      alt={offer.product.title}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                  </div>
                )}
                <div className='flex-1'>
                  <h3 className='text-lg font-medium text-deep-charcoal mb-2'>
                    {offer.product?.title || offer.productTitle}
                  </h3>
                  {offer.product?.description && (
                    <p className='text-sm text-deep-charcoal/70 mb-4'>
                      {offer.product.description}
                    </p>
                  )}
                  <div className='space-y-2 text-sm'>
                    <p>
                      <span className='font-medium text-deep-charcoal'>
                        {locale === 'en' ? 'Original Price' : 'السعر الأصلي'}:
                      </span>{' '}
                      <span className='text-deep-charcoal/70 line-through'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                        {offer.originalPrice?.toFixed(2) || offer.product?.price?.toFixed(2)}
                      </span>
                    </p>
                    <p>
                      <span className='font-medium text-deep-charcoal'>
                        {locale === 'en' ? 'Offer Amount' : 'مبلغ العرض'}:
                      </span>{' '}
                      <span className='text-lg font-bold text-saudi-green'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.offerAmount.toFixed(2)}
                      </span>
                    </p>
                    {offer.shippingCost && (
                      <p>
                        <span className='font-medium text-deep-charcoal'>
                          {locale === 'en' ? 'Shipping Cost' : 'تكلفة الشحن'}:
                        </span>{' '}
                        <span className='text-deep-charcoal/70'>
                          {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.shippingCost.toFixed(2)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Information */}
            <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Buyer Information' : 'معلومات المشتري'}
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-deep-charcoal/60 mb-1'>
                    {locale === 'en' ? 'Name' : 'الاسم'}
                  </p>
                  <p className='font-medium text-deep-charcoal'>
                    {offer.buyer?.name || offer.buyerName}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-deep-charcoal/60 mb-1'>
                    {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                  </p>
                  <p className='font-medium text-deep-charcoal'>{offer.buyer?.email}</p>
                </div>
                {offer.buyer?.phone && (
                  <div>
                    <p className='text-sm text-deep-charcoal/60 mb-1'>
                      {locale === 'en' ? 'Phone' : 'الهاتف'}
                    </p>
                    <p className='font-medium text-deep-charcoal'>{offer.buyer.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {(offer.shippingAddress || offer.zipCode || offer.houseNumber) && (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
                <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                  {locale === 'en' ? 'Shipping Address' : 'عنوان الشحن'}
                </h2>
                <div className='space-y-2 text-deep-charcoal'>
                  {offer.shippingAddress && <p>{offer.shippingAddress}</p>}
                  <div className='flex flex-wrap gap-4'>
                    {offer.zipCode && (
                      <p>
                        <span className='text-deep-charcoal/60'>
                          {locale === 'en' ? 'Zip Code' : 'الرمز البريدي'}:
                        </span>{' '}
                        {offer.zipCode}
                      </p>
                    )}
                    {offer.houseNumber && (
                      <p>
                        <span className='text-deep-charcoal/60'>
                          {locale === 'en' ? 'House Number' : 'رقم المنزل'}:
                        </span>{' '}
                        {offer.houseNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Information */}
            {offer.order && (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
                <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                  {locale === 'en' ? 'Order Information' : 'معلومات الطلب'}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <p className='text-sm text-deep-charcoal/60 mb-1'>
                      {locale === 'en' ? 'Order Number' : 'رقم الطلب'}
                    </p>
                    <p className='font-medium text-deep-charcoal'>{offer.order.orderNumber}</p>
                  </div>
                  <div>
                    <p className='text-sm text-deep-charcoal/60 mb-1'>
                      {locale === 'en' ? 'Status' : 'الحالة'}
                    </p>
                    <p className='font-medium text-deep-charcoal capitalize'>
                      {offer.order.status}
                    </p>
                  </div>
                  {offer.order.trackingNumber && (
                    <div>
                      <p className='text-sm text-deep-charcoal/60 mb-1'>
                        {locale === 'en' ? 'Tracking Number' : 'رقم التتبع'}
                      </p>
                      <p className='font-medium text-deep-charcoal'>{offer.order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className='bg-green-50 rounded-lg border border-green-200 p-6'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4 flex items-center gap-2'>
                <HiTruck className='w-5 h-5 text-green-600' />
                {locale === 'en' ? 'Payment Status' : 'حالة الدفع'}
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-deep-charcoal/60 mb-1'>
                    {locale === 'en' ? 'Status' : 'الحالة'}
                  </p>
                  <p className='text-green-600 font-medium capitalize'>
                    {offer.paymentStatus === 'completed' || offer.status === 'paid'
                      ? locale === 'en'
                        ? 'Paid'
                        : 'مدفوع'
                      : offer.paymentStatus}
                  </p>
                </div>
                {offer.moyasarPaymentId && (
                  <div>
                    <p className='text-sm text-deep-charcoal/60 mb-1'>
                      {locale === 'en' ? 'Payment ID' : 'معرف الدفع'}
                    </p>
                    <p className='font-medium text-deep-charcoal'>{offer.moyasarPaymentId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipment Proof Upload */}
            {!offer.order?.shipmentProof && (
              <div className='bg-blue-50 rounded-lg border border-blue-200 p-6'>
                <h2 className='text-xl font-semibold text-deep-charcoal mb-4 flex items-center gap-2'>
                  <HiPhoto className='w-5 h-5 text-blue-600' />
                  {locale === 'en' ? 'Upload Shipment Proof' : 'رفع إثبات الشحن'}
                </h2>
                <div className='space-y-4'>
                  {preview && (
                    <div className='relative w-full max-w-md h-64 rounded-lg overflow-hidden border border-rich-sand/30 bg-white'>
                      <Image
                        src={preview}
                        alt='Preview'
                        fill
                        className='object-contain'
                        unoptimized
                      />
                    </div>
                  )}
                  <div className='flex flex-col sm:flex-row gap-3'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      onChange={handleFileSelect}
                      className='hidden'
                      id='shipment-proof-input'
                    />
                    <label
                      htmlFor='shipment-proof-input'
                      className='flex-1 px-4 py-3 bg-white border border-rich-sand/30 rounded-lg text-sm font-medium text-deep-charcoal hover:bg-rich-sand/10 transition-colors cursor-pointer text-center'
                    >
                      {locale === 'en' ? 'Select Image' : 'اختر صورة'}
                    </label>
                    {selectedFile && (
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className='px-6 py-3 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        {isUploading
                          ? locale === 'en'
                            ? 'Uploading...'
                            : 'جاري الرفع...'
                          : locale === 'en'
                          ? 'Upload'
                          : 'رفع'}
                      </button>
                    )}
                  </div>
                  <p className='text-xs text-deep-charcoal/60'>
                    {locale === 'en'
                      ? 'Upload an image of the shipment receipt or tracking information'
                      : 'قم برفع صورة إيصال الشحن أو معلومات التتبع'}
                  </p>
                </div>
              </div>
            )}

            {/* Existing Shipment Proof */}
            {offer.order?.shipmentProof && (
              <div className='bg-green-50 rounded-lg border border-green-200 p-6'>
                <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                  {locale === 'en' ? 'Shipment Proof' : 'إثبات الشحن'}
                </h2>
                <div className='relative w-full max-w-2xl h-96 rounded-lg overflow-hidden border border-rich-sand/30 bg-white'>
                  <Image
                    src={offer.order.shipmentProof}
                    alt='Shipment Proof'
                    fill
                    className='object-contain'
                    unoptimized
                  />
                </div>
                <p className='text-sm text-green-600 mt-4'>
                  {locale === 'en'
                    ? 'Shipment proof uploaded successfully. Order status: Delivered'
                    : 'تم رفع إثبات الشحن بنجاح. حالة الطلب: تم التسليم'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70'>
              {locale === 'en' ? 'Failed to load offer details' : 'فشل تحميل تفاصيل العرض'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

