'use client';

import CounterOfferModal from '@/components/shared/CounterOfferModal';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  type Message as ApiMessage,
} from '@/lib/api/chatApi';
import { apiClient } from '@/lib/api/client';
import { useGetProductDetailQuery } from '@/lib/api/productsApi';
import { useAppSelector } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HiArrowLeft,
  HiBanknotes,
  HiCheck,
  HiPaperAirplane,
  HiPaperClip,
  HiShoppingCart,
  HiXMark,
} from 'react-icons/hi2';

// WebSocket URL - use the correct backend URL
// All WebSocket connections require authentication token in query params
const WS_BASE_URL = 'wss://dolabb-backend-2vsj.onrender.com';

interface ProductInfo {
  id: string;
  title: string;
  image: string;
  images?: string[];
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: string;
  condition?: string;
}

interface OfferInfo {
  id: string;
  offerAmount?: number;
  offer?: number; // Backend uses "offer" instead of "offerAmount"
  originalPrice?: number;
  price?: number; // Backend uses "price" for original price
  counterAmount?: number;
  status?: 'pending' | 'accepted' | 'rejected' | 'countered';
  type?: string; // Backend uses "type" instead of "status"
  product?: ProductInfo | string; // Backend sends product as string, but can also be object
  productId?: string;
  shippingCost?: number;
  shipping?: number; // Backend uses "shipping" instead of "shippingCost"
  expirationDate?: string;
  expires?: string; // Backend uses "expires" instead of "expirationDate"
  size?: string; // Backend includes size directly in offer
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
  attachments?: string[];
  senderId?: string;
  receiverId?: string;
  isDelivered?: boolean;
  isRead?: boolean;
  offerId?: string;
  productId?: string;
  offer?: OfferInfo; // New: Full offer object with product details
  messageType?: string; // 'offer', 'text', etc.
}

interface Offer {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  offerAmount: number;
  originalPrice?: number;
  counterAmount?: number;
  status: 'pending' | 'countered' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

interface AttachedFile {
  id: string;
  file: File;
  preview: string;
}

interface ConversationUser {
  id: string;
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    profileImage?: string;
    status?: 'active' | 'inactive' | 'offline';
    isOnline?: boolean;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: string;
  productId?: string | null;
}

// Helper function to format username (remove @ and _, capitalize)
const formatUsername = (username: string): string => {
  if (!username) return '';
  // Remove @ and _ characters
  let formatted = username.replace(/[@_]/g, ' ');
  // Capitalize first letter of each word
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to safely parse and format date (for conversation list)
const formatDate = (
  dateString: string | undefined | null,
  locale: string
): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Show relative time for conversation list
    if (diffMins < 1) {
      return locale === 'en' ? 'Just now' : 'الآن';
    } else if (diffMins < 60) {
      return locale === 'en' ? `${diffMins}m ago` : `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return locale === 'en' ? `${diffHours}h ago` : `منذ ${diffHours} ساعة`;
    } else if (diffDays < 7) {
      return locale === 'en' ? `${diffDays}d ago` : `منذ ${diffDays} يوم`;
    } else {
      // Show date if older than a week
      return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// Helper function to format message timestamp (always shows actual local time)
const formatMessageTime = (
  dateString: string | undefined | null,
  locale: string
): string => {
  if (!dateString) return '';

  try {
    // Parse the date string - handles UTC and local timezone automatically
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }

    // Always show actual local time in 12-hour format
    return date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
};

// Product Message Card Component
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
    text?: string
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

function ProductMessageCard({
  message,
  locale,
  user,
  selectedConversation,
  onAcceptOffer,
  onCounterOffer,
  onRejectOffer,
  sendOffer,
}: ProductMessageCardProps) {
  const isRTL = locale === 'ar';
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
  const { data: product, isLoading: isLoadingProduct } =
    useGetProductDetailQuery(productId || '', {
      skip: !productId || !!offerProduct,
    });

  // Get product data from offer or fetched product
  // If offerProduct is a string, we'll use it as title, otherwise use the object
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

  // Log offer data for debugging
  console.log(
    '🎴 PRODUCT MESSAGE CARD - Message:',
    JSON.stringify(message, null, 2)
  );
  console.log(
    '🎴 PRODUCT MESSAGE CARD - Offer Object:',
    JSON.stringify(message.offer, null, 2)
  );
  console.log(
    '🎴 PRODUCT MESSAGE CARD - Product Data:',
    JSON.stringify(productData, null, 2)
  );
  console.log('🎴 PRODUCT MESSAGE CARD - Offer ID:', message.offerId);
  console.log('🎴 PRODUCT MESSAGE CARD - Product ID:', message.productId);

  const productImages = getProductImages();
  const productImage = productImages[0] || '';

  // Handle both API format and WebSocket format
  // API format: { offerAmount, originalPrice, counterAmount, status, shippingCost, expirationDate, product: {...} }
  // WebSocket format: { offer, price, shipping, expires, product: string }
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
  const productPrice =
    (typeof message.offer?.product === 'object' &&
    message.offer.product !== null
      ? (message.offer.product as ProductInfo).price
      : undefined) ||
    message.offer?.price ||
    productData?.price ||
    originalPrice;
  // Handle product as string or object
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
  const offerStatus = message.offer?.status || message.offer?.type;
  const productSize =
    message.offer?.size ||
    (typeof message.offer?.product === 'object' &&
    message.offer.product !== null
      ? (message.offer.product as ProductInfo).size
      : undefined) ||
    productData?.size;
  const shippingCost =
    message.offer?.shippingCost || message.offer?.shipping || 0;
  const expirationDate =
    message.offer?.expirationDate || message.offer?.expires;
  const productCondition =
    (typeof message.offer?.product === 'object' &&
    message.offer.product !== null
      ? (message.offer.product as ProductInfo).condition
      : undefined) || productData?.condition;
  const productBrand =
    typeof message.offer?.product === 'object' && message.offer.product !== null
      ? (message.offer.product as any).brand
      : undefined;
  const productCurrency =
    (typeof message.offer?.product === 'object' &&
    message.offer.product !== null
      ? (message.offer.product as ProductInfo).currency
      : undefined) || 'SAR';

  console.log('🎴 PRODUCT MESSAGE CARD - Extracted Values:', {
    productImage,
    productPrice,
    originalPrice,
    productTitle,
    offerAmount,
    counterAmount,
    offerStatus,
    productSize,
    shippingCost,
    expirationDate,
    rawOffer: message.offer, // Log raw offer for debugging
  });

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
      message.text
    );
    setShowCounterModal(false);
  };

  // Check if current user is the seller (can accept/reject offers)
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
          {/* Vertical Green Bar on Left */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${
              message.sender === 'me' ? 'bg-white/30' : 'bg-saudi-green'
            }`}
          ></div>

          {/* Product Info */}
          <div className='p-4 space-y-3 pl-5'>
            {/* Header with badge */}
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

            {/* Product Image and Title Row */}
            <div className='flex gap-3'>
              {/* Product Image */}
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

              {/* Title */}
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

            {/* Price Information - Enhanced UI with all API data */}
            {(message.offerId || message.offer) && (
              <div className='space-y-3'>
                {/* Original Price */}
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

                {/* Offer Amount - Highlighted */}
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

                {/* Counter Offer - If exists */}
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

                {/* Shipping Cost - Only if exists */}
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

            {/* Offer Status */}
            {offerStatus && (
              <div
                className={`text-xs px-2 py-1 rounded-full inline-block ${
                  offerStatus === 'accepted'
                    ? 'bg-green-100 text-green-700'
                    : offerStatus === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : offerStatus === 'countered'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {offerStatus === 'accepted'
                  ? locale === 'en'
                    ? 'Accepted'
                    : 'مقبول'
                  : offerStatus === 'rejected'
                  ? locale === 'en'
                    ? 'Rejected'
                    : 'مرفوض'
                  : offerStatus === 'countered'
                  ? locale === 'en'
                    ? 'Countered'
                    : 'عرض مقابل'
                  : locale === 'en'
                  ? 'Pending'
                  : 'قيد الانتظار'}
              </div>
            )}

            {/* Action Buttons - Show for seller when receiving offers */}
            {!isMyMessage &&
              isSeller &&
              (message.offerId || message.offer) &&
              offerStatus !== 'accepted' &&
              offerStatus !== 'rejected' && (
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

            {/* Action Buttons - Show for buyer when receiving counter offers */}
            {!isMyMessage &&
              !isSeller &&
              (message.offerId || message.offer) &&
              counterAmount &&
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

            {/* View Checkout Button - Show for buyer when offer is accepted */}
            {!isSeller &&
              (message.offerId || message.offer) &&
              (offerStatus === 'accepted' ||
                message.offer?.status === 'accepted') &&
              (() => {
                // Check if user is the product seller
                const productSellerId =
                  (productData as any)?.seller?.id ||
                  (typeof productData === 'object' && productData !== null
                    ? (productData as any).sellerId
                    : null);
                const canPurchase =
                  !user?.id || !productSellerId || user.id !== productSellerId;

                return (
                  <div className='flex gap-2 pt-3 border-t border-rich-sand/20'>
                    {!canPurchase ? (
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
                    )}
                  </div>
                );
              })()}

            {/* View Status Button - Show for seller when offer is accepted */}
            {isSeller &&
              (message.offerId || message.offer) &&
              (offerStatus === 'accepted' ||
                message.offer?.status === 'accepted') && (
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

            {/* Timestamp */}
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
                {message.timestamp || (locale === 'en' ? 'Just now' : 'الآن')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Counter Offer Modal */}
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

export default function MessagesContent() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const user = useAppSelector(state => state.auth.user);
  const token =
    useAppSelector(state => state.auth.token) ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationUser | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [otherUserOnlineStatus, setOtherUserOnlineStatus] =
    useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const hasAutoSelectedRef = useRef<boolean>(false);

  // Fetch conversations
  const {
    data: conversationsData,
    refetch: refetchConversations,
    isLoading: isLoadingConversations,
  } = useGetConversationsQuery();

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    refetch: refetchMessages,
    isLoading: isLoadingMessages,
    isFetching: isFetchingMessages,
    error: messagesError,
  } = useGetMessagesQuery(
    { conversationId: conversationId || '' },
    { skip: !conversationId }
  );

  // Debug logging for query state
  useEffect(() => {
    console.log('🔍 MESSAGES QUERY STATE:', {
      conversationId,
      isLoading: isLoadingMessages,
      isFetching: isFetchingMessages,
      hasData: !!messagesData,
      messagesCount: messagesData?.messages?.length || 0,
      error: messagesError,
      skip: !conversationId,
    });
  }, [
    conversationId,
    isLoadingMessages,
    isFetchingMessages,
    messagesData,
    messagesError,
  ]);

  // Refetch messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      console.log(
        '🔄 Conversation ID changed, refetching messages:',
        conversationId
      );
      // Small delay to ensure the query hook is ready
      const timeoutId = setTimeout(() => {
        refetchMessages()
          .then(result => {
            console.log('🔄 Refetch result:', result);
            if (result.data) {
              console.log('🔄 Refetch returned data:', result.data);
            } else if (result.error) {
              console.error('🔄 Refetch error:', result.error);
              // Check if it's a timeout error
              const errorData = (result.error as any)?.data;
              if (
                errorData === 'timeout of 30000ms exceeded' ||
                errorData === 'timeout of 60000ms exceeded' ||
                (typeof errorData === 'string' && errorData.includes('timeout'))
              ) {
                toast.error(
                  locale === 'en'
                    ? 'Request timed out. The server is taking too long to respond. Please try again.'
                    : 'انتهت مهلة الطلب. الخادم يستغرق وقتاً طويلاً للرد. يرجى المحاولة مرة أخرى.'
                );
              }
            } else {
              console.log('🔄 Refetch returned no data');
            }
          })
          .catch(error => {
            console.error('🔄 Refetch error:', error);
            toast.error(
              locale === 'en'
                ? 'Failed to load messages. Please try again.'
                : 'فشل تحميل الرسائل. يرجى المحاولة مرة أخرى.'
            );
          });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [conversationId, refetchMessages, locale]);

  const [sendMessageMutation] = useSendMessageMutation();

  // Convert API conversations to local format
  const conversations: ConversationUser[] =
    conversationsData?.conversations?.map((conv: any) => {
      const otherUser = conv.otherUser || {
        id: conv.participants?.find((p: any) => p.id !== user?.id)?.id || '',
        username:
          conv.participants?.find((p: any) => p.id !== user?.id)?.username ||
          'Unknown',
        profileImage: conv.participants?.find((p: any) => p.id !== user?.id)
          ?.profileImage,
        status: conv.participants?.find((p: any) => p.id !== user?.id)?.status,
        isOnline: conv.participants?.find((p: any) => p.id !== user?.id)
          ?.isOnline,
      };

      // Use online users list from WebSocket if available, otherwise use API status
      const isOnline =
        selectedConversation?.id === conv.id
          ? onlineUsers.includes(otherUser.id) || otherUserOnlineStatus
          : onlineUsers.includes(otherUser.id) ||
            (otherUser.isOnline !== undefined
              ? otherUser.isOnline
              : conv.otherUser?.status === 'active');

      return {
        id: conv.id || conv.conversationId,
        conversationId: conv.conversationId || conv.id,
        otherUser: {
          ...otherUser,
          status: otherUser.status || conv.otherUser?.status,
          isOnline: isOnline,
        },
        lastMessage: conv.lastMessage || conv.lastMessage?.text,
        lastMessageAt: conv.lastMessageAt || conv.updatedAt,
        unreadCount: conv.unreadCount?.toString() || '0',
        productId: conv.productId,
      };
    }) || [];

  // Convert API messages to local format
  useEffect(() => {
    console.log('📥 MESSAGES EFFECT - Conversation ID:', conversationId);
    console.log('📥 MESSAGES EFFECT - Messages Data:', messagesData);
    console.log('📥 MESSAGES EFFECT - User:', user?.id);
    console.log(
      '📥 MESSAGES EFFECT - Current Messages Count:',
      messages.length
    );

    // Only process if we have messagesData and user
    if (messagesData && user) {
      console.log(
        '📥 API MESSAGES RESPONSE - Full Response:',
        JSON.stringify(messagesData, null, 2)
      );
      console.log(
        '📥 API MESSAGES RESPONSE - Messages Array:',
        messagesData.messages
      );
      console.log(
        '📥 API MESSAGES RESPONSE - Total Messages:',
        messagesData.messages?.length || 0
      );

      // Handle both empty array and undefined
      const messagesArray = messagesData.messages || [];

      console.log(
        '📥 MESSAGES EFFECT - Processing messages array, length:',
        messagesArray.length
      );

      if (messagesArray.length === 0) {
        console.log(
          '📥 MESSAGES EFFECT - Empty messages array, setting empty state'
        );
        setMessages([]);
        return;
      }

      const formattedMessages: Message[] = messagesArray.map(
        (msg: ApiMessage) => {
          // Check if this is an offer message - only if it has actual offer data
          const isOfferMessage = !!(
            (msg.offerId && (msg as any).offer) ||
            ((msg as any).messageType === 'offer' && (msg as any).offer) ||
            ((msg as any).offer &&
              ((msg as any).offer.offerAmount || (msg as any).offer.offer))
          );

          if (isOfferMessage) {
            console.log(
              '📥 API MESSAGE WITH OFFER - Message:',
              JSON.stringify(msg, null, 2)
            );
            console.log('📥 API MESSAGE WITH OFFER - Offer ID:', msg.offerId);
            console.log(
              '📥 API MESSAGE WITH OFFER - Product ID:',
              msg.productId
            );
            console.log(
              '📥 API MESSAGE WITH OFFER - Offer Object:',
              (msg as any).offer
            );
          }

          const formattedMessage: Message = {
            id: msg.id,
            text: isOfferMessage ? '' : msg.text, // Hide text for offer messages
            sender: (msg.senderId === user.id ? 'me' : 'other') as
              | 'me'
              | 'other',
            timestamp: formatMessageTime(msg.createdAt, locale),
            attachments: msg.attachments || [],
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            offerId: msg.offerId || (msg as any).offer?.id || undefined,
            productId:
              msg.productId ||
              (msg as any).offer?.productId ||
              (msg as any).offer?.product?.id ||
              undefined,
            offer: (msg as any).offer || undefined, // Include offer object if present
            // Default to delivered for sent messages (API may not provide this yet)
            isDelivered: msg.senderId === user.id ? true : undefined,
            isRead: msg.senderId === user.id ? false : undefined, // Can be updated when API provides read receipts
          };

          if (isOfferMessage) {
            console.log(
              '📥 API MESSAGE WITH OFFER - Formatted Message:',
              JSON.stringify(formattedMessage, null, 2)
            );
          }

          return formattedMessage;
        }
      );

      console.log(
        '📥 API MESSAGES RESPONSE - Formatted Messages:',
        JSON.stringify(formattedMessages, null, 2)
      );
      console.log(
        '📥 API MESSAGES RESPONSE - Total Formatted Messages:',
        formattedMessages.length
      );
      console.log(
        '📥 API MESSAGES RESPONSE - Setting messages state with:',
        formattedMessages.length,
        'messages'
      );

      setMessages(formattedMessages);
    } else if (!messagesData && conversationId) {
      // Only clear if we're switching conversations and don't have data yet
      // But don't clear if we're just waiting for the query to complete
      console.log(
        '📥 MESSAGES EFFECT - No messagesData yet, but conversationId exists'
      );
      // Don't clear messages here - wait for the query to complete
    }

    // Handle errors
    if (messagesError) {
      console.error(
        '📥 MESSAGES EFFECT - Error loading messages:',
        messagesError
      );
      // Check if it's a timeout error
      const errorData = (messagesError as any)?.data;
      if (
        errorData === 'timeout of 30000ms exceeded' ||
        errorData === 'timeout of 60000ms exceeded' ||
        (typeof errorData === 'string' && errorData.includes('timeout'))
      ) {
        console.error('📥 MESSAGES EFFECT - Timeout error detected');
        toast.error(
          locale === 'en'
            ? 'Request timed out. The server is taking too long to respond. Please try again.'
            : 'انتهت مهلة الطلب. الخادم يستغرق وقتاً طويلاً للرد. يرجى المحاولة مرة أخرى.'
        );
      }
    }
  }, [messagesData, user, locale, conversationId, messagesError]);

  // Handle WebSocket messages - all message types from documentation
  const handleWebSocketMessage = useCallback(
    (data: any) => {
      console.log(
        '🔵 WEBSOCKET MESSAGE RECEIVED - Full Data:',
        JSON.stringify(data, null, 2)
      );
      console.log('🔵 WEBSOCKET MESSAGE RECEIVED - Type:', data.type);
      console.log(
        '🔵 WEBSOCKET MESSAGE RECEIVED - Timestamp:',
        new Date().toISOString()
      );

      try {
        switch (data.type) {
          case 'online_users':
            // Initial list of online users when connecting
            console.log('Online users:', data.onlineUsers);
            if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
              setOnlineUsers(data.onlineUsers);

              // Update other user's online status if they're in the online users list
              if (selectedConversation?.otherUser.id) {
                const isOtherUserOnline = data.onlineUsers.includes(
                  selectedConversation.otherUser.id
                );
                setOtherUserOnlineStatus(isOtherUserOnline);
              }
            }
            break;

          case 'user_status':
            // User went online/offline
            console.log(`User ${data.user_id} is now ${data.status}`);

            if (data.user_id && data.status) {
              // Update online users list
              if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
                setOnlineUsers(data.onlineUsers);
              }

              // Update other user's status if it's the user we're chatting with
              if (selectedConversation?.otherUser.id === data.user_id) {
                setOtherUserOnlineStatus(data.status === 'online');

                // Show notification
                if (data.status === 'online') {
                  toast.info(
                    locale === 'en'
                      ? `${formatUsername(
                          selectedConversation.otherUser.username
                        )} is now online`
                      : `${formatUsername(
                          selectedConversation.otherUser.username
                        )} متصل الآن`
                  );
                }
              }
            }
            break;

          case 'chat_message':
            console.log('💬 CHAT MESSAGE - Processing chat message');
            if (data.message) {
              console.log(
                '💬 CHAT MESSAGE - Full Message Data:',
                JSON.stringify(data.message, null, 2)
              );
              console.log('💬 CHAT MESSAGE - Message ID:', data.message.id);
              console.log('💬 CHAT MESSAGE - Text:', data.message.text);
              console.log(
                '💬 CHAT MESSAGE - Sender ID:',
                data.message.senderId
              );
              console.log(
                '💬 CHAT MESSAGE - Receiver ID:',
                data.message.receiverId
              );
              console.log(
                '💬 CHAT MESSAGE - Timestamp:',
                data.message.timestamp || data.message.createdAt
              );

              // Log offer-related chat messages
              if (
                data.message.offerId ||
                data.message.productId ||
                data.message.offer
              ) {
                console.log(
                  '💬 CHAT MESSAGE WITH OFFER/PRODUCT - Full WebSocket Data:',
                  JSON.stringify(data, null, 2)
                );
                console.log(
                  '💬 CHAT MESSAGE WITH OFFER/PRODUCT - Message Object:',
                  JSON.stringify(data.message, null, 2)
                );
                console.log(
                  '💬 CHAT MESSAGE WITH OFFER/PRODUCT - Offer Object:',
                  JSON.stringify(data.message.offer, null, 2)
                );
                console.log(
                  '💬 CHAT MESSAGE WITH OFFER/PRODUCT - Offer ID:',
                  data.message.offerId
                );
                console.log(
                  '💬 CHAT MESSAGE WITH OFFER/PRODUCT - Product ID:',
                  data.message.productId
                );
              }

              // Use the enhanced message format with isSender field
              // Backend provides isSender and sender fields for easier identification
              const isMyMessage =
                data.message.isSender !== undefined
                  ? data.message.isSender
                  : data.message.sender === 'me' ||
                    data.message.senderId === user?.id;

              // Check if this is an offer message - only if it has actual offer data
              // Don't treat as offer if it's just a text message with productId
              const isOfferMessage = !!(
                (data.message.offerId && data.message.offer) ||
                (data.message.messageType === 'offer' && data.message.offer) ||
                (data.message.offer &&
                  (data.message.offer.offerAmount || data.message.offer.offer))
              );

              const newMessage: Message = {
                id: data.message.id,
                text: isOfferMessage ? '' : data.message.text, // Hide text for offer messages
                sender: isMyMessage ? 'me' : 'other',
                timestamp: formatMessageTime(
                  data.message.timestamp || data.message.createdAt,
                  locale
                ),
                attachments: data.message.attachments || [],
                senderId: data.message.senderId,
                receiverId: data.message.receiverId,
                offerId:
                  data.message.offerId || data.message.offer?.id || undefined,
                productId:
                  data.message.productId ||
                  data.message.offer?.productId ||
                  data.message.offer?.product?.id ||
                  undefined,
                offer: data.message.offer || undefined, // Include full offer object with product details
                messageType: data.message.messageType, // Include messageType
                isDelivered: isMyMessage
                  ? data.message.isDelivered !== undefined
                    ? data.message.isDelivered
                    : true
                  : undefined,
                isRead: isMyMessage
                  ? data.message.isRead !== undefined
                    ? data.message.isRead
                    : false
                  : undefined,
              };

              console.log(
                `💬 CHAT MESSAGE - Message from ${
                  data.message.senderName || 'Unknown'
                }`
              );
              console.log(`💬 CHAT MESSAGE - Is sender: ${isMyMessage}`);
              console.log(
                `💬 CHAT MESSAGE - Sender ID: ${data.message.senderId}`
              );
              console.log(
                `💬 CHAT MESSAGE - Receiver ID: ${data.message.receiverId}`
              );
              console.log(
                `💬 CHAT MESSAGE - Created Message Object:`,
                JSON.stringify(newMessage, null, 2)
              );

              // If this is our message, update the optimistic message to delivered (2 ticks)
              if (isMyMessage) {
                setMessages(prev => {
                  // Check if we already have the real message (avoid duplicates)
                  const hasRealMessage = prev.some(
                    msg => msg.id === newMessage.id
                  );
                  if (hasRealMessage) {
                    console.log(
                      '💬 Message already exists, skipping:',
                      newMessage.id
                    );
                    return prev;
                  }

                  // Find the most recent optimistic message (temp message) that matches
                  // Match by text content (trimmed), sender, and being a temp message
                  // Also check if temp message was created recently (within 10 seconds)
                  const now = Date.now();
                  const tempMessages = prev
                    .map((msg, index) => ({ msg, index }))
                    .filter(({ msg }) => {
                      if (!msg.id.startsWith('temp-')) return false;
                      if (
                        msg.senderId !== newMessage.senderId ||
                        msg.sender !== 'me'
                      )
                        return false;

                      // Extract timestamp from temp ID (format: temp-{timestamp}-{random})
                      const tempTimeMatch = msg.id.match(/^temp-(\d+)-/);
                      if (tempTimeMatch) {
                        const tempTime = parseInt(tempTimeMatch[1]);
                        // Only match if temp message was created within last 10 seconds
                        if (now - tempTime > 10000) return false;
                      }

                      // Match text content (trimmed and case-insensitive)
                      const tempText = (msg.text || '').trim();
                      const realText = (newMessage.text || '').trim();
                      return tempText === realText;
                    });

                  if (tempMessages.length > 0) {
                    // Use the most recent temp message (last one in array)
                    const { index } = tempMessages[tempMessages.length - 1];
                    console.log('💬 Updating optimistic message:', {
                      tempId: prev[index].id,
                      realId: newMessage.id,
                      tempText: prev[index].text,
                      realText: newMessage.text,
                      index: index,
                    });
                    // Update the optimistic message: replace temp ID with real ID and mark as delivered (2 ticks)
                    const updated = [...prev];
                    updated[index] = {
                      ...newMessage,
                      isDelivered: true, // 2 ticks - delivered
                    };
                    return updated;
                  } else {
                    // Remove any old temp messages (older than 10 seconds) to clean up
                    const cleaned = prev.filter(msg => {
                      if (!msg.id.startsWith('temp-')) return true;
                      const tempTimeMatch = msg.id.match(/^temp-(\d+)-/);
                      if (tempTimeMatch) {
                        const tempTime = parseInt(tempTimeMatch[1]);
                        return now - tempTime <= 10000; // Keep only recent temp messages
                      }
                      return true;
                    });

                    console.log(
                      '💬 No matching temp message found. Adding real message:',
                      {
                        realId: newMessage.id,
                        realText: newMessage.text,
                        tempMessagesCount: prev.filter(m =>
                          m.id.startsWith('temp-')
                        ).length,
                      }
                    );
                    // No matching temp message found, just add the real one
                    return [...cleaned, newMessage];
                  }
                });
              } else {
                // For received messages, just add them (avoid duplicates)
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === newMessage.id);
                  if (!exists) {
                    return [...prev, newMessage];
                  }
                  return prev;
                });
              }

              // Refetch conversations to update last message
              refetchConversations();
            }
            break;

          case 'offer_sent':
            console.log(
              '📦 OFFER SENT - Full WebSocket Data:',
              JSON.stringify(data, null, 2)
            );
            console.log(
              '📦 OFFER SENT - Offer Object:',
              JSON.stringify(data.offer, null, 2)
            );
            console.log(
              '📦 OFFER SENT - Message Object:',
              JSON.stringify(data.message, null, 2)
            );
            console.log('📦 OFFER SENT - Offer ID:', data.offer?.id);
            console.log('📦 OFFER SENT - Product ID:', data.offer?.productId);
            console.log(
              '📦 OFFER SENT - Offer Amount:',
              data.offer?.offerAmount
            );
            console.log(
              '📦 OFFER SENT - Original Price:',
              data.offer?.originalPrice
            );
            console.log('📦 OFFER SENT - Buyer ID:', data.offer?.buyerId);
            console.log('📦 OFFER SENT - Seller ID:', data.offer?.sellerId);
            console.log('📦 OFFER SENT - Status:', data.offer?.status);
            console.log(
              '📦 OFFER SENT - Product Object:',
              JSON.stringify(data.offer?.product, null, 2)
            );

            if (data.offer) {
              // Add offer message to chat with full offer details - this will render as product card
              const offerMessage: Message = {
                id: data.message?.id || `offer_${data.offer.id}`,
                text: '', // Empty text so it doesn't show text, only the card
                sender: data.offer.buyerId === user?.id ? 'me' : 'other',
                timestamp: formatMessageTime(
                  data.message?.timestamp || data.offer.createdAt,
                  locale
                ),
                offerId: data.offer.id,
                productId: data.offer.productId || data.offer.product?.id,
                offer: {
                  id: data.offer.id,
                  offerAmount: data.offer.offerAmount,
                  originalPrice: data.offer.originalPrice,
                  status: data.offer.status || 'pending',
                  productId: data.offer.productId || data.offer.product?.id,
                  product: data.offer.product
                    ? {
                        id: data.offer.product.id || data.offer.productId,
                        title: data.offer.product.title,
                        image: data.offer.product.image,
                        images: data.offer.product.images,
                        price: data.offer.product.price,
                        originalPrice: data.offer.product.originalPrice,
                        currency: data.offer.product.currency,
                        size: data.offer.product.size,
                        condition: data.offer.product.condition,
                      }
                    : undefined,
                },
              };
              console.log(
                '📦 OFFER SENT - Created Message Object:',
                offerMessage
              );
              setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === offerMessage.id)) {
                  return prev;
                }
                return [...prev, offerMessage];
              });
              refetchConversations();

              toast.success(
                locale === 'en'
                  ? `Offer of ${data.offer.offerAmount} SAR sent successfully`
                  : `تم إرسال عرض بقيمة ${data.offer.offerAmount} ريال بنجاح`
              );
            }
            break;

          case 'offer_countered':
            console.log(
              '🔄 OFFER COUNTERED - Full WebSocket Data:',
              JSON.stringify(data, null, 2)
            );
            console.log(
              '🔄 OFFER COUNTERED - Offer Object:',
              JSON.stringify(data.offer, null, 2)
            );
            console.log(
              '🔄 OFFER COUNTERED - Message Object:',
              JSON.stringify(data.message, null, 2)
            );
            console.log('🔄 OFFER COUNTERED - Offer ID:', data.offer?.id);
            console.log(
              '🔄 OFFER COUNTERED - Original Offer Amount:',
              data.offer?.offerAmount
            );
            console.log(
              '🔄 OFFER COUNTERED - Counter Amount:',
              data.offer?.counterAmount
            );
            console.log(
              '🔄 OFFER COUNTERED - Product ID:',
              data.offer?.productId
            );
            console.log('🔄 OFFER COUNTERED - Status:', data.offer?.status);
            console.log(
              '🔄 OFFER COUNTERED - Product Object:',
              JSON.stringify(data.offer?.product, null, 2)
            );

            if (data.offer) {
              const counterMessage: Message = {
                id: data.message?.id || `counter_${data.offer.id}`,
                text:
                  data.message?.text ||
                  (locale === 'en' ? 'Countered offer' : 'تم تقديم عرض مقابل'),
                sender: data.offer.sellerId === user?.id ? 'me' : 'other',
                timestamp: formatMessageTime(
                  data.message?.timestamp || data.offer.updatedAt,
                  locale
                ),
                offerId: data.offer.id,
                productId: data.offer.productId || data.offer.product?.id,
                offer: {
                  id: data.offer.id,
                  offerAmount: data.offer.offerAmount,
                  counterAmount: data.offer.counterAmount,
                  originalPrice: data.offer.originalPrice,
                  status: data.offer.status || 'countered',
                  productId: data.offer.productId,
                  product: data.offer.product
                    ? {
                        id: data.offer.product.id || data.offer.productId,
                        title: data.offer.product.title,
                        image: data.offer.product.image,
                        images: data.offer.product.images,
                        price: data.offer.product.price,
                        originalPrice: data.offer.product.originalPrice,
                        currency: data.offer.product.currency,
                        size: data.offer.product.size,
                        condition: data.offer.product.condition,
                      }
                    : undefined,
                },
              };
              console.log(
                '🔄 OFFER COUNTERED - Created Message Object:',
                counterMessage
              );
              setMessages(prev => [...prev, counterMessage]);
              refetchConversations();

              toast.info(
                locale === 'en'
                  ? `Counter offer of ${data.offer.counterAmount} SAR received`
                  : `تم استلام عرض مقابل بقيمة ${data.offer.counterAmount} ريال`
              );
            }
            break;

          case 'offer_accepted':
            console.log(
              '✅ OFFER ACCEPTED - Full WebSocket Data:',
              JSON.stringify(data, null, 2)
            );
            console.log(
              '✅ OFFER ACCEPTED - Offer Object:',
              JSON.stringify(data.offer, null, 2)
            );
            console.log(
              '✅ OFFER ACCEPTED - Message Object:',
              JSON.stringify(data.message, null, 2)
            );
            console.log('✅ OFFER ACCEPTED - Offer ID:', data.offer?.id);
            console.log(
              '✅ OFFER ACCEPTED - Offer Amount:',
              data.offer?.offerAmount
            );
            console.log(
              '✅ OFFER ACCEPTED - Counter Amount:',
              data.offer?.counterAmount
            );
            console.log(
              '✅ OFFER ACCEPTED - Product ID:',
              data.offer?.productId
            );
            console.log('✅ OFFER ACCEPTED - Status:', data.offer?.status);
            console.log(
              '✅ OFFER ACCEPTED - Product Object:',
              JSON.stringify(data.offer?.product, null, 2)
            );

            if (data.offer) {
              const acceptMessage: Message = {
                id: data.message?.id || `accept_${data.offer.id}`,
                text:
                  data.message?.text ||
                  (locale === 'en' ? 'Offer accepted' : 'تم قبول العرض'),
                sender: data.offer.sellerId === user?.id ? 'me' : 'other',
                timestamp: formatMessageTime(
                  data.message?.timestamp || data.offer.updatedAt,
                  locale
                ),
                offerId: data.offer.id,
                productId: data.offer.productId || data.offer.product?.id,
                offer: {
                  id: data.offer.id,
                  offerAmount: data.offer.offerAmount,
                  counterAmount: data.offer.counterAmount,
                  originalPrice: data.offer.originalPrice,
                  status: 'accepted',
                  productId: data.offer.productId,
                  product: data.offer.product
                    ? {
                        id: data.offer.product.id || data.offer.productId,
                        title: data.offer.product.title,
                        image: data.offer.product.image,
                        images: data.offer.product.images,
                        price: data.offer.product.price,
                        originalPrice: data.offer.product.originalPrice,
                        currency: data.offer.product.currency,
                        size: data.offer.product.size,
                        condition: data.offer.product.condition,
                      }
                    : undefined,
                },
              };
              console.log(
                '✅ OFFER ACCEPTED - Created Message Object:',
                acceptMessage
              );
              setMessages(prev => [...prev, acceptMessage]);
              refetchConversations();

              toast.success(
                locale === 'en'
                  ? 'Offer accepted! Proceed to checkout'
                  : 'تم قبول العرض! تابع إلى الدفع'
              );
            }
            break;

          case 'offer_rejected':
            console.log(
              '❌ OFFER REJECTED - Full WebSocket Data:',
              JSON.stringify(data, null, 2)
            );
            console.log(
              '❌ OFFER REJECTED - Offer Object:',
              JSON.stringify(data.offer, null, 2)
            );
            console.log(
              '❌ OFFER REJECTED - Message Object:',
              JSON.stringify(data.message, null, 2)
            );
            console.log('❌ OFFER REJECTED - Offer ID:', data.offer?.id);
            console.log(
              '❌ OFFER REJECTED - Offer Amount:',
              data.offer?.offerAmount
            );
            console.log(
              '❌ OFFER REJECTED - Product ID:',
              data.offer?.productId
            );
            console.log('❌ OFFER REJECTED - Status:', data.offer?.status);
            console.log(
              '❌ OFFER REJECTED - Product Object:',
              JSON.stringify(data.offer?.product, null, 2)
            );

            if (data.offer) {
              const rejectMessage: Message = {
                id: data.message?.id || `reject_${data.offer.id}`,
                text:
                  data.message?.text ||
                  (locale === 'en' ? 'Offer rejected' : 'تم رفض العرض'),
                sender: data.offer.sellerId === user?.id ? 'me' : 'other',
                timestamp: formatMessageTime(
                  data.message?.timestamp || data.offer.updatedAt,
                  locale
                ),
                offerId: data.offer.id,
                productId: data.offer.productId || data.offer.product?.id,
                offer: {
                  id: data.offer.id,
                  offerAmount: data.offer.offerAmount,
                  counterAmount: data.offer.counterAmount,
                  originalPrice: data.offer.originalPrice,
                  status: 'rejected',
                  productId: data.offer.productId,
                  product: data.offer.product
                    ? {
                        id: data.offer.product.id || data.offer.productId,
                        title: data.offer.product.title,
                        image: data.offer.product.image,
                        images: data.offer.product.images,
                        price: data.offer.product.price,
                        originalPrice: data.offer.product.originalPrice,
                        currency: data.offer.product.currency,
                        size: data.offer.product.size,
                        condition: data.offer.product.condition,
                      }
                    : undefined,
                },
              };
              console.log(
                '❌ OFFER REJECTED - Created Message Object:',
                rejectMessage
              );
              setMessages(prev => [...prev, rejectMessage]);
              refetchConversations();

              toast.warning(
                locale === 'en' ? 'Offer was rejected' : 'تم رفض العرض'
              );
            }
            break;

          case 'error':
            // Handle WebSocket errors
            const errorMsg = data.message || data.error;

            // Check for specific error messages
            if (errorMsg === 'You cannot make an offer on your own product') {
              toast.error(
                locale === 'en'
                  ? 'You cannot make an offer on your own product'
                  : 'لا يمكنك تقديم عرض على منتجك الخاص'
              );
            } else if (errorMsg === 'You cannot purchase your own product') {
              toast.error(
                locale === 'en'
                  ? 'You cannot purchase your own product'
                  : 'لا يمكنك شراء منتجك الخاص'
              );
            } else {
              toast.error(
                errorMsg || (locale === 'en' ? 'An error occurred' : 'حدث خطأ')
              );
            }
            console.error('WebSocket error:', data);
            break;

          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        toast.error(
          locale === 'en' ? 'Error processing message' : 'خطأ في معالجة الرسالة'
        );
      }
    },
    [user, locale, refetchConversations]
  );

  // Initialize conversation and connect WebSocket
  const initializeConversation = useCallback(
    async (receiverId: string) => {
      if (!token || !user) {
        toast.error(
          locale === 'en'
            ? 'Authentication required. Please login again.'
            : 'مطلوب تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.'
        );
        return;
      }

      setIsConnecting(true);

      try {
        // Step 1: Check if conversation exists
        const conversationsResponse = await apiClient.get(
          '/api/chat/conversations/'
        );
        const conversations = conversationsResponse.data.conversations || [];

        let conversation = conversations.find(
          (conv: any) => conv.otherUser?.id === receiverId
        );

        // Step 2: Create conversation if needed by sending first message
        if (!conversation) {
          try {
            await apiClient.post('/api/chat/send/', {
              receiverId: receiverId,
              text: locale === 'en' ? 'Hello!' : 'مرحبا!',
              productId: null,
              attachments: [],
              offerId: null,
            });

            // Get the newly created conversation
            const newConversationsResponse = await apiClient.get(
              '/api/chat/conversations/'
            );
            const newConversations =
              newConversationsResponse.data.conversations || [];
            conversation = newConversations.find(
              (conv: any) => conv.otherUser?.id === receiverId
            );
          } catch (error: any) {
            console.error('Error creating conversation:', error);
            toast.error(
              locale === 'en'
                ? 'Failed to start conversation. Please try again.'
                : 'فشل بدء المحادثة. يرجى المحاولة مرة أخرى.'
            );
            setIsConnecting(false);
            return;
          }
        }

        if (!conversation) {
          toast.error(
            locale === 'en'
              ? 'Could not find or create conversation'
              : 'تعذر العثور على المحادثة أو إنشاؤها'
          );
          setIsConnecting(false);
          return;
        }

        const convId = conversation.conversationId || conversation.id;

        // Initialize connection state and variables before using them
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 3;
        const RECONNECT_DELAY = 2000;
        const connectionState = { isIntentionallyClosed: false };

        // Check if already connected to this conversation
        if (
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN &&
          conversationId === convId
        ) {
          // Already connected to the same conversation, don't reconnect
          console.log(
            '✅ Already connected to this conversation, keeping connection'
          );
          setIsConnecting(false);
          setIsWebSocketConnected(true);
          return;
        }

        setConversationId(convId);

        // Step 3: Connect to WebSocket with authentication token
        const wsUrl = `${WS_BASE_URL}/ws/chat/${convId}/?token=${encodeURIComponent(
          token
        )}`;

        console.log(
          'Connecting to WebSocket:',
          wsUrl.replace(/token=[^&]+/, 'token=***')
        );
        console.log('Conversation ID:', convId);

        // Close existing connection only if switching to a different conversation
        if (wsRef.current && conversationId && conversationId !== convId) {
          console.log('🔄 Switching conversation, closing existing WebSocket');
          connectionState.isIntentionallyClosed = true;
          wsRef.current.close(1000, 'Switching conversation');
          wsRef.current = null;
          setWs(null);
        } else if (wsRef.current) {
          // Close any existing connection that's not open
          if (wsRef.current.readyState !== WebSocket.OPEN) {
            console.log('🔄 Closing non-open WebSocket connection');
            connectionState.isIntentionallyClosed = true;
            wsRef.current.close();
            wsRef.current = null;
            setWs(null);
          }
        }

        // Create WebSocket connection
        const websocket = new WebSocket(wsUrl);

        // Set connection timeout (10 seconds) - must be set before connection
        const connectionTimeout = setTimeout(() => {
          if (websocket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket connection timeout');
            websocket.close();
            setIsConnecting(false);
            toast.error(
              locale === 'en'
                ? 'Connection timeout. Please try again.'
                : 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.'
            );
          }
        }, 10000); // 10 seconds

        websocket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket Connected successfully');
          setIsConnecting(false);
          setIsWebSocketConnected(true);
          reconnectAttempts = 0;
          connectionState.isIntentionallyClosed = false;

          // When WebSocket connects, backend will send 'online_users' message
          // with the list of online users, so we'll update status then
        };

        websocket.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            toast.error(
              locale === 'en'
                ? 'Error receiving message'
                : 'خطأ في استقبال الرسالة'
            );
          }
        };

        websocket.onerror = error => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket Error:', error);
          setIsConnecting(false);

          // Check if it's an authentication error
          const ws = error.target as WebSocket;
          if (ws?.readyState === WebSocket.CLOSED) {
            // Error might be followed by close event with code 4001
            // We'll handle it in onclose
          }

          if (reconnectAttempts === 0) {
            toast.warning(
              locale === 'en'
                ? 'Connection issue. Retrying...'
                : 'مشكلة في الاتصال. إعادة المحاولة...'
            );
          }
        };

        websocket.onclose = event => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket closed:', event.code, event.reason);
          console.log('WebSocket Disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          setIsConnecting(false);
          setIsWebSocketConnected(false);

          // Don't reconnect if intentionally closed
          if (connectionState.isIntentionallyClosed) {
            console.log('WebSocket intentionally closed, not reconnecting');
            return;
          }

          // Code 4001 = Unauthorized (authentication failed)
          if (event.code === 4001) {
            console.error('Authentication failed - check your token');
            toast.error(
              locale === 'en'
                ? 'Authentication failed. Please login again.'
                : 'فشل المصادقة. يرجى تسجيل الدخول مرة أخرى.'
            );
            return;
          }

          // Code 1005 = No Status Received (normal closure without status frame)
          // Code 1000 = Normal Closure
          // Code 1001 = Going Away
          // Code 1006 = Abnormal Closure (connection lost)
          const isNormalClosure =
            event.code === 1000 || event.code === 1001 || event.code === 1005;

          if (
            !isNormalClosure &&
            event.code === 1006 &&
            reconnectAttempts < maxReconnectAttempts
          ) {
            // Abnormal closure - try to reconnect only if not intentionally closed
            reconnectAttempts++;
            const delay = RECONNECT_DELAY * reconnectAttempts;

            console.log(
              `Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`
            );

            toast.info(
              locale === 'en'
                ? `Reconnecting... (${reconnectAttempts}/${maxReconnectAttempts})`
                : `إعادة الاتصال... (${reconnectAttempts}/${maxReconnectAttempts})`
            );

            setTimeout(() => {
              // Only reconnect if still on the same conversation and not intentionally closed
              if (
                receiverId &&
                selectedConversation?.otherUser.id === receiverId &&
                !connectionState.isIntentionallyClosed &&
                conversationId === convId
              ) {
                initializeConversation(receiverId);
              }
            }, delay);
          } else if (
            !isNormalClosure &&
            reconnectAttempts >= maxReconnectAttempts
          ) {
            // Max reconnection attempts reached
            toast.error(
              locale === 'en'
                ? 'Connection failed. Please refresh the page.'
                : 'فشل الاتصال. يرجى تحديث الصفحة.'
            );
          }
        };

        wsRef.current = websocket;
        setWs(websocket);

        // Store connection state in ref for access in callbacks
        connectionState.isIntentionallyClosed = false;
      } catch (error: any) {
        console.error('Error initializing conversation:', error);
        setIsConnecting(false);

        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          (locale === 'en'
            ? 'Failed to initialize chat. Please try again.'
            : 'فشل تهيئة الدردشة. يرجى المحاولة مرة أخرى.');

        toast.error(errorMessage);
      }
    },
    [
      token,
      user,
      locale,
      refetchConversations,
      handleWebSocketMessage,
      selectedConversation,
    ]
  );

  // Cleanup WebSocket on unmount or conversation change
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll to bottom when chat opens on mobile only
  useEffect(() => {
    if (showChat && chatAreaRef.current) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setTimeout(() => {
          chatAreaRef.current?.scrollTo({
            top: chatAreaRef.current.scrollHeight,
            behavior: 'auto',
          });
        }, 150);
      }
    }
  }, [showChat]);

  // Auto-select first conversation when conversations are loaded (only once)
  useEffect(() => {
    if (
      conversations.length > 0 &&
      !selectedConversation &&
      !hasAutoSelectedRef.current &&
      conversationsData
    ) {
      const firstConversation = conversations[0];
      hasAutoSelectedRef.current = true;
      // Use handleUserSelect to properly initialize the conversation
      handleUserSelect(firstConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationsData, conversations.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          if (e.target?.result) {
            const newFile: AttachedFile = {
              id: Date.now().toString() + Math.random(),
              file,
              preview: e.target.result as string,
            };
            setAttachedFiles(prev => [...prev, newFile]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== id));
  };

  // Send message via WebSocket or REST API
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && attachedFiles.length === 0) return;
    if (!selectedConversation || !user) return;

    const receiverId = selectedConversation.otherUser.id;
    const text = messageText.trim();

    // Upload attachments if any
    let attachmentUrls: string[] = [];
    if (attachedFiles.length > 0) {
      try {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file.file);
          const uploadResponse = await apiClient.post(
            '/api/chat/upload/',
            formData
          );
          if (uploadResponse.data.fileUrl) {
            attachmentUrls.push(uploadResponse.data.fileUrl);
          }
        }
      } catch (error) {
        console.error('Error uploading attachments:', error);
        toast.error(
          locale === 'en'
            ? 'Failed to upload attachments'
            : 'فشل تحميل المرفقات'
        );
        return;
      }
    }

    // Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        // Create temporary message ID for optimistic update
        const tempMessageId = `temp-${Date.now()}-${Math.random()}`;

        // Add message immediately to chat with 1 tick (sent)
        const optimisticMessage: Message = {
          id: tempMessageId,
          text: text,
          sender: 'me',
          timestamp: formatMessageTime(new Date().toISOString(), locale),
          attachments: attachmentUrls,
          senderId: user.id,
          receiverId: receiverId,
          isDelivered: false, // 1 tick - sent
          isRead: false,
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setMessageText('');
        setAttachedFiles([]);

        // Send via WebSocket
        wsRef.current.send(
          JSON.stringify({
            type: 'chat_message',
            senderId: user.id,
            receiverId: receiverId,
            text: text,
            attachments: attachmentUrls,
            offerId: null,
            productId: selectedConversation.productId || null,
          })
        );
      } catch (error) {
        console.error('Error sending message via WebSocket:', error);
        toast.error(
          locale === 'en' ? 'Failed to send message' : 'فشل إرسال الرسالة'
        );
      }
    } else {
      // Fallback to REST API if WebSocket not connected
      try {
        await sendMessageMutation({
          receiverId: receiverId,
          text: text,
          attachments: attachmentUrls,
          offerId: null,
          productId: selectedConversation.productId || null,
        });
        setMessageText('');
        setAttachedFiles([]);
        refetchMessages();
      } catch (error: any) {
        console.error('Error sending message:', error);
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          (locale === 'en'
            ? 'Failed to send message. Please try again.'
            : 'فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.');
        toast.error(errorMsg);
      }
    }
  };

  // Offer Management Functions via WebSocket
  const sendOffer = useCallback(
    (
      productId: string,
      offerAmount: number,
      receiverId: string,
      shippingDetails?: {
        shippingAddress?: string;
        zipCode?: string;
        houseNumber?: string;
      },
      text?: string
    ) => {
      console.log('📤 SENDING OFFER - Input Data:', {
        productId,
        offerAmount,
        receiverId,
        shippingDetails,
        text,
      });

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      if (!user) return;

      const offerPayload = {
        type: 'send_offer',
        productId: productId,
        offerAmount: offerAmount,
        receiverId: receiverId,
        text:
          text ||
          (locale === 'en'
            ? `I'd like to offer ${offerAmount} SAR for this product`
            : `أود تقديم عرض بقيمة ${offerAmount} ريال لهذا المنتج`),
        shippingAddress: shippingDetails?.shippingAddress || null,
        zipCode: shippingDetails?.zipCode || null,
        houseNumber: shippingDetails?.houseNumber || null,
      };

      console.log(
        '📤 SENDING OFFER - WebSocket Payload:',
        JSON.stringify(offerPayload, null, 2)
      );

      try {
        wsRef.current.send(JSON.stringify(offerPayload));
        console.log('📤 SENDING OFFER - Successfully sent via WebSocket');
      } catch (error) {
        console.error('📤 SENDING OFFER - Error sending offer:', error);
        toast.error(
          locale === 'en' ? 'Failed to send offer' : 'فشل إرسال العرض'
        );
      }
    },
    [user, locale]
  );

  const counterOffer = useCallback(
    (
      offerId: string,
      counterAmount: number,
      receiverId: string,
      text?: string
    ) => {
      console.log('🔄 SENDING COUNTER OFFER - Input Data:', {
        offerId,
        counterAmount,
        receiverId,
        text,
      });

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      const counterPayload = {
        type: 'counter_offer',
        offerId: offerId,
        counterAmount: counterAmount,
        receiverId: receiverId,
        text:
          text ||
          (locale === 'en'
            ? `I can do ${counterAmount} SAR`
            : `يمكنني الموافقة على ${counterAmount} ريال`),
      };

      console.log(
        '🔄 SENDING COUNTER OFFER - WebSocket Payload:',
        JSON.stringify(counterPayload, null, 2)
      );

      try {
        wsRef.current.send(JSON.stringify(counterPayload));
        console.log(
          '🔄 SENDING COUNTER OFFER - Successfully sent via WebSocket'
        );
      } catch (error) {
        console.error(
          '🔄 SENDING COUNTER OFFER - Error sending counter offer:',
          error
        );
        toast.error(
          locale === 'en'
            ? 'Failed to send counter offer'
            : 'فشل إرسال العرض المقابل'
        );
      }
    },
    [locale]
  );

  const acceptOffer = useCallback(
    (offerId: string, receiverId: string, text?: string) => {
      console.log('✅ SENDING ACCEPT OFFER - Input Data:', {
        offerId,
        receiverId,
        text,
      });

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      const acceptPayload = {
        type: 'accept_offer',
        offerId: offerId,
        receiverId: receiverId,
        text:
          text ||
          (locale === 'en'
            ? "Deal! Let's proceed with the purchase"
            : 'اتفاق! دعنا نتابع الشراء'),
      };

      console.log(
        '✅ SENDING ACCEPT OFFER - WebSocket Payload:',
        JSON.stringify(acceptPayload, null, 2)
      );

      try {
        wsRef.current.send(JSON.stringify(acceptPayload));
        console.log(
          '✅ SENDING ACCEPT OFFER - Successfully sent via WebSocket'
        );
      } catch (error) {
        console.error(
          '✅ SENDING ACCEPT OFFER - Error accepting offer:',
          error
        );
        toast.error(
          locale === 'en' ? 'Failed to accept offer' : 'فشل قبول العرض'
        );
      }
    },
    [locale]
  );

  const rejectOffer = useCallback(
    (offerId: string, receiverId: string, text?: string) => {
      console.log('❌ SENDING REJECT OFFER - Input Data:', {
        offerId,
        receiverId,
        text,
      });

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        toast.error(
          locale === 'en'
            ? 'Not connected. Please wait for connection.'
            : 'غير متصل. يرجى الانتظار للاتصال.'
        );
        return;
      }

      const rejectPayload = {
        type: 'reject_offer',
        offerId: offerId,
        receiverId: receiverId,
        text:
          text ||
          (locale === 'en'
            ? "Sorry, I can't accept this offer"
            : 'عذراً، لا يمكنني قبول هذا العرض'),
      };

      console.log(
        '❌ SENDING REJECT OFFER - WebSocket Payload:',
        JSON.stringify(rejectPayload, null, 2)
      );

      try {
        wsRef.current.send(JSON.stringify(rejectPayload));
        console.log(
          '❌ SENDING REJECT OFFER - Successfully sent via WebSocket'
        );
      } catch (error) {
        console.error(
          '❌ SENDING REJECT OFFER - Error rejecting offer:',
          error
        );
        toast.error(
          locale === 'en' ? 'Failed to reject offer' : 'فشل رفض العرض'
        );
      }
    },
    [locale]
  );

  const handleUserSelect = async (conversation: ConversationUser) => {
    // Check if we're already on this conversation
    const isSameConversation =
      selectedConversation?.id === conversation.id &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN;

    // Clear messages when switching to a different conversation
    if (selectedConversation?.id !== conversation.id) {
      console.log('Switching conversation, clearing messages');
      setMessages([]);
    }

    setSelectedConversation(conversation);
    setShowChat(true);

    // Only close and reconnect if switching to a different conversation
    if (!isSameConversation) {
      // Close existing WebSocket connection only if switching conversations
      if (wsRef.current && selectedConversation?.id !== conversation.id) {
        console.log('Switching to different conversation, closing WebSocket');
        // Mark as intentional to prevent reconnection attempts
        if (wsRef.current) {
          wsRef.current.close(1000, 'Switching conversation');
          wsRef.current = null;
          setWs(null);
        }
      }

      // Initialize conversation and connect WebSocket
      if (conversation.otherUser.id) {
        await initializeConversation(conversation.otherUser.id);
      }
    } else {
      console.log(
        'Already on this conversation with active WebSocket, skipping reconnection'
      );
    }
  };

  const handleBackToUsers = () => {
    setShowChat(false);
    // Close WebSocket when leaving chat (intentionally)
    if (wsRef.current) {
      wsRef.current.close(1000, 'User left chat');
      wsRef.current = null;
      setWs(null);
    }
    setConversationId(null);
    setMessages([]);
  };

  return (
    <div className='bg-off-white min-h-screen' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='h-screen flex flex-col'>
        <div className='bg-white border-b border-rich-sand/30 flex-shrink-0'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <h1 className='text-2xl font-bold text-deep-charcoal'>
              {locale === 'en' ? 'Messages' : 'الرسائل'}
            </h1>
          </div>
        </div>
        <div className='flex-1 flex overflow-hidden'>
          {/* Users List */}
          <div
            className={`${
              showChat ? 'hidden' : 'flex'
            } md:flex w-full md:w-80 flex-col border-r border-rich-sand/30 overflow-hidden`}
          >
            <div className='flex-1 overflow-y-auto scrollbar-transparent divide-y divide-rich-sand/30'>
              {isLoadingConversations ? (
                // Skeleton loading for conversations
                <div className='divide-y divide-rich-sand/30'>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className='p-4 flex items-center gap-3'>
                      {/* Avatar skeleton */}
                      <div className='relative w-12 h-12 rounded-full overflow-visible flex-shrink-0'>
                        <div className='w-12 h-12 rounded-full bg-rich-sand/20 skeleton-shimmer' />
                      </div>
                      {/* Content skeleton */}
                      <div className='flex-1 min-w-0 space-y-2'>
                        <div className='flex items-center justify-between'>
                          <div className='h-4 bg-rich-sand/20 rounded w-24 skeleton-shimmer' />
                          <div className='h-3 bg-rich-sand/10 rounded w-12 skeleton-shimmer' />
                        </div>
                        <div className='h-3 bg-rich-sand/10 rounded w-3/4 skeleton-shimmer' />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className='p-4 text-center text-deep-charcoal/60'>
                  {locale === 'en'
                    ? 'No conversations yet'
                    : 'لا توجد محادثات بعد'}
                </div>
              ) : (
                conversations.map(conv => {
                  const timeAgo = formatDate(conv.lastMessageAt, locale);
                  const formattedUsername = formatUsername(
                    conv.otherUser.username
                  );
                  // Check if user is in the online users list from WebSocket
                  const isOnline =
                    isWebSocketConnected &&
                    onlineUsers.includes(conv.otherUser.id);

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleUserSelect(conv)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-rich-sand/10 transition-colors text-left cursor-pointer ${
                        selectedConversation?.id === conv.id
                          ? 'bg-saudi-green/5'
                          : ''
                      }`}
                    >
                      <div className='relative w-12 h-12 rounded-full overflow-visible flex-shrink-0'>
                        <div className='w-12 h-12 rounded-full overflow-hidden bg-rich-sand/20'>
                          {conv.otherUser.profileImage ? (
                            <Image
                              src={conv.otherUser.profileImage}
                              alt={formattedUsername}
                              fill
                              className='object-cover w-12 h-12 rounded-full'
                              unoptimized
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center bg-saudi-green/20 text-saudi-green font-semibold'>
                              {formattedUsername.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Online status badge */}
                        {isOnline && (
                          <div className='absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10'></div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between mb-1'>
                          <h3 className='font-semibold text-deep-charcoal truncate'>
                            {formattedUsername}
                          </h3>
                          {timeAgo && (
                            <span className='text-xs text-deep-charcoal/60 flex-shrink-0 ml-2'>
                              {timeAgo}
                            </span>
                          )}
                        </div>
                        <p className='text-sm text-deep-charcoal/70 truncate'>
                          {conv.lastMessage ||
                            (locale === 'en' ? 'No messages' : 'لا توجد رسائل')}
                        </p>
                      </div>
                      {parseInt(conv.unreadCount) > 0 && (
                        <span className='bg-saudi-green text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0'>
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`${
              showChat ? 'flex' : 'hidden'
            } md:flex flex-1 flex-col`}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className='p-4 border-b border-rich-sand/30 flex items-center gap-3 flex-shrink-0'>
                  <button
                    onClick={handleBackToUsers}
                    className='md:hidden p-2 hover:bg-rich-sand/10 rounded-lg transition-colors cursor-pointer'
                    aria-label={locale === 'en' ? 'Back' : 'رجوع'}
                  >
                    <HiArrowLeft className='w-5 h-5 text-deep-charcoal' />
                  </button>
                  <div className='relative w-10 h-10 rounded-full overflow-visible flex-shrink-0'>
                    <div className='w-10 h-10 rounded-full overflow-hidden bg-rich-sand/20'>
                      {selectedConversation.otherUser.profileImage ? (
                        <Image
                          src={selectedConversation.otherUser.profileImage}
                          alt={formatUsername(
                            selectedConversation.otherUser.username
                          )}
                          fill
                          className='object-cover w-10 h-10 rounded-full'
                          unoptimized
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center bg-saudi-green/20 text-saudi-green font-semibold'>
                          {formatUsername(
                            selectedConversation.otherUser.username
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Online status badge */}
                    {isWebSocketConnected &&
                      (onlineUsers.includes(
                        selectedConversation.otherUser.id
                      ) ||
                        otherUserOnlineStatus) && (
                        <div className='absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10'></div>
                      )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold text-deep-charcoal truncate'>
                        {formatUsername(
                          selectedConversation.otherUser.username
                        )}
                      </h3>
                      {/* Status badge */}
                      {isWebSocketConnected &&
                        (onlineUsers.includes(
                          selectedConversation.otherUser.id
                        ) ||
                          otherUserOnlineStatus) && (
                          <span className='flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full'>
                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            {locale === 'en' ? 'Active now' : 'نشط الآن'}
                          </span>
                        )}
                    </div>
                    <p className='text-xs text-deep-charcoal/60 mt-0.5'>
                      {isConnecting
                        ? locale === 'en'
                          ? 'Connecting...'
                          : 'جاري الاتصال...'
                        : isWebSocketConnected &&
                          (onlineUsers.includes(
                            selectedConversation.otherUser.id
                          ) ||
                            otherUserOnlineStatus)
                        ? locale === 'en'
                          ? 'Online'
                          : 'متصل'
                        : locale === 'en'
                        ? 'Offline'
                        : 'غير متصل'}
                    </p>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  ref={chatAreaRef}
                  className='flex-1 overflow-y-auto scrollbar-transparent p-4 space-y-4 bg-off-white/50'
                >
                  {/* Loading State - Skeleton Messages */}
                  {(isLoadingMessages || isFetchingMessages) &&
                  messages.length === 0 ? (
                    <div className='space-y-4'>
                      {/* Skeleton messages - alternating sent and received */}
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex ${
                            i % 2 === 0 ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl ${
                              i % 2 === 0
                                ? 'rounded-br-sm bg-gradient-to-br from-rich-sand/20 to-rich-sand/10'
                                : 'rounded-bl-sm bg-white border border-rich-sand/20'
                            } p-3 space-y-2`}
                          >
                            {/* Message text skeleton */}
                            <div className='space-y-1.5'>
                              <div
                                className={`h-4 rounded ${
                                  i % 2 === 0
                                    ? 'bg-rich-sand/30'
                                    : 'bg-rich-sand/20'
                                } skeleton-shimmer`}
                                style={{ width: `${60 + Math.random() * 30}%` }}
                              />
                              {i % 3 === 0 && (
                                <div
                                  className={`h-4 rounded ${
                                    i % 2 === 0
                                      ? 'bg-rich-sand/30'
                                      : 'bg-rich-sand/20'
                                  } skeleton-shimmer`}
                                  style={{
                                    width: `${40 + Math.random() * 20}%`,
                                  }}
                                />
                              )}
                            </div>
                            {/* Timestamp skeleton */}
                            <div
                              className={`flex items-center gap-1.5 mt-2 ${
                                i % 2 === 0 ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`h-3 rounded w-16 ${
                                  i % 2 === 0
                                    ? 'bg-rich-sand/20'
                                    : 'bg-rich-sand/10'
                                } skeleton-shimmer`}
                              />
                              {i % 2 === 0 && (
                                <div className='h-3 w-3 rounded bg-rich-sand/20 skeleton-shimmer' />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !selectedConversation ? null : messages.length === 0 &&
                    !isLoadingMessages &&
                    !isFetchingMessages ? (
                    <div className='flex items-center justify-center h-full text-deep-charcoal/60'>
                      <div className='text-center'>
                        <p className='mb-2'>
                          {locale === 'en'
                            ? 'No messages yet. Start the conversation!'
                            : 'لا توجد رسائل بعد. ابدأ المحادثة!'}
                        </p>
                        {messagesError && (
                          <div className='mt-4 space-y-2'>
                            <p className='text-sm text-red-500'>
                              {locale === 'en'
                                ? 'Error loading messages. Please try again.'
                                : 'خطأ في تحميل الرسائل. يرجى المحاولة مرة أخرى.'}
                            </p>
                            {/* Show last message from conversation as fallback if available */}
                            {selectedConversation?.lastMessage && (
                              <div className='mt-4 p-3 bg-rich-sand/20 rounded-lg border border-rich-sand/30'>
                                <p className='text-xs text-deep-charcoal/60 mb-1'>
                                  {locale === 'en'
                                    ? 'Last message:'
                                    : 'آخر رسالة:'}
                                </p>
                                <p className='text-sm text-deep-charcoal'>
                                  {selectedConversation.lastMessage}
                                </p>
                                {selectedConversation.lastMessageAt && (
                                  <p className='text-xs text-deep-charcoal/40 mt-1'>
                                    {formatDate(
                                      selectedConversation.lastMessageAt,
                                      locale
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                if (conversationId) {
                                  refetchMessages();
                                }
                              }}
                              className='mt-4 px-4 py-2 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors text-sm'
                            >
                              {locale === 'en' ? 'Retry' : 'إعادة المحاولة'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    messages.map(message => {
                      // Only render as product card if message has an actual offer object with offer data
                      // Don't render as card if it's just a text message (even if it has productId)
                      const hasActualOffer =
                        message.offer &&
                        (message.offer.offerAmount ||
                          message.offer.offer ||
                          message.offer.counterAmount ||
                          message.offer.status ||
                          message.messageType === 'offer');

                      // Only render as card if there's an actual offer, not just productId
                      if (
                        hasActualOffer ||
                        (message.offerId && message.offer)
                      ) {
                        return (
                          <ProductMessageCard
                            key={message.id}
                            message={message}
                            locale={locale}
                            user={user}
                            selectedConversation={selectedConversation}
                            onAcceptOffer={acceptOffer}
                            onCounterOffer={counterOffer}
                            onRejectOffer={rejectOffer}
                            sendOffer={sendOffer}
                          />
                        );
                      }

                      // Regular message
                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender === 'me'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] md:max-w-[70%] ${
                              message.sender === 'me'
                                ? 'bg-gradient-to-br from-saudi-green to-green-600 text-white shadow-md'
                                : 'bg-white border border-rich-sand/30 text-deep-charcoal shadow-sm'
                            } rounded-2xl ${
                              message.sender === 'me'
                                ? 'rounded-br-sm'
                                : 'rounded-bl-sm'
                            } p-3 space-y-2`}
                          >
                            {message.attachments &&
                              message.attachments.length > 0 && (
                                <div className='grid grid-cols-2 gap-2 mb-2'>
                                  {message.attachments.map(
                                    (attachment, idx) => (
                                      <div
                                        key={idx}
                                        className='relative aspect-square rounded-lg overflow-hidden bg-rich-sand/20'
                                      >
                                        <Image
                                          src={attachment}
                                          alt={`Attachment ${idx + 1}`}
                                          fill
                                          className='object-cover'
                                          unoptimized
                                        />
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            {/* Show text for regular messages (not offer cards) */}
                            {message.text && message.text.trim() && (
                              <p
                                className={`text-sm leading-relaxed ${
                                  message.sender === 'me'
                                    ? 'text-white'
                                    : 'text-deep-charcoal'
                                }`}
                              >
                                {message.text}
                              </p>
                            )}

                            {/* Timestamp - Always show under message */}
                            <div
                              className={`flex items-center gap-1.5 mt-2 ${
                                message.sender === 'me'
                                  ? 'justify-end'
                                  : 'justify-start'
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  message.sender === 'me'
                                    ? 'text-white/70'
                                    : 'text-deep-charcoal/60'
                                }`}
                              >
                                {message.timestamp ||
                                  (locale === 'en' ? 'Just now' : 'الآن')}
                              </p>
                              {/* Delivery status ticks for sent messages */}
                              {message.sender === 'me' && (
                                <div className='flex items-center ml-0.5'>
                                  {message.isRead ? (
                                    // Double blue tick (read) - WhatsApp style
                                    <div className='flex items-center -space-x-1'>
                                      <HiCheck className='w-3.5 h-3.5 text-blue-300' />
                                      <HiCheck className='w-3.5 h-3.5 text-blue-300' />
                                    </div>
                                  ) : message.isDelivered ? (
                                    // Double gray tick (delivered)
                                    <div className='flex items-center -space-x-1'>
                                      <HiCheck className='w-3.5 h-3.5 text-white/70' />
                                      <HiCheck className='w-3.5 h-3.5 text-white/70' />
                                    </div>
                                  ) : (
                                    // Single gray tick (sent)
                                    <HiCheck className='w-3.5 h-3.5 text-white/50' />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <div className='border-t  border-rich-sand/30 p-3 md:p-4 bg-white flex-shrink-0'>
                  {/* Attached Files Preview */}
                  {attachedFiles.length > 0 && (
                    <div className='mb-3 flex flex-wrap gap-2'>
                      {attachedFiles.map(file => (
                        <div
                          key={file.id}
                          className='relative w-20 h-20 rounded-lg overflow-hidden bg-rich-sand/20 border border-rich-sand/30'
                        >
                          <Image
                            src={file.preview}
                            alt={file.file.name}
                            fill
                            className='object-cover'
                            unoptimized
                          />
                          <button
                            onClick={() => removeAttachment(file.id)}
                            className='absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer'
                            aria-label={locale === 'en' ? 'Remove' : 'إزالة'}
                          >
                            <HiXMark className='w-3 h-3' />
                          </button>
                          <div className='absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 truncate'>
                            {file.file.name.length > 10
                              ? file.file.name.substring(0, 10) + '...'
                              : file.file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Input Form */}
                  <form
                    onSubmit={handleSendMessage}
                    className='flex items-center gap-2'
                  >
                    <input
                      type='file'
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept='image/*'
                      multiple
                      className='hidden'
                      id='file-attachment'
                    />
                    <label
                      htmlFor='file-attachment'
                      className='group relative p-2.5 md:p-3 bg-gradient-to-br from-rich-sand/20 to-rich-sand/10 hover:from-rich-sand/30 hover:to-rich-sand/20 rounded-xl cursor-pointer transition-all duration-200 flex-shrink-0 shadow-sm hover:shadow-md border border-rich-sand/20 hover:border-rich-sand/30'
                      aria-label={locale === 'en' ? 'Attach file' : 'إرفاق ملف'}
                    >
                      <HiPaperClip className='w-5 h-5 text-deep-charcoal group-hover:text-saudi-green transition-colors duration-200' />
                      <div className='absolute inset-0 rounded-xl bg-saudi-green/0 group-hover:bg-saudi-green/5 transition-colors duration-200'></div>
                    </label>
                    <div className='flex-1 relative flex items-center'>
                      <textarea
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder={
                          locale === 'en'
                            ? 'Type a message...'
                            : 'اكتب رسالة...'
                        }
                        className='w-full px-4 py-2.5 md:py-3 pr-14 border border-rich-sand/30 rounded-3xl focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green resize-none flex items-center'
                        rows={1}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        style={{
                          minHeight: '44px',
                          maxHeight: '120px',
                        }}
                      />
                      <button
                        type='submit'
                        disabled={
                          !messageText.trim() && attachedFiles.length === 0
                        }
                        className='absolute right-2 top-1/2 -translate-y-1/2 group p-2 bg-gradient-to-br from-saudi-green to-green-600 text-white rounded-full hover:from-saudi-green/90 hover:to-green-600/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-saudi-green disabled:hover:to-green-600 cursor-pointer shadow-md hover:shadow-lg hover:scale-110 active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-md'
                        aria-label={
                          locale === 'en' ? 'Send message' : 'إرسال رسالة'
                        }
                      >
                        <HiPaperAirplane className='w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200' />
                        <div className='absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-colors duration-200'></div>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className='flex-1 flex items-center justify-center text-deep-charcoal/60'>
                {locale === 'en'
                  ? 'Select a conversation to start chatting'
                  : 'اختر محادثة لبدء الدردشة'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
