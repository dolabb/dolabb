'use client';

import ProductCard from '@/components/shared/ProductCard';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Hero from './Hero';
import { useGetFeaturedProductsQuery, useGetTrendingProductsQuery } from '@/lib/api/productsApi';

export default function LoggedInHome() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch featured and trending products
  const { data: featuredData, isLoading: featuredLoading, error: featuredError } = useGetFeaturedProductsQuery({ limit: 8, page: 1 });
  const { data: trendingData, isLoading: trendingLoading, error: trendingError } = useGetTrendingProductsQuery({ limit: 8, page: 1 });

  const itemsYouMightLike = featuredData?.products || [];
  const dailyRecommendations = trendingData?.products || [];

  // Log featured items response and errors
  useEffect(() => {
    if (featuredData) {
      console.log('Featured Items Response:', featuredData);
    }
  }, [featuredData]);

  useEffect(() => {
    if (featuredError) {
      console.error('Featured Items Error:', featuredError);
    }
  }, [featuredError]);

  // Log trending products response and errors
  useEffect(() => {
    if (trendingData) {
      console.log('Trending Products Response:', trendingData);
    }
  }, [trendingData]);

  useEffect(() => {
    if (trendingError) {
      console.error('Trending Products Error:', trendingError);
    }
  }, [trendingError]);

  // Get carousel images from featured products
  const carouselProducts = featuredData?.products?.slice(0, 5) || [];

  // Auto carousel effect
  useEffect(() => {
    if (carouselProducts.length === 0) return;

    carouselIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselProducts.length);
    }, 5000); // Change slide every 5 seconds

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [carouselProducts.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    // Reset timer when manually changing slide
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
    }
    carouselIntervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselProducts.length);
    }, 5000);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % carouselProducts.length);
  };

  const prevSlide = () => {
    goToSlide(
      (currentSlide - 1 + carouselProducts.length) % carouselProducts.length
    );
  };

  return (
    <div className='bg-off-white' dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section - Trending Clothes with Carousel */}
      <section>
        <Hero />
      </section>

      {/* Items You Might Like */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center mb-8'>
            <h2 className='text-3xl font-bold text-deep-charcoal font-display'>
              {locale === 'en' ? 'Items You Might Like' : 'عناصر قد تعجبك'}
            </h2>
            <Link
              href={`/${locale}/browse`}
              className='text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors font-display flex items-center gap-1'
            >
              {locale === 'en' ? 'View all' : 'عرض الكل'} <span>{locale === 'ar' ? '←' : '→'}</span>
            </Link>
          </div>
          {featuredLoading ? (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6'>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden bg-rich-sand/20 skeleton-shimmer" />
                  <div className="p-4">
                    <div className="h-4 bg-rich-sand/30 rounded w-3/4 mb-1 skeleton-shimmer" />
                    <div className="h-3 bg-rich-sand/30 rounded w-1/2 mb-2 skeleton-shimmer" />
                    <div className="h-5 bg-rich-sand/30 rounded w-20 skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : itemsYouMightLike.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6'>
              {itemsYouMightLike.map((product, index) => {
                // Get first valid image, clean any spaces in URL
                const firstImage = product.images?.find(img => img && img.trim() !== '') || product.images?.[0] || '';
                // Clean image URL - remove any spaces that might be in the URL
                const productImage = firstImage ? firstImage.replace(/\s+/g, '') : '';
                
                // Prioritize first 4 items (above the fold)
                const isPriority = index < 4;
                
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    image={productImage}
                    title={product.title || 'Untitled Product'}
                    price={product.price || 0}
                    seller={product.seller?.username || 'Unknown'}
                    isLiked={product.isLiked}
                    locale={locale}
                    priority={isPriority}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      {/* Daily Recommendations */}
      <section className='py-16 bg-off-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center mb-8'>
            <h2 className='text-3xl font-bold text-deep-charcoal font-display'>
              {locale === 'en' ? 'Daily Recommendations' : 'التوصيات اليومية'}
            </h2>
            <Link
              href={`/${locale}/recommendations`}
              className='text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors font-display flex items-center gap-1'
            >
              {locale === 'en' ? 'View all' : 'عرض الكل'} <span>{locale === 'ar' ? '←' : '→'}</span>
            </Link>
          </div>
          {trendingLoading ? (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6'>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden bg-rich-sand/20 skeleton-shimmer" />
                  <div className="p-4">
                    <div className="h-4 bg-rich-sand/30 rounded w-3/4 mb-1 skeleton-shimmer" />
                    <div className="h-3 bg-rich-sand/30 rounded w-1/2 mb-2 skeleton-shimmer" />
                    <div className="h-5 bg-rich-sand/30 rounded w-20 skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : dailyRecommendations.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6'>
              {dailyRecommendations.map(product => {
                // Get first valid image, clean any spaces in URL
                const firstImage = product.images?.find(img => img && img.trim() !== '') || product.images?.[0] || '';
                // Clean image URL - remove any spaces that might be in the URL
                const productImage = firstImage ? firstImage.replace(/\s+/g, '') : '';
                
                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    image={productImage}
                    title={product.title || 'Untitled Product'}
                    price={product.price || 0}
                    seller={product.seller?.username || 'Unknown'}
                    isLiked={product.isLiked}
                    locale={locale}
                    currency={(product as any).Currency || product.currency}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
