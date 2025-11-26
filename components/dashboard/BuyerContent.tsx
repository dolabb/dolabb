'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { HiPencil, HiShoppingCart, HiBanknotes } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/shared/Pagination';
import { useGetOffersQuery, useAcceptOfferMutation, useRejectOfferMutation, useCounterOfferMutation, type Offer } from '@/lib/api/offersApi';
import { useGetProductDetailQuery } from '@/lib/api/productsApi';
import { toast } from '@/utils/toast';
import { useAppSelector } from '@/lib/store/hooks';
import PaymentsTab from './PaymentsTab';
import CounterOfferModal from '@/components/shared/CounterOfferModal';
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
  onReject
}: { 
  offer: Offer;
  locale: string;
  isAccepting: boolean;
  isCountering: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  onCounter: () => void;
  onReject: () => void;
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

  const productImage = getProductImage();

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    countered: 'bg-blue-100 text-blue-700',
  };

  const statusLabels = {
    pending: locale === 'en' ? 'Pending' : 'قيد الانتظار',
    accepted: locale === 'en' ? 'Accepted' : 'مقبول',
    rejected: locale === 'en' ? 'Rejected' : 'مرفوض',
    countered: locale === 'en' ? 'Countered' : 'مقابل',
  };

  return (
    <div className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'>
      <Link
        href={`/${locale}/product/${offer.productId}`}
        className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
      >
        {productImage && !imageError ? (
          <Image
            src={productImage}
            alt={offer.productTitle || 'Product'}
            fill
            className='object-cover'
            unoptimized
            onError={() => setImageError(true)}
          />
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
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[offer.status] || statusColors.pending}`}>
            {statusLabels[offer.status] || statusLabels.pending}
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
                {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.originalPrice.toFixed(2)}
              </span>
            )}
            <span className='text-lg font-bold text-saudi-green'>
              {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.offerAmount.toFixed(2)}
            </span>
          </div>
          {offer.counterOfferAmount && (
            <p className='text-sm text-blue-600 mt-1'>
              {locale === 'en' ? 'Counter offer' : 'عرض مقابل'}: {locale === 'ar' ? 'ر.س' : 'SAR'} {offer.counterOfferAmount.toFixed(2)}
            </p>
          )}
        </div>
        {/* Accept and Counter/Reject buttons inside the card */}
        {/* Show buttons until offer is accepted or rejected */}
        {(offer.status === 'pending' || offer.status === 'countered') && (
          <div className='flex gap-2 mt-4'>
            <button
              onClick={onAccept}
              disabled={isAccepting}
              className='flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isAccepting 
                ? (locale === 'en' ? 'Accepting...' : 'جاري القبول...')
                : (locale === 'en' ? 'Accept' : 'قبول')}
            </button>
            {offer.status === 'pending' ? (
              <button
                onClick={onCounter}
                disabled={isCountering}
                className='flex-1 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isCountering 
                  ? (locale === 'en' ? 'Sending...' : 'جاري الإرسال...')
                  : (locale === 'en' ? 'Counter' : 'مقابل')}
              </button>
            ) : (
              <button
                onClick={onReject}
                disabled={isRejecting}
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
        {offer.status === 'accepted' && (
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
      </div>
    </div>
  );
}

export default function BuyerContent() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const user = useAppSelector(state => state.auth.user);
  const isSeller = user?.role === 'seller';
  // For sellers, default to 'offers' tab; for buyers, default to 'orders'
  // Use lazy initializer to avoid hook order issues when user state changes
  const [activeTab, setActiveTab] = useState<'orders' | 'offers' | 'shipping'>(() => {
    // This function only runs once on mount, so we use a default
    return 'orders';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Update activeTab when user role is determined (only once when user loads)
  useEffect(() => {
    if (isSeller) {
      setActiveTab('offers');
    }
  }, [isSeller]);

  // Fetch offers from API
  const { data: offersData, isLoading: isLoadingOffers, error: offersError, refetch: refetchOffers } = useGetOffersQuery();
  const [acceptOffer, { isLoading: isAccepting }] = useAcceptOfferMutation();
  const [rejectOffer, { isLoading: isRejecting }] = useRejectOfferMutation();
  const [counterOffer, { isLoading: isCountering }] = useCounterOfferMutation();

  // Counter offer modal state
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  // Mock orders data
  const orders = [
    {
      id: 'ORD-001',
      product: {
        id: '1',
        title: 'Vintage Denim Jacket',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
        price: 45.99,
      },
      orderDate: '2024-01-15',
      status: 'active',
    },
    {
      id: 'ORD-002',
      product: {
        id: '2',
        title: 'Designer Leather Bag',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop&auto=format',
        price: 89.50,
      },
      orderDate: '2024-01-14',
      status: 'active',
    },
    {
      id: 'ORD-003',
      product: {
        id: '3',
        title: 'Y2K Platform Sneakers',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop&auto=format',
        price: 65.00,
      },
      orderDate: '2024-01-13',
      status: 'sold',
    },
  ];

  // Get offers from API response
  const offers = offersData?.offers || [];

  // Handle counter offer submission from modal
  const handleCounterOfferSubmit = async (counterAmount: number) => {
    if (!selectedOffer) return;
    
    try {
      // Call the counter offer API: /api/offers/{offer_id}/counter/
      await counterOffer({
        offerId: selectedOffer.id,
        counterAmount: counterAmount,
      }).unwrap();
      toast.success(
        locale === 'en' 
          ? 'Counter offer sent successfully!' 
          : 'تم إرسال العرض المقابل بنجاح!'
      );
      // Refetch offers to get the latest data
      await refetchOffers();
      // Close the modal after successful submission
      setIsCounterModalOpen(false);
      setSelectedOffer(null);
    } catch (error: any) {
      toast.error(
        error?.data?.message || 
        (locale === 'en' ? 'Failed to send counter offer' : 'فشل إرسال العرض المقابل')
      );
      throw error; // Re-throw to let modal handle it
    }
  };

  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(orders.length / itemsPerPage);

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
        <div className='flex gap-4 mb-6 border-b border-rich-sand/30'>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {isSeller 
              ? (locale === 'en' ? 'Orders to Ship' : 'الطلبات للشحن')
              : (locale === 'en' ? 'Orders' : 'الطلبات')}
          </button>
          <button
            onClick={() => setActiveTab('offers')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'offers'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {isSeller 
              ? (locale === 'en' ? 'Received Offers' : 'العروض المستلمة')
              : (locale === 'en' ? 'Offers' : 'العروض')}
          </button>
          {isSeller && (
            <button
              onClick={() => setActiveTab('shipping')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === 'shipping'
                  ? 'border-saudi-green text-saudi-green'
                  : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
              }`}
            >
              {locale === 'en' ? 'Shipping' : 'الشحن'}
            </button>
          )}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {isSeller ? (
              // For sellers: Show PaymentsTab UI (Orders to Ship)
              <PaymentsTab />
            ) : (
              // For buyers: Show existing orders UI
              <>
                <div className='space-y-4 mb-6'>
                  {paginatedOrders.map(order => (
                    <div
                      key={order.id}
                      className='bg-white rounded-lg border border-rich-sand/30 p-4 flex flex-col sm:flex-row gap-4'
                    >
                      <Link
                        href={`/${locale}/product/${order.product.id}`}
                        className='relative w-full sm:w-24 h-24 bg-rich-sand/20 rounded-lg overflow-hidden flex-shrink-0'
                      >
                        <Image
                          src={order.product.image}
                          alt={order.product.title}
                          fill
                          className='object-cover'
                          unoptimized
                        />
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
                            {locale === 'en' ? 'Order ID' : 'رقم الطلب'}: {order.id}
                          </p>
                          <p>
                            {locale === 'en' ? 'Order Date' : 'تاريخ الطلب'}: {order.orderDate}
                          </p>
                          <p className='text-lg font-bold text-saudi-green'>
                            {locale === 'ar' ? 'ر.س' : 'SAR'} {order.product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className='flex flex-col gap-2 sm:w-32'>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                            order.status === 'sold'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {order.status === 'sold'
                            ? locale === 'en'
                              ? 'Sold'
                              : 'مباع'
                            : locale === 'en'
                              ? 'Active'
                              : 'نشط'}
                        </span>
                        <Link
                          href={`/${locale}/my-store/item/${order.product.id}`}
                          className='flex items-center justify-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors'
                        >
                          <HiPencil className='w-4 h-4' />
                          {locale === 'en' ? 'Edit listing' : 'تعديل القائمة'}
                        </Link>
                      </div>
                    </div>
                  ))}
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

        {/* Offers Tab */}
        {activeTab === 'offers' && (
          <div className='space-y-4'>
            {isLoadingOffers ? (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
                <p className='text-deep-charcoal/70'>
                  {locale === 'en' ? 'Loading offers...' : 'جاري تحميل العروض...'}
                </p>
              </div>
            ) : offersError ? (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
                <p className='text-red-600'>
                  {locale === 'en' 
                    ? 'Failed to load offers. Please try again.' 
                    : 'فشل تحميل العروض. يرجى المحاولة مرة أخرى.'}
                </p>
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
                    // Refetch offers to get the latest data
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
                    // Refetch offers to get the latest data
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
        productTitle={selectedOffer?.productTitle}
        onSubmit={handleCounterOfferSubmit}
        isLoading={isCountering}
      />
    </div>
  );
}

