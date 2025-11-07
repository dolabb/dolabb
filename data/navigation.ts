export interface SubCategory {
  name: string;
  key: string;
  href: string;
}

export interface FeaturedItem {
  name: string;
  key: string;
  href: string;
}

export interface StyleCategory {
  name: string;
  key: string;
  image: string;
  href: string;
}

export interface NavigationCategory {
  name: string;
  key: string;
  href: string;
  subCategories: SubCategory[];
  featured: FeaturedItem[];
  styles: StyleCategory[];
}

export const navigationCategories: NavigationCategory[] = [
  {
    name: 'Women',
    key: 'women',
    href: '/women',
    subCategories: [
      { name: 'Tops', key: 'tops', href: '/women/tops' },
      { name: 'Jeans', key: 'jeans', href: '/women/jeans' },
      { name: 'Sweaters', key: 'sweaters', href: '/women/sweaters' },
      { name: 'Skirts', key: 'skirts', href: '/women/skirts' },
      { name: 'Dresses', key: 'dresses', href: '/women/dresses' },
      { name: 'Coats & Jackets', key: 'coats-jackets', href: '/women/coats-jackets' },
      { name: 'Shoes', key: 'shoes', href: '/women/shoes' },
      { name: 'Bags & Purses', key: 'bags-purses', href: '/women/bags-purses' },
      { name: 'Sunglasses', key: 'sunglasses', href: '/women/sunglasses' },
      { name: 'Hats', key: 'hats', href: '/women/hats' },
      { name: 'Jewelry', key: 'jewelry', href: '/women/jewelry' },
      { name: 'Plus Size', key: 'plus-size', href: '/women/plus-size' },
    ],
    featured: [
      { name: 'Wardrobe essentials', key: 'wardrobe-essentials', href: '/women/wardrobe-essentials' },
      { name: 'Denim everything', key: 'denim-everything', href: '/women/denim' },
      { name: 'Lifestyle sneakers', key: 'lifestyle-sneakers', href: '/women/sneakers' },
      { name: 'Office wear', key: 'office-wear', href: '/women/office-wear' },
      { name: 'Gym gear', key: 'gym-gear', href: '/women/gym-gear' },
    ],
    styles: [
      {
        name: 'Minimalism',
        key: 'minimalism',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&auto=format',
        href: '/women/styles/minimalism',
      },
      {
        name: 'Coquette',
        key: 'coquette',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop&auto=format',
        href: '/women/styles/coquette',
      },
      {
        name: 'Y2K',
        key: 'y2k',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=300&fit=crop&auto=format',
        href: '/women/styles/y2k',
      },
      {
        name: 'Boho',
        key: 'boho',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&h=300&fit=crop&auto=format',
        href: '/women/styles/boho',
      },
    ],
  },
  {
    name: 'Men',
    key: 'men',
    href: '/men',
    subCategories: [
      { name: 'T-Shirts', key: 'tshirts', href: '/men/tshirts' },
      { name: 'Jeans', key: 'jeans', href: '/men/jeans' },
      { name: 'Hoodies', key: 'hoodies', href: '/men/hoodies' },
      { name: 'Shorts', key: 'shorts', href: '/men/shorts' },
      { name: 'Jackets', key: 'jackets', href: '/men/jackets' },
      { name: 'Sneakers', key: 'sneakers', href: '/men/sneakers' },
      { name: 'Watches', key: 'watches', href: '/men/watches' },
      { name: 'Bags', key: 'bags', href: '/men/bags' },
      { name: 'Accessories', key: 'accessories', href: '/men/accessories' },
    ],
    featured: [
      { name: 'Streetwear', key: 'streetwear', href: '/men/streetwear' },
      { name: 'Vintage finds', key: 'vintage-finds', href: '/men/vintage' },
      { name: 'Formal wear', key: 'formal-wear', href: '/men/formal' },
    ],
    styles: [
      {
        name: 'Streetwear',
        key: 'streetwear',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop&auto=format',
        href: '/men/styles/streetwear',
      },
      {
        name: 'Minimalist',
        key: 'minimalist',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop&auto=format',
        href: '/men/styles/minimalist',
      },
      {
        name: 'Vintage',
        key: 'vintage',
        image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=300&fit=crop&auto=format',
        href: '/men/styles/vintage',
      },
      {
        name: 'Athletic',
        key: 'athletic',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&auto=format',
        href: '/men/styles/athletic',
      },
    ],
  },
  {
    name: 'Kids',
    key: 'kids',
    href: '/kids',
    subCategories: [
      { name: 'Girls', key: 'girls', href: '/kids/girls' },
      { name: 'Boys', key: 'boys', href: '/kids/boys' },
      { name: 'Baby', key: 'baby', href: '/kids/baby' },
      { name: 'Shoes', key: 'shoes', href: '/kids/shoes' },
      { name: 'Accessories', key: 'accessories', href: '/kids/accessories' },
    ],
    featured: [
      { name: 'Back to school', key: 'back-to-school', href: '/kids/back-to-school' },
      { name: 'Playtime', key: 'playtime', href: '/kids/playtime' },
    ],
    styles: [],
  },
  {
    name: 'Sports',
    key: 'sports',
    href: '/sports',
    subCategories: [
      { name: 'Activewear', key: 'activewear', href: '/sports/activewear' },
      { name: 'Sneakers', key: 'sneakers', href: '/sports/sneakers' },
      { name: 'Equipment', key: 'equipment', href: '/sports/equipment' },
    ],
    featured: [
      { name: 'Running gear', key: 'running-gear', href: '/sports/running' },
      { name: 'Gym essentials', key: 'gym-essentials', href: '/sports/gym' },
    ],
    styles: [],
  },
  {
    name: 'Brands',
    key: 'brands',
    href: '/brands',
    subCategories: [
      { name: 'Designer', key: 'designer', href: '/brands/designer' },
      { name: 'Vintage', key: 'vintage', href: '/brands/vintage' },
      { name: 'Streetwear', key: 'streetwear', href: '/brands/streetwear' },
    ],
    featured: [
      { name: 'Top brands', key: 'top-brands', href: '/brands/top' },
      { name: 'New arrivals', key: 'new-arrivals', href: '/brands/new' },
    ],
    styles: [],
  },
  {
    name: 'Trending',
    key: 'trending',
    href: '/trending',
    subCategories: [
      { name: 'This week', key: 'this-week', href: '/trending/this-week' },
      { name: 'New arrivals', key: 'new-arrivals', href: '/trending/new' },
      { name: 'Most liked', key: 'most-liked', href: '/trending/most-liked' },
    ],
    featured: [],
    styles: [],
  },
  {
    name: 'Sale',
    key: 'sale',
    href: '/sale',
    subCategories: [
      { name: 'Up to 50% off', key: 'up-to-50', href: '/sale/up-to-50' },
      { name: 'Up to 70% off', key: 'up-to-70', href: '/sale/up-to-70' },
      { name: 'Clearance', key: 'clearance', href: '/sale/clearance' },
    ],
    featured: [],
    styles: [],
  },
];

