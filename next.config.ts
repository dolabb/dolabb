import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dolabb-backend-2vsj.onrender.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.dolabb.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dolabb.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.dolabb.com',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
  // Optimize for production
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
