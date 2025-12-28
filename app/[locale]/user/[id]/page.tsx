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
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { HiArrowLeft } from 'react-icons/hi2';
import { FaStar } from 'react-icons/fa';

export default function UserProfilePage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
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
    skip: !userId,
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
      skip: !userId || !isSeller || activeTab !== 'products',
    }
  );

  // Fetch seller rating
  const { data: ratingData } = useGetSellerRatingQuery(userId, {
    skip: !userId || !isSeller,
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
      skip: !userId || !isSeller || activeTab !== 'reviews',
    }
  );

  // Reset tabs when userId changes
  useEffect(() => {
    if (userId) {
      setActiveTab('products');
      setProductsPage(1);
      setReviewsPage(1);
    }
  }, [userId]);

  // Extract products - API returns { success: true, products: [], pagination: {} }
  const products = Array.isArray(productsData)
    ? productsData
    : (productsData as any)?.products || [];

  // Extract reviews - API returns { success: true, reviews: [], pagination: {} }
  const reviews = reviewsData?.reviews || [];
  
  // Get rating - prefer from profile response, fallback to separate rating API
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
    <div className={`bg-off-white min-h-screen py-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Breadcrumbs */}
        <nav className='mb-6'>
          <ol className='flex items-center gap-1.5 text-xs text-deep-charcoal/60 flex-wrap'>
            <li>
              <Link
                href={`/${locale}`}
                className='hover:text-deep-charcoal transition-colors'
              >
                {locale === 'en' ? 'Home' : 'الرئيسية'}
              </Link>
            </li>
            <li>/</li>
            <li className='text-deep-charcoal/80'>
              {locale === 'en' ? 'User Profile' : 'الملف الشخصي'}
            </li>
          </ol>
        </nav>

        {isLoadingProfile ? (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/60 text-sm'>
              {locale === 'en' ? 'Loading profile...' : 'جاري تحميل الملف الشخصي...'}
            </p>
          </div>
        ) : profileError || !user ? (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-red-500 text-sm'>
              {locale === 'en'
                ? 'Failed to load profile'
                : 'فشل تحميل الملف الشخصي'}
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {/* User Info Card */}
            <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
              <div className='flex flex-col sm:flex-row items-center sm:items-start gap-4'>
                <div className='relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-rich-sand/20 flex-shrink-0'>
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
                    <div className='w-full h-full flex items-center justify-center bg-saudi-green text-white font-bold text-2xl'>
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0 text-center sm:text-left w-full sm:w-auto'>
                  <h2 className='text-xl sm:text-2xl font-bold text-deep-charcoal mb-1 break-words'>
                    {user.username || user.full_name}
                  </h2>
                  {user.full_name && user.full_name !== user.username && (
                    <p className='text-sm text-deep-charcoal/70 mb-2 break-words'>
                      {user.full_name}
                    </p>
                  )}
                  {isSeller && rating && (
                    <div className='flex items-center justify-center sm:justify-start gap-3 mt-3 flex-wrap'>
                      <div className='flex items-center gap-1 bg-white'>
                        <FaStar className='w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0' />
                        <span className='font-semibold text-deep-charcoal text-base'>
                          {(rating.averageRating || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className='text-sm text-deep-charcoal/60'>
                        ({rating.totalReviews || 0}{' '}
                        {locale === 'en' ? 'reviews' : 'تقييم'})
                      </span>
                    </div>
                  )}
                  {user.bio && (
                    <p className='text-sm text-deep-charcoal/70 mt-3 break-words max-w-2xl mx-auto sm:mx-0'>
                      {user.bio}
                    </p>
                  )}
                  {user.location && (
                    <p className='text-sm text-deep-charcoal/60 mt-2 flex items-center justify-center sm:justify-start gap-1.5'>
                      <span>📍</span>
                      <span className='break-words'>{user.location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs (only for sellers) */}
            {isSeller && (
              <div className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden'>
                <div className='flex border-b border-rich-sand/30'>
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`flex-1 px-6 py-3 font-semibold text-sm transition-colors ${
                      activeTab === 'products'
                        ? 'text-saudi-green border-b-2 border-saudi-green bg-saudi-green/5'
                        : 'text-deep-charcoal/60 hover:text-deep-charcoal hover:bg-rich-sand/5'
                    }`}
                  >
                    {locale === 'en' ? 'Products' : 'المنتجات'}
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 px-6 py-3 font-semibold text-sm transition-colors ${
                      activeTab === 'reviews'
                        ? 'text-saudi-green border-b-2 border-saudi-green bg-saudi-green/5'
                        : 'text-deep-charcoal/60 hover:text-deep-charcoal hover:bg-rich-sand/5'
                    }`}
                  >
                    {locale === 'en' ? 'Reviews' : 'التقييمات'}
                    {rating?.totalReviews && (
                      <span className='ml-2 text-xs font-medium'>
                        ({rating.totalReviews})
                      </span>
                    )}
                  </button>
                </div>

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <div className='p-6'>
                    {isLoadingProducts ? (
                      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className='relative aspect-square rounded-lg overflow-hidden bg-gray-200 skeleton-shimmer'
                          />
                        ))}
                      </div>
                    ) : products.length === 0 ? (
                      <div className='text-center text-deep-charcoal/60 py-12'>
                        <p className='text-sm'>
                          {locale === 'en'
                            ? 'No products found'
                            : 'لا توجد منتجات'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
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
                                className='group relative aspect-square rounded-lg overflow-hidden bg-transparent border border-rich-sand/30 hover:border-saudi-green/50 hover:shadow-lg transition-all'
                              >
                                {productImage ? (
                                  productImage.startsWith('/api/cdn') ? (
                                    <img
                                      src={productImage}
                                      alt={productTitle}
                                      className='w-full h-full object-contain group-hover:scale-105 transition-transform'
                                    />
                                  ) : (
                                    <Image
                                      src={productImage}
                                      alt={productTitle}
                                      fill
                                      className='object-contain group-hover:scale-105 transition-transform'
                                      unoptimized
                                    />
                                  )
                                ) : (
                                  <div className='w-full h-full flex items-center justify-center bg-transparent text-deep-charcoal/40 text-xs'>
                                    {locale === 'en' ? 'No Image' : 'لا توجد صورة'}
                                  </div>
                                )}
                                <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'>
                                  <div className='absolute bottom-0 left-0 right-0 p-3'>
                                    <p className='text-white text-xs font-medium truncate mb-0.5'>
                                      {productTitle}
                                    </p>
                                    {product.price && (
                                      <p className='text-white text-xs font-semibold'>
                                        {product.price} {product.currency || 'SAR'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                        {hasMoreProducts && (
                          <button
                            onClick={() => setProductsPage(prev => prev + 1)}
                            disabled={isFetchingProducts}
                            className='mt-6 w-full px-4 py-2 bg-saudi-green text-white text-sm rounded-lg hover:bg-saudi-green/90 transition-colors disabled:opacity-50 font-medium'
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
                      </>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className='p-6'>
                    {isLoadingReviews ? (
                      <div className='space-y-4'>
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className='border border-rich-sand/30 rounded-lg p-4 bg-white'
                          >
                            <div className='flex items-center justify-between mb-3'>
                              <div className='flex items-center gap-2'>
                                <div className='h-4 w-20 bg-gray-200 rounded skeleton-shimmer' />
                                <div className='h-4 w-16 bg-gray-200 rounded skeleton-shimmer' />
                              </div>
                              <div className='h-3 w-24 bg-gray-200 rounded skeleton-shimmer' />
                            </div>
                            <div className='space-y-2'>
                              <div className='h-3 w-full bg-gray-200 rounded skeleton-shimmer' />
                              <div className='h-3 w-3/4 bg-gray-200 rounded skeleton-shimmer' />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className='text-center text-deep-charcoal/60 py-12'>
                        <p className='text-sm'>
                          {locale === 'en'
                            ? 'No reviews yet'
                            : 'لا توجد تقييمات بعد'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className='space-y-4'>
                          {reviews.map((review: any) => (
                            <div
                              key={review.id}
                              className='border border-rich-sand/30 rounded-lg p-4'
                            >
                              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2'>
                                <div className='flex items-center gap-2 flex-wrap'>
                                  <div className='flex items-center gap-0.5 bg-white'>
                                    {[...Array(5)].map((_, i) => (
                                      <FaStar
                                        key={i}
                                        className={`w-4 h-4 flex-shrink-0 ${
                                          i < (review.rating || 0)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className='font-semibold text-deep-charcoal text-sm break-words'>
                                    {review.buyer?.username || 'Anonymous'}
                                  </span>
                                </div>
                                {(review.createdAt || review.created_at) && (
                                  <span className='text-xs text-deep-charcoal/60 flex-shrink-0'>
                                    {new Date(
                                      review.createdAt || review.created_at
                                    ).toLocaleDateString(
                                      locale === 'en' ? 'en-US' : 'ar-SA'
                                    )}
                                  </span>
                                )}
                              </div>
                              {review.comment && (
                                <p className='text-sm text-deep-charcoal/70 mt-2 break-words leading-relaxed'>
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        {hasMoreReviews && (
                          <button
                            onClick={() => setReviewsPage(prev => prev + 1)}
                            disabled={isFetchingReviews}
                            className='mt-6 w-full px-4 py-2 bg-saudi-green text-white text-sm rounded-lg hover:bg-saudi-green/90 transition-colors disabled:opacity-50 font-medium'
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
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Non-seller message */}
            {!isSeller && (
              <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
                <p className='text-deep-charcoal/60 text-sm'>
                  {locale === 'en'
                    ? 'This user has no products or reviews'
                    : 'هذا المستخدم ليس لديه منتجات أو تقييمات'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
