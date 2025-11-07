export interface Product {
  id: string;
  image: string;
  title: string;
  price: number;
  seller: string;
  isLiked?: boolean;
}

export const featuredProducts: Product[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
    title: 'Vintage Denim Jacket',
    price: 45.99,
    seller: '@vintagefinds',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop&auto=format',
    title: 'Designer Leather Bag',
    price: 89.50,
    seller: '@luxuryitems',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop&auto=format',
    title: 'Y2K Platform Sneakers',
    price: 65.00,
    seller: '@sneakerhead',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=500&fit=crop&auto=format',
    title: 'Oversized Blazer',
    price: 55.75,
    seller: '@fashionista',
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&h=500&fit=crop&auto=format',
    title: 'Silk Scarf Set',
    price: 32.99,
    seller: '@accessories',
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=500&fit=crop&auto=format',
    title: 'Vintage Sunglasses',
    price: 28.50,
    seller: '@retrostyle',
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
    title: 'Cropped Hoodie',
    price: 38.00,
    seller: '@streetwear',
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop&auto=format',
    title: 'High-Waisted Jeans',
    price: 42.99,
    seller: '@denimlover',
  },
];

export const trendingProducts: Product[] = [
  {
    id: '9',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop&auto=format',
    title: 'Minimalist Watch',
    price: 75.00,
    seller: '@minimalist',
  },
  {
    id: '10',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop&auto=format',
    title: 'Statement Earrings',
    price: 24.99,
    seller: '@jewelry',
  },
  {
    id: '11',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop&auto=format',
    title: 'Cargo Pants',
    price: 48.50,
    seller: '@urbanstyle',
  },
  {
    id: '12',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=500&fit=crop&auto=format',
    title: 'Crossbody Bag',
    price: 52.00,
    seller: '@handbags',
  },
];

