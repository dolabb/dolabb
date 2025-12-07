'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { formatPrice } from '@/utils/formatPrice';

interface ProductCardProps {
  id?: string;
  image: string;
  title: string;
  price: number;
  seller: string;
  isLiked?: boolean;
  locale?: string;
  priority?: boolean;
  currency?: string;
}

export default function ProductCard({
  id,
  image,
  title,
  price,
  seller,
  isLiked = false,
  locale = 'en',
  priority = false,
  currency,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const isRTL = locale === 'ar';

  // Handle empty or invalid image URLs
  const hasValidImage =
    image && image.trim() !== '' && image !== 'undefined' && image !== 'null';

  const productUrl = id ? `/${locale}/product/${id}` : '#';

  // Clean and normalize image URL
  // Convert cdn.dolabb.com URLs to use Next.js proxy to bypass SSL issues
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    if (trimmed.includes('cdn.dolabb.com')) {
      try {
        // Extract the path after cdn.dolabb.com
        const urlObj = new URL(trimmed);
        const path = urlObj.pathname + urlObj.search;
        // Use Next.js proxy route - remove leading slash if present to avoid double slashes
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `/api/cdn${cleanPath}`;
      } catch (error) {
        // If URL parsing fails, try simple string replacement
        const path = trimmed.replace('https://cdn.dolabb.com', '').replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return trimmed;
  };

  const normalizedImage = hasValidImage ? normalizeImageUrl(image) : '';

  // Determine if image should be unoptimized
  // Always unoptimize cdn.dolabb.com images to avoid Next.js optimization issues
  const shouldUnoptimize =
    !hasValidImage ||
    imageError ||
    normalizedImage?.includes('unsplash.com') ||
    normalizedImage?.includes('cloudinary.com') ||
    normalizedImage?.includes('onrender.com') ||
    normalizedImage?.includes('cdn.dolabb.com');

  return (
    <Link
      href={productUrl}
      className='group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer block'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Image Container */}
      <div className='relative aspect-square overflow-hidden bg-rich-sand'>
        {hasValidImage && !imageError ? (
          // Use regular img tag for proxied cdn.dolabb.com images due to SSL certificate issues
          normalizedImage?.startsWith('/api/cdn') ? (
            <img
              src={normalizedImage}
              alt={title || 'Product image'}
              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              onError={() => {
                console.error('Image failed to load:', normalizedImage);
                setImageError(true);
              }}
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            <Image
              src={normalizedImage}
              alt={title || 'Product image'}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className='object-cover group-hover:scale-105 transition-transform duration-300'
              onError={() => {
                console.error('Image failed to load:', normalizedImage);
                setImageError(true);
              }}
              unoptimized={shouldUnoptimize}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
          )
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-rich-sand to-saudi-green/10'>
            <span className='text-deep-charcoal/40 text-xs text-center px-2 line-clamp-2'>
              {title || 'No Image'}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className='p-4'>
        <h3 className='font-semibold text-deep-charcoal mb-1 line-clamp-2 group-hover:text-saudi-green transition-colors text-sm md:text-base'>
          {title}
        </h3>
        <p className='text-xs md:text-sm text-deep-charcoal/70 mb-2 font-medium'>
          {seller}
        </p>
        <p className='text-base md:text-lg font-bold text-saudi-green font-display'>
          {formatPrice(price, locale, 2, currency)}
        </p>
      </div>
    </Link>
  );
}
