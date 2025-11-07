'use client';

import Hero from '@/components/Hero';
import CategoriesSection from '@/components/sections/CategoriesSection';
import FeaturedProductsSection from '@/components/sections/FeaturedProductsSection';
import TrendingProductsSection from '@/components/sections/TrendingProductsSection';
import { featuredProducts, trendingProducts } from '@/data/products';
import { useLocale } from 'next-intl';

export default function Home() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <div className='bg-off-white' dir={isRTL ? 'rtl' : 'ltr'}>
      <Hero />
      <CategoriesSection />
      <FeaturedProductsSection products={featuredProducts} />
      <TrendingProductsSection products={trendingProducts} />
    </div>
  );
}
