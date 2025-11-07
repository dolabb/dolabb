'use client';

import { useTranslations, useLocale } from 'next-intl';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/data/products';

interface TrendingProductsSectionProps {
  products: Product[];
}

export default function TrendingProductsSection({ products }: TrendingProductsSectionProps) {
  const t = useTranslations('trending');
  const locale = useLocale();

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-deep-charcoal mb-8 font-display">
          {t('title')}
        </h2>
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

