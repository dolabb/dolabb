'use client';

import CounterOfferModal from '@/components/shared/CounterOfferModal';
import { useGetProductDetailQuery } from '@/lib/api/productsApi';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  HiBanknotes,
  HiCheck,
  HiShoppingCart,
} from 'react-icons/hi2';
import { formatMessageTime } from './utils';
import type {
  ConversationUser,
  Message,
  ProductInfo,
} from './types';

interface ProductMessageCardProps {
  message: Message;
  locale: string;
  user: any;
  selectedConversation: ConversationUser | null;
  onAcceptOffer: (
    offerId: string,
    receiverId: string,
    text?: string
  ) => Promise<void>;
  onCounterOffer: (
    offerId: string,
    counterAmount: number,
    receiverId: string,
    text?: string,
    originalOffer?: any
  ) => Promise<void>;
  onRejectOffer: (
    offerId: string,
    receiverId: string,
    text?: string
  ) => Promise<void>;
  sendOffer: (
    productId: string,
    offerAmount: number,
    receiverId: string,
    shippingDetails?: any
  ) => Promise<void>;
}

export default function ProductMessageCard({
  message,
  locale,
  user,
  selectedConversation,
  onAcceptOffer,
  onCounterOffer,
  onRejectOffer,
  sendOffer,
}: ProductMessageCardProps) {
  const router = useRouter();
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Use offer.product if available, otherwise fetch product details
  const offerProduct = message.offer?.product;
  const productId =
    message.productId ||
    message.offer?.productId ||
    (typeof offerProduct === 'object' && offerProduct !== null
      ? (offerProduct as ProductInfo).id
      : undefined);

  // Fetch product details only if not in offer object
  const { data: product } = useGetProductDetailQuery(productId || '', {
    skip: !productId || !!offerProduct,
  });

  // Get product data from offer or fetched product
  const productData =
    typeof offerProduct === 'object' && offerProduct !== null
      ? (offerProduct as ProductInfo)
      : product;

  // Get product images
  const getProductImages = (): string[] => {
    if (
      typeof offerProduct === 'object' &&
      offerProduct !== null &&
      (offerProduct as ProductInfo).images &&
      (offerProduct as ProductInfo).images!.length > 0
    ) {
      return (offerProduct as ProductInfo).images!;
    }
    if (
      typeof offerProduct === 'object' &&
      offerProduct !== null &&
      (offerProduct as ProductInfo).image
    ) {
      return [(offerProduct as ProductInfo).image!];
    }
    if (!product) return [];
    const productWithImages = product as {
      Images?: string[];
      images?: string[];
    };
    const images = productWithImages.Images || productWithImages.images || [];
    return images.filter(
      img => img && img.trim() !== '' && img !== 'undefined' && img !== 'null'
    );
  };

  const productImages = getProductImages();
  const productImage = productImages[0] || '';

  // Extract offer data
  const offerAmount = message.offer?.offerAmount || message.offer?.offer || 0;
  const originalPrice =
    message.offer?.originalPrice ||
    message.offer?.price ||
    (typeof message.offer?.product === 'object' &&
    message.offer.product !== null
      ? (message.offer.product as ProductInfo).originalPrice ||
        (message.offer.product as ProductInfo).price
      : undefined) ||
    productData?.originalPrice ||
    productData?.price ||
    0;
  const productTitle =
    (typeof message.offer?.product === 'string'
      ? message.offer.product
      : typeof message.offer?.product === 'object' &&
        message.offer.product !== null
      ? (message.offer.product as ProductInfo).title
      : undefined) ||
    productData?.title ||
    message.text ||
    'Product';
  const counterAmount = message.offer?.counterAmount;
  // Get offer status from multiple possible locations
  const offerStatus = message.offer?.status || 
                      message.offer?.type || 
                      (message.offerId ? 'pending' : undefined);
  
  // Helper function to get display status - show "paid" if accepted and payment is paid
  const getDisplayStatus = (): string => {
    const status = offerStatus || '';
    const paymentStatus = (message.offer as any)?.payment?.status || (message.offer as any)?.paymentStatus;
    if (status === 'accepted' && paymentStatus === 'paid') {
      return 'paid';
    }
    return status;
  };
  
  const displayStatus = getDisplayStatus();
  
  // Check if offer is accepted - check multiple conditions
  const isOfferAccepted = offerStatus === 'accepted' || 
                          message.offer?.status === 'accepted' ||
                          displayStatus === 'accepted' ||
                          displayStatus === 'paid';
  const productSize =
    message.offer?.size ||
    (typeof message.offer?.product === 'object' &&
    message.offer.product !== null
      ? (message.offer.product as ProductInfo).size
      : undefined) ||
    productData?.size;
  const shippingCost =
    message.offer?.shippingCost || message.offer?.shipping || 0;
  const productCurrency =
    (typeof message.offer?.product === 'object' &&
    message.offer.product !== null
      ? (message.offer.product as ProductInfo).currency
      : undefined) || 'SAR';

  const handleAccept = async () => {
    if (!message.offerId || !selectedConversation?.otherUser.id) return;
    setIsAccepting(true);
    try {
      await onAcceptOffer(
        message.offerId,
        selectedConversation.otherUser.id,
        message.text
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!message.offerId || !selectedConversation?.otherUser.id) return;
    setIsRejecting(true);
    try {
      await onRejectOffer(
        message.offerId,
        selectedConversation.otherUser.id,
        message.text
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCounterSubmit = async (counterAmount: number) => {
    if (!message.offerId || !selectedConversation?.otherUser.id) return;
    await onCounterOffer(
      message.offerId,
      counterAmount,
      selectedConversation.otherUser.id,
      message.text,
      message.offer
    );
    setShowCounterModal(false);
  };

  const isSeller = user?.role === 'seller';
  const isMyMessage = message.sender === 'me';

  return (
    <>
      <div
        className={`flex w-full ${
          message.sender === 'me' ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`max-w-[75%] md:max-w-[60%] ${
            message.sender === 'me'
              ? 'bg-gradient-to-br from-saudi-green to-green-600 text-white'
              : 'bg-off-white border border-rich-sand/30 text-deep-charcoal'
          } rounded-lg ${
            message.sender === 'me' ? 'rounded-br-sm' : 'rounded-bl-sm'
          } overflow-hidden shadow-lg relative`}
        >
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              message.sender === 'me' ? 'bg-white/30' : 'bg-saudi-green'
            }`}
          ></div>

          <div className='p-4 space-y-3 pl-5'>
            <div className='flex items-start justify-between gap-2 mb-2'>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  message.sender === 'me'
                    ? 'bg-white/25 text-white backdrop-blur-sm'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {message.sender === 'me'
                  ? locale === 'en'
                    ? 'Offer Sent'
                    : 'تم إرسال العرض'
                  : locale === 'en'
                  ? 'Received Offer'
                  : 'عرض مستلم'}
              </span>
            </div>

            <div className='flex gap-3'>
              {productImage && (
                <div className='relative w-20 h-20 rounded-lg overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                  <Image
                    src={productImage}
                    alt={productTitle}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </div>
              )}

              <div className='flex-1 min-w-0'>
                <h4
                  className={`font-bold text-base ${
                    message.sender === 'me'
                      ? 'text-white'
                      : 'text-deep-charcoal'
                  }`}
                >
                  {productTitle}
                </h4>
              </div>
            </div>

            {(message.offerId || message.offer) && (
              <div className='space-y-3'>
                {originalPrice > 0 && (
                  <div className='flex items-center justify-between py-2 px-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20'>
                    <span
                      className={`text-sm ${
                        message.sender === 'me'
                          ? 'text-white/70'
                          : 'text-deep-charcoal/60'
                      }`}
                    >
                      {locale === 'en' ? 'Original Price' : 'السعر الأصلي'}
                    </span>
                    <span
                      className={`text-base font-bold line-through ${
                        message.sender === 'me'
                          ? 'text-white/60'
                          : 'text-deep-charcoal/50'
                      }`}
                    >
                      {productCurrency} {(originalPrice || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {offerAmount > 0 && (
                  <div className='relative py-3 px-4 rounded-xl bg-gradient-to-r from-white/15 to-white/5 border-2 border-white/30 shadow-lg'>
                    <div className='flex items-center justify-between'>
                      <span
                        className={`text-sm font-semibold ${
                          message.sender === 'me'
                            ? 'text-white/90'
                            : 'text-deep-charcoal'
                        }`}
                      >
                        {message.sender === 'me'
                          ? locale === 'en'
                            ? 'Your Offer'
                            : 'عرضك'
                          : locale === 'en'
                          ? 'Received Offer'
                          : 'عرض مستلم'}
                      </span>
                      <span
                        className={`text-2xl font-extrabold ${
                          message.sender === 'me'
                            ? 'text-white'
                            : 'text-saudi-green'
                        }`}
                      >
                        {productCurrency} {offerAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {counterAmount && counterAmount > 0 && (
                  <div className='flex items-center justify-between py-2.5 px-3 rounded-lg bg-yellow-100/80 border-2 border-yellow-300/50'>
                    <span
                      className={`text-sm font-semibold ${
                        message.sender === 'me'
                          ? 'text-white'
                          : 'text-yellow-800'
                      }`}
                    >
                      {locale === 'en' ? 'Counter Offer' : 'عرض مقابل'}:
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        message.sender === 'me'
                          ? 'text-white'
                          : 'text-yellow-800'
                      }`}
                    >
                      {productCurrency} {counterAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {shippingCost > 0 && (
                  <div className='flex items-center justify-between py-1.5 px-2'>
                    <span
                      className={`text-xs ${
                        message.sender === 'me'
                          ? 'text-white/60'
                          : 'text-deep-charcoal/50'
                      }`}
                    >
                      {locale === 'en' ? 'Shipping' : 'الشحن'}:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        message.sender === 'me'
                          ? 'text-white/80'
                          : 'text-deep-charcoal/70'
                      }`}
                    >
                      +{productCurrency} {shippingCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {displayStatus && (
              <div
                className={`text-xs px-2 py-1 rounded-full inline-block ${
                  displayStatus === 'accepted' || displayStatus === 'paid'
                    ? displayStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-green-100 text-green-700'
                    : displayStatus === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : displayStatus === 'countered'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {displayStatus === 'paid'
                  ? locale === 'en'
                    ? 'Paid'
                    : 'مدفوع'
                  : displayStatus === 'accepted'
                  ? locale === 'en'
                    ? 'Accepted'
                    : 'مقبول'
                  : displayStatus === 'rejected'
                  ? locale === 'en'
                    ? 'Rejected'
                    : 'مرفوض'
                  : displayStatus === 'countered'
                  ? locale === 'en'
                    ? 'Countered'
                    : 'عرض مقابل'
                  : locale === 'en'
                  ? 'Pending'
                  : 'قيد الانتظار'}
              </div>
            )}

            {/* Seller receiving offer from buyer - show Accept/Counter/Reject buttons */}
            {!isMyMessage &&
              isSeller &&
              (message.offerId || message.offer) &&
              offerStatus !== 'accepted' &&
              offerStatus !== 'rejected' &&
              offerStatus !== 'countered' && (
                <div className='flex gap-2 pt-3 border-t border-rich-sand/20'>
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting || isRejecting}
                    className='flex-1 px-4 py-2.5 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm flex items-center justify-center gap-2'
                  >
                    <HiCheck className='w-4 h-4' />
                    {isAccepting
                      ? locale === 'en'
                        ? 'Accepting...'
                        : 'جاري القبول...'
                      : locale === 'en'
                      ? 'Accept'
                      : 'قبول'}
                  </button>
                  <button
                    onClick={() => setShowCounterModal(true)}
                    disabled={isAccepting || isRejecting}
                    className='flex-1 px-4 py-2.5 bg-deep-charcoal text-white rounded-lg font-medium hover:bg-deep-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm'
                  >
                    {locale === 'en' ? 'Counter' : 'عرض مقابل'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isAccepting || isRejecting}
                    className='px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm'
                  >
                    {isRejecting
                      ? locale === 'en'
                        ? 'Rejecting...'
                        : 'جاري الرفض...'
                      : locale === 'en'
                      ? 'Reject'
                      : 'رفض'}
                  </button>
                </div>
              )}

            {!isMyMessage &&
              !isSeller &&
              (message.offerId || message.offer) &&
              (counterAmount || offerStatus === 'countered') &&
              offerStatus !== 'accepted' &&
              offerStatus !== 'rejected' && (
                <div className='flex gap-2 pt-2 border-t border-white/20'>
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting || isRejecting}
                    className='flex-1 px-3 py-2 bg-white text-saudi-green rounded-lg font-medium hover:bg-rich-sand/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm'
                  >
                    {isAccepting
                      ? locale === 'en'
                        ? 'Accepting...'
                        : 'جاري القبول...'
                      : locale === 'en'
                      ? 'Accept Counter'
                      : 'قبول العرض المقابل'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isAccepting || isRejecting}
                    className='flex-1 px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm'
                  >
                    {isRejecting
                      ? locale === 'en'
                        ? 'Rejecting...'
                        : 'جاري الرفض...'
                      : locale === 'en'
                      ? 'Reject'
                      : 'رفض'}
                  </button>
                </div>
              )}

            {!isSeller &&
              (message.offerId || message.offer) &&
              isOfferAccepted && (
                <div className='flex gap-2 pt-3 border-t border-rich-sand/20'>
                  {(() => {
                    const productSellerId =
                      (productData as any)?.seller?.id ||
                      (typeof productData === 'object' && productData !== null
                        ? (productData as any).sellerId
                        : null);
                    const canPurchase =
                      !user?.id || !productSellerId || user.id !== productSellerId;

                    return !canPurchase ? (
                      <div className='flex-1 px-4 py-2.5 bg-rich-sand/20 border border-rich-sand/40 text-deep-charcoal/70 rounded-lg text-sm text-center'>
                        {locale === 'en'
                          ? 'This is your own product. You cannot purchase it.'
                          : 'هذا منتجك الخاص. لا يمكنك شرائه.'}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          const params = new URLSearchParams({
                            offerId: message.offerId || message.offer?.id || '',
                            product: productTitle || '',
                            size: productSize || '',
                            price: String(originalPrice || 0),
                            offerPrice: String(offerAmount || 0),
                            shipping: String(shippingCost || 0),
                          });
                          router.push(
                            `/${locale}/checkout?${params.toString()}`
                          );
                        }}
                        className='flex-1 px-4 py-2.5 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg'
                      >
                        <HiShoppingCart className='w-4 h-4' />
                        {locale === 'en'
                          ? 'View Checkout Page'
                          : 'عرض صفحة الدفع'}
                      </button>
                    );
                  })()}
                </div>
              )}

            {isSeller &&
              (message.offerId || message.offer) &&
              isOfferAccepted && (
                <div className='flex gap-2 pt-3 border-t border-rich-sand/20'>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams({
                        offerId: message.offerId || message.offer?.id || '',
                        product: productTitle || '',
                      });
                      router.push(
                        `/${locale}/order-status?${params.toString()}`
                      );
                    }}
                    className='flex-1 px-4 py-2.5 bg-deep-charcoal text-white rounded-lg font-medium hover:bg-deep-charcoal/90 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg'
                  >
                    <HiBanknotes className='w-4 h-4' />
                    {locale === 'en' ? 'View Status' : 'عرض الحالة'}
                  </button>
                </div>
              )}

            <div
              className={`flex items-center gap-1.5 pt-2 border-t ${
                message.sender === 'me'
                  ? 'border-white/20 justify-end'
                  : 'border-rich-sand/20 justify-start'
              }`}
            >
              <p
                className={`text-xs ${
                  message.sender === 'me'
                    ? 'text-white/70'
                    : 'text-deep-charcoal/60'
                }`}
              >
                {message.rawTimestamp 
                  ? formatMessageTime(message.rawTimestamp, locale)
                  : (message.timestamp || (locale === 'en' ? 'Just now' : 'الآن'))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showCounterModal && message.offerId && (
        <CounterOfferModal
          isOpen={showCounterModal}
          onClose={() => setShowCounterModal(false)}
          originalOfferAmount={
            offerAmount ||
            parseFloat(message.text?.replace(/[^\d.]/g, '') || '0') ||
            0
          }
          productTitle={productTitle}
          onSubmit={handleCounterSubmit}
        />
      )}
    </>
  );
}

