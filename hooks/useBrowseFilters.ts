import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useGetCategoriesQuery, useGetProductsQuery } from '@/lib/api/productsApi';
import { navigationCategories } from '@/data/navigation';

const sizes = [
  '2XS',
  'XS',
  'Small',
  'Medium',
  'Large',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  'One Size',
];

const colors = [
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Black',
  'White',
  'Gray',
  'Pink',
  'Purple',
  'Orange',
  'Brown',
  'Beige',
];

export function useBrowseFilters(locale: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch categories data
  const { data: categoriesData } = useGetCategoriesQuery();

  // Filter state from URL
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    size: searchParams.get('size') || '',
    color: searchParams.get('color') || '',
    // Map API condition values back to user-friendly names for display
    condition: (() => {
      const apiCondition = searchParams.get('condition') || '';
      const reverseConditionMap: Record<string, string> = {
        'new': 'Brand new',
        'like-new': 'Like new',
        'good': 'Used - Good', // Default to "Used - Good" for 'good'
        'fair': 'Used - Fair',
      };
      return reverseConditionMap[apiCondition] || apiCondition;
    })(),
    sortBy:
      (searchParams.get('sortBy') as
        | 'Relevance'
        | 'Low to High'
        | 'High to Low'
        | 'Newly Listed') || 'Relevance',
    page: parseInt(searchParams.get('page') || '1'),
    limit: 20,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.subcategory) params.set('subcategory', filters.subcategory);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.size) params.set('size', filters.size);
    if (filters.color) params.set('color', filters.color);
    // Map condition user-friendly names to API values for URL
    if (filters.condition) {
      const conditionMap: Record<string, string> = {
        'Brand new': 'new',
        'Like new': 'like-new',
        'Used - Excellent': 'good',
        'Used - Good': 'good',
        'Used - Fair': 'fair',
      };
      params.set('condition', conditionMap[filters.condition] || filters.condition);
    }
    if (filters.sortBy && filters.sortBy !== 'Relevance')
      params.set('sortBy', filters.sortBy);
    if (filters.page > 1) params.set('page', filters.page.toString());

    router.replace(`/${locale}/browse?${params.toString()}`, { scroll: false });
  }, [filters, locale, router]);

  // Build API params
  const apiParams = useMemo(() => {
    const params: {
      page: number;
      limit: number;
      category?: string;
      subcategory?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      size?: string;
      color?: string;
      condition?: string;
      sortBy?: 'newest' | 'price: low to high' | 'price: high to low' | 'relevance';
    } = {
      page: filters.page,
      limit: filters.limit,
    };

    if (filters.category) params.category = filters.category;
    // Only include subcategory if it's not empty (not "All Subcategories")
    // Send exact subcategory value as received from API (case-sensitive)
    if (filters.subcategory && filters.subcategory.trim() !== '') {
      params.subcategory = filters.subcategory;
    }
    if (filters.brand) params.brand = filters.brand;
    if (filters.minPrice) params.minPrice = parseInt(filters.minPrice);
    if (filters.maxPrice) params.maxPrice = parseInt(filters.maxPrice);
    if (filters.size) params.size = filters.size;
    if (filters.color) params.color = filters.color;
    // Map condition user-friendly names to API values
    if (filters.condition) {
      const conditionMap: Record<string, string> = {
        'Brand new': 'new',
        'Like new': 'like-new',
        'Used - Excellent': 'good',
        'Used - Good': 'good',
        'Used - Fair': 'fair',
      };
      params.condition = conditionMap[filters.condition] || filters.condition;
    }
    // Always include sortBy when it's set - map display values to API values
    if (filters.sortBy) {
      const sortByMap: Record<string, 'newest' | 'price: low to high' | 'price: high to low' | 'relevance'> = {
        'Relevance': 'relevance',
        'Low to High': 'price: low to high',
        'High to Low': 'price: high to low',
        'Newly Listed': 'newest',
      };
      const apiSortBy = sortByMap[filters.sortBy];
      if (apiSortBy) {
        params.sortBy = apiSortBy;
      }
    }

    return params;
  }, [filters]);

  // Fetch products
  const { data: products, isLoading, error } = useGetProductsQuery(apiParams);

  // Filter options from API
  const apiCategories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData?.categories]
  );
  const apiBrands = useMemo(
    () => categoriesData?.brands || [],
    [categoriesData?.brands]
  );
  const apiColors = useMemo(
    () => categoriesData?.colors || [],
    [categoriesData?.colors]
  );
  const apiSizes = useMemo(
    () => categoriesData?.sizes || [],
    [categoriesData?.sizes]
  );

  // Available subcategories
  const availableSubcategoriesFromApi = useMemo(() => {
    // If no category is selected, return all subcategories from all categories
    if (!filters.category) {
      const allSubcategories: string[] = [];
      apiCategories.forEach(cat => {
        if (cat.subcategories && cat.subcategories.length > 0) {
          allSubcategories.push(...cat.subcategories);
        }
      });
      // Remove duplicates
      return Array.from(new Set(allSubcategories));
    }
    
    // If a category is selected, return only subcategories from that category
    const selectedCategoryFromApi = apiCategories.find(
      cat => cat.category.toLowerCase() === filters.category.toLowerCase()
    );
    return selectedCategoryFromApi?.subcategories || [];
  }, [apiCategories, filters.category]);

  // Category options
  const categoryOptions = useMemo(() => {
    const options = [
      { value: '', label: locale === 'en' ? 'All Categories' : 'جميع الفئات' },
    ];

    if (apiCategories.length > 0) {
      apiCategories.forEach(cat => {
        const categoryName =
          cat.category.charAt(0).toUpperCase() + cat.category.slice(1);
        options.push({ value: cat.category, label: categoryName });
      });
    } else {
      navigationCategories.forEach(cat => {
        options.push({ value: cat.key, label: cat.name });
      });
    }

    return options;
  }, [apiCategories, locale]);

  // Subcategory options - use exact values from API
  const subcategoryOptions = useMemo(() => {
    const options = [
      {
        value: '',
        label: locale === 'en' ? 'All Subcategories' : 'جميع الفئات الفرعية',
      },
    ];

    if (availableSubcategoriesFromApi.length > 0) {
      availableSubcategoriesFromApi.forEach(sub => {
        // Use exact subcategory value from API (case-sensitive)
        options.push({
          value: sub, // Send exact value as received from API
          label: sub.charAt(0).toUpperCase() + sub.slice(1),
        });
      });
    } else if (filters.category) {
      const selectedCategoryData = navigationCategories.find(
        cat => cat.key === filters.category
      );
      const availableSubcategories = selectedCategoryData?.subCategories || [];
      availableSubcategories.forEach(sub => {
        options.push({ value: sub.key, label: sub.name });
      });
    }

    return options;
  }, [availableSubcategoriesFromApi, filters.category, locale]);

  // Brand options
  const brandOptions = useMemo(() => {
    const options = [
      {
        value: '',
        label: locale === 'en' ? 'All Brands' : 'جميع العلامات التجارية',
      },
    ];

    if (apiBrands.length > 0) {
      apiBrands.forEach(brand => {
        options.push({ value: brand, label: brand });
      });
    }

    return options;
  }, [apiBrands, locale]);

  // Color options
  const colorOptions = useMemo(() => {
    const options = [
      { value: '', label: locale === 'en' ? 'All Colors' : 'جميع الألوان' },
    ];

    if (apiColors.length > 0) {
      apiColors.forEach(color => {
        const colorName = color.charAt(0).toUpperCase() + color.slice(1);
        options.push({ value: color, label: colorName });
      });
    } else {
      colors.forEach(color => {
        options.push({ value: color, label: color });
      });
    }

    return options;
  }, [apiColors, locale]);

  // Size options - from API if available, otherwise fallback to hardcoded
  const sizeOptions = useMemo(() => {
    const options = [
      { value: '', label: locale === 'en' ? 'All Sizes' : 'جميع المقاسات' },
    ];

    if (apiSizes.length > 0) {
      // Use sizes from API (already sorted: 2XS, XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, One Size, then others)
      apiSizes.forEach(size => {
        options.push({ value: size, label: size });
      });
    } else {
      // Fallback to hardcoded sizes
      sizes.forEach(size => {
        options.push({ value: size, label: size });
      });
    }

    return options;
  }, [apiSizes, locale]);

  // Filter actions
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const clearFilter = (key: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: '',
      page: 1,
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      subcategory: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      size: '',
      color: '',
      condition: '',
      sortBy: 'Relevance',
      page: 1,
      limit: 20,
    });
  };

  const hasActiveFilters =
    filters.category ||
    filters.subcategory ||
    filters.brand ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.size ||
    filters.color ||
    filters.condition;

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    categoryOptions,
    subcategoryOptions,
    brandOptions,
    colorOptions,
    sizeOptions,
    products: products || [],
    isLoading,
    error,
    apiCategories,
    availableSubcategoriesFromApi,
  };
}

