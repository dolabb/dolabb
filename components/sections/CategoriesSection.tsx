'use client';

import { useTranslations } from 'next-intl';
import { categories } from '@/data/categories';

export default function CategoriesSection() {
  const t = useTranslations('categories');

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-deep-charcoal mb-8 text-center font-display">
          {t('title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.key}
                className="group cursor-pointer bg-rich-sand/30 hover:bg-rich-sand rounded-lg p-6 text-center transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-2">
                  <IconComponent className="w-10 h-10 text-deep-charcoal group-hover:text-saudi-green transition-colors" />
                </div>
                <h3 className="font-semibold text-deep-charcoal group-hover:text-saudi-green transition-colors font-display">
                  {t(category.key)}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

