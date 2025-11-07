# Depop Clone - Fashion Marketplace

A modern, responsive clone of the Depop fashion marketplace built with Next.js, featuring bilingual support (English and Arabic), advanced filtering, pagination, and a beautiful UI with custom theme colors.

![Depop Clone](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### Core Features
- 🎨 **Custom Theme Colors**: Saudi Green, Rich Sand, Deep Charcoal, Off White, Desert Gold, Coral Red, and Royal Blue
- 🌍 **Bilingual Support**: Full English and Arabic support with RTL layout
- 📱 **Fully Responsive**: Mobile-first design optimized for all devices
- 🛍️ **Product Listings**: Dynamic product pages with filtering and pagination
- 🔍 **Advanced Filtering**: Filter by brand, category, price, size, color, and condition
- 📄 **Pagination**: 20 products per page with elegant pagination controls
- 🎯 **Category Navigation**: Dropdown menus with featured items and style images
- 🔐 **Authentication**: Signup (with phone number) and login pages
- 🎭 **Professional Icons**: React Icons throughout the application
- 🔤 **Custom Typography**: Google Fonts (Inter & Poppins)

### Product Features
- Product cards with like functionality
- Featured and trending product sections
- Category-based product browsing
- Popular brands quick selection
- Subcategory filtering with checkboxes
- Price range selection
- Size and color filtering
- Condition filter (new, like-new, good, fair)
- On-sale filter
- Multiple sort options (Relevance, Price, Newest)

### Navigation Features
- Sticky header with search bar
- Category navigation bar with animated dropdowns
- Mobile-responsive hamburger menu
- Breadcrumb navigation
- Language switcher

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AnasPirzada/dolabb.git
cd dolabb
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

The app will automatically redirect to `/en` for English or you can visit `/ar` for Arabic.

## 📁 Project Structure

```
dolabb/
├── app/
│   ├── [locale]/              # Locale-based routes
│   │   ├── [...slug]/         # Dynamic category/product pages
│   │   ├── login/             # Login page
│   │   ├── signup/            # Signup page with phone number
│   │   ├── layout.tsx         # Locale layout with i18n
│   │   └── page.tsx           # Homepage
│   ├── globals.css            # Global styles with custom colors
│   └── layout.tsx             # Root layout
├── components/
│   ├── Header.tsx             # Navigation header with search
│   ├── NavigationBar.tsx      # Category navigation with dropdowns
│   ├── Footer.tsx             # Footer component
│   ├── Hero.tsx               # Hero section
│   ├── ProductCard.tsx         # Product card component
│   ├── CategoryProductListing.tsx  # Product listing with filters
│   ├── Pagination.tsx         # Pagination component
│   └── sections/              # Section components
│       ├── CategoriesSection.tsx
│       ├── FeaturedProductsSection.tsx
│       └── TrendingProductsSection.tsx
├── data/
│   ├── categories.ts          # Category data with icons
│   ├── products.ts            # Product data
│   ├── categoryProducts.ts    # Category-specific products
│   ├── navigation.ts          # Navigation categories
│   └── countries.ts           # Country codes for phone numbers
├── messages/
│   ├── en.json               # English translations
│   └── ar.json               # Arabic translations
├── i18n.ts                   # i18n configuration
└── middleware.ts             # Next.js middleware for i18n
```

## 🎨 Color Palette

The project uses a custom color palette defined in `app/globals.css`:

- **Saudi Green**: `#006747` - Primary brand color
- **Rich Sand**: `#E8D4B0` - Borders and backgrounds
- **Deep Charcoal**: `#333333` - Text color
- **Off White**: `#F9F9F9` - Background color
- **Desert Gold**: `#FFD700` - Accent color
- **Coral Red**: `#FF6F61` - Error and favorites
- **Royal Blue**: `#0066CC` - Links and messages

## 🌐 Internationalization

The application supports two languages:
- **English** (`/en`) - Default language
- **Arabic** (`/ar`) - Full RTL support

Users can switch languages using the toggle button in the header. All UI elements, including navigation, forms, and content, automatically adapt to the selected language.

## 📱 Pages & Routes

### Public Pages
- `/` - Redirects to `/en`
- `/en` or `/ar` - Homepage
- `/en/login` or `/ar/login` - Login page
- `/en/signup` or `/ar/signup` - Signup page with phone number

### Category Pages
- `/en/women/wardrobe-essentials` - Category product listings
- `/en/men/tshirts` - Category product listings
- Dynamic routes support any category/subcategory combination

## 🔧 Technologies Used

- **Next.js 16**: React framework with App Router
- **TypeScript 5**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **GSAP**: Animation library for smooth transitions
- **next-intl**: Internationalization for Next.js
- **React Icons**: Professional icon library
- **Google Fonts**: Inter & Poppins typography

## 🎯 Key Features Explained

### Category Navigation
- Hover/click to open dropdown menus
- Shows featured items and style images
- GSAP animations for smooth transitions
- Mobile-responsive accordion menu

### Product Filtering
- Popular brands quick selection
- Subcategory checkboxes
- Price range slider
- Size and color filters
- Condition filter
- On-sale toggle
- Active filters display with remove option

### Pagination
- 20 products per page
- Arrow navigation
- Page numbers with ellipsis
- Theme-styled controls
- Smooth scroll to top on page change

### Authentication
- Signup with phone number (country code selector with flags)
- Traditional login with email/username
- Form validation
- Password visibility toggle
- Remember me functionality

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📝 Customization

### Adding New Categories
Edit `data/navigation.ts` to add new categories with subcategories, featured items, and styles.

### Adding Products
Edit `data/categoryProducts.ts` to add products for specific categories.

### Modifying Colors
Update the color variables in `app/globals.css` under the `@theme` section.

### Adding Translations
Edit `messages/en.json` and `messages/ar.json` to add or modify translations.

## 🌟 Features in Detail

### Custom Checkboxes & Radio Buttons
- Theme-styled form controls
- Saudi green for checked states
- Smooth transitions
- Accessible design

### Image Handling
- Next.js Image optimization
- Error handling with fallback placeholders
- Unsplash integration
- Responsive images

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly interactions
- Optimized for all screen sizes

## 📄 License

This is a clone project for educational purposes.

## 👨‍💻 Author

**Anas Pirzada**
- GitHub: [@AnasPirzada](https://github.com/AnasPirzada)

## 🙏 Acknowledgments

- Design inspired by Depop
- Icons from React Icons
- Images from Unsplash
- Fonts from Google Fonts

---

Made with ❤️ using Next.js and TypeScript
