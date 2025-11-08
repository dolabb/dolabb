'use client';

import { useAuth } from '@/contexts/AuthContext';
import Hero from '@/components/home/Hero';
import CategoriesSection from '@/components/home/CategoriesSection';
import FeaturedProductsSection from '@/components/home/FeaturedProductsSection';
import TrendingProductsSection from '@/components/home/TrendingProductsSection';
import LoggedInHome from '@/components/home/LoggedInHome';
import { featuredProducts, trendingProducts } from '@/data/products';
import { useLocale } from 'next-intl';

export default function HomePage() {
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const isRTL = locale === 'ar';

  // Show different content based on authentication
  if (isAuthenticated) {
    return <LoggedInHome />;
  }

  return (
    <div className='bg-off-white' dir={isRTL ? 'rtl' : 'ltr'}>
      <Hero />
      <CategoriesSection />
      <FeaturedProductsSection products={featuredProducts} />
      <TrendingProductsSection products={trendingProducts} />
    </div>
  );
}
