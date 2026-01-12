'use client';

import { useAppSelector } from '@/lib/store/hooks';
import Hero from '@/components/home/Hero';
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection';
import TrendingProductsSection from '@/components/home/TrendingProductsSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import LoggedInHome from '@/components/home/LoggedInHome';
import { useHomeProducts } from '@/hooks/useHomeProducts';
import { useLocale } from 'next-intl';

export default function HomePage() {
  const locale = useLocale();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isRTL = locale === 'ar';

  // Always call hooks before any conditional returns to follow Rules of Hooks
  // Use shared hook to fetch and filter products to avoid duplicates
  const {
    featuredProducts,
    trendingProducts,
    featuredLoading,
    trendingLoading,
  } = useHomeProducts(5);

  // Show different content based on authentication
  if (isAuthenticated) {
    return <LoggedInHome />;
  }

  return (
    <div className='bg-off-white' dir={isRTL ? 'rtl' : 'ltr'}>
      <Hero />
      <CategoriesSection />
      <FeaturedProductsSection 
        products={featuredProducts} 
        isLoading={featuredLoading}
      />
      <TrendingProductsSection 
        products={trendingProducts} 
        isLoading={trendingLoading}
      />
    </div>
  );
}
