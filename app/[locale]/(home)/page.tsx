'use client';

import { useAppSelector } from '@/lib/store/hooks';
import Hero from '@/components/home/Hero';
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection';
import TrendingProductsSection from '@/components/home/TrendingProductsSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import LoggedInHome from '@/components/home/LoggedInHome';
import { useLocale } from 'next-intl';

export default function HomePage() {
  const locale = useLocale();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isRTL = locale === 'ar';

  // Show different content based on authentication
  if (isAuthenticated) {
    return <LoggedInHome />;
  }

  return (
    <div className='bg-off-white' dir={isRTL ? 'rtl' : 'ltr'}>
      <Hero />
      <CategoriesSection />
      <FeaturedProductsSection />
      <TrendingProductsSection />
    </div>
  );
}
