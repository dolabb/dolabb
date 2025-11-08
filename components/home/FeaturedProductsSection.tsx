'use client';

import { useTranslations, useLocale } from 'next-intl';
import ProductCard from '@/components/shared/ProductCard';
import { Product } from '@/data/products';

interface FeaturedProductsSectionProps {
  products: Product[];
}

export default function FeaturedProductsSection({ products }: FeaturedProductsSectionProps) {
  const t = useTranslations('featured');
  const locale = useLocale();

  return (
    <section className="py-16 bg-off-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-deep-charcoal font-display">
            {t('title')}
          </h2>
          <button className="text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors font-display flex items-center gap-1">
            {t('viewAll')} <span>→</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              locale={locale}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

