'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  id?: string;
  image: string;
  title: string;
  price: number;
  seller: string;
  isLiked?: boolean;
  locale?: string;
}

export default function ProductCard({
  id,
  image,
  title,
  price,
  seller,
  isLiked = false,
  locale = 'en',
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const isRTL = locale === 'ar';

  // Handle empty or invalid image URLs
  const hasValidImage =
    image && image.trim() !== '' && image !== 'undefined' && image !== 'null';

  const productUrl = id ? `/${locale}/product/${id}` : '#';

  // Determine if image should be unoptimized
  const shouldUnoptimize =
    !hasValidImage ||
    imageError ||
    image?.includes('unsplash.com') ||
    image?.includes('cloudinary.com') ||
    image?.includes('onrender.com');

  return (
    <Link
      href={productUrl}
      className='group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer block'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Image Container */}
      <div className='relative aspect-square overflow-hidden bg-rich-sand'>
        {hasValidImage && !imageError ? (
          <Image
            src={image}
            alt={title || 'Product image'}
            fill
            className='object-cover group-hover:scale-105 transition-transform duration-300'
            onError={() => setImageError(true)}
            unoptimized={shouldUnoptimize}
            priority={false}
          />
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
          {locale === 'ar' ? 'ر.س' : 'SAR'} {price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
