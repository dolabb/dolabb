'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Pagination from '@/components/Pagination';
import { getCategoryData } from '@/data/categoryProducts';
import { navigationCategories } from '@/data/navigation';
import { HiChevronDown, HiXMark } from 'react-icons/hi2';

interface CategoryProductListingProps {
  slug: string[];
}

export default function CategoryProductListing({ slug }: CategoryProductListingProps) {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  // Parse slug to get category and subcategory
  const category = slug[0] || '';
  const subCategory = slug.slice(1).join('-') || '';
  
  // Get category data
  const categoryData = getCategoryData(category, subCategory);
  
  // Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>('');
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const itemsPerPage = 20;
  
  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
    };
    
    if (openFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openFilter]);
  
  // Find category info from navigation
  const categoryInfo = navigationCategories.find(cat => cat.key === category);
  const subCategoryInfo = categoryInfo?.subCategories.find(sub => 
    sub.href.includes(subCategory) || sub.key === subCategory
  );
  const featuredInfo = categoryInfo?.featured.find(feat => 
    feat.href.includes(subCategory) || feat.key === subCategory
  );
  
  // Determine display name
  const displayName = featuredInfo?.name || subCategoryInfo?.name || categoryInfo?.name || category;
  
  // Build breadcrumbs
  const breadcrumbs = [
    { name: locale === 'en' ? 'Home' : 'الرئيسية', href: `/${locale}` },
    { name: categoryInfo?.name || category, href: `/${locale}${categoryInfo?.href || `/${category}`}` },
  ];
  
  if (featuredInfo) {
    breadcrumbs.push({
      name: featuredInfo.name,
      href: `/${locale}${featuredInfo.href}`,
    });
  } else if (subCategoryInfo) {
    breadcrumbs.push({
      name: subCategoryInfo.name,
      href: `/${locale}${subCategoryInfo.href}`,
    });
  }
  
  // Filter products
  const filteredProducts = useMemo(() => {
    if (!categoryData) return [];
    
    let products = [...categoryData.products];
    
    // Filter by brands
    if (selectedBrands.length > 0) {
      products = products.filter(p => selectedBrands.includes(p.brand));
    }
    
    // Filter by subcategories
    if (selectedSubCategories.length > 0) {
      products = products.filter(p => 
        selectedSubCategories.some(sc => 
          p.subCategory.toLowerCase().includes(sc.toLowerCase().replace(/\s+/g, '-'))
        )
      );
    }
    
    // Filter by price
    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    // Filter by sizes
    if (selectedSizes.length > 0) {
      products = products.filter(p => p.size && selectedSizes.includes(p.size));
    }
    
    // Filter by colors
    if (selectedColors.length > 0) {
      products = products.filter(p => p.color && selectedColors.includes(p.color));
    }
    
    // Filter by condition
    if (selectedCondition) {
      products = products.filter(p => p.condition === selectedCondition);
    }
    
    // Filter by sale
    if (onSaleOnly) {
      products = products.filter(p => p.onSale);
    }
    
    // Sort products
    switch (sortBy) {
      case 'price-low':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        products.sort((a, b) => parseInt(b.id.split('-').pop() || '0') - parseInt(a.id.split('-').pop() || '0'));
        break;
      default:
        break;
    }
    
    return products;
  }, [categoryData, selectedBrands, selectedSubCategories, priceRange, selectedSizes, selectedColors, selectedCondition, onSaleOnly, sortBy]);
  
  // Paginate products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrands, selectedSubCategories, priceRange, selectedSizes, selectedColors, selectedCondition, onSaleOnly, sortBy]);
  
  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);
  
  // Active filters
  const activeFilters = [
    ...selectedBrands.map(b => ({ type: 'brand', value: b })),
    ...selectedSubCategories.map(s => ({ type: 'subcategory', value: s })),
    ...selectedSizes.map(s => ({ type: 'size', value: s })),
    ...selectedColors.map(c => ({ type: 'color', value: c })),
    ...(selectedCondition ? [{ type: 'condition', value: selectedCondition }] : []),
    ...(onSaleOnly ? [{ type: 'sale', value: 'On sale' }] : []),
  ];
  
  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'brand':
        setSelectedBrands(prev => prev.filter(b => b !== value));
        break;
      case 'subcategory':
        setSelectedSubCategories(prev => prev.filter(s => s !== value));
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
    }
  };
  
  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedSubCategories([]);
    setPriceRange([0, 1000]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedCondition('');
    setOnSaleOnly(false);
  };
  
  if (!categoryData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-deep-charcoal">Category not found</p>
      </div>
    );
  }
  
  return (
    <div className="bg-off-white min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-deep-charcoal/70">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                <Link
                  href={crumb.href}
                  className="hover:text-saudi-green transition-colors"
                >
                  {crumb.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal mb-2 font-display flex items-center gap-2">
            {displayName}
            <HiChevronDown className="w-6 h-6 text-deep-charcoal/50" />
          </h1>
          <p className="text-deep-charcoal/70">
            ({filteredProducts.length.toLocaleString()} {locale === 'en' ? 'results' : 'نتيجة'})
          </p>
        </div>
        
        {/* Popular Brands */}
        {categoryData.popularBrands.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-3">
              <span className="font-bold text-deep-charcoal">
                {locale === 'en' ? 'Popular brands' : 'العلامات التجارية الشائعة'}
              </span>
              <div className="flex flex-wrap gap-2">
                {categoryData.popularBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedBrands(prev =>
                        prev.includes(brand)
                          ? prev.filter(b => b !== brand)
                          : [...prev, brand]
                      );
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedBrands.includes(brand)
                        ? 'bg-saudi-green text-white'
                        : 'bg-white text-deep-charcoal border border-rich-sand hover:border-saudi-green'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Filter Bar */}
        <div className="border-t border-b border-rich-sand/30 py-4 mb-4" ref={filterRef}>
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'category' ? null : 'category')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Category' : 'الفئة'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'category' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'category' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[200px] p-4">
                  <div className="space-y-2">
                    {categoryInfo?.subCategories.map((sub) => (
                      <label key={sub.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSubCategories.includes(sub.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubCategories(prev => [...prev, sub.name]);
                            } else {
                              setSelectedSubCategories(prev => prev.filter(s => s !== sub.name));
                            }
                          }}
                          className=""
                        />
                        <span className="text-sm text-deep-charcoal">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Subcategory Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'subcategory' ? null : 'subcategory')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Subcategory' : 'الفئة الفرعية'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'subcategory' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'subcategory' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[200px] max-h-[400px] overflow-y-auto p-4">
                  <div className="space-y-2">
                    {categoryData.subCategories.map((sub) => (
                      <label key={sub} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSubCategories.includes(sub)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubCategories(prev => [...prev, sub]);
                            } else {
                              setSelectedSubCategories(prev => prev.filter(s => s !== sub));
                            }
                          }}
                          className=""
                        />
                        <span className="text-sm text-deep-charcoal">{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Brand Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'brand' ? null : 'brand')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Brand' : 'العلامة التجارية'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'brand' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'brand' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[200px] max-h-[400px] overflow-y-auto p-4">
                  <div className="space-y-2">
                    {categoryData.popularBrands.map((brand) => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands(prev => [...prev, brand]);
                            } else {
                              setSelectedBrands(prev => prev.filter(b => b !== brand));
                            }
                          }}
                          className=""
                        />
                        <span className="text-sm text-deep-charcoal">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Price Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'price' ? null : 'price')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Price' : 'السعر'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'price' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'price' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[300px] p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-24 px-3 py-2 border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green"
                        placeholder="Min"
                      />
                      <span className="text-deep-charcoal/70">-</span>
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-24 px-3 py-2 border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green"
                        placeholder="Max"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Size Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'size' ? null : 'size')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Size' : 'المقاس'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'size' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'size' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[200px] p-4">
                  <div className="grid grid-cols-3 gap-2">
                    {categoryData.sizes.map((size) => (
                      <label key={size} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSizes(prev => [...prev, size]);
                            } else {
                              setSelectedSizes(prev => prev.filter(s => s !== size));
                            }
                          }}
                          className=""
                        />
                        <span className="text-sm text-deep-charcoal">{size}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Color Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'color' ? null : 'color')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Color' : 'اللون'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'color' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'color' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[200px] p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {categoryData.colors.map((color) => (
                      <label key={color} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColors(prev => [...prev, color]);
                            } else {
                              setSelectedColors(prev => prev.filter(c => c !== color));
                            }
                          }}
                          className=""
                        />
                        <span className="text-sm text-deep-charcoal">{color}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Condition Filter */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'condition' ? null : 'condition')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Condition' : 'الحالة'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'condition' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'condition' && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[200px] p-4">
                  <div className="space-y-2">
                    {['new', 'like-new', 'good', 'fair'].map((condition) => (
                      <label key={condition} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="condition"
                          checked={selectedCondition === condition}
                          onChange={() => setSelectedCondition(condition)}
                          className=""
                        />
                        <span className="text-sm text-deep-charcoal capitalize">{condition.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* On Sale Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => setOnSaleOnly(e.target.checked)}
                className="w-4 h-4 text-saudi-green rounded border-rich-sand focus:ring-saudi-green"
              />
              <span className="text-sm text-deep-charcoal">
                {locale === 'en' ? 'On sale' : 'عرض'}
              </span>
            </label>
            
            {/* Sort */}
            <div className="relative ml-auto">
              <button
                onClick={() => setOpenFilter(openFilter === 'sort' ? null : 'sort')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rich-sand rounded-lg hover:border-saudi-green transition-colors"
              >
                {locale === 'en' ? 'Sort' : 'ترتيب'}
                <HiChevronDown className={`w-4 h-4 transition-transform ${openFilter === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              {openFilter === 'sort' && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 min-w-[200px] p-2">
                  <button
                    onClick={() => { setSortBy('relevance'); setOpenFilter(null); }}
                    className="w-full text-left px-4 py-2 hover:bg-saudi-green/10 rounded text-sm"
                  >
                    {locale === 'en' ? 'Relevance' : 'الصلة'}
                  </button>
                  <button
                    onClick={() => { setSortBy('price-low'); setOpenFilter(null); }}
                    className="w-full text-left px-4 py-2 hover:bg-saudi-green/10 rounded text-sm"
                  >
                    {locale === 'en' ? 'Price: Low to High' : 'السعر: منخفض إلى مرتفع'}
                  </button>
                  <button
                    onClick={() => { setSortBy('price-high'); setOpenFilter(null); }}
                    className="w-full text-left px-4 py-2 hover:bg-saudi-green/10 rounded text-sm"
                  >
                    {locale === 'en' ? 'Price: High to Low' : 'السعر: مرتفع إلى منخفض'}
                  </button>
                  <button
                    onClick={() => { setSortBy('newest'); setOpenFilter(null); }}
                    className="w-full text-left px-4 py-2 hover:bg-saudi-green/10 rounded text-sm"
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
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-saudi-green/10 text-saudi-green rounded-full text-sm"
              >
                {filter.value}
                <button
                  onClick={() => removeFilter(filter.type, filter.value)}
                  className="hover:text-saudi-green/70"
                >
                  <HiXMark className="w-4 h-4" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-deep-charcoal/70 hover:text-saudi-green transition-colors"
            >
              {locale === 'en' ? 'Clear all' : 'مسح الكل'}
            </button>
          </div>
        )}
        
        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              locale={locale}
            />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-deep-charcoal/70 text-lg">
              {locale === 'en' ? 'No products found' : 'لم يتم العثور على منتجات'}
            </p>
          </div>
        )}
        
        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

