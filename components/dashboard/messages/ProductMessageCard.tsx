'use client';

import CounterOfferModal from '@/components/shared/CounterOfferModal';
import { useGetProductDetailQuery } from '@/lib/api/productsApi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { HiBanknotes, HiCheck, HiShoppingCart } from 'react-icons/hi2';
import type { ConversationUser, Message, ProductInfo } from './types';

interface ProductMessageCardProps {
  message: Message;
  messages: Message[]; // All messages to count counter offers
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
  messages,
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
  const [isCountering, setIsCountering] = useState(false);
  
  // Track the previous status to detect changes from WebSocket
  const prevStatusRef = useRef<string | undefined>(undefined);

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
  
  // Reset loading states when offer status changes (from WebSocket update)
  useEffect(() => {
    const currentStatus = message.offer?.status;
    
    // If we have a previous status and it changed, reset loading states
    if (prevStatusRef.current !== undefined && prevStatusRef.current !== currentStatus) {
      setIsAccepting(false);
      setIsRejecting(false);
      setIsCountering(false);
    }
    
    // Update the ref with current status
    prevStatusRef.current = currentStatus;
  }, [message.offer?.status]);
  
  // Timeout fallback - reset loading after 15 seconds if no response
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isAccepting || isRejecting || isCountering) {
      timeout = setTimeout(() => {
        setIsAccepting(false);
        setIsRejecting(false);
        setIsCountering(false);
      }, 15000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isAccepting, isRejecting, isCountering]);
  
  // Normalize image URL - convert cdn.dolabb.com URLs to use Next.js proxy
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    // Clean any spaces in URL first
    let trimmed = url.trim().replace(/\s+/g, '');
    if (trimmed.includes('cdn.dolabb.com')) {
      try {
        // Extract the path after cdn.dolabb.com
        const urlObj = new URL(trimmed);
        const path = urlObj.pathname + urlObj.search;
        // Use Next.js proxy route - remove leading slash if present to avoid double slashes
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `/api/cdn${cleanPath}`;
      } catch (error) {
        // If URL parsing fails, try simple string replacement
        const path = trimmed.replace('https://cdn.dolabb.com', '').replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return trimmed;
  };
  
  const productImage = productImages[0] ? normalizeImageUrl(productImages[0]) : '';

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
  const offerStatus =
    message.offer?.status ||
    message.offer?.type ||
    (message.offerId ? 'pending' : undefined);

  // Helper function to get display status - show "paid" if accepted and payment is paid
  const getDisplayStatus = (): string => {
    const status = offerStatus || '';
    const paymentStatus =
      (message.offer as any)?.payment?.status ||
      (message.offer as any)?.paymentStatus;
    if (status === 'accepted' && paymentStatus === 'paid') {
      return 'paid';
    }
    return status;
  };

  const displayStatus = getDisplayStatus();

  // Check if offer is accepted - check multiple conditions
  const isOfferAccepted =
    offerStatus === 'accepted' ||
    message.offer?.status === 'accepted' ||
    displayStatus === 'accepted' ||
    displayStatus === 'paid';

  // Check if offer is rejected
  const isOfferRejected =
    offerStatus === 'rejected' ||
    message.offer?.status === 'rejected' ||
    displayStatus === 'rejected';

  // Check if offer is pending or countered (can still be acted upon)
  // When offer is countered, both sides can still act on it (accept/reject/counter again)
  const canActOnOffer =
    !isOfferAccepted &&
    !isOfferRejected &&
    (offerStatus === 'pending' || offerStatus === 'countered' || !offerStatus);

  // Check if this is a countered offer (either has counterAmount or status is countered)
  const isCounteredOffer = offerStatus === 'countered' || !!counterAmount;

  // Count how many times this offer has been countered
  // Count messages with same offerId and status "countered" (excluding the original offer)
  const counterOfferCount = message.offerId
    ? messages.filter(
        m =>
          m.offerId === message.offerId &&
          m.offer?.status === 'countered' &&
          m.offer?.counterAmount !== undefined &&
          m.offer?.counterAmount !== null
      ).length
    : 0;

  // Check if the last counter offer was sent by the current user
  // If so, they cannot counter again until the other party responds
  const lastCounterOffer = message.offerId
    ? messages
        .filter(
          m =>
            m.offerId === message.offerId &&
            m.offer?.status === 'countered' &&
            m.offer?.counterAmount !== undefined &&
            m.offer?.counterAmount !== null
        )
        .sort((a, b) => {
          // Sort by timestamp to get the most recent counter offer
          const timeA = a.rawTimestamp ? new Date(a.rawTimestamp).getTime() : 0;
          const timeB = b.rawTimestamp ? new Date(b.rawTimestamp).getTime() : 0;
          return timeB - timeA; // Most recent first
        })[0]
    : null;

  const lastCounterWasFromMe =
    lastCounterOffer?.sender === 'me' ||
    lastCounterOffer?.senderId === user?.id;

  // Maximum counter offers allowed (4 times)
  const MAX_COUNTER_OFFERS = 4;
  const canCounterOffer =
    counterOfferCount < MAX_COUNTER_OFFERS && !lastCounterWasFromMe;
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
      // Don't reset here - wait for WebSocket response to update offer status
      // The useEffect watching message.offer?.status will reset loading
    } catch (error) {
      // Only reset on error
      setIsAccepting(false);
      throw error;
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
      // Don't reset here - wait for WebSocket response to update offer status
      // The useEffect watching message.offer?.status will reset loading
    } catch (error) {
      // Only reset on error
      setIsRejecting(false);
      throw error;
    }
  };

  const handleCounterSubmit = async (counterAmount: number) => {
    // Get offerId from multiple possible locations
    const offerId = message.offerId || message.offer?.id;

    if (!offerId || !selectedConversation?.otherUser.id) {
      console.error(
        '❌ Error: Missing offerId or receiverId for counter offer:',
        {
          messageOfferId: message.offerId,
          offerObjectId: message.offer?.id,
          finalOfferId: offerId,
          receiverId: selectedConversation?.otherUser.id,
          messageId: message.id,
          hasOfferObject: !!message.offer,
        }
      );
      return;
    }

    setIsCountering(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 Preparing to send counter offer:', {
          offerId: offerId,
          messageOfferId: message.offerId,
          offerObjectId: message.offer?.id,
          counterAmount: counterAmount,
          receiverId: selectedConversation.otherUser.id,
          hasOriginalOffer: !!message.offer,
          offerStatus: message.offer?.status,
        });
      }

      await onCounterOffer(
        offerId, // Use the resolved offerId (from message.offerId or message.offer.id)
        counterAmount,
        selectedConversation.otherUser.id,
        message.text,
        message.offer
      );
      setShowCounterModal(false);
      // Don't reset here - wait for WebSocket response to update offer status
      // The useEffect watching message.offer?.status will reset loading
    } catch (error) {
      // Only reset on error
      setIsCountering(false);
      throw error;
    }
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
          className={`w-full max-w-[92%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] ${
            message.sender === 'me'
              ? 'bg-gradient-to-br from-saudi-green via-green-600 to-green-700'
              : 'bg-white border border-rich-sand/20'
          } rounded-2xl ${
            message.sender === 'me' ? 'rounded-br-md' : 'rounded-bl-md'
          } overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300`}
        >
          {/* Card Header with Badge */}
          <div className={`px-3 sm:px-4 pt-3 sm:pt-4 pb-2 ${
            message.sender === 'me' 
              ? 'bg-gradient-to-r from-white/10 to-transparent' 
              : 'bg-gradient-to-r from-green-50 to-transparent'
          }`}>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide uppercase ${
                message.sender === 'me'
                  ? 'bg-white/20 text-white backdrop-blur-sm border border-white/20'
                  : 'bg-saudi-green/10 text-saudi-green border border-saudi-green/20'
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

          {/* Product Info Section */}
          <div className='px-3 sm:px-4 py-3'>
            <div className='flex gap-3'>
              {/* Product Image */}
              {productImage && (
                <div className='relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-xl overflow-hidden bg-gradient-to-br from-rich-sand/30 to-rich-sand/10 flex-shrink-0 ring-2 ring-white/20'>
                  {productImage.startsWith('/api/cdn') ? (
                    <img
                      src={productImage}
                      alt={productTitle}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        console.error('Product image failed to load:', productImage);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Image
                      src={productImage}
                      alt={productTitle}
                      fill
                      className='object-cover'
                      unoptimized
                      onError={() => {
                        console.error('Product image failed to load:', productImage);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Product Title & Original Price */}
              <div className='flex-1 min-w-0 flex flex-col justify-center'>
                <h4
                  className={`font-bold text-sm sm:text-base leading-snug line-clamp-2 ${
                    message.sender === 'me'
                      ? 'text-white'
                      : 'text-deep-charcoal'
                  }`}
                >
                  {productTitle}
                </h4>
                
                {/* Original Price - Inline with product */}
                {originalPrice > 0 && (message.offerId || message.offer) && (
                  <div className='mt-1'>
                    <span
                      className={`text-xs sm:text-sm line-through ${
                        message.sender === 'me'
                          ? 'text-white/50'
                          : 'text-deep-charcoal/40'
                      }`}
                    >
                      {productCurrency} {(originalPrice || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

            {(message.offerId || message.offer) && (
              <div className='px-3 sm:px-4 pb-3 space-y-2'>
                {/* Main Offer Amount - Highlighted */}
                {offerAmount > 0 && (
                  <div className={`relative py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl ${
                    message.sender === 'me'
                      ? 'bg-white/15 backdrop-blur-sm border border-white/25'
                      : 'bg-gradient-to-r from-saudi-green/10 to-green-50 border border-saudi-green/20'
                  }`}>
                    <div className='flex items-center justify-between gap-2'>
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          message.sender === 'me'
                            ? 'text-white/80'
                            : 'text-deep-charcoal/70'
                        }`}
                      >
                        {message.sender === 'me'
                          ? locale === 'en'
                            ? 'Your Offer'
                            : 'عرضك'
                          : locale === 'en'
                          ? 'Offer Amount'
                          : 'مبلغ العرض'}
                      </span>
                      <div className='flex items-baseline gap-1'>
                        <span
                          className={`text-[10px] sm:text-xs font-medium ${
                            message.sender === 'me'
                              ? 'text-white/70'
                              : 'text-saudi-green/70'
                          }`}
                        >
                          {productCurrency}
                        </span>
                        <span
                          className={`text-lg sm:text-xl md:text-2xl font-bold tabular-nums ${
                            message.sender === 'me'
                              ? 'text-white'
                              : 'text-saudi-green'
                          }`}
                        >
                          {offerAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Counter Offer Amount */}
                {counterAmount && counterAmount > 0 && (
                  <div className={`py-2 sm:py-2.5 px-3 rounded-xl ${
                    message.sender === 'me'
                      ? 'bg-yellow-400/20 border border-yellow-300/30'
                      : 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200'
                  }`}>
                    <div className='flex items-center justify-between gap-2'>
                      <span
                        className={`text-xs sm:text-sm font-medium ${
                          message.sender === 'me'
                            ? 'text-yellow-100'
                            : 'text-amber-700'
                        }`}
                      >
                        {locale === 'en' ? 'Counter Offer' : 'عرض مقابل'}
                      </span>
                      <div className='flex items-baseline gap-1'>
                        <span
                          className={`text-[10px] sm:text-xs font-medium ${
                            message.sender === 'me'
                              ? 'text-yellow-200/70'
                              : 'text-amber-600/70'
                          }`}
                        >
                          {productCurrency}
                        </span>
                        <span
                          className={`text-base sm:text-lg font-bold tabular-nums ${
                            message.sender === 'me'
                              ? 'text-yellow-100'
                              : 'text-amber-700'
                          }`}
                        >
                          {counterAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Cost */}
                {shippingCost > 0 && (
                  <div className='flex items-center justify-between py-1.5 px-1'>
                    <span
                      className={`text-[10px] sm:text-xs ${
                        message.sender === 'me'
                          ? 'text-white/50'
                          : 'text-deep-charcoal/50'
                      }`}
                    >
                      {locale === 'en' ? '+ Shipping' : '+ الشحن'}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs font-medium ${
                        message.sender === 'me'
                          ? 'text-white/60'
                          : 'text-deep-charcoal/60'
                      }`}
                    >
                      {productCurrency} {shippingCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Status Badge */}
            {displayStatus && (
              <div className='px-3 sm:px-4 pb-3'>
                <div
                  className={`inline-flex items-center gap-1.5 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold ${
                    displayStatus === 'accepted' || displayStatus === 'paid'
                      ? displayStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-green-100 text-green-700 ring-1 ring-green-200'
                      : displayStatus === 'rejected'
                      ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                      : displayStatus === 'countered'
                      ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                      : 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    displayStatus === 'accepted' || displayStatus === 'paid'
                      ? displayStatus === 'paid' ? 'bg-emerald-500' : 'bg-green-500'
                      : displayStatus === 'rejected'
                      ? 'bg-red-500'
                      : displayStatus === 'countered'
                      ? 'bg-amber-500'
                      : 'bg-blue-500 animate-pulse'
                  }`}></span>
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
              </div>
            )}

            {/* Seller side - show Accept/Counter/Reject buttons when offer can be acted upon */}
            {/* Show buttons when offer is pending or countered (not accepted/rejected) */}
            {/* Seller can act on: pending offers from buyer OR countered offers (can counter again) */}
            {isSeller &&
              (message.offerId || message.offer) &&
              canActOnOffer && (
                <div className='px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-rich-sand/10'>
                  <div className='flex flex-wrap gap-2'>
                    <button
                      onClick={handleAccept}
                      disabled={isAccepting || isRejecting || isCountering}
                      className='flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-saudi-green to-green-600 text-white rounded-xl font-semibold hover:from-saudi-green/90 hover:to-green-600/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-[0.98]'
                    >
                      <HiCheck className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                      <span className='truncate'>
                        {isAccepting
                          ? locale === 'en'
                            ? 'Accepting...'
                            : 'قبول...'
                          : locale === 'en'
                          ? 'Accept'
                          : 'قبول'}
                      </span>
                    </button>
                    {canCounterOffer ? (
                      <button
                        onClick={() => setShowCounterModal(true)}
                        disabled={isAccepting || isRejecting || isCountering}
                        className='flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-deep-charcoal to-gray-700 text-white rounded-xl font-semibold hover:from-deep-charcoal/90 hover:to-gray-700/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98]'
                      >
                        <span className='truncate'>
                          {isCountering
                            ? locale === 'en'
                              ? 'Countering...'
                              : 'عرض...'
                            : locale === 'en'
                            ? 'Counter'
                            : 'عرض مقابل'}
                        </span>
                      </button>
                    ) : lastCounterWasFromMe ? (
                      <div
                        className='flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs sm:text-sm text-center font-medium'
                        title={
                          locale === 'en'
                            ? 'Wait for the other party to respond'
                            : 'انتظر رد الطرف الآخر'
                        }
                      >
                        <span className='truncate'>{locale === 'en' ? 'Awaiting...' : 'انتظر...'}</span>
                      </div>
                    ) : null}
                    <button
                      onClick={handleReject}
                      disabled={isAccepting || isRejecting || isCountering}
                      className={`${
                        canCounterOffer ? 'px-3 sm:px-4' : 'flex-1 min-w-[80px]'
                      } py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98]`}
                    >
                      <span className='truncate'>
                        {isRejecting
                          ? locale === 'en'
                            ? 'Rejecting...'
                            : 'رفض...'
                          : locale === 'en'
                          ? 'Reject'
                          : 'رفض'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

            {/* Buyer side - show Accept/Counter/Reject buttons when offer is countered */}
            {/* Show buttons when offer is countered and can still be acted upon (not accepted/rejected) */}
            {!isSeller &&
              (message.offerId || message.offer) &&
              isCounteredOffer &&
              canActOnOffer && (
                <div className='px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-rich-sand/10'>
                  <div className='flex flex-wrap gap-2'>
                    <button
                      onClick={handleAccept}
                      disabled={isAccepting || isRejecting || isCountering}
                      className='flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-saudi-green to-green-600 text-white rounded-xl font-semibold hover:from-saudi-green/90 hover:to-green-600/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-[0.98]'
                    >
                      <HiCheck className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                      <span className='truncate'>
                        {isAccepting
                          ? locale === 'en'
                            ? 'Accepting...'
                            : 'قبول...'
                          : locale === 'en'
                          ? 'Accept'
                          : 'قبول'}
                      </span>
                    </button>
                    {canCounterOffer ? (
                      <button
                        onClick={() => setShowCounterModal(true)}
                        disabled={isAccepting || isRejecting || isCountering}
                        className='flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98]'
                      >
                        <span className='truncate'>
                          {isCountering
                            ? locale === 'en'
                              ? 'Countering...'
                              : 'عرض...'
                            : locale === 'en'
                            ? 'Counter'
                            : 'عرض مقابل'}
                        </span>
                      </button>
                    ) : lastCounterWasFromMe ? (
                      <div
                        className='flex-1 min-w-[80px] px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-500 rounded-xl text-xs sm:text-sm text-center font-medium'
                        title={
                          locale === 'en'
                            ? 'Wait for the other party to respond'
                            : 'انتظر رد الطرف الآخر'
                        }
                      >
                        <span className='truncate'>{locale === 'en' ? 'Awaiting...' : 'انتظر...'}</span>
                      </div>
                    ) : null}
                    <button
                      onClick={handleReject}
                      disabled={isAccepting || isRejecting || isCountering}
                      className={`${
                        canCounterOffer ? 'px-3 sm:px-4' : 'flex-1 min-w-[80px]'
                      } py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98]`}
                    >
                      <span className='truncate'>
                        {isRejecting
                          ? locale === 'en'
                            ? 'Rejecting...'
                            : 'رفض...'
                          : locale === 'en'
                          ? 'Reject'
                          : 'رفض'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

            {/* Buyer Checkout Button */}
            {!isSeller &&
              (message.offerId || message.offer) &&
              isOfferAccepted && (
                <div className='px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-white/10'>
                  {(() => {
                    const productSellerId =
                      (productData as any)?.seller?.id ||
                      (typeof productData === 'object' && productData !== null
                        ? (productData as any).sellerId
                        : null);
                    const canPurchase =
                      !user?.id ||
                      !productSellerId ||
                      user.id !== productSellerId;

                    return !canPurchase ? (
                      <div className='w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 text-white/70 rounded-xl text-xs sm:text-sm text-center font-medium'>
                        {locale === 'en'
                          ? 'This is your own product'
                          : 'هذا منتجك الخاص'}
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
                        className='w-full px-4 py-2.5 sm:py-3 bg-white text-saudi-green rounded-xl font-bold hover:bg-gray-50 transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]'
                      >
                        <HiShoppingCart className='w-4 h-4 sm:w-5 sm:h-5' />
                        {locale === 'en'
                          ? 'Proceed to Checkout'
                          : 'متابعة الدفع'}
                      </button>
                    );
                  })()}
                </div>
              )}

            {/* Seller View Status Button */}
            {isSeller &&
              (message.offerId || message.offer) &&
              isOfferAccepted && (
                <div className='px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-rich-sand/10'>
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
                    className='w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-deep-charcoal to-gray-700 text-white rounded-xl font-bold hover:from-deep-charcoal/90 hover:to-gray-700/90 transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]'
                  >
                    <HiBanknotes className='w-4 h-4 sm:w-5 sm:h-5' />
                    {locale === 'en' ? 'View Order Status' : 'عرض حالة الطلب'}
                  </button>
                </div>
              )}
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
          isLoading={isCountering}
          currency={productCurrency}
        />
      )}
    </>
  );
}
