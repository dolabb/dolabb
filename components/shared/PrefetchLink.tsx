'use client';

import Link from 'next/link';
import { useCallback, ReactNode } from 'react';
import { usePrefetch } from '@/hooks/usePrefetch';

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetchType?: 'home' | 'browse' | 'category' | 'product';
  prefetchId?: string; // For product or category prefetch
  onClick?: () => void;
}

/**
 * Link component that prefetches data on hover for instant navigation
 */
export default function PrefetchLink({
  href,
  children,
  className,
  prefetchType,
  prefetchId,
  onClick,
}: PrefetchLinkProps) {
  const prefetch = usePrefetch();

  const handleMouseEnter = useCallback(() => {
    switch (prefetchType) {
      case 'home':
        prefetch.home();
        break;
      case 'browse':
        prefetch.browse();
        break;
      case 'category':
        if (prefetchId) prefetch.category(prefetchId);
        break;
      case 'product':
        if (prefetchId) prefetch.product(prefetchId);
        break;
      default:
        // Auto-detect based on href
        if (href === '/' || href.endsWith('/home')) {
          prefetch.home();
        } else if (href.includes('/browse') || href.includes('/products')) {
          prefetch.browse();
        } else if (href.includes('/category/')) {
          const categoryKey = href.split('/category/')[1]?.split('/')[0];
          if (categoryKey) prefetch.category(categoryKey);
        } else if (href.includes('/product/')) {
          const productId = href.split('/product/')[1]?.split('/')[0];
          if (productId) prefetch.product(productId);
        }
    }
  }, [prefetch, prefetchType, prefetchId, href]);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
