'use client';

import ProductCard from '@/components/shared/ProductCard';
import { featuredProducts, trendingProducts } from '@/data/products';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

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
          {/* Image Carousel */}
          <div className='relative mb-8 md:mb-12'>
            <div className='relative h-64 md:h-96 lg:h-[500px] overflow-hidden shadow-xl'>
              {carouselProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    currentSlide === index
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0'
                  }`}
                >
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className='object-cover'
                    priority={index === 0}
                    unoptimized={product.image.includes('unsplash.com')}
                  />
                  {/* Overlay with product info */}
                  <div className='absolute inset-0 bg-gradient-to-t from-deep-charcoal/80 via-deep-charcoal/20 to-transparent'>
                    <div className='absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white'>
                      <h3 className='text-2xl md:text-3xl font-bold mb-2 font-display'>
                        {product.title}
                      </h3>
                      <p className='text-xl md:text-2xl font-semibold text-saudi-green mb-4'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {product.price.toFixed(2)}
                      </p>
                      <Link
                        href={`/${locale}/product/${product.id}`}
                        className='inline-block px-4 py-2 text-sm bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-lg hover:shadow-xl'
                      >
                        {locale === 'en' ? 'Shop Now' : 'تسوق الآن'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows - Hidden on mobile */}
              <button
                onClick={prevSlide}
                className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
                  isRTL ? 'right-4' : 'left-4'
                } z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 items-center justify-center`}
                aria-label={
                  locale === 'en' ? 'Previous slide' : 'الشريحة السابقة'
                }
              >
                <HiChevronLeft className='w-6 h-6 text-deep-charcoal' />
              </button>
              <button
                onClick={nextSlide}
                className={`hidden md:flex absolute top-1/2 -translate-y-1/2 ${
                  isRTL ? 'left-4' : 'right-4'
                } z-20 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 items-center justify-center`}
                aria-label={locale === 'en' ? 'Next slide' : 'الشريحة التالية'}
              >
                <HiChevronRight className='w-6 h-6 text-deep-charcoal' />
              </button>

              {/* Dots Indicator */}
              <div className='absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2'>
                {carouselProducts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === index
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
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
