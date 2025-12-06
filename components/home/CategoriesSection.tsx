'use client';

import { categories } from '@/data/categories';
import { navigationCategories } from '@/data/navigation';
import { useGetCategoriesQuery } from '@/lib/api/productsApi';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

export default function CategoriesSection() {
  const t = useTranslations('categories');
  const locale = useLocale();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Fetch categories from API
  const { data: categoriesData, isLoading } = useGetCategoriesQuery();

  // Map category keys to their navigation hrefs
  const getCategoryHref = (categoryKey: string): string => {
    const navCategory = navigationCategories.find(
      cat => cat.key === categoryKey
    );
    if (navCategory) {
      return navCategory.href;
    }
    // Fallback for categories that might not have direct navigation matches
    const fallbackRoutes: Record<string, string> = {
      vintage: '/trending',
      designer: '/brands',
      accessories: '/women',
      shoes: '/women/shoes',
    };
    return fallbackRoutes[categoryKey] || '/';
  };

  // Get subcategory href
  const getSubcategoryHref = (
    categoryKey: string,
    subcategory: string
  ): string => {
    const categoryHref = getCategoryHref(categoryKey);
    // Convert subcategory to URL-friendly format
    const subcategorySlug = subcategory.toLowerCase().replace(/\s+/g, '-');
    return `${categoryHref}/${subcategorySlug}`;
  };

  // Format subcategory name for display
  const formatSubcategoryName = (subcategory: string): string => {
    return subcategory
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Merge API categories with static categories
  const getCategoriesWithSubcategories = () => {
    // Start with static categories
    const mergedCategories = categories.map(cat => ({
      ...cat,
      subcategories: [] as string[],
    }));

    // Add subcategories from API
    if (categoriesData?.categories) {
      categoriesData.categories.forEach(apiCat => {
        const matchingCategory = mergedCategories.find(
          cat => cat.key.toLowerCase() === apiCat.category.toLowerCase()
        );
        if (matchingCategory) {
          // Limit to max 10 subcategories
          matchingCategory.subcategories = apiCat.subcategories.slice(0, 10);
        }
      });
    }

    // Filter out sales-related categories
    return mergedCategories.filter(
      category =>
        !category.key.toLowerCase().includes('sales') &&
        !category.key.toLowerCase().includes('best-sellers') &&
        !category.key.toLowerCase().includes('best_sellers') &&
        !category.key.toLowerCase().includes('on-sale') &&
        !category.key.toLowerCase().includes('on_sale') &&
        category.key.toLowerCase() !== 'sale'
    );
  };

  const categoriesWithSubcategories = getCategoriesWithSubcategories();

  return (
    <section className='py-12 bg-white'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h2 className='text-3xl cursor-pointer font-bold text-deep-charcoal mb-8 text-center font-display'>
          {t('title')}
        </h2>
        {isLoading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            {categories.map(category => (
              <div
                key={category.key}
                className='bg-rich-sand/30 rounded-lg p-6 text-center animate-pulse'
              >
                <div className='h-6 bg-rich-sand/50 rounded'></div>
              </div>
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
            {categoriesWithSubcategories.map(category => {
              const categoryHref = getCategoryHref(category.key);
              const hasSubcategories = category.subcategories.length > 0;
              const isHovered = hoveredCategory === category.key;

              return (
                <div
                  key={category.key}
                  className='relative group'
                  onMouseEnter={() => setHoveredCategory(category.key)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    href={`/${locale}/browse?category=${encodeURIComponent(
                      category.key
                    )}`}
                    className='block cursor-pointer bg-rich-sand/30 hover:bg-rich-sand rounded-lg p-6 text-center transition-all duration-300 hover:scale-105'
                  >
                    <h3 className='font-semibold text-deep-charcoal group-hover:text-saudi-green transition-colors font-display'>
                      {t(category.key)}
                    </h3>
                  </Link>

                  {/* Subcategories Dropdown */}
                  {hasSubcategories && isHovered && (
                    <div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-lg shadow-lg border border-rich-sand/30 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200'>
                      <div className='max-h-64 overflow-y-auto'>
                        {category.subcategories.map((subcategory, index) => {
                          // Build browse URL with category and subcategory filters
                          const browseUrl = `/${locale}/browse?category=${encodeURIComponent(
                            category.key
                          )}&subcategory=${encodeURIComponent(subcategory)}`;
                          return (
                            <Link
                              key={index}
                              href={browseUrl}
                              className='block px-4 py-2 text-sm text-deep-charcoal hover:bg-rich-sand/30 hover:text-saudi-green transition-colors'
                              onClick={() => setHoveredCategory(null)}
                            >
                              {formatSubcategoryName(subcategory)}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Loading indicator on hover */}
                  {hasSubcategories && isHovered && isLoading && (
                    <div className='absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-lg shadow-lg border border-rich-sand/30 z-50 py-4'>
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-saudi-green'></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
