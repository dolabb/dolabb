'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { HiHeart } from 'react-icons/hi2';
import { FaHeart } from 'react-icons/fa';

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
  const [liked, setLiked] = useState(isLiked);
  const [imageError, setImageError] = useState(false);
  const isRTL = locale === 'ar';
  
  const imageSrc = imageError 
    ? `https://via.placeholder.com/500/006747/FFFFFF?text=${encodeURIComponent(title)}`
    : image;

  const productUrl = id ? `/${locale}/product/${id}` : '#';

  return (
    <Link
      href={productUrl}
      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer block"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-rich-sand">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
          unoptimized={image.includes('unsplash.com') || imageError}
        />
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked(!liked);
          }}
          className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-2 rounded-full bg-white/90 backdrop-blur-sm transition-all hover:bg-white hover:scale-110 z-10 cursor-pointer ${
            liked ? 'text-coral-red' : 'text-deep-charcoal/70'
          }`}
          aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
        >
          {liked ? (
            <FaHeart className="w-5 h-5 fill-current" />
          ) : (
            <HiHeart className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-deep-charcoal mb-1 line-clamp-2 group-hover:text-saudi-green transition-colors text-sm md:text-base">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-deep-charcoal/70 mb-2 font-medium">{seller}</p>
        <p className="text-base md:text-lg font-bold text-saudi-green font-display">
          {locale === 'ar' ? 'ر.س' : 'SAR'} {price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}

