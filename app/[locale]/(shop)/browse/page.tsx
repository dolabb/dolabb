'use client';

import ActiveFilters from '@/components/browse/ActiveFilters';
import FilterBar from '@/components/browse/FilterBar';
import ProductsGrid from '@/components/browse/ProductsGrid';
import { useBrowseFilters } from '@/hooks/useBrowseFilters';
import { useLocale } from 'next-intl';

export default function BrowsePage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  const {
    filters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    categoryOptions,
    subcategoryOptions,
    brandOptions,
    colorOptions,
    sizeOptions,
    products,
    isLoading,
    error,
    apiCategories,
    availableSubcategoriesFromApi,
  } = useBrowseFilters(locale);

  const handlePageChange = (page: number) => {
    updateFilter('page', page.toString());
  };

  return (
    <div
      className='bg-off-white min-h-screen py-8'
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ overflow: 'visible', position: 'relative' }}
    >
      <div
        className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
        style={{ overflow: 'visible', position: 'relative' }}
      >
        {/* Header */}
        <h1 className='text-3xl font-bold text-deep-charcoal mb-6'>
          {locale === 'en' ? 'Browse Products' : 'تصفح المنتجات'}
        </h1>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          categoryOptions={categoryOptions}
          subcategoryOptions={subcategoryOptions}
          brandOptions={brandOptions}
          colorOptions={colorOptions}
          sizeOptions={sizeOptions}
          onCategoryChange={value => updateFilter('category', value)}
          onSubcategoryChange={value => updateFilter('subcategory', value)}
          onBrandChange={value => updateFilter('brand', value)}
          onMinPriceChange={value => updateFilter('minPrice', value)}
          onMaxPriceChange={value => updateFilter('maxPrice', value)}
          onSizeChange={value => updateFilter('size', value)}
          onColorChange={value => updateFilter('color', value)}
          onConditionChange={value => updateFilter('condition', value)}
          onSortChange={value => updateFilter('sortBy', value)}
          locale={locale}
          isRTL={isRTL}
        />

        {/* Active Filters */}
        <ActiveFilters
          filters={filters}
          apiCategories={apiCategories}
          availableSubcategoriesFromApi={availableSubcategoriesFromApi}
          onClearFilter={clearFilter}
          onClearAllFilters={clearAllFilters}
          locale={locale}
        />

        {/* Products Grid with Skeleton Loading */}
        <ProductsGrid
          products={products}
          isLoading={isLoading}
          error={error}
          filters={filters}
          onPageChange={handlePageChange}
          locale={locale}
        />
      </div>
    </div>
  );
}
