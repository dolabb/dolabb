'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { HiBell, HiStar } from 'react-icons/hi2';
import { FaStar } from 'react-icons/fa';
import ProductCard from '@/components/shared/ProductCard';
import { featuredProducts } from '@/data/products';

export default function ProfileContent() {
  const locale = useLocale();
  const { user } = useAuth();
  const isRTL = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'shop' | 'reviews'>('shop');

  // Mock user data
  const userStats = {
    followers: 1234,
    following: 567,
    rating: 4.8,
    reviews: 42,
  };

  // Mock shop products
  const shopProducts = featuredProducts.slice(0, 6);

  // Mock reviews
  const reviews = [
    {
      id: '1',
      reviewer: 'buyer123',
      rating: 5,
      comment: 'Great product, fast shipping!',
      date: '2024-01-10',
    },
    {
      id: '2',
      reviewer: 'fashion_lover',
      rating: 4,
      comment: 'Good quality, as described.',
      date: '2024-01-08',
    },
  ];

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* User Profile Header */}
        <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
            <div className='relative w-24 h-24 rounded-full overflow-hidden bg-rich-sand/20'>
              {user?.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.username}
                  fill
                  className='object-cover'
                  unoptimized
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-3xl font-bold text-saudi-green'>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-4 mb-2'>
                <h1 className='text-2xl font-bold text-deep-charcoal'>
                  @{user?.username || 'username'}
                </h1>
                <button className='p-2 hover:bg-rich-sand/20 rounded-full transition-colors'>
                  <HiBell className='w-5 h-5 text-deep-charcoal' />
                </button>
              </div>
              <div className='flex flex-wrap items-center gap-4 text-sm text-deep-charcoal/70'>
                <span>
                  <strong className='text-deep-charcoal'>{userStats.followers}</strong>{' '}
                  {locale === 'en' ? 'followers' : 'متابع'}
                </span>
                <span>
                  <strong className='text-deep-charcoal'>{userStats.following}</strong>{' '}
                  {locale === 'en' ? 'following' : 'يتابع'}
                </span>
                <div className='flex items-center gap-1'>
                  <FaStar className='w-4 h-4 text-yellow-400 fill-yellow-400' />
                  <strong className='text-deep-charcoal'>{userStats.rating}</strong>
                  <span className='text-deep-charcoal/60'>
                    ({userStats.reviews}{' '}
                    {locale === 'en' ? 'reviews' : 'مراجعة'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-4 mb-6 border-b border-rich-sand/30'>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'shop'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Shop' : 'المتجر'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'reviews'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Reviews' : 'المراجعات'}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'shop' && (
          <div>
            <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
              {locale === 'en' ? 'Products for Sale' : 'المنتجات المعروضة للبيع'}
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
              {shopProducts.map(product => (
                <ProductCard key={product.id} {...product} locale={locale} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className='space-y-4'>
            {reviews.map(review => (
              <div
                key={review.id}
                className='bg-white rounded-lg border border-rich-sand/30 p-6'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h3 className='font-semibold text-deep-charcoal mb-1'>
                      @{review.reviewer}
                    </h3>
                    <div className='flex items-center gap-1'>
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-rich-sand fill-rich-sand'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className='text-sm text-deep-charcoal/60'>{review.date}</span>
                </div>
                <p className='text-deep-charcoal/80'>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

