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
      { name: 'Jewelry', key: 'jewelry', href: '/women/jewelry' },
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
      { name: 'Jewelry', key: 'jewelry', href: '/men/jewelry' },
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
    name: 'Kids',
    key: 'kids',
    href: '/kids',
    subCategories: [
      { name: 'T-shirts', key: 'tshirts', href: '/kids/tshirts' },
      { name: 'Shoes', key: 'shoes', href: '/kids/shoes' },
      { name: 'Shirts', key: 'shirts', href: '/kids/shirts' },
      { name: 'Bags', key: 'bags', href: '/kids/bags' },
      { name: 'Hoodies', key: 'hoodies', href: '/kids/hoodies' },
      { name: 'Hats', key: 'hats', href: '/kids/hats' },
      { name: 'Jeans', key: 'jeans', href: '/kids/jeans' },
      { name: 'Jewelry', key: 'jewelry', href: '/kids/jewelry' },
      { name: 'Sweaters', key: 'sweaters', href: '/kids/sweaters' },
      { name: 'Sunglasses', key: 'sunglasses', href: '/kids/sunglasses' },
      { name: 'Coats & Jackets', key: 'coats-jackets', href: '/kids/coats-jackets' },
      { name: 'Big & Tall', key: 'big-tall', href: '/kids/big-tall' },
    ],
    featured: [
      { name: 'Wardrobe essentials', key: 'wardrobe-essentials', href: '/kids/wardrobe-essentials' },
      { name: 'Denim everything', key: 'denim-everything', href: '/kids/denim' },
      { name: 'Lifestyle sneakers', key: 'lifestyle-sneakers', href: '/kids/sneakers' },
      { name: 'Office wear', key: 'office-wear', href: '/kids/office-wear' },
      { name: 'Gym gear', key: 'gym-gear', href: '/kids/gym-gear' },
      { name: 'See all kids\'', key: 'see-all-kids', href: '/kids' },
    ],
    styles: [],
  },
  {
    name: 'Sports',
    key: 'sports',
    href: '/sports',
    subCategories: [
      { name: 'Jerseys', key: 'jerseys', href: '/sports/jerseys' },
      { name: 'Sneakers', key: 'sneakers', href: '/sports/sneakers' },
      { name: 'Sweatpants', key: 'sweatpants', href: '/sports/sweatpants' },
      { name: 'Sweatshirts', key: 'sweatshirts', href: '/sports/sweatshirts' },
      { name: 'Tracksuits', key: 'tracksuits', href: '/sports/tracksuits' },
      { name: 'Hats', key: 'hats', href: '/sports/hats' },
      { name: 'Scarves', key: 'scarves', href: '/sports/scarves' },
      { name: 'Cleats', key: 'cleats', href: '/sports/cleats' },
    ],
    featured: [
      { name: 'Shop vintage', key: 'shop-vintage', href: '/sports/vintage' },
      { name: 'Shop by league', key: 'shop-by-league', href: '/sports/league' },
      { name: 'Vintage jerseys', key: 'vintage-jerseys', href: '/sports/vintage-jerseys' },
      { name: 'NFL', key: 'nfl', href: '/sports/nfl' },
      { name: 'Vintage sneakers', key: 'vintage-sneakers', href: '/sports/vintage-sneakers' },
      { name: 'NHL', key: 'nhl', href: '/sports/nhl' },
      { name: 'Vintage sweatpants', key: 'vintage-sweatpants', href: '/sports/vintage-sweatpants' },
      { name: 'NBA', key: 'nba', href: '/sports/nba' },
      { name: 'Vintage sweatshirts', key: 'vintage-sweatshirts', href: '/sports/vintage-sweatshirts' },
      { name: 'MLB', key: 'mlb', href: '/sports/mlb' },
      { name: 'Vintage tracksuits', key: 'vintage-tracksuits', href: '/sports/vintage-tracksuits' },
      { name: 'NCAA', key: 'ncaa', href: '/sports/ncaa' },
      { name: 'Vintage hats', key: 'vintage-hats', href: '/sports/vintage-hats' },
      { name: 'Vintage scarves', key: 'vintage-scarves', href: '/sports/vintage-scarves' },
      { name: 'Vintage shorts', key: 'vintage-shorts', href: '/sports/vintage-shorts' },
      { name: 'See all sportswear', key: 'see-all-sportswear', href: '/sports' },
    ],
    styles: [],
  },
  {
    name: 'Brands',
    key: 'brands',
    href: '/brands',
    subCategories: [
      { name: 'Abercrombie & Fitch', key: 'abercrombie-fitch', href: '/brands/abercrombie-fitch' },
      { name: 'Free People', key: 'free-people', href: '/brands/free-people' },
      { name: 'Patagonia', key: 'patagonia', href: '/brands/patagonia' },
      { name: 'Adidas', key: 'adidas', href: '/brands/adidas' },
      { name: 'Harley Davidson', key: 'harley-davidson', href: '/brands/harley-davidson' },
      { name: 'Polo Ralph Lauren', key: 'polo-ralph-lauren', href: '/brands/polo-ralph-lauren' },
      { name: 'Brandy Melville', key: 'brandy-melville', href: '/brands/brandy-melville' },
      { name: 'Jordan', key: 'jordan', href: '/brands/jordan' },
      { name: 'Supreme', key: 'supreme', href: '/brands/supreme' },
      { name: 'Carhartt', key: 'carhartt', href: '/brands/carhartt' },
      { name: 'Lululemon', key: 'lululemon', href: '/brands/lululemon' },
      { name: 'The North Face', key: 'the-north-face', href: '/brands/the-north-face' },
      { name: 'Coach', key: 'coach', href: '/brands/coach' },
      { name: 'New Balance', key: 'new-balance', href: '/brands/new-balance' },
      { name: 'Urban Outfitters', key: 'urban-outfitters', href: '/brands/urban-outfitters' },
      { name: 'Dickies', key: 'dickies', href: '/brands/dickies' },
      { name: 'Nike', key: 'nike', href: '/brands/nike' },
      { name: 'Zara', key: 'zara', href: '/brands/zara' },
    ],
    featured: [
      { name: 'See all brands', key: 'see-all-brands', href: '/brands' },
    ],
    styles: [],
  },
  {
    name: 'Trending',
    key: 'trending',
    href: '/trending',
    subCategories: [
      { name: 'Trending in women\'s', key: 'trending-womens', href: '/trending/womens' },
      { name: 'Trending in men\'s', key: 'trending-mens', href: '/trending/mens' },
      { name: 'Trending items', key: 'trending-items', href: '/trending/items' },
      { name: 'Boots weather', key: 'boots-weather', href: '/trending/boots-weather' },
      { name: 'Black tie', key: 'black-tie', href: '/trending/black-tie' },
      { name: 'Barn jackets', key: 'barn-jackets', href: '/trending/barn-jackets' },
      { name: 'Outerwear season', key: 'outerwear-season', href: '/trending/outerwear-season' },
      { name: 'Cardigans', key: 'cardigans', href: '/trending/cardigans' },
      { name: 'Party fits', key: 'party-fits', href: '/trending/party-fits' },
      { name: 'Festive knits', key: 'festive-knits', href: '/trending/festive-knits' },
      { name: 'The bridal edit', key: 'bridal-edit', href: '/trending/bridal-edit' },
      { name: 'Henley tops', key: 'henley-tops', href: '/trending/henley-tops' },
      { name: 'Wedding guests', key: 'wedding-guests', href: '/trending/wedding-guests' },
      { name: 'Knee high boots', key: 'knee-high-boots', href: '/trending/knee-high-boots' },
      { name: 'Sherpa jackets', key: 'sherpa-jackets', href: '/trending/sherpa-jackets' },
      { name: 'Pea coats', key: 'pea-coats', href: '/trending/pea-coats' },
    ],
    featured: [
      { name: 'See our Fall/Winter trends', key: 'fall-winter-trends', href: '/trending/fall-winter' },
    ],
    styles: [],
  },
  {
    name: 'Sale',
    key: 'sale',
    href: '/sale',
    subCategories: [
      { name: 'Women\'s sale', key: 'womens-sale', href: '/sale/womens' },
      { name: 'Men\'s sale', key: 'mens-sale', href: '/sale/mens' },
      { name: 'Tops', key: 'tops', href: '/sale/tops' },
      { name: 'T-shirts', key: 'tshirts', href: '/sale/tshirts' },
      { name: 'Sweaters', key: 'sweaters', href: '/sale/sweaters' },
      { name: 'Bottoms', key: 'bottoms', href: '/sale/bottoms' },
      { name: 'Bags & Purses', key: 'bags-purses', href: '/sale/bags-purses' },
      { name: 'Windbreakers', key: 'windbreakers', href: '/sale/windbreakers' },
      { name: 'Dresses', key: 'dresses', href: '/sale/dresses' },
      { name: 'Casual pants', key: 'casual-pants', href: '/sale/casual-pants' },
      { name: 'Skirts', key: 'skirts', href: '/sale/skirts' },
      { name: 'Coats & Jackets', key: 'coats-jackets', href: '/sale/coats-jackets' },
      { name: 'Leather jackets', key: 'leather-jackets', href: '/sale/leather-jackets' },
      { name: 'Shoes', key: 'shoes', href: '/sale/shoes' },
      { name: 'Sneakers', key: 'sneakers', href: '/sale/sneakers' },
      { name: 'Accessories', key: 'accessories', href: '/sale/accessories' },
      { name: 'Boots', key: 'boots', href: '/sale/boots' },
      { name: 'Jeans', key: 'jeans', href: '/sale/jeans' },
    ],
    featured: [
      { name: 'See all women\'s sale', key: 'see-all-womens-sale', href: '/sale/womens' },
      { name: 'See all men\'s sale', key: 'see-all-mens-sale', href: '/sale/mens' },
    ],
    styles: [],
  },
];

