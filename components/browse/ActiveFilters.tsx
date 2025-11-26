'use client';

import { HiXMark } from 'react-icons/hi2';
import { navigationCategories } from '@/data/navigation';

interface ActiveFiltersProps {
  filters: {
    category: string;
    subcategory: string;
    brand: string;
    minPrice: string;
    maxPrice: string;
    size: string;
    color: string;
    condition: string;
  };
  apiCategories: { category: string; subcategories: string[] }[];
  availableSubcategoriesFromApi: string[];
  onClearFilter: (key: string) => void;
  onClearAllFilters: () => void;
  locale: string;
}

const conditionData = [
  {
    value: 'new',
    label: { en: 'Brand new', ar: 'جديد تماماً' },
  },
  {
    value: 'like-new',
    label: { en: 'Like new', ar: 'شبه جديد' },
  },
  {
    value: 'excellent',
    label: { en: 'Used - Excellent', ar: 'مستعمل - ممتاز' },
  },
  {
    value: 'good',
    label: { en: 'Used - Good', ar: 'مستعمل - جيد' },
  },
  {
    value: 'fair',
    label: { en: 'Used - Fair', ar: 'مستعمل - عادل' },
  },
];

export default function ActiveFilters({
  filters,
  apiCategories,
  availableSubcategoriesFromApi,
  onClearFilter,
  onClearAllFilters,
  locale,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    filters.category ||
    filters.subcategory ||
    filters.brand ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.size ||
    filters.color ||
    filters.condition;

  if (!hasActiveFilters) return null;

  const getCategoryName = () => {
    const apiCat = apiCategories.find(
      c => c.category.toLowerCase() === filters.category.toLowerCase()
    );
    const navCat = navigationCategories.find(c => c.key === filters.category);
    if (apiCat) {
      return apiCat.category.charAt(0).toUpperCase() + apiCat.category.slice(1);
    }
    if (navCat) {
      return navCat.name;
    }
    return filters.category;
  };

  const getSubcategoryName = () => {
    const subFromApi = availableSubcategoriesFromApi.find(
      s => s.toLowerCase().replace(/\s+/g, '-') === filters.subcategory
    );
    const navCat = navigationCategories.find(c => c.key === filters.category);
    const subFromNav = navCat?.subCategories.find(
      s => s.key === filters.subcategory
    );
    if (subFromApi) {
      return subFromApi.charAt(0).toUpperCase() + subFromApi.slice(1);
    }
    if (subFromNav) {
      return subFromNav.name;
    }
    return filters.subcategory;
  };

  return (
    <div className='flex flex-wrap items-center gap-3 mb-6'>
      <div className='flex flex-wrap items-center gap-2 flex-1'>
        {filters.category && filters.subcategory && (
          <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm font-medium'>
            {getCategoryName()} / {getSubcategoryName()}
            <button
              onClick={() => {
                onClearFilter('category');
                onClearFilter('subcategory');
              }}
              className='hover:text-saudi-green/80 transition-colors'
            >
              <HiXMark className='w-4 h-4' />
            </button>
          </span>
        )}
        {filters.category && !filters.subcategory && (
          <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm font-medium'>
            {getCategoryName()}
            <button
              onClick={() => onClearFilter('category')}
              className='hover:text-saudi-green/80 transition-colors'
            >
              <HiXMark className='w-4 h-4' />
            </button>
          </span>
        )}
        {filters.brand && (
          <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm font-medium'>
            {filters.brand}
            <button
              onClick={() => onClearFilter('brand')}
              className='hover:text-saudi-green/80 transition-colors'
            >
              <HiXMark className='w-4 h-4' />
            </button>
          </span>
        )}
        {(filters.minPrice || filters.maxPrice) && (
          <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm font-medium'>
            {filters.minPrice || '0'} - {filters.maxPrice || '∞'}{' '}
            {locale === 'ar' ? 'ر.س' : 'SAR'}
            <button
              onClick={() => {
                onClearFilter('minPrice');
                onClearFilter('maxPrice');
              }}
              className='hover:text-saudi-green/80 transition-colors'
            >
              <HiXMark className='w-4 h-4' />
            </button>
          </span>
        )}
        {filters.size && (
          <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm font-medium'>
            {filters.size}
            <button
              onClick={() => onClearFilter('size')}
              className='hover:text-saudi-green/80 transition-colors'
            >
              <HiXMark className='w-4 h-4' />
            </button>
          </span>
        )}
        {filters.color && (
          <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm font-medium'>
            {filters.color}
            <button
              onClick={() => onClearFilter('color')}
              className='hover:text-saudi-green/80 transition-colors'
            >
              <HiXMark className='w-4 h-4' />
            </button>
          </span>
        )}
        {filters.condition && (
          <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm font-medium'>
            {
              conditionData.find(opt => opt.value === filters.condition)
                ?.label[locale as 'en' | 'ar']
            }
            <button
              onClick={() => onClearFilter('condition')}
              className='hover:text-saudi-green/80 transition-colors'
            >
              <HiXMark className='w-4 h-4' />
            </button>
          </span>
        )}
      </div>
      {hasActiveFilters && (
        <button
          onClick={onClearAllFilters}
          className='text-sm text-deep-charcoal/70 hover:text-saudi-green transition-colors font-medium'
        >
          {locale === 'en' ? 'Clear all' : 'مسح الكل'}
        </button>
      )}
    </div>
  );
}

