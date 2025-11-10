'use client';

import ProductCard from '@/components/shared/ProductCard';
import { featuredProducts, trendingProducts } from '@/data/products';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Hero from './Hero';
export default function LoggedInHome() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock data for "Items you might like" and "Daily Recommendations"
  const itemsYouMightLike = featuredProducts.slice(0, 8);
  const dailyRecommendations = trendingProducts.slice(0, 8);

  // Get carousel images from featured products
  const carouselProducts = featuredProducts.slice(0, 5);

  // Auto carousel effect
  useEffect(() => {
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
              {locale === 'en' ? 'View all' : 'عرض الكل'} <span>→</span>
            </Link>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6'>
            {itemsYouMightLike.map(product => (
              <ProductCard key={product.id} {...product} locale={locale} />
            ))}
          </div>
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
              {locale === 'en' ? 'View all' : 'عرض الكل'} <span>→</span>
            </Link>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6'>
            {dailyRecommendations.map(product => (
              <ProductCard key={product.id} {...product} locale={locale} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
