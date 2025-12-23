'use client';

import { useGetUserProfileByIdQuery } from '@/lib/api/authApi';
import { useGetProductsBySellerIdQuery } from '@/lib/api/productsApi';
import {
  useGetSellerReviewsQuery,
  useGetSellerRatingQuery,
} from '@/lib/api/buyerApi';
import { useAppSelector } from '@/lib/store/hooks';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HiXMark, HiStar } from 'react-icons/hi2';
import { FaStar } from 'react-icons/fa';

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({
  userId,
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const currentUser = useAppSelector(state => state.auth.user);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [productsPage, setProductsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);

  // Fetch user profile
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useGetUserProfileByIdQuery(userId, {
    skip: !isOpen || !userId,
  });

  const user = profileData?.user;
  const isSeller = user?.role === 'seller';

  // Fetch seller products
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
  } = useGetProductsBySellerIdQuery(
    {
      sellerId: userId,
      page: productsPage,
      limit: 12,
    },
    {
      skip: !isOpen || !userId || !isSeller || activeTab !== 'products',
    }
  );

  // Fetch seller rating
  const { data: ratingData } = useGetSellerRatingQuery(userId, {
    skip: !isOpen || !userId || !isSeller,
  });

  // Fetch seller reviews
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    isFetching: isFetchingReviews,
  } = useGetSellerReviewsQuery(
    {
      sellerId: userId,
      page: reviewsPage,
      limit: 10,
    },
    {
      skip: !isOpen || !userId || !isSeller || activeTab !== 'reviews',
    }
  );

  // Reset tabs when modal opens/closes and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      setActiveTab('products');
      setProductsPage(1);
      setReviewsPage(1);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = '';
    }
    
    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract products - API returns { success: true, products: [], pagination: {} }
  const products = Array.isArray(productsData)
    ? productsData
    : (productsData as any)?.products || [];

  // Extract reviews - API returns { success: true, reviews: [], pagination: {} }
  const reviews = reviewsData?.reviews || [];
  
  // Get rating - prefer from profile response, fallback to separate rating API
  // Profile API returns: user.rating = { averageRating, totalReviews, ratingDistribution }
  // Rating API returns: rating = { averageRating, totalReviews, ratingDistribution }
  const rating = user?.rating || ratingData?.rating || null;
  
  // Calculate pagination
  const productsPagination = Array.isArray(productsData)
    ? null
    : (productsData as any)?.pagination;
  const hasMoreProducts = productsPagination
    ? productsPage < productsPagination.totalPages
    : products.length >= 12;

  const reviewsPagination = reviewsData?.pagination;
  const hasMoreReviews = reviewsPagination
    ? reviewsPage < reviewsPagination.totalPages
    : reviews.length >= 10;

  // Normalize image URL
  const normalizeImageUrl = (url: string | undefined | null): string => {
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
      return '';
    }
    const trimmed = url.trim();
    let normalized = trimmed.startsWith('http://')
      ? trimmed.replace('http://', 'https://')
      : trimmed;

    if (normalized.startsWith('/') && !normalized.startsWith('//')) {
      normalized = `https://dolabb-backend-2vsj.onrender.com${normalized}`;
    }

    if (normalized.includes('cdn.dolabb.com')) {
      try {
        const urlObj = new URL(normalized);
        const path = urlObj.pathname + urlObj.search;
        return `/api/cdn${path}`;
      } catch {
        const path = normalized
          .replace('https://cdn.dolabb.com', '')
          .replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return normalized;
  };

  const profileImage = normalizeImageUrl(user?.profile_image);

  return (
    <div
      className='fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto pt-20 sm:pt-8'
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl mt-2 sm:mt-4 mb-4 sm:mb-8 max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col ${
          isRTL ? 'rtl' : 'ltr'
        }`}
        onClick={e => e.stopPropagation()}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-5 sm:px-6 py-4 border-b-2 border-saudi-green/20 bg-gradient-to-r from-white to-rich-sand/5 flex-shrink-0 sticky top-0 z-10'>
          <h2 className='text-xl sm:text-2xl font-bold text-deep-charcoal'>
            {locale === 'en' ? 'User Profile' : 'الملف الشخصي'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-rich-sand/20 rounded-full transition-all cursor-pointer flex-shrink-0 hover:scale-110'
            aria-label={locale === 'en' ? 'Close' : 'إغلاق'}
          >
            <HiXMark className='w-5 h-5 sm:w-6 sm:h-6 text-deep-charcoal' />
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-rich-sand/30 scrollbar-track-transparent'>
          {isLoadingProfile ? (
            <div className='p-6 text-center text-deep-charcoal/60'>
              {locale === 'en' ? 'Loading profile...' : 'جاري تحميل الملف الشخصي...'}
            </div>
          ) : profileError || !user ? (
            <div className='p-6 text-center text-red-500'>
              {locale === 'en'
                ? 'Failed to load profile'
                : 'فشل تحميل الملف الشخصي'}
            </div>
          ) : (
            <>
              {/* User Info Section */}
              <div className='px-5 sm:px-6 py-5 sm:py-6 border-b border-rich-sand/20 bg-gradient-to-br from-white via-rich-sand/5 to-white'>
                <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4'>
                  <div className='relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gradient-to-br from-saudi-green/20 to-rich-sand/30 flex-shrink-0 ring-4 ring-white shadow-lg'>
                    {profileImage ? (
                      profileImage.startsWith('/api/cdn') ? (
                        <img
                          src={profileImage}
                          alt={user.username}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <Image
                          src={profileImage}
                          alt={user.username}
                          fill
                          className='object-cover'
                          unoptimized
                        />
                      )
                    ) : (
                      <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-saudi-green to-saudi-green/80 text-white font-bold text-2xl sm:text-3xl'>
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className='flex-1 min-w-0 text-center sm:text-left w-full sm:w-auto'>
                    <h3 className='text-xl sm:text-2xl font-bold text-deep-charcoal mb-1 break-words'>
                      {user.username || user.full_name}
                    </h3>
                    {user.full_name && user.full_name !== user.username && (
                      <p className='text-sm sm:text-base text-deep-charcoal/70 mb-2 break-words'>
                        {user.full_name}
                      </p>
                    )}
                    {isSeller && rating && (
                      <div className='flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap'>
                        <div className='flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200'>
                          <FaStar className='w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0' />
                          <span className='font-bold text-deep-charcoal text-base'>
                            {(rating.averageRating || rating.average_rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <span className='text-sm text-deep-charcoal/70 bg-rich-sand/30 px-3 py-1.5 rounded-full'>
                          {rating.totalReviews || rating.total_reviews || 0}{' '}
                          {locale === 'en' ? 'reviews' : 'تقييم'}
                        </span>
                      </div>
                    )}
                    {user.bio && (
                      <p className='text-sm text-deep-charcoal/70 mt-3 break-words line-clamp-3 max-w-md mx-auto sm:mx-0'>
                        {user.bio}
                      </p>
                    )}
                    {user.location && (
                      <p className='text-sm text-deep-charcoal/60 mt-3 flex items-center justify-center sm:justify-start gap-1.5'>
                        <span className='text-lg'>📍</span>
                        <span className='break-words'>{user.location}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs (only for sellers) */}
              {isSeller && (
                <>
                  <div className='flex border-b-2 border-rich-sand/20 bg-white sticky top-[120px] sm:top-[140px] z-10 shadow-sm'>
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all relative ${
                        activeTab === 'products'
                          ? 'text-saudi-green bg-saudi-green/10'
                          : 'text-deep-charcoal/60 hover:text-deep-charcoal hover:bg-rich-sand/10'
                      }`}
                    >
                      <span className='flex items-center justify-center gap-2'>
                        {locale === 'en' ? 'Products' : 'المنتجات'}
                        {products.length > 0 && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            activeTab === 'products'
                              ? 'bg-saudi-green text-white'
                              : 'bg-rich-sand/40 text-deep-charcoal/70'
                          }`}>
                            {products.length}
                          </span>
                        )}
                      </span>
                      {activeTab === 'products' && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-saudi-green'></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all relative ${
                        activeTab === 'reviews'
                          ? 'text-saudi-green bg-saudi-green/10'
                          : 'text-deep-charcoal/60 hover:text-deep-charcoal hover:bg-rich-sand/10'
                      }`}
                    >
                      <span className='flex items-center justify-center gap-2'>
                        {locale === 'en' ? 'Reviews' : 'التقييمات'}
                        {(rating?.totalReviews || rating?.total_reviews) && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            activeTab === 'reviews'
                              ? 'bg-saudi-green text-white'
                              : 'bg-rich-sand/40 text-deep-charcoal/70'
                          }`}>
                            {rating.totalReviews || rating.total_reviews}
                          </span>
                        )}
                      </span>
                      {activeTab === 'reviews' && (
                        <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-saudi-green'></div>
                      )}
                    </button>
                  </div>

                  {/* Products Tab */}
                  {activeTab === 'products' && (
                    <div className='px-4 sm:px-6 py-5 sm:py-6 bg-rich-sand/5'>
                      {isLoadingProducts ? (
                        <div className='text-center text-deep-charcoal/60 py-12 sm:py-16'>
                          <p className='text-base sm:text-lg'>
                            {locale === 'en'
                              ? 'Loading products...'
                              : 'جاري تحميل المنتجات...'}
                          </p>
                        </div>
                      ) : products.length === 0 ? (
                        <div className='text-center text-deep-charcoal/60 py-12 sm:py-16'>
                          <p className='text-base sm:text-lg'>
                            {locale === 'en'
                              ? 'No products found'
                              : 'لا توجد منتجات'}
                          </p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'>
                          {products.map((product: any) => {
                            const productImage = normalizeImageUrl(
                              product.image || product.images?.[0]
                            );
                            const productId = product.id;
                            const productTitle =
                              product.itemtitle || product.title || 'Untitled';

                            return (
                              <Link
                                key={productId}
                                href={`/${locale}/product/${productId}`}
                                onClick={onClose}
                                className='group relative aspect-square rounded-xl overflow-hidden bg-white border-2 border-rich-sand/30 hover:border-saudi-green/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'
                              >
                                {productImage ? (
                                  productImage.startsWith('/api/cdn') ? (
                                    <img
                                      src={productImage}
                                      alt={productTitle}
                                      className='w-full h-full object-cover group-hover:scale-105 transition-transform'
                                    />
                                  ) : (
                                    <Image
                                      src={productImage}
                                      alt={productTitle}
                                      fill
                                      className='object-cover group-hover:scale-105 transition-transform'
                                      unoptimized
                                    />
                                  )
                                ) : (
                                  <div className='w-full h-full flex items-center justify-center text-deep-charcoal/40'>
                                    {locale === 'en' ? 'No Image' : 'لا توجد صورة'}
                                  </div>
                                )}
                                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                                  <div className='absolute bottom-0 left-0 right-0 p-3 sm:p-4'>
                                    <p className='text-white text-xs sm:text-sm font-semibold truncate mb-1 drop-shadow-lg'>
                                      {productTitle}
                                    </p>
                                    {product.price && (
                                      <p className='text-white text-sm font-bold drop-shadow-lg'>
                                        {product.price} {product.currency || 'SAR'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                      {hasMoreProducts && (
                        <button
                          onClick={() => setProductsPage(prev => prev + 1)}
                          disabled={isFetchingProducts}
                          className='mt-4 sm:mt-6 w-full px-4 py-2.5 sm:py-3 bg-saudi-green text-white text-sm sm:text-base rounded-lg hover:bg-saudi-green/90 transition-colors disabled:opacity-50 font-medium'
                        >
                          {isFetchingProducts
                            ? locale === 'en'
                              ? 'Loading...'
                              : 'جاري التحميل...'
                            : locale === 'en'
                            ? 'Load More Products'
                            : 'تحميل المزيد من المنتجات'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reviews Tab */}
                  {activeTab === 'reviews' && (
                    <div className='px-4 sm:px-6 py-5 sm:py-6 bg-rich-sand/5'>
                      {isLoadingReviews ? (
                        <div className='text-center text-deep-charcoal/60 py-12 sm:py-16'>
                          <p className='text-base sm:text-lg'>
                            {locale === 'en'
                              ? 'Loading reviews...'
                              : 'جاري تحميل التقييمات...'}
                          </p>
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className='text-center text-deep-charcoal/60 py-12 sm:py-16'>
                          <p className='text-base sm:text-lg'>
                            {locale === 'en'
                              ? 'No reviews yet'
                              : 'لا توجد تقييمات بعد'}
                          </p>
                        </div>
                      ) : (
                        <div className='space-y-4'>
                          {reviews.map((review: any) => (
                            <div
                              key={review.id}
                              className='border-2 border-rich-sand/30 rounded-xl p-4 sm:p-5 bg-white hover:shadow-lg hover:border-saudi-green/30 transition-all duration-300'
                            >
                              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3'>
                                <div className='flex items-center gap-3 flex-wrap'>
                                  <div className='flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-200'>
                                    {[...Array(5)].map((_, i) => (
                                      <FaStar
                                        key={i}
                                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                                          i < (review.rating || 0)
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className='font-bold text-deep-charcoal text-base break-words'>
                                    {review.buyer?.username || 'Anonymous'}
                                  </span>
                                </div>
                                {(review.createdAt || review.created_at) && (
                                  <span className='text-xs text-deep-charcoal/60 flex-shrink-0 bg-rich-sand/30 px-2 py-1 rounded-full'>
                                    {new Date(
                                      review.createdAt || review.created_at
                                    ).toLocaleDateString(
                                      locale === 'en' ? 'en-US' : 'ar-SA'
                                    )}
                                  </span>
                                )}
                              </div>
                              {review.comment && (
                                <p className='text-sm sm:text-base text-deep-charcoal/80 mt-3 break-words leading-relaxed bg-rich-sand/20 p-3 rounded-lg'>
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {hasMoreReviews && (
                        <button
                          onClick={() => setReviewsPage(prev => prev + 1)}
                          disabled={isFetchingReviews}
                          className='mt-4 sm:mt-6 w-full px-4 py-2.5 sm:py-3 bg-saudi-green text-white text-sm sm:text-base rounded-lg hover:bg-saudi-green/90 transition-colors disabled:opacity-50 font-medium'
                        >
                          {isFetchingReviews
                            ? locale === 'en'
                              ? 'Loading...'
                              : 'جاري التحميل...'
                            : locale === 'en'
                            ? 'Load More Reviews'
                            : 'تحميل المزيد من التقييمات'}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Non-seller message */}
              {!isSeller && (
                <div className='px-4 sm:px-6 py-8 sm:py-12 text-center text-deep-charcoal/60'>
                  <p className='text-sm sm:text-base'>
                    {locale === 'en'
                      ? 'This user has no products or reviews'
                      : 'هذا المستخدم ليس لديه منتجات أو تقييمات'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

