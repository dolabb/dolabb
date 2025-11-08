'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { categories } from '@/data/categories';
import { navigationCategories } from '@/data/navigation';

export default function CategoriesSection() {
  const t = useTranslations('categories');
  const locale = useLocale();

  // Map category keys to their navigation hrefs
  const getCategoryHref = (categoryKey: string): string => {
    const navCategory = navigationCategories.find(cat => cat.key === categoryKey);
    if (navCategory) {
      return navCategory.href;
    }
    // Fallback for categories that might not have direct navigation matches
    // You can customize these routes as needed
    const fallbackRoutes: Record<string, string> = {
      'vintage': '/trending',
      'designer': '/brands',
      'accessories': '/women', // Default to women's accessories
      'shoes': '/women/shoes', // Default to women's shoes
    };
    return fallbackRoutes[categoryKey] || '/';
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-deep-charcoal mb-8 text-center font-display">
          {t('title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const categoryHref = getCategoryHref(category.key);
            
            return (
              <Link
                key={category.key}
                href={`/${locale}${categoryHref}`}
                className="group cursor-pointer bg-rich-sand/30 hover:bg-rich-sand rounded-lg p-6 text-center transition-all duration-300 hover:scale-105 block"
              >
                <div className="flex justify-center mb-2">
                  <IconComponent className="w-10 h-10 text-deep-charcoal group-hover:text-saudi-green transition-colors" />
                </div>
                <h3 className="font-semibold text-deep-charcoal group-hover:text-saudi-green transition-colors font-display">
                  {t(category.key)}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

