'use client';

import { useEffect, useState } from 'react';
import ConditionDropdown from './ConditionDropdown';
import FilterDropdown from './FilterDropdown';
import PriceFilter from './PriceFilter';
import SortDropdown from './SortDropdown';

interface FilterBarProps {
  filters: {
    category: string;
    subcategory: string;
    brand: string;
    minPrice: string;
    maxPrice: string;
    size: string;
    color: string;
    condition: string;
    sortBy: string;
  };
  categoryOptions: { value: string; label: string }[];
  subcategoryOptions: { value: string; label: string }[];
  brandOptions: { value: string; label: string }[];
  colorOptions: { value: string; label: string }[];
  sizeOptions: { value: string; label: string }[];
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onSortChange: (value: string) => void;
  locale: string;
  isRTL: boolean;
}

export default function FilterBar({
  filters,
  categoryOptions,
  subcategoryOptions,
  brandOptions,
  colorOptions,
  sizeOptions,
  onCategoryChange,
  onSubcategoryChange,
  onBrandChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSizeChange,
  onColorChange,
  onConditionChange,
  onSortChange,
  locale,
  isRTL,
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openSort, setOpenSort] = useState(false);

  // Local state for temporary filter values
  const [tempFilters, setTempFilters] = useState({
    category: filters.category,
    subcategory: filters.subcategory,
    brand: filters.brand,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    size: filters.size,
    color: filters.color,
    condition: filters.condition,
    sortBy: filters.sortBy,
  });

  // Sync tempFilters when filters prop changes (e.g., from URL or clear all)
  useEffect(() => {
    setTempFilters({
      category: filters.category,
      subcategory: filters.subcategory,
      brand: filters.brand,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      size: filters.size,
      color: filters.color,
      condition: filters.condition,
      sortBy: filters.sortBy,
    });
  }, [filters]);

  const handleCategoryChange = (value: string) => {
    setTempFilters(prev => ({
      ...prev,
      category: value,
      subcategory: '', // Clear subcategory when category changes
    }));
    setOpenDropdown(null);
  };

  const handleFilterChange = (key: string, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setOpenDropdown(null);
  };

  const handleApplyFilters = () => {
    onCategoryChange(tempFilters.category);
    onSubcategoryChange(tempFilters.subcategory);
    onBrandChange(tempFilters.brand);
    onMinPriceChange(tempFilters.minPrice);
    onMaxPriceChange(tempFilters.maxPrice);
    onSizeChange(tempFilters.size);
    onColorChange(tempFilters.color);
    onConditionChange(tempFilters.condition);
    onSortChange(tempFilters.sortBy);
    setOpenDropdown(null);
    setOpenSort(false);
  };

  return (
    <div
      className='mb-4 relative'
      style={{ overflow: 'visible', position: 'relative', zIndex: 50 }}
    >
      {/* Desktop: Filters in one row with Apply button at the end */}
      {/* Mobile: Scrollable filters row, Apply button below */}
      <div className='flex flex-col md:flex-row md:items-center md:gap-2'>
        <div
          className='flex items-center gap-2 pb-2 md:pb-0 scrollbar-hide flex-1'
          style={{
            overflowX: 'auto',
            overflowY: 'visible',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            position: 'relative',
          }}
        >
          <FilterDropdown
            label={locale === 'en' ? 'Category' : 'الفئة'}
            value={tempFilters.category}
            options={categoryOptions}
            onChange={value => handleCategoryChange(value)}
            placeholder={locale === 'en' ? 'Category' : 'الفئة'}
            isOpen={openDropdown === 'category'}
            onToggle={() => {
              setOpenDropdown(openDropdown === 'category' ? null : 'category');
              setOpenSort(false);
            }}
            isRTL={isRTL}
          />

          <FilterDropdown
            label={locale === 'en' ? 'Subcategory' : 'الفئة الفرعية'}
            value={tempFilters.subcategory}
            options={subcategoryOptions}
            onChange={value => handleFilterChange('subcategory', value)}
            placeholder={locale === 'en' ? 'Subcategory' : 'الفئة الفرعية'}
            isOpen={openDropdown === 'subcategory'}
            onToggle={() => {
              setOpenDropdown(
                openDropdown === 'subcategory' ? null : 'subcategory'
              );
              setOpenSort(false);
            }}
            isRTL={isRTL}
          />

          <FilterDropdown
            label={locale === 'en' ? 'Brand' : 'العلامة التجارية'}
            value={tempFilters.brand}
            options={brandOptions}
            onChange={value => handleFilterChange('brand', value)}
            placeholder={locale === 'en' ? 'Brand' : 'العلامة التجارية'}
            isOpen={openDropdown === 'brand'}
            onToggle={() => {
              setOpenDropdown(openDropdown === 'brand' ? null : 'brand');
              setOpenSort(false);
            }}
            isRTL={isRTL}
          />

          <PriceFilter
            minPrice={tempFilters.minPrice}
            maxPrice={tempFilters.maxPrice}
            onMinChange={value => handleFilterChange('minPrice', value)}
            onMaxChange={value => handleFilterChange('maxPrice', value)}
            isOpen={openDropdown === 'price'}
            onToggle={() => {
              setOpenDropdown(openDropdown === 'price' ? null : 'price');
              setOpenSort(false);
            }}
            locale={locale}
            isRTL={isRTL}
          />

          <FilterDropdown
            label={locale === 'en' ? 'Size' : 'المقاس'}
            value={tempFilters.size}
            options={sizeOptions}
            onChange={value => handleFilterChange('size', value)}
            placeholder={locale === 'en' ? 'Size' : 'المقاس'}
            isOpen={openDropdown === 'size'}
            onToggle={() => {
              setOpenDropdown(openDropdown === 'size' ? null : 'size');
              setOpenSort(false);
            }}
            isRTL={isRTL}
          />

          <FilterDropdown
            label={locale === 'en' ? 'Color' : 'اللون'}
            value={tempFilters.color}
            options={colorOptions}
            onChange={value => handleFilterChange('color', value)}
            placeholder={locale === 'en' ? 'Color' : 'اللون'}
            isOpen={openDropdown === 'color'}
            onToggle={() => {
              setOpenDropdown(openDropdown === 'color' ? null : 'color');
              setOpenSort(false);
            }}
            isRTL={isRTL}
          />

          <ConditionDropdown
            value={tempFilters.condition}
            onChange={value => handleFilterChange('condition', value)}
            isOpen={openDropdown === 'condition'}
            onToggle={() => {
              setOpenDropdown(
                openDropdown === 'condition' ? null : 'condition'
              );
              setOpenSort(false);
            }}
            locale={locale}
            isRTL={isRTL}
          />

          <SortDropdown
            value={tempFilters.sortBy}
            onChange={value => handleFilterChange('sortBy', value)}
            isOpen={openSort}
            onToggle={() => {
              setOpenSort(!openSort);
              setOpenDropdown(null);
            }}
            locale={locale}
            isRTL={isRTL}
          />
        </div>

        {/* Apply Filter Button - Desktop: same row, Mobile: below */}
        <button
          onClick={handleApplyFilters}
          className='px-6 py-2 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors whitespace-nowrap text-nowrap w-full md:w-auto mt-2 md:mt-0 shrink-0'
        >
          {locale === 'en' ? 'Apply Filters' : 'تطبيق الفلاتر'}
        </button>
      </div>
    </div>
  );
}
