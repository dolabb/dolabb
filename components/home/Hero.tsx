'use client';

import { useGetHeroSectionQuery } from '@/lib/api/productsApi';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Fetch hero section data
  const { data: heroData, isLoading, error } = useGetHeroSectionQuery();
  const heroSection = heroData?.heroSection;
  const isActive = heroSection?.isActive === true;

  // Log hero section API response
  useEffect(() => {
    if (heroData) {
      console.log('=== HERO SECTION API RESPONSE ===');
      console.log('Full Response:', heroData);
      console.log('Hero Section Data:', heroData.heroSection);
      console.log('Is Active:', heroData.heroSection?.isActive);
      console.log('Background Type:', heroData.heroSection?.backgroundType);
      console.log('Title:', heroData.heroSection?.title);
      console.log('Subtitle:', heroData.heroSection?.subtitle);
      console.log('===============================');
    }
  }, [heroData]);

  // Log errors
  useEffect(() => {
    if (error) {
      console.error('=== HERO SECTION API ERROR ===');
      console.error('Error:', error);
      console.error('============================');
    }
  }, [error]);

  // Default hero section (current design)
  const renderDefaultHero = () => (
    <section
      className='relative min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-saudi-green via-off-white to-rich-sand overflow-hidden'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--deep-charcoal) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <div className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold text-deep-charcoal mb-6 font-display tracking-tight leading-tight'>
          <span className='block'>Love</span>
          <span className='block'>Pre-Loved</span>
          <span className='block'>Fashion</span>
        </h1>
      </div>

      {/* Decorative Elements */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-off-white to-transparent'></div>
    </section>
  );

  // If loading or not active, show default
  if (isLoading || !isActive || !heroSection) {
    return renderDefaultHero();
  }

  // Dynamic hero section based on API data
  const getBackgroundStyle = () => {
    const textColor = heroSection.textColor || '#FFFFFF';

    switch (heroSection.backgroundType) {
      case 'gradient':
        if (
          heroSection.gradientColors &&
          heroSection.gradientColors.length >= 2
        ) {
          const direction = heroSection.gradientDirection || 'to right';
          return {
            background: `linear-gradient(${direction}, ${heroSection.gradientColors.join(
              ', '
            )})`,
            color: textColor,
          };
        }
        // Fallback to single color if gradient colors are missing
        return {
          background: heroSection.singleColor || '#4F46E5',
          color: textColor,
        };

      case 'image':
        if (heroSection.imageUrl) {
          return {
            backgroundImage: `url(${heroSection.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: textColor,
          };
        }
        // Fallback to single color if image URL is missing
        return {
          background: heroSection.singleColor || '#4F46E5',
          color: textColor,
        };

      case 'single':
      default:
        return {
          background: heroSection.singleColor || '#4F46E5',
          color: textColor,
        };
    }
  };

  const backgroundStyle = getBackgroundStyle();
  const buttonLink = heroSection.buttonLink || `/${locale}`;

  return (
    <section
      className='relative min-h-[70vh] flex items-center justify-center overflow-hidden'
      dir={isRTL ? 'rtl' : 'ltr'}
      style={backgroundStyle}
    >
      {/* Overlay for better text readability on images */}
      {heroSection.backgroundType === 'image' && (
        <div className='absolute inset-0 bg-black/30'></div>
      )}

      <div className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        <h1
          className='text-4xl md:text-6xl lg:text-7xl font-bold mb-6 font-display tracking-tight'
          style={{ color: backgroundStyle.color }}
        >
          {heroSection.title}
        </h1>
        <p
          className='text-lg md:text-xl lg:text-2xl mb-8 max-w-2xl mx-auto leading-relaxed font-medium opacity-90'
          style={{ color: backgroundStyle.color }}
        >
          {heroSection.subtitle}
        </p>

        {heroSection.buttonText && (
          <Link
            href={buttonLink}
            className='inline-block px-8 py-4 bg-white text-deep-charcoal rounded-lg font-semibold text-lg hover:bg-off-white transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl font-display'
          >
            {heroSection.buttonText}
          </Link>
        )}
      </div>

      {/* Decorative Elements */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-off-white to-transparent'></div>
    </section>
  );
}
