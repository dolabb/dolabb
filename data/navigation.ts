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
      { name: 'Shoes', key: 'shoes', href: '/women/shoes' },
      { name: 'Jeans', key: 'jeans', href: '/women/jeans' },
      { name: 'Bags & Purses', key: 'bags-purses', href: '/women/bags-purses' },
      { name: 'Sweaters', key: 'sweaters', href: '/women/sweaters' },
      { name: 'Sunglasses', key: 'sunglasses', href: '/women/sunglasses' },
      { name: 'Skirts', key: 'skirts', href: '/women/skirts' },
      { name: 'Hats', key: 'hats', href: '/women/hats' },
      { name: 'Dresses', key: 'dresses', href: '/women/dresses' },
      { name: 'Coats & Jackets', key: 'coats-jackets', href: '/women/coats-jackets' },
      { name: 'Plus Size', key: 'plus-size', href: '/women/plus-size' },
    ],
    featured: [
      { name: 'Wardrobe essentials', key: 'wardrobe-essentials', href: '/women/wardrobe-essentials' },
      { name: 'Denim everything', key: 'denim-everything', href: '/women/denim' },
      { name: 'Lifestyle sneakers', key: 'lifestyle-sneakers', href: '/women/sneakers' },
      { name: 'Office wear', key: 'office-wear', href: '/women/office-wear' },
      { name: 'Gym gear', key: 'gym-gear', href: '/women/gym-gear' },
      { name: 'See all women\'s', key: 'see-all-womens', href: '/women' },
    ],
    styles: [],
  },
  {
    name: 'Men',
    key: 'men',
    href: '/men',
    subCategories: [
      { name: 'T-shirts', key: 'tshirts', href: '/men/tshirts' },
      { name: 'Shoes', key: 'shoes', href: '/men/shoes' },
      { name: 'Shirts', key: 'shirts', href: '/men/shirts' },
      { name: 'Bags', key: 'bags', href: '/men/bags' },
      { name: 'Hoodies', key: 'hoodies', href: '/men/hoodies' },
      { name: 'Hats', key: 'hats', href: '/men/hats' },
      { name: 'Jeans', key: 'jeans', href: '/men/jeans' },
      { name: 'Sweaters', key: 'sweaters', href: '/men/sweaters' },
      { name: 'Sunglasses', key: 'sunglasses', href: '/men/sunglasses' },
      { name: 'Coats & Jackets', key: 'coats-jackets', href: '/men/coats-jackets' },
      { name: 'Big & Tall', key: 'big-tall', href: '/men/big-tall' },
    ],
    featured: [
      { name: 'Wardrobe essentials', key: 'wardrobe-essentials', href: '/men/wardrobe-essentials' },
      { name: 'Denim everything', key: 'denim-everything', href: '/men/denim' },
      { name: 'Lifestyle sneakers', key: 'lifestyle-sneakers', href: '/men/sneakers' },
      { name: 'Office wear', key: 'office-wear', href: '/men/office-wear' },
      { name: 'Gym gear', key: 'gym-gear', href: '/men/gym-gear' },
      { name: 'See all men\'s', key: 'see-all-mens', href: '/men' },
    ],
    styles: [],
  },
  {
    name: 'Watches',
    key: 'watches',
    href: '/watches',
    subCategories: [
      { name: 'Men\'s Watches', key: 'mens-watches', href: '/watches/mens' },
      { name: 'Women\'s Watches', key: 'womens-watches', href: '/watches/womens' },
      { name: 'Smart Watches', key: 'smart-watches', href: '/watches/smart' },
      { name: 'Luxury Watches', key: 'luxury-watches', href: '/watches/luxury' },
      { name: 'Sports Watches', key: 'sports-watches', href: '/watches/sports' },
      { name: 'Vintage Watches', key: 'vintage-watches', href: '/watches/vintage' },
      { name: 'Dress Watches', key: 'dress-watches', href: '/watches/dress' },
      { name: 'Casual Watches', key: 'casual-watches', href: '/watches/casual' },
    ],
    featured: [
      { name: 'Best Sellers', key: 'best-sellers', href: '/watches/best-sellers' },
      { name: 'New Arrivals', key: 'new-arrivals', href: '/watches/new-arrivals' },
      { name: 'On Sale', key: 'on-sale', href: '/watches/sale' },
      { name: 'See all watches', key: 'see-all-watches', href: '/watches' },
    ],
    styles: [],
  },
  {
    name: 'Jewelry',
    key: 'jewelry',
    href: '/jewelry',
    subCategories: [
      { name: 'Rings', key: 'rings', href: '/jewelry/rings' },
      { name: 'Necklaces', key: 'necklaces', href: '/jewelry/necklaces' },
      { name: 'Earrings', key: 'earrings', href: '/jewelry/earrings' },
      { name: 'Bracelets', key: 'bracelets', href: '/jewelry/bracelets' },
      { name: 'Pendants', key: 'pendants', href: '/jewelry/pendants' },
      { name: 'Chains', key: 'chains', href: '/jewelry/chains' },
      { name: 'Anklets', key: 'anklets', href: '/jewelry/anklets' },
      { name: 'Brooches', key: 'brooches', href: '/jewelry/brooches' },
      { name: 'Cufflinks', key: 'cufflinks', href: '/jewelry/cufflinks' },
    ],
    featured: [
      { name: 'Gold Collection', key: 'gold-collection', href: '/jewelry/gold' },
      { name: 'Silver Collection', key: 'silver-collection', href: '/jewelry/silver' },
      { name: 'Diamond Collection', key: 'diamond-collection', href: '/jewelry/diamond' },
      { name: 'Vintage Jewelry', key: 'vintage-jewelry', href: '/jewelry/vintage' },
      { name: 'See all jewelry', key: 'see-all-jewelry', href: '/jewelry' },
    ],
    styles: [],
  },
  {
    name: 'Accessories',
    key: 'accessories',
    href: '/accessories',
    subCategories: [
      { name: 'Bags', key: 'bags', href: '/accessories/bags' },
      { name: 'Belts', key: 'belts', href: '/accessories/belts' },
      { name: 'Hats & Caps', key: 'hats-caps', href: '/accessories/hats-caps' },
      { name: 'Sunglasses', key: 'sunglasses', href: '/accessories/sunglasses' },
      { name: 'Scarves', key: 'scarves', href: '/accessories/scarves' },
      { name: 'Wallets', key: 'wallets', href: '/accessories/wallets' },
      { name: 'Phone Cases', key: 'phone-cases', href: '/accessories/phone-cases' },
      { name: 'Keychains', key: 'keychains', href: '/accessories/keychains' },
      { name: 'Hair Accessories', key: 'hair-accessories', href: '/accessories/hair' },
      { name: 'Ties & Bow Ties', key: 'ties-bow-ties', href: '/accessories/ties' },
    ],
    featured: [
      { name: 'Designer Bags', key: 'designer-bags', href: '/accessories/designer-bags' },
      { name: 'Luxury Accessories', key: 'luxury-accessories', href: '/accessories/luxury' },
      { name: 'Trending Now', key: 'trending-now', href: '/accessories/trending' },
      { name: 'See all accessories', key: 'see-all-accessories', href: '/accessories' },
    ],
    styles: [],
  },
];

