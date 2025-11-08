# Project Folder Structure

This document explains the organized folder structure of the application.

## 📁 App Directory Structure

```
app/
└── [locale]/                    # Locale-based routing (en, ar)
    ├── layout.tsx              # Main layout (Header, Nav, Footer)
    ├── (home)/                 # Route group for home page
    │   └── page.tsx            # Home page
    ├── (auth)/                 # Route group for authentication pages
    │   ├── layout.tsx          # Auth layout (clean, centered design)
    │   ├── login/
    │   │   └── page.tsx        # Login page
    │   ├── signup/
    │   │   └── page.tsx        # Signup page
    │   ├── forgot-password/
    │   │   └── page.tsx        # Forgot password page
    │   └── reset-password/
    │       └── page.tsx        # Reset password page
    └── (shop)/                 # Route group for shop/category pages
        ├── layout.tsx          # Shop layout
        └── [...slug]/
            └── page.tsx        # Dynamic category/product pages
```

### Route Groups
- `(home)`, `(auth)`, `(shop)` are route groups in Next.js
- They organize pages without affecting the URL structure
- Each can have its own layout

## 📦 Components Directory Structure

```
components/
├── layout/                     # Layout components (used across the app)
│   ├── Header.tsx             # Main header
│   ├── Footer.tsx              # Main footer
│   └── NavigationBar.tsx      # Navigation bar
├── home/                      # Home page components
│   ├── Hero.tsx               # Hero section
│   ├── CategoriesSection.tsx  # Categories section
│   ├── FeaturedProductsSection.tsx
│   └── TrendingProductsSection.tsx
├── shop/                      # Shop/category components
│   └── CategoryProductListing.tsx
├── auth/                      # Authentication components (future)
│   └── (auth-specific components)
└── shared/                    # Shared/reusable components
    ├── ProductCard.tsx        # Product card component
    └── Pagination.tsx         # Pagination component
```

## 📂 Other Directories

```
data/                          # Data files and mock data
├── categories.ts
├── categoryProducts.ts
├── countries.ts
├── navigation.ts
└── products.ts

messages/                      # i18n translation files
├── en.json
└── ar.json

hooks/                         # Custom React hooks
├── useScrollTrigger.ts
└── useSmoothScroll.ts

utils/                         # Utility functions
└── animations.ts
```

## 🎯 Key Principles

1. **Route Groups**: Use parentheses `()` for organizing pages without affecting URLs
2. **Feature-based Components**: Components are organized by feature/domain
3. **Shared Components**: Reusable components go in `shared/`
4. **Layout Components**: Global layout components in `layout/`
5. **Page-specific Components**: Components used by specific pages are in their domain folder

## 📝 Adding New Pages

### Adding a new auth page:
1. Create `app/[locale]/(auth)/your-page/page.tsx`
2. It will automatically use the auth layout

### Adding a new shop page:
1. Create `app/[locale]/(shop)/your-page/page.tsx`
2. It will automatically use the shop layout

### Adding a new component:
- **Layout component**: `components/layout/`
- **Home component**: `components/home/`
- **Shop component**: `components/shop/`
- **Shared component**: `components/shared/`

## 🔄 Import Paths

All imports use the `@/` alias:
- `@/components/layout/Header`
- `@/components/home/Hero`
- `@/components/shop/CategoryProductListing`
- `@/components/shared/ProductCard`
- `@/data/products`
- `@/messages/en`

