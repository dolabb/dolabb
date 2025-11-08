import { Product } from './products';

export interface CategoryProduct extends Product {
  category: string;
  subCategory: string;
  brand: string;
  size?: string;
  color?: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair';
  onSale?: boolean;
  originalPrice?: number;
}

export interface CategoryData {
  category: string;
  subCategory: string;
  popularBrands: string[];
  subCategories: string[];
  sizes: string[];
  colors: string[];
  products: CategoryProduct[];
}

// Popular brands for different categories
export const categoryBrands: Record<string, string[]> = {
  women: [
    'Gildan',
    'Nike',
    'American Vintage',
    'Harley Davidson',
    'Zara',
    'H&M',
    'Forever 21',
  ],
  men: [
    'Gildan',
    'Nike',
    'American Vintage',
    'Harley Davidson',
    'Adidas',
    "Levi's",
    'Uniqlo',
  ],
  kids: ['Gap Kids', "Carter's", 'Old Navy', 'H&M Kids'],
  sports: ['Nike', 'Adidas', 'Under Armour', 'Puma'],
  brands: ['Gildan', 'Nike', 'American Vintage', 'Harley Davidson'],
};

// Subcategories for wardrobe essentials
export const wardrobeEssentialsSubcategories = [
  'T-shirts',
  'Hoodies',
  'Sweatshirts',
  'Jumpers',
  'Cardigans',
  'Shirts',
  'Polo shirts',
  'Blouses',
  'Crop tops',
  'Vests',
  'Corsets',
  'Bodysuits',
];

// Common sizes
export const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Common colors
export const colors = [
  'Black',
  'White',
  'Navy',
  'Gray',
  'Beige',
  'Red',
  'Blue',
  'Green',
  'Pink',
  'Yellow',
  'Purple',
  'Orange',
];

// Generate products for wardrobe essentials
const generateWardrobeEssentialsProducts = (): CategoryProduct[] => {
  const products: CategoryProduct[] = [];
  const brands = categoryBrands['women'];
  const subcats = wardrobeEssentialsSubcategories;
  const imageIds = [
    '1521572163474-6864f9cf17ab',
    '1551028719-00167b16eac5',
    '1544966503-7cc5ac882d5f',
    '1594633312681-425c7b97ccd1',
    '1594633313593-bab3825d0caf',
    '1521572163474-6864f9cf17ab',
    '1551028719-00167b16eac5',
    '1544966503-7cc5ac882d5f',
  ];

  subcats.forEach((subcat, subcatIndex) => {
    brands.forEach((brand, brandIndex) => {
      for (let i = 0; i < 3; i++) {
        const productIndex =
          subcatIndex * brands.length * 3 + brandIndex * 3 + i;
        products.push({
          id: `we-${productIndex}`,
          category: 'women',
          subCategory: subcat.toLowerCase().replace(/\s+/g, '-'),
          brand: brand,
          image: `https://images.unsplash.com/photo-${
            imageIds[productIndex % imageIds.length]
          }?w=500&h=500&fit=crop&auto=format`,
          title: `${brand} ${subcat}`,
          price: 15.99 + (productIndex % 10) * 5,
          originalPrice:
            productIndex % 3 === 0
              ? 25.99 + (productIndex % 10) * 5
              : undefined,
          onSale: productIndex % 3 === 0,
          seller: `@${brand.toLowerCase().replace(/\s+/g, '')}${i}`,
          size: sizes[productIndex % sizes.length],
          color: colors[productIndex % colors.length],
          condition: ['new', 'like-new', 'good', 'fair'][productIndex % 4] as
            | 'new'
            | 'like-new'
            | 'good'
            | 'fair',
        });
      }
    });
  });

  return products;
};

// Generate products for men's t-shirts
const generateMenTshirtsProducts = (): CategoryProduct[] => {
  const products: CategoryProduct[] = [];
  const brands = categoryBrands['men'];
  const imageIds = [
    '1521572163474-6864f9cf17ab',
    '1551028719-00167b16eac5',
    '1544966503-7cc5ac882d5f',
    '1594633312681-425c7b97ccd1',
    '1594633313593-bab3825d0caf',
    '1521572163474-6864f9cf17ab',
    '1551028719-00167b16eac5',
    '1544966503-7cc5ac882d5f',
  ];

  brands.forEach((brand, brandIndex) => {
    for (let i = 0; i < 8; i++) {
      const productIndex = brandIndex * 8 + i;
      products.push({
        id: `men-tshirt-${productIndex}`,
        category: 'men',
        subCategory: 'tshirts',
        brand: brand,
        image: `https://images.unsplash.com/photo-${
          imageIds[productIndex % imageIds.length]
        }?w=500&h=500&fit=crop`,
        title: `${brand} Men's T-shirt`,
        price: 19.99 + (productIndex % 10) * 3,
        originalPrice:
          productIndex % 4 === 0 ? 29.99 + (productIndex % 10) * 3 : undefined,
        onSale: productIndex % 4 === 0,
        seller: `@${brand.toLowerCase().replace(/\s+/g, '')}${i}`,
        size: sizes[productIndex % sizes.length],
        color: colors[productIndex % colors.length],
        condition: ['new', 'like-new', 'good', 'fair'][productIndex % 4] as
          | 'new'
          | 'like-new'
          | 'good'
          | 'fair',
      });
    }
  });

  return products;
};

// Store all category products
export const categoryProductsData: Record<string, CategoryData> = {
  'women-wardrobe-essentials': {
    category: 'women',
    subCategory: 'wardrobe-essentials',
    popularBrands: categoryBrands['women'],
    subCategories: wardrobeEssentialsSubcategories,
    sizes: sizes,
    colors: colors,
    products: generateWardrobeEssentialsProducts(),
  },
  'men-tshirts': {
    category: 'men',
    subCategory: 'tshirts',
    popularBrands: categoryBrands['men'],
    subCategories: wardrobeEssentialsSubcategories, // Same subcategories for men
    sizes: sizes,
    colors: colors,
    products: generateMenTshirtsProducts(),
  },
};

// Generic product generator for any category/subcategory
const generateGenericProducts = (
  category: string,
  subCategory: string,
  count: number = 24
): CategoryProduct[] => {
  const products: CategoryProduct[] = [];
  const brands = categoryBrands[category] || categoryBrands['women'];
  const imageIds = [
    '1521572163474-6864f9cf17ab',
    '1551028719-00167b16eac5',
    '1544966503-7cc5ac882d5f',
    '1594633312681-425c7b97ccd1',
    '1594633313593-bab3825d0caf',
    '1515886657613-9f3515b0c78f',
    '1441986300917-64674bd600d8',
    '1490481651871-ab68de25d43d',
  ];

  const subCategoryName = subCategory
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  for (let i = 0; i < count; i++) {
    const brand = brands[i % brands.length];
    const productIndex = i;
    products.push({
      id: `${category}-${subCategory}-${productIndex}`,
      category: category,
      subCategory: subCategory,
      brand: brand,
      image: `https://images.unsplash.com/photo-${
        imageIds[productIndex % imageIds.length]
      }?w=500&h=500&fit=crop&auto=format`,
      title: `${brand} ${subCategoryName}`,
      price: 15.99 + (productIndex % 20) * 5,
      originalPrice:
        productIndex % 3 === 0 ? 25.99 + (productIndex % 20) * 5 : undefined,
      onSale: productIndex % 3 === 0,
      seller: `@${brand.toLowerCase().replace(/\s+/g, '')}${i}`,
      size: sizes[productIndex % sizes.length],
      color: colors[productIndex % colors.length],
      condition: ['new', 'like-new', 'good', 'fair'][productIndex % 4] as
        | 'new'
        | 'like-new'
        | 'good'
        | 'fair',
    });
  }

  return products;
};

// Helper function to get category data
export const getCategoryData = (
  category: string,
  subCategory: string
): CategoryData | null => {
  const key = `${category}-${subCategory}`;

  // If specific data exists, return it
  if (categoryProductsData[key]) {
    return categoryProductsData[key];
  }

  // Otherwise, generate generic data for any category
  const brands = categoryBrands[category] || categoryBrands['women'];
  const subCategories =
    category === 'women' || category === 'men' || category === 'kids'
      ? wardrobeEssentialsSubcategories
      : ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  return {
    category: category,
    subCategory: subCategory,
    popularBrands: brands,
    subCategories: subCategories,
    sizes: sizes,
    colors: colors,
    products: generateGenericProducts(category, subCategory, 24),
  };
};

// Helper function to get all products for a category
export const getCategoryProducts = (
  category: string,
  subCategory: string
): CategoryProduct[] => {
  const data = getCategoryData(category, subCategory);
  return data?.products || [];
};
