'use client';

import { useLocale } from 'next-intl';
import { useState } from 'react';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import { useAppSelector } from '@/lib/store/hooks';
import {
  useGetSellerRatingQuery,
  useGetSellerReviewsQuery,
} from '@/lib/api/buyerApi';
import Pagination from '@/components/shared/Pagination';

export default function ReviewsTab() {
  const locale = useLocale();
  const user = useAppSelector((state) => state.auth.user);
  const sellerId = user?.id;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get seller rating
  const { data: ratingData, isLoading: isLoadingRating } = useGetSellerRatingQuery(
    sellerId || '',
    {
      skip: !sellerId,
    }
  );

  // Get seller reviews
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
  } = useGetSellerReviewsQuery(
    {
      sellerId: sellerId || '',
      page: currentPage,
      limit: itemsPerPage,
    },
    {
      skip: !sellerId,
    }
  );

  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination;
  const rating = ratingData?.rating;
  const isLoading = isLoadingRating || isLoadingReviews;

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {/* Rating Summary Skeleton */}
        <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
          <div className='flex items-center gap-4'>
            <div className='h-16 bg-rich-sand/30 rounded w-16 skeleton-shimmer' />
            <div className='space-y-2'>
              <div className='h-6 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
              <div className='h-4 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
            </div>
          </div>
        </div>
        {/* Review Cards Skeleton */}
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className='bg-white rounded-lg border border-rich-sand/30 p-6'
          >
            <div className='flex items-start gap-4 mb-4'>
              <div className='w-12 h-12 bg-rich-sand/30 rounded-full skeleton-shimmer' />
              <div className='flex-1 space-y-2'>
                <div className='h-5 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
              </div>
            </div>
            <div className='h-4 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
            <div className='h-4 bg-rich-sand/30 rounded w-3/4 mt-2 skeleton-shimmer' />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Rating Summary */}
      {rating && rating.totalReviews > 0 && (
        <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Average Rating */}
            <div className='text-center md:text-left'>
              <div className='text-5xl font-bold text-deep-charcoal mb-2'>
                {rating.averageRating.toFixed(1)}
              </div>
              <div className='flex items-center justify-center md:justify-start gap-1 mb-2'>
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.round(rating.averageRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-rich-sand/30'
                    }`}
                  />
                ))}
              </div>
              <p className='text-sm text-deep-charcoal/60'>
                {rating.totalReviews}{' '}
                {locale === 'en' ? 'reviews' : 'مراجعة'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className='space-y-2'>
              <h4 className='text-sm font-semibold text-deep-charcoal mb-3'>
                {locale === 'en' ? 'Rating Distribution' : 'توزيع التقييمات'}
              </h4>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = rating.ratingDistribution[star.toString() as '1' | '2' | '3' | '4' | '5'] || 0;
                const percentage = rating.totalReviews > 0 ? (count / rating.totalReviews) * 100 : 0;
                return (
                  <div key={star} className='flex items-center gap-2'>
                    <span className='text-sm text-deep-charcoal/70 w-8'>
                      {star} ⭐
                    </span>
                    <div className='flex-1 h-2 bg-rich-sand/20 rounded-full overflow-hidden'>
                      <div
                        className={`h-full ${
                          star === 5
                            ? 'bg-green-500'
                            : star === 4
                            ? 'bg-blue-500'
                            : star === 3
                            ? 'bg-yellow-500'
                            : star === 2
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className='text-sm text-deep-charcoal/60 w-8 text-right'>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'No reviews yet. Reviews will appear here once buyers leave feedback.'
              : 'لا توجد مراجعات بعد. ستظهر المراجعات هنا بمجرد أن يترك المشترون تعليقات.'}
          </p>
        </div>
      ) : (
        <>
          <div className='space-y-4'>
            {reviews.map((review) => (
              <div
                key={review.id}
                className='bg-white rounded-lg border border-rich-sand/30 p-6'
              >
                {/* Review Header */}
                <div className='flex items-start gap-4 mb-4'>
                  <div className='relative w-12 h-12 rounded-full overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                    {review.buyer.profileImage ? (
                      <Image
                        src={review.buyer.profileImage}
                        alt={review.buyer.fullName || review.buyer.username}
                        fill
                        className='object-cover'
                        unoptimized
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center'>
                        <span className='text-deep-charcoal/40 text-xs'>
                          {(review.buyer.fullName || review.buyer.username || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h3 className='font-semibold text-deep-charcoal mb-1'>
                          {review.buyer.fullName || review.buyer.username}
                        </h3>
                        <div className='flex items-center gap-1 mb-2'>
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-rich-sand/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className='text-deep-charcoal/70 mb-3'>{review.comment}</p>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className='flex items-center gap-3 pt-4 border-t border-rich-sand/20'>
                  {review.product.image && (
                    <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                      <Image
                        src={review.product.image}
                        alt={review.product.title}
                        fill
                        className='object-cover'
                        unoptimized
                      />
                    </div>
                  )}
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-deep-charcoal'>
                      {review.product.title}
                    </p>
                    <p className='text-xs text-deep-charcoal/60'>
                      {locale === 'en' ? 'Order' : 'الطلب'}: {review.orderNumber}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}

