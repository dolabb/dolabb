'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { HiPencil, HiShoppingCart, HiBanknotes, HiTruck } from 'react-icons/hi2';
import { useRouter, useSearchParams } from 'next/navigation';
import Pagination from '@/components/shared/Pagination';
import { useGetOffersQuery, useAcceptOfferMutation, useRejectOfferMutation, useCounterOfferMutation, type Offer } from '@/lib/api/offersApi';
import { useGetProductDetailQuery } from '@/lib/api/productsApi';
import { 
  useGetBuyerOrdersQuery, 
  useCreateReviewMutation, 
  useGetProductReviewsQuery,
  useGetSellerRatingQuery,
  useCreateDisputeMutation 
} from '@/lib/api/buyerApi';
import { useSendMessageMutation } from '@/lib/api/chatApi';
import { toast } from '@/utils/toast';
import { formatPrice } from '@/utils/formatPrice';
import { useAppSelector } from '@/lib/store/hooks';
import PaymentsTab from './PaymentsTab';
import CounterOfferModal from '@/components/shared/CounterOfferModal';
import ReviewModal from '@/components/shared/ReviewModal';
import DisputeModal from '@/components/shared/DisputeModal';
import { canUserPurchaseProduct } from '@/utils/productValidation';

// Separate component for offer item to use hooks properly
function OfferItem({ 
  offer, 
  locale, 
  isAccepting, 
  isCountering,
  isRejecting,
  onAccept,
  onCounter,
  onReject,
  onViewShipment
}: { 
  offer: Offer;
  locale: string;
  isAccepting: boolean;
  isCountering: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  onCounter: () => void;
  onReject: () => void;
  onViewShipment?: () => void;
}) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const currentUser = useAppSelector(state => state.auth.user);
  
  // Fetch product details for image
  const { data: productData } = useGetProductDetailQuery(offer.productId, {
    skip: !offer.productId,
  });

  // Check if current user is the product seller
  const productSellerId = (productData as any)?.seller?.id || offer.sellerId;
  const canPurchase = canUserPurchaseProduct(
    currentUser?.id,
    productSellerId
  );

  // Get product image
  const getProductImage = (): string => {
    if (!productData) return '';
    const productWithImages = productData as {
      Images?: string[];
      images?: string[];
    };
    const images = productWithImages.Images || productWithImages.images || [];
    const firstImage = images.find(
      img => img && img.trim() !== '' && img !== 'undefined' && img !== 'null'
    );
    return firstImage || '';
  };

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

  const productImageRaw = getProductImage();
  const productImage = productImageRaw ? normalizeImageUrl(productImageRaw) : '';

  // Helper function to get display status - show "paid" if accepted and payment is paid
  const getDisplayStatus = (): string => {
    if (offer.status === 'accepted' && (offer.payment?.status === 'paid' || offer.paymentStatus === 'paid')) {
      return 'paid';
    }
    return offer.status;
  };

  const displayStatus = getDisplayStatus();


  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    countered: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
  };

  const statusLabels = {
    pending: locale === 'en' ? 'Pending' : 'قيد الانتظار',
    accepted: locale === 'en' ? 'Accepted' : 'مقبول',
    rejected: locale === 'en' ? 'Rejected' : 'مرفوض',
    countered: locale === 'en' ? 'Countered' : 'مقابل',
    paid: locale === 'en' ? 'Paid' : 'مدفوع',
  };

  return (
    <div className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'>
      <Link
        href={`/${locale}/product/${offer.productId}`}
        className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
      >
        {productImage && !imageError ? (
          productImage.startsWith('/api/cdn') ? (
            <img
              src={productImage}
              alt={offer.productTitle || 'Product'}
              className='w-full h-full object-cover'
              onError={() => setImageError(true)}
            />
          ) : (
            <Image
              src={productImage}
              alt={offer.productTitle || 'Product'}
              fill
              className='object-cover'
              unoptimized
              onError={() => setImageError(true)}
            />
          )
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-rich-sand to-saudi-green/10'>
            <span className='text-deep-charcoal/40 text-xs text-center px-2'>
              {offer.productTitle || (locale === 'en' ? 'Product' : 'المنتج')}
            </span>
          </div>
        )}
      </Link>
      <div className='flex-1'>
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2'>
          <Link
            href={`/${locale}/product/${offer.productId}`}
            className='block'
          >
            <h3 className='font-semibold text-deep-charcoal mb-2 hover:text-saudi-green transition-colors'>
              {offer.productTitle || `Product ${offer.productId}`}
            </h3>
          </Link>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[displayStatus as keyof typeof statusColors] || statusColors.pending}`}>
            {statusLabels[displayStatus as keyof typeof statusLabels] || statusLabels.pending}
          </span>
        </div>
        <div className='text-sm text-deep-charcoal/70 space-y-1'>
          {offer.buyerName && (
            <p>
              {locale === 'en' ? 'Buyer' : 'المشتري'}: {offer.buyerName}
            </p>
          )}
          <p>
            {locale === 'en' ? 'Date' : 'التاريخ'}: {new Date(offer.createdAt).toLocaleDateString()}
          </p>
          <div className='flex items-center gap-2 mt-2'>
            {offer.originalPrice && (
              <span className='text-deep-charcoal/60 line-through'>
                {formatPrice(offer.originalPrice, locale, 2, offer.product?.currency)}
              </span>
            )}
            <span className='text-lg font-bold text-saudi-green'>
              {formatPrice(offer.offerAmount, locale, 2, offer.product?.currency)}
            </span>
          </div>
          {offer.counterOfferAmount && (
            <p className='text-sm text-blue-600 mt-1'>
              {locale === 'en' ? 'Counter offer' : 'عرض مقابل'}: {formatPrice(offer.counterOfferAmount, locale, 2, offer.product?.currency)}
            </p>
          )}
        </div>
        {/* Accept, Counter, and Reject buttons inside the card */}
        {/* Show buttons until offer is accepted or rejected */}
        {(offer.status === 'pending' || offer.status === 'countered') && (
          <div className='flex gap-2 mt-4'>
            <button
              onClick={onAccept}
              disabled={isAccepting || isRejecting || isCountering}
              className='flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isAccepting 
                ? (locale === 'en' ? 'Accepting...' : 'جاري القبول...')
                : (locale === 'en' ? 'Accept' : 'قبول')}
            </button>
            {offer.status === 'pending' ? (
              <>
                <button
                  onClick={onCounter}
                  disabled={isCountering || isAccepting || isRejecting}
                  className='flex-1 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isCountering 
                    ? (locale === 'en' ? 'Sending...' : 'جاري الإرسال...')
                    : (locale === 'en' ? 'Counter' : 'مقابل')}
                </button>
                <button
                  onClick={onReject}
                  disabled={isRejecting || isAccepting || isCountering}
                  className='flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isRejecting 
                    ? (locale === 'en' ? 'Rejecting...' : 'جاري الرفض...')
                    : (locale === 'en' ? 'Reject' : 'رفض')}
                </button>
              </>
            ) : (
              <button
                onClick={onReject}
                disabled={isRejecting || isAccepting}
                className='flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isRejecting 
                  ? (locale === 'en' ? 'Rejecting...' : 'جاري الرفض...')
                  : (locale === 'en' ? 'Reject' : 'رفض')}
              </button>
            )}
          </div>
        )}
        {/* View Checkout/Status Button - Show when offer is accepted */}
        {offer.status === 'accepted' && displayStatus !== 'paid' && (
          <div className='flex gap-2 mt-4'>
            {canPurchase ? (
              // Show checkout button for buyers
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    offerId: offer.id,
                    product: offer.productTitle || `Product ${offer.productId}`,
                    size: '',
                    price: String(offer.originalPrice || 0),
                    offerPrice: String(offer.offerAmount || 0),
                    shipping: String(offer.shippingCost || 0),
                  });
                  router.push(`/${locale}/checkout?${params.toString()}`);
                }}
                className='flex-1 px-4 py-2.5 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg'
              >
                <HiShoppingCart className='w-4 h-4' />
                {locale === 'en' ? 'View Checkout Page' : 'عرض صفحة الدفع'}
              </button>
            ) : (
              // Show status button for sellers
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    offerId: offer.id,
                    product: offer.productTitle || `Product ${offer.productId}`,
                  });
                  router.push(`/${locale}/order-status?${params.toString()}`);
                }}
                className='flex-1 px-4 py-2.5 bg-deep-charcoal text-white rounded-lg font-medium hover:bg-deep-charcoal/90 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg'
              >
                <HiBanknotes className='w-4 h-4' />
                {locale === 'en' ? 'View Status' : 'عرض الحالة'}
              </button>
            )}
          </div>
        )}
        {/* Shipment Actions - Show when offer is paid (for sellers only) */}
        {displayStatus === 'paid' && !canPurchase && onViewShipment && (
          <div className='flex gap-2 mt-4'>
            <button
              onClick={onViewShipment}
              className='flex-1 px-4 py-2.5 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg'
            >
              <HiTruck className='w-4 h-4' />
              {locale === 'en' ? 'View Details & Shipment' : 'عرض التفاصيل والشحن'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BuyerContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';
  const user = useAppSelector(state => state.auth.user);
  const isSeller = user?.role === 'seller';
  
  // Get tab from URL parameter, default based on user role
  const tabParam = searchParams.get('tab');
  const defaultTab = isSeller ? 'offers' : 'orders';
  const initialTab = (tabParam === 'offers' || tabParam === 'orders') ? tabParam : defaultTab;
  
  // For sellers, only show offers tab; for buyers, show orders and offers tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'offers'>(initialTab);
  
  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam === 'offers' || tabParam === 'orders') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Fetch offers from API
  const { data: offersData, isLoading: isLoadingOffers, error: offersError, refetch: refetchOffers } = useGetOffersQuery();
  const [acceptOffer, { isLoading: isAccepting }] = useAcceptOfferMutation();
  const [rejectOffer, { isLoading: isRejecting }] = useRejectOfferMutation();
  const [counterOffer, { isLoading: isCountering }] = useCounterOfferMutation();

  // Fetch buyer orders from API
  const { data: ordersData, isLoading: isLoadingOrders, error: ordersError, refetch: refetchOrders } = useGetBuyerOrdersQuery({}, {
    skip: isSeller, // Only fetch for buyers
  });
  
  // Buyer review and dispute mutations
  const [createReview, { isLoading: isSubmittingReview }] = useCreateReviewMutation();
  const [createDispute, { isLoading: isSubmittingDispute }] = useCreateDisputeMutation();
  
  // Chat message mutation for sending counter offer notification
  const [sendMessage] = useSendMessageMutation();

  // Counter offer modal state
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  
  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<any>(null);
  
  // Dispute modal state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedOrderForDispute, setSelectedOrderForDispute] = useState<any>(null);

  // Log offers data to console - Full API response
  useEffect(() => {
    if (offersData) {
      console.log('=== OFFERS API RESPONSE ===');
      console.log(offersData);
      console.log('===========================');
    }
  }, [offersData]);

  // Log offers error if any
  useEffect(() => {
    if (offersError) {
      console.error('=== OFFERS ERROR ===');
      console.error('Error:', offersError);
      console.error('===================');
    }
  }, [offersError]);

  // Get orders from API response
  const orders = ordersData?.orders || [];

  // Get offers from API response
  const offers = offersData?.offers || [];

  // Note: We don't need a WebSocket connection here
  // The backend API should handle sending WebSocket messages to both parties
  // when the counter offer is created

  // Handle counter offer submission from modal
  const handleCounterOfferSubmit = async (counterAmount: number) => {
    if (!selectedOffer) return;
    
    try {
      // Call the counter offer API: /api/offers/{offer_id}/counter/
      const response = await counterOffer({
        offerId: selectedOffer.id,
        counterAmount: counterAmount,
      }).unwrap();

      // The backend API should automatically send WebSocket messages to both parties
      // when the counter offer is created. We don't need to send it manually here.
      // However, we can send a chat message as a backup notification
      const buyerId = selectedOffer.buyerId || selectedOffer.buyer?.id;
      const productId = selectedOffer.productId || selectedOffer.product?.id;
      
      // Send a chat message as backup notification (backend should handle WebSocket)
      if (buyerId) {
        try {
          const offerCurrency = selectedOffer.product?.currency || '';
          const currencySymbol = locale === 'ar' 
            ? (offerCurrency === 'SAR' ? '﷼' : offerCurrency === 'OMR' ? 'ر.ع' : offerCurrency === 'AED' ? 'د.إ' : offerCurrency === 'KWD' ? 'د.ك' : offerCurrency === 'QAR' ? 'ر.ق' : offerCurrency === 'BHD' ? 'د.ب' : offerCurrency)
            : offerCurrency;
          await sendMessage({
            receiverId: buyerId,
            text:
              locale === 'en'
                ? `Counter offer: ${currencySymbol} ${counterAmount.toFixed(2)}`
                : `عرض مقابل: ${counterAmount.toFixed(2)} ${currencySymbol}`,
            offerId: selectedOffer.id,
            productId: productId,
          }).unwrap();
        } catch (chatError) {
          console.error('Error sending chat message:', chatError);
          // Don't fail the whole operation if chat message fails
        }
      }

      // Store offer ID before closing modal
      const offerIdToRedirect = selectedOffer.id;
      
      toast.success(
        locale === 'en' 
          ? 'Counter offer sent successfully!' 
          : 'تم إرسال العرض المقابل بنجاح!'
      );
      
      // Close the modal first
      setIsCounterModalOpen(false);
      setSelectedOffer(null);
      
      // Wait a bit for backend to process, then refetch offers and redirect to chat
      await new Promise(resolve => setTimeout(resolve, 300));
      await refetchOffers();
      
      // Redirect to messages page with buyer ID to auto-select conversation
      if (buyerId) {
        router.push(`/${locale}/messages?buyerId=${buyerId}&offerId=${offerIdToRedirect}`);
      }
    } catch (error: any) {
      toast.error(
        error?.data?.message || 
        (locale === 'en' ? 'Failed to send counter offer' : 'فشل إرسال العرض المقابل')
      );
      throw error; // Re-throw to let modal handle it
    }
  };

  // Handle review submission
  const handleSubmitReview = async (orderId: string, rating: number, comment?: string) => {
    try {
      await createReview({
        orderId,
        rating,
        comment: comment || undefined,
      }).unwrap();
      toast.success(
        locale === 'en' 
          ? 'Review submitted successfully!' 
          : 'تم إرسال التقييم بنجاح!'
      );
      await refetchOrders();
      setIsReviewModalOpen(false);
      setSelectedOrderForReview(null);
    } catch (error: any) {
      toast.error(
        error?.data?.message || 
        (locale === 'en' ? 'Failed to submit review' : 'فشل إرسال التقييم')
      );
    }
  };

  // Handle dispute/report submission
  const handleSubmitDispute = async (orderId: string, disputeType: 'product_quality' | 'delivery_issue' | 'payment_dispute', description: string) => {
    try {
      await createDispute({
        orderId,
        disputeType,
        description,
      }).unwrap();
      toast.success(
        locale === 'en' 
          ? 'Report submitted successfully! Admin will review it.' 
          : 'تم إرسال البلاغ بنجاح! سيقوم المدير بمراجعته.'
      );
      await refetchOrders();
      setIsDisputeModalOpen(false);
      setSelectedOrderForDispute(null);
    } catch (error: any) {
      toast.error(
        error?.data?.message || 
        (locale === 'en' ? 'Failed to submit report' : 'فشل إرسال البلاغ')
      );
    }
  };

  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // Status badge colors and labels
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: { en: string; ar: string } }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: { en: 'Pending', ar: 'قيد الانتظار' } },
      packed: { color: 'bg-blue-100 text-blue-700', label: { en: 'Packed', ar: 'معبأ' } },
      ready: { color: 'bg-purple-100 text-purple-700', label: { en: 'Ready', ar: 'جاهز' } },
      shipped: { color: 'bg-indigo-100 text-indigo-700', label: { en: 'Shipped', ar: 'شُحن' } },
      delivered: { color: 'bg-green-100 text-green-700', label: { en: 'Delivered', ar: 'تم التسليم' } },
      cancelled: { color: 'bg-red-100 text-red-700', label: { en: 'Cancelled', ar: 'ملغي' } },
    };
    return statusMap[status] || { color: 'bg-gray-100 text-gray-700', label: { en: status, ar: status } };
  };

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Page Title */}
        <h1 className='text-2xl md:text-3xl font-bold text-deep-charcoal mb-6'>
          {isSeller 
            ? (locale === 'en' ? 'Received Offers' : 'العروض المستلمة')
            : (locale === 'en' ? 'Buyer Dashboard' : 'لوحة المشتري')}
        </h1>
        {/* Tabs */}
        {!isSeller && (
        <div className='flex gap-4 mb-6 border-b border-rich-sand/30'>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Orders' : 'الطلبات'}
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'offers'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Offers' : 'العروض'}
          </button>
        </div>
        )}

        {/* Orders Tab - Only for buyers */}
        {!isSeller && activeTab === 'orders' && (
          <div>
            {isLoadingOrders ? (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
                <p className='text-deep-charcoal/70'>
                  {locale === 'en' ? 'Loading orders...' : 'جاري تحميل الطلبات...'}
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
                <p className='text-deep-charcoal/70'>
                  {locale === 'en' ? 'No orders found.' : 'لا توجد طلبات.'}
                </p>
              </div>
            ) : (
              <>
            <div className='space-y-4 mb-6'>
                  {paginatedOrders.map(order => {
                    const statusBadge = getStatusBadge(order.status);
                    const firstImageRaw = order.product?.images?.[0] || '';
                    
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
                    
                    const firstImage = firstImageRaw ? normalizeImageUrl(firstImageRaw) : '';
                    
                    return (
                <div
                  key={order.id}
                  className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
                >
                  <Link
                    href={`/${locale}/product/${order.product.id}`}
                    className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
                  >
                          {firstImage ? (
                            firstImage.startsWith('/api/cdn') ? (
                              <img
                                src={firstImage}
                                alt={order.product.title}
                                className='w-full h-full object-cover'
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Image
                                src={firstImage}
                                alt={order.product.title}
                                fill
                                className='object-cover'
                                unoptimized
                                onError={() => {
                                  console.error('Order product image failed to load:', firstImage);
                                }}
                              />
                            )
                          ) : (
                            <div className='w-full h-full flex items-center justify-center text-deep-charcoal/30'>
                              {locale === 'en' ? 'Product' : 'المنتج'}
                            </div>
                          )}
                  </Link>
                  <div className='flex-1'>
                    <Link
                      href={`/${locale}/product/${order.product.id}`}
                      className='block'
                    >
                      <h3 className='font-semibold text-deep-charcoal mb-2 hover:text-saudi-green transition-colors'>
                        {order.product.title}
                      </h3>
                    </Link>
                    <div className='text-sm text-deep-charcoal/70 space-y-1'>
                      <p>
                              {locale === 'en' ? 'Order ID' : 'رقم الطلب'}: {order.orderNumber || order.id}
                      </p>
                      <p>
                              {locale === 'en' ? 'Order Date' : 'تاريخ الطلب'}: {new Date(order.orderDate).toLocaleDateString()}
                            </p>
                            {order.trackingNumber && (
                              <p>
                                {locale === 'en' ? 'Tracking' : 'رقم التتبع'}: {order.trackingNumber}
                              </p>
                            )}
                      <p className='text-lg font-bold text-saudi-green'>
                              {formatPrice(order.totalPrice || 0, locale, 2, (order as any).currency || (order.product as any)?.currency)}
                      </p>
                    </div>
                  </div>
                        <div className='flex flex-col gap-2 sm:w-40'>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${statusBadge.color}`}>
                            {statusBadge.label[locale as 'en' | 'ar'] || statusBadge.label.en}
                          </span>
                          
                          {/* Review button - Show for delivered orders that haven't been reviewed */}
                          {order.status === 'delivered' && !order.reviewSubmitted && (
                            <button
                              onClick={() => {
                                setSelectedOrderForReview(order);
                                setIsReviewModalOpen(true);
                              }}
                              className='flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors cursor-pointer'
                            >
                              {locale === 'en' ? 'Review' : 'تقييم'}
                            </button>
                          )}
                          
                          {/* Report/Dispute button - Show for delivered orders */}
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => {
                                setSelectedOrderForDispute(order);
                                setIsDisputeModalOpen(true);
                              }}
                              className='flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer'
                            >
                              {locale === 'en' ? 'Report Issue' : 'الإبلاغ عن مشكلة'}
                            </button>
                          )}
                        </div>
                  </div>
                    );
                  })}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
                )}
              </>
            )}
          </div>
        )}

        {/* Offers Tab - Show for sellers directly, or when activeTab is 'offers' for buyers */}
        {(isSeller || activeTab === 'offers') && (
          <div className='space-y-4'>
            {isLoadingOffers ? (
              <div className='space-y-4'>
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
                  >
                    <div className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg skeleton-shimmer' />
                    <div className='flex-1 space-y-3'>
                      <div className='flex items-start justify-between'>
                        <div className='h-6 bg-rich-sand/30 rounded w-3/4 skeleton-shimmer' />
                        <div className='h-6 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
                      </div>
                      <div className='space-y-2'>
                        <div className='h-4 bg-rich-sand/30 rounded w-1/2 skeleton-shimmer' />
                        <div className='h-4 bg-rich-sand/30 rounded w-1/3 skeleton-shimmer' />
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='h-5 bg-rich-sand/30 rounded w-20 skeleton-shimmer' />
                        <div className='h-6 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
                      </div>
                      <div className='flex gap-2 mt-4'>
                        <div className='h-10 bg-rich-sand/30 rounded flex-1 skeleton-shimmer' />
                        <div className='h-10 bg-rich-sand/30 rounded flex-1 skeleton-shimmer' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
                <p className='text-deep-charcoal/70'>
                  {locale === 'en' ? 'No offers found.' : 'لا توجد عروض.'}
                </p>
              </div>
            ) : (
              offers.map(offer => {
                const handleAccept = async () => {
                  try {
                    // Call the accept offer API: /api/offers/{offer_id}/accept/
                    await acceptOffer(offer.id).unwrap();
                    
                    toast.success(
                      locale === 'en' 
                        ? 'Offer accepted successfully!' 
                        : 'تم قبول العرض بنجاح!'
                    );
                    
                    // Refetch offers to get the latest data after acceptance
                    // Add a small delay to ensure backend has processed the acceptance
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await refetchOffers();
                  } catch (error: any) {
                    toast.error(
                      error?.data?.message || 
                      (locale === 'en' ? 'Failed to accept offer' : 'فشل قبول العرض')
                    );
                  }
                };

                const handleReject = async () => {
                  try {
                    // Call the reject offer API: /api/offers/{offer_id}/reject/
                    await rejectOffer(offer.id).unwrap();
                    
                    toast.success(
                      locale === 'en' 
                        ? 'Offer rejected successfully!' 
                        : 'تم رفض العرض بنجاح!'
                    );
                    
                    // Refetch offers to get the latest data after rejection
                    // Add a small delay to ensure backend has processed the rejection
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await refetchOffers();
                  } catch (error: any) {
                    toast.error(
                      error?.data?.message || 
                      (locale === 'en' ? 'Failed to reject offer' : 'فشل رفض العرض')
                    );
                  }
                };

                const handleCounter = () => {
                  // Open counter offer modal
                  setSelectedOffer(offer);
                  setIsCounterModalOpen(true);
                };

                const handleViewShipment = () => {
                  // Navigate to shipment page
                  router.push(`/${locale}/seller/offer/${offer.id}`);
                };

                return (
                  <OfferItem
                    key={offer.id}
                    offer={offer}
                    locale={locale}
                    isAccepting={isAccepting}
                    isCountering={isCountering}
                    isRejecting={isRejecting}
                    onAccept={handleAccept}
                    onCounter={handleCounter}
                    onReject={handleReject}
                    onViewShipment={isSeller ? handleViewShipment : undefined}
                  />
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Counter Offer Modal */}
      <CounterOfferModal
        isOpen={isCounterModalOpen}
        onClose={() => {
          setIsCounterModalOpen(false);
          setSelectedOffer(null);
        }}
        originalOfferAmount={selectedOffer?.offerAmount || 0}
        originalPrice={selectedOffer?.originalPrice || 0}
        productTitle={selectedOffer?.productTitle}
        onSubmit={handleCounterOfferSubmit}
        isLoading={isCountering}
      />

      {/* Review Modal */}
      {selectedOrderForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedOrderForReview(null);
          }}
          orderId={selectedOrderForReview.id}
          productTitle={selectedOrderForReview.product?.title || 'Product'}
          onSubmit={async (rating, comment) => {
            await handleSubmitReview(selectedOrderForReview.id, rating, comment);
          }}
          isLoading={isSubmittingReview}
        />
      )}

      {/* Dispute Modal */}
      {selectedOrderForDispute && (
        <DisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => {
            setIsDisputeModalOpen(false);
            setSelectedOrderForDispute(null);
          }}
          orderId={selectedOrderForDispute.id}
          productTitle={selectedOrderForDispute.product?.title || 'Product'}
          onSubmit={async (disputeType, description) => {
            await handleSubmitDispute(selectedOrderForDispute.id, disputeType, description);
          }}
          isLoading={isSubmittingDispute}
        />
      )}
    </div>
  );
}

