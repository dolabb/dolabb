'use client';

import Pagination from '@/components/shared/Pagination';
import ProductCard from '@/components/shared/ProductCard';
import {
  useGetCategoryDetailsQuery,
  useGetCategoryFiltersQuery,
  useGetProductsQuery,
} from '@/lib/api/productsApi';
import { navigationCategories } from '@/data/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HiChevronDown, HiXMark } from 'react-icons/hi2';
import type { Product } from '@/types/products';

interface CategoryProductListingProps {
  slug: string[];
}

export default function CategoryProductListing({
  slug,
}: CategoryProductListingProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Parse slug to get category and subcategory
  const category = slug[0] || '';
  const subCategory = slug.slice(1).join('-') || '';

  // Fetch category details
  const {
    data: categoryDetails,
    isLoading: categoryLoading,
  } = useGetCategoryDetailsQuery(category, {
    skip: !category,
  });

  // Fetch filter options
  const {
    data: filtersData,
    isLoading: filtersLoading,
  } = useGetCategoryFiltersQuery(
    {
      categoryKey: category,
      subcategory: subCategory || undefined,
    },
    {
      skip: !category,
    }
  );

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);

  // Initialize price range from API filters
  const priceRange = useMemo(() => {
    if (filtersData?.filters?.priceRange) {
      return [
        filtersData.filters.priceRange.min,
        filtersData.filters.priceRange.max,
      ] as [number, number];
    }
    return [0, 1000] as [number, number];
  }, [filtersData]);

  const [minPrice, setMinPrice] = useState(priceRange[0]);
  const [maxPrice, setMaxPrice] = useState(priceRange[1]);

  // Update price range when filters data loads
  useEffect(() => {
    if (filtersData?.filters?.priceRange) {
      setMinPrice(filtersData.filters.priceRange.min);
      setMaxPrice(filtersData.filters.priceRange.max);
    }
  }, [filtersData]);

  // Build API query parameters
  const productFilters = useMemo(() => {
    const params: any = {
      category,
      page: currentPage,
      limit: 20,
    };

    if (subCategory) {
      params.subcategory = subCategory;
    }

    if (selectedBrands.length > 0) {
      params.brand = selectedBrands.join(',');
    }

    if (minPrice > priceRange[0]) {
      params.minPrice = minPrice;
    }

    if (maxPrice < priceRange[1]) {
      params.maxPrice = maxPrice;
    }

    if (selectedSizes.length > 0) {
      params.size = selectedSizes.join(',');
    }

    if (selectedColors.length > 0) {
      params.color = selectedColors.join(',');
    }

    if (selectedCondition) {
      params.condition = selectedCondition;
    }

    if (onSaleOnly) {
      params.onSale = true;
    }

    // Map sortBy to API format
    const sortMap: Record<string, string> = {
      relevance: 'relevance',
      'price-low': 'price: low to high',
      'price-high': 'price: high to low',
      newest: 'newest',
    };
    params.sortBy = sortMap[sortBy] || 'relevance';

    return params;
  }, [
    category,
    subCategory,
    selectedBrands,
    minPrice,
    maxPrice,
    priceRange,
    selectedSizes,
    selectedColors,
    selectedCondition,
    onSaleOnly,
    sortBy,
    currentPage,
  ]);

  // Fetch products
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
  } = useGetProductsQuery(productFilters);

  // Extract products and pagination from response
  const products = useMemo(() => {
    if (!productsResponse) return [];
    // Handle both new format (ProductsResponse) and legacy format (Product[])
    if (Array.isArray(productsResponse)) {
      return productsResponse;
    }
    return productsResponse.products || [];
  }, [productsResponse]);

  const pagination = useMemo(() => {
    if (!productsResponse || Array.isArray(productsResponse)) {
      return null;
    }
    return productsResponse.pagination;
  }, [productsResponse]);

  // Find category info from navigation (fallback)
  const categoryInfo = useMemo(() => {
    if (categoryDetails?.category) {
      return categoryDetails.category;
    }
    return navigationCategories.find(cat => cat.key === category);
  }, [categoryDetails, category]);

  const subCategoryInfo = useMemo(() => {
    if (categoryDetails?.category) {
      return categoryDetails.category.subCategories.find(
        sub => sub.key === subCategory || sub.href.includes(subCategory)
      );
    }
    return categoryInfo?.subCategories?.find(
      sub => sub.href.includes(subCategory) || sub.key === subCategory
    );
  }, [categoryDetails, categoryInfo, subCategory]);

  const featuredInfo = useMemo(() => {
    if (categoryDetails?.category) {
      return categoryDetails.category.featured.find(
        feat => feat.key === subCategory || feat.href.includes(subCategory)
      );
    }
    return categoryInfo?.featured?.find(
      feat => feat.href.includes(subCategory) || feat.key === subCategory
    );
  }, [categoryDetails, categoryInfo, subCategory]);

  // Determine display name
  const displayName =
    featuredInfo?.name ||
    subCategoryInfo?.name ||
    categoryInfo?.name ||
    category;

  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { name: locale === 'en' ? 'Home' : 'الرئيسية', href: `/${locale}` },
      {
        name: categoryInfo?.name || category,
        href: `/${locale}${categoryInfo?.href || `/${category}`}`,
      },
    ];

    if (featuredInfo) {
      crumbs.push({
        name: featuredInfo.name,
        href: `/${locale}${featuredInfo.href}`,
      });
    } else if (subCategoryInfo) {
      crumbs.push({
        name: subCategoryInfo.name,
        href: `/${locale}${subCategoryInfo.href}`,
      });
    }

    return crumbs;
  }, [locale, categoryInfo, featuredInfo, subCategoryInfo, category]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setOpenFilter(null);
      }
    };

    if (openFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openFilter]);

  // Reset to page 1 when filters change
  const prevFiltersRef = useRef<string>('');
  useEffect(() => {
    const currentFilters = JSON.stringify({
      selectedBrands,
      selectedSizes,
      selectedColors,
      selectedCondition,
      onSaleOnly,
      sortBy,
      minPrice,
      maxPrice,
    });

    if (prevFiltersRef.current && prevFiltersRef.current !== currentFilters) {
      setCurrentPage(1);
    }
    prevFiltersRef.current = currentFilters;
  }, [
    selectedBrands,
    selectedSizes,
    selectedColors,
    selectedCondition,
    onSaleOnly,
    sortBy,
    minPrice,
    maxPrice,
  ]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentPage]);

  // Active filters
  const activeFilters = useMemo(() => {
    const filters: Array<{ type: string; value: string }> = [];
    selectedBrands.forEach(b => filters.push({ type: 'brand', value: b }));
    selectedSizes.forEach(s => filters.push({ type: 'size', value: s }));
    selectedColors.forEach(c => filters.push({ type: 'color', value: c }));
    if (selectedCondition) {
      filters.push({ type: 'condition', value: selectedCondition });
    }
    if (onSaleOnly) {
      filters.push({ type: 'sale', value: 'On sale' });
    }
    if (minPrice > priceRange[0] || maxPrice < priceRange[1]) {
      filters.push({
        type: 'price',
        value: `${minPrice} - ${maxPrice}`,
      });
    }
    return filters;
  }, [
    selectedBrands,
    selectedSizes,
    selectedColors,
    selectedCondition,
    onSaleOnly,
    minPrice,
    maxPrice,
    priceRange,
  ]);

  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'brand':
        setSelectedBrands(prev => prev.filter(b => b !== value));
        break;
      case 'size':
        setSelectedSizes(prev => prev.filter(s => s !== value));
        break;
      case 'color':
        setSelectedColors(prev => prev.filter(c => c !== value));
        break;
      case 'condition':
        setSelectedCondition('');
        break;
      case 'sale':
        setOnSaleOnly(false);
        break;
      case 'price':
        setMinPrice(priceRange[0]);
        setMaxPrice(priceRange[1]);
        break;
    }
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedCondition('');
    setOnSaleOnly(false);
    setMinPrice(priceRange[0]);
    setMaxPrice(priceRange[1]);
  };

  const isLoading = categoryLoading || filtersLoading || productsLoading;
  const totalItems = pagination?.totalItems || products.length;

  return (
    <div className='bg-off-white min-h-screen' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Breadcrumbs */}
        <nav className='mb-6'>
          <ol className='flex items-center gap-2 text-sm text-deep-charcoal/70'>
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className='flex items-center gap-2'>
                {index > 0 && <span>/</span>}
                <Link
                  href={crumb.href}
                  className='hover:text-saudi-green'
                >
                  {crumb.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl md:text-4xl font-bold text-deep-charcoal mb-2 font-display flex items-center gap-2'>
            {displayName}
          </h1>
          {!isLoading && (
            <p className='text-deep-charcoal/70'>
              ({totalItems.toLocaleString()}{' '}
              {locale === 'en' ? 'results' : 'نتيجة'})
            </p>
          )}
        </div>

        {/* Filter Bar */}
        <div
          className='border-t border-b border-rich-sand/30 py-3 md:py-4 mb-4'
          ref={filterRef}
        >
          <div className='flex items-center gap-2 md:gap-4 overflow-x-auto scrollbar-hide pb-2 md:pb-0'>
            {/* Brand Filter */}
            {filtersData?.filters?.brands && filtersData.filters.brands.length > 0 && (
              <div className='relative flex-shrink-0'>
                <button
                  onClick={() =>
                    setOpenFilter(openFilter === 'brand' ? null : 'brand')
                  }
                  className='flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green text-xs md:text-sm whitespace-nowrap'
                >
                  {locale === 'en' ? 'Brand' : 'العلامة التجارية'}
                  <HiChevronDown
                    className={`w-3 h-3 md:w-4 md:h-4 ${
                      openFilter === 'brand' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFilter === 'brand' && (
                  <div className='absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-[calc(100vw-2rem)] md:w-auto md:min-w-[200px] max-w-[280px] md:max-w-none p-3 md:p-4 max-h-[60vh] md:max-h-[400px] overflow-y-auto'>
                    <div className='space-y-2'>
                      {filtersData.filters.brands.map(brand => (
                        <label
                          key={brand.name}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={selectedBrands.includes(brand.name)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedBrands(prev => [...prev, brand.name]);
                              } else {
                                setSelectedBrands(prev =>
                                  prev.filter(b => b !== brand.name)
                                );
                              }
                            }}
                            className=''
                          />
                          <span className='text-sm text-deep-charcoal'>
                            {brand.name} ({brand.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price Filter */}
            {filtersData?.filters?.priceRange && (
              <div className='relative flex-shrink-0'>
                <button
                  onClick={() =>
                    setOpenFilter(openFilter === 'price' ? null : 'price')
                  }
                  className='flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green text-xs md:text-sm whitespace-nowrap'
                >
                  {locale === 'en' ? 'Price' : 'السعر'}
                  <HiChevronDown
                    className={`w-3 h-3 md:w-4 md:h-4 ${
                      openFilter === 'price' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFilter === 'price' && (
                  <div className='absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-[calc(100vw-2rem)] md:w-auto md:min-w-[300px] max-w-[320px] md:max-w-none p-3 md:p-4'>
                    <div className='space-y-3 md:space-y-4'>
                      <div className='flex items-center gap-2 md:gap-4'>
                        <input
                          type='number'
                          value={minPrice}
                          onChange={e =>
                            setMinPrice(Number(e.target.value))
                          }
                          min={priceRange[0]}
                          max={priceRange[1]}
                          className='w-20 md:w-24 px-2 md:px-3 py-1.5 md:py-2 text-sm border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                          placeholder='Min'
                        />
                        <span className='text-deep-charcoal/70 text-sm'>-</span>
                        <input
                          type='number'
                          value={maxPrice}
                          onChange={e =>
                            setMaxPrice(Number(e.target.value))
                          }
                          min={priceRange[0]}
                          max={priceRange[1]}
                          className='w-20 md:w-24 px-2 md:px-3 py-1.5 md:py-2 text-sm border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green'
                          placeholder='Max'
                        />
                      </div>
                      <input
                        type='range'
                        min={priceRange[0]}
                        max={priceRange[1]}
                        value={maxPrice}
                        onChange={e =>
                          setMaxPrice(Number(e.target.value))
                        }
                        className='w-full'
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Size Filter */}
            {filtersData?.filters?.sizes && filtersData.filters.sizes.length > 0 && (
              <div className='relative flex-shrink-0'>
                <button
                  onClick={() =>
                    setOpenFilter(openFilter === 'size' ? null : 'size')
                  }
                  className='flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green text-xs md:text-sm whitespace-nowrap'
                >
                  {locale === 'en' ? 'Size' : 'المقاس'}
                  <HiChevronDown
                    className={`w-3 h-3 md:w-4 md:h-4 ${
                      openFilter === 'size' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFilter === 'size' && (
                  <div className='absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-[calc(100vw-2rem)] md:w-auto md:min-w-[200px] max-w-[280px] md:max-w-none p-3 md:p-4 max-h-[60vh] md:max-h-[400px] overflow-y-auto'>
                    <div className='grid grid-cols-3 md:grid-cols-3 gap-2'>
                      {filtersData.filters.sizes.map(size => (
                        <label
                          key={size.name}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={selectedSizes.includes(size.name)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedSizes(prev => [...prev, size.name]);
                              } else {
                                setSelectedSizes(prev =>
                                  prev.filter(s => s !== size.name)
                                );
                              }
                            }}
                            className=''
                          />
                          <span className='text-sm text-deep-charcoal'>
                            {size.name} ({size.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Color Filter */}
            {filtersData?.filters?.colors && filtersData.filters.colors.length > 0 && (
              <div className='relative flex-shrink-0'>
                <button
                  onClick={() =>
                    setOpenFilter(openFilter === 'color' ? null : 'color')
                  }
                  className='flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green text-xs md:text-sm whitespace-nowrap'
                >
                  {locale === 'en' ? 'Color' : 'اللون'}
                  <HiChevronDown
                    className={`w-3 h-3 md:w-4 md:h-4 ${
                      openFilter === 'color' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFilter === 'color' && (
                  <div className='absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-[calc(100vw-2rem)] md:w-auto md:min-w-[200px] max-w-[280px] md:max-w-none p-3 md:p-4 max-h-[60vh] md:max-h-[400px] overflow-y-auto'>
                    <div className='grid grid-cols-2 gap-2'>
                      {filtersData.filters.colors.map(color => (
                        <label
                          key={color.name}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={selectedColors.includes(color.name)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedColors(prev => [...prev, color.name]);
                              } else {
                                setSelectedColors(prev =>
                                  prev.filter(c => c !== color.name)
                                );
                              }
                            }}
                            className=''
                          />
                          <span className='text-sm text-deep-charcoal'>
                            {color.name} ({color.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Condition Filter */}
            {filtersData?.filters?.conditions && filtersData.filters.conditions.length > 0 && (
              <div className='relative flex-shrink-0'>
                <button
                  onClick={() =>
                    setOpenFilter(openFilter === 'condition' ? null : 'condition')
                  }
                  className='flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green text-xs md:text-sm whitespace-nowrap'
                >
                  {locale === 'en' ? 'Condition' : 'الحالة'}
                  <HiChevronDown
                    className={`w-3 h-3 md:w-4 md:h-4 ${
                      openFilter === 'condition' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFilter === 'condition' && (
                  <div className='absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-[calc(100vw-2rem)] md:w-auto md:min-w-[200px] max-w-[280px] md:max-w-none p-3 md:p-4 max-h-[60vh] md:max-h-[400px] overflow-y-auto'>
                    <div className='space-y-2'>
                      {filtersData.filters.conditions.map(condition => (
                        <label
                          key={condition.name}
                          className='flex items-center gap-2 cursor-pointer'
                        >
                          <input
                            type='radio'
                            name='condition'
                            checked={selectedCondition === condition.name}
                            onChange={() => setSelectedCondition(condition.name)}
                            className=''
                          />
                          <span className='text-sm text-deep-charcoal capitalize'>
                            {condition.name.replace('-', ' ')} ({condition.count})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* On Sale Checkbox */}
            <label className='flex items-center gap-1.5 md:gap-2 cursor-pointer flex-shrink-0 whitespace-nowrap'>
              <input
                type='checkbox'
                checked={onSaleOnly}
                onChange={e => setOnSaleOnly(e.target.checked)}
                className='w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 rounded border-rich-sand focus:ring-red-500'
              />
              <span
                className={`text-xs md:text-sm font-medium ${
                  category === 'sale' ? 'text-red-500' : 'text-deep-charcoal'
                }`}
              >
                {locale === 'en' ? 'On sale' : 'عرض'}
              </span>
            </label>

            {/* Sort */}
            <div className='relative ml-auto flex-shrink-0'>
              <button
                onClick={() =>
                  setOpenFilter(openFilter === 'sort' ? null : 'sort')
                }
                className='flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors text-xs md:text-sm whitespace-nowrap'
              >
                {locale === 'en' ? 'Sort' : 'ترتيب'}
                <HiChevronDown
                  className={`w-3 h-3 md:w-4 md:h-4 ${
                    openFilter === 'sort' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFilter === 'sort' && (
                <div className='absolute top-full right-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-[calc(100vw-2rem)] md:w-auto md:min-w-[200px] max-w-[280px] md:max-w-none p-2'>
                  <button
                    onClick={() => {
                      setSortBy('relevance');
                      setOpenFilter(null);
                    }}
                    className='w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-saudi-green/10 rounded text-xs md:text-sm'
                  >
                    {locale === 'en' ? 'Relevance' : 'الصلة'}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('price-low');
                      setOpenFilter(null);
                    }}
                    className='w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-saudi-green/10 rounded text-xs md:text-sm'
                  >
                    {locale === 'en'
                      ? 'Price: Low to High'
                      : 'السعر: منخفض إلى مرتفع'}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('price-high');
                      setOpenFilter(null);
                    }}
                    className='w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-saudi-green/10 rounded text-xs md:text-sm'
                  >
                    {locale === 'en'
                      ? 'Price: High to Low'
                      : 'السعر: مرتفع إلى منخفض'}
                  </button>
                  <button
                    onClick={() => {
                      setSortBy('newest');
                      setOpenFilter(null);
                    }}
                    className='w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-saudi-green/10 rounded text-xs md:text-sm'
                  >
                    {locale === 'en' ? 'Newest' : 'الأحدث'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className='mb-6 flex flex-wrap items-center gap-2'>
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className='inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1 bg-saudi-green/10 text-saudi-green rounded-full text-xs md:text-sm'
              >
                <span className='truncate max-w-[120px] md:max-w-none'>
                  {filter.value}
                </span>
                <button
                  onClick={() => removeFilter(filter.type, filter.value)}
                  className='hover:text-saudi-green/70 flex-shrink-0'
                  aria-label={
                    locale === 'en' ? 'Remove filter' : 'إزالة المرشح'
                  }
                >
                  <HiXMark className='w-3 h-3 md:w-4 md:h-4' />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className='text-xs md:text-sm text-deep-charcoal/70 hover:text-saudi-green whitespace-nowrap'
            >
              {locale === 'en' ? 'Clear all' : 'مسح الكل'}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className='bg-white rounded-lg overflow-hidden shadow-sm'
              >
                <div className='relative aspect-square overflow-hidden bg-rich-sand/20' />
                <div className='p-4'>
                  <div className='h-4 bg-rich-sand/30 rounded w-3/4 mb-1' />
                  <div className='h-3 bg-rich-sand/30 rounded w-1/2 mb-2' />
                  <div className='h-5 bg-rich-sand/30 rounded w-20' />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && products.length > 0 && (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.images?.[0] || ''}
                title={product.title}
                price={product.price}
                seller={product.seller?.username || 'Unknown'}
                isLiked={product.isLiked}
                locale={locale}
                priority={false}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className='text-center py-12'>
            <p className='text-deep-charcoal/70 text-lg'>
              {locale === 'en'
                ? 'No products found'
                : 'لم يتم العثور على منتجات'}
            </p>
          </div>
        )}


        {/* Pagination */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
