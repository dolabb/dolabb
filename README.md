# Dolabb - Marketplace Platform

A modern, full-featured marketplace platform built with Next.js, supporting
multi-language (English/Arabic), user authentication, product listings, shopping
cart, offers, messaging, and affiliate system.

## 🚀 Features

### Core Features

- **Multi-language Support**: Full RTL/LTR support for English and Arabic
- **User Authentication**: Signup, login, OTP verification, password reset
- **Product Management**: Browse, search, filter, and view product details
- **Shopping Cart**: Add to cart, checkout, and payment processing
- **Offers System**: Buyers can make offers, sellers can accept/reject/counter
- **Messaging**: Real-time messaging between buyers and sellers
- **Affiliate System**: Separate affiliate dashboard and authentication
- **Dynamic Hero Section**: Configurable hero section via API
- **Responsive Design**: Mobile-first, fully responsive UI

### User Roles

- **Buyers**: Browse products, make offers, purchase items, manage orders
- **Sellers**: List products, manage inventory, respond to offers, track sales
- **Affiliates**: Access affiliate dashboard and track performance

## 🛠️ Tech Stack

### Frontend

- **Next.js 16.0.1** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Redux Toolkit** - State management
- **RTK Query** - API data fetching
- **next-intl** - Internationalization
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **Chart.js** - Data visualization

### Key Libraries

- `react-redux` - Redux bindings
- `nextjs-toast-notify` - Toast notifications
- `react-icons` - Icon library
- `gsap` - Animation library

## 📁 Project Structure

```
dolabb/
├── app/
│   ├── [locale]/              # Internationalized routes
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # User dashboard pages
│   │   ├── (home)/            # Home page
│   │   ├── (shop)/            # Shop pages
│   │   └── affiliate/         # Affiliate pages
│   └── globals.css            # Global styles
├── components/
│   ├── dashboard/             # Dashboard components
│   ├── home/                  # Home page components
│   ├── layout/                # Layout components
│   ├── payment/               # Payment components
│   ├── shared/                # Shared components
│   └── shop/                  # Shop components
├── lib/
│   ├── api/                   # API endpoints (RTK Query)
│   └── store/                 # Redux store configuration
├── messages/                  # Translation files
│   ├── en.json
│   └── ar.json
├── public/                    # Static assets
├── types/                     # TypeScript type definitions
├── utils/                     # Utility functions
└── hooks/                     # Custom React hooks
```

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AnasPirzada/dolabb.git
   cd dolabb
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables** Create a `.env.local` file in the root
   directory:

   ```env
   NEXT_PUBLIC_API_URL=your_api_url_here
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser** Navigate to
   [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint


## 🎨 Styling

The application uses Tailwind CSS with custom color palette:

- `saudi-green`: #006747
- `rich-sand`: #E8D4B0
- `deep-charcoal`: #333333
- `off-white`: #F9F9F9
- `desert-gold`: #FFD700
- `coral-red`: #FF6F61
- `royal-blue`: #0066CC

## 📱 Responsive Design

The application is fully responsive and optimized for:

- Mobile devices
- Tablets
- Desktop screens

## 🔄 State Management

State is managed using Redux Toolkit with:

- **Auth Slice**: User authentication state
- **Cart Slice**: Shopping cart state
- **RTK Query**: API data fetching and caching

## 🌍 Deployment

### Recommended Platforms

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **DigitalOcean App Platform**

### Build for Production

```bash
npm run build
npm run start
```

## 📄 License

This project is private and proprietary.

## 👥 Contributors

- Anas Pirzada

## 📞 Support

For support and inquiries, please contact the development team.

---

**Note**: This is a private project. Ensure all environment variables and API
endpoints are properly configured before deployment.
