'use client';

import { navigationCategories, StyleCategory } from '@/data/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { gsap } from 'gsap';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import {
  HiClock,
  HiHome,
  HiShoppingBag,
  HiSparkles,
  HiTag,
  HiUser,
  HiUserGroup,
  HiChatBubbleLeftRight,
} from 'react-icons/hi2';

// Style Image Component with error handling
const StyleImage = ({
  style,
  className = '',
}: {
  style: StyleCategory;
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  const imageSrc = imageError
    ? `https://via.placeholder.com/300/006747/FFFFFF?text=${encodeURIComponent(
        style.name
      )}`
    : style.image;

  return (
    <Image
      src={imageSrc}
      alt={style.name}
      fill
      className={`object-cover transition-transform duration-300 ${className}`}
      onError={() => setImageError(true)}
      unoptimized={style.image.includes('unsplash.com') || imageError}
    />
  );
};

// Category icon mapping
const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  women: HiUserGroup,
  men: HiUser,
  watches: HiClock,
  jewellery: HiSparkles,
  accessories: HiTag,
};

export default function NavigationBar() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const user = useAppSelector(state => state.auth.user);
  const isSeller = user?.role === 'seller';
  const isRTL = locale === 'ar';
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [, setHoveredCategory] = useState<string | null>(null);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is affiliate
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const affiliate = localStorage.getItem('affiliate');
      const affiliateToken = localStorage.getItem('affiliate_token');
      setIsAffiliate(!!(affiliate && affiliateToken));
    }
  }, []);

  // Helper function to safely get translations with fallback
  const safeTranslate = (key: string, fallback: string): string => {
    try {
      const translated = t(key);
      return translated && translated !== key ? translated : fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setActiveCategory(null);
        setHoveredCategory(null);
      }, 200);
    };

    const dropdown = dropdownRef.current;
    if (dropdown) {
      dropdown.addEventListener('mouseenter', () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      });
      dropdown.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (dropdown) {
        dropdown.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const displayedCategory = clickedCategory || activeCategory;

  useEffect(() => {
    if (typeof window === 'undefined' || !dropdownRef.current) return;

    const dropdown = dropdownRef.current;
    const isVisible = displayedCategory !== null;

    if (isVisible) {
      // Set display to block immediately before animation
      dropdown.style.display = 'block';

      gsap.fromTo(
        dropdown,
        {
          opacity: 0,
          y: -20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        }
      );

      const children = dropdown.querySelectorAll('.dropdown-item');
      gsap.fromTo(
        children,
        {
          opacity: 0,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.1,
        }
      );
    } else {
      gsap.to(dropdown, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          if (dropdown) {
            dropdown.style.display = 'none';
          }
        },
      });
    }
  }, [clickedCategory, activeCategory, displayedCategory]);

  const handleCategoryEnter = (categoryKey: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredCategory(categoryKey);
    setActiveCategory(categoryKey);
  };

  const handleCategoryLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!clickedCategory) {
      timeoutRef.current = setTimeout(() => {
        setActiveCategory(null);
        setHoveredCategory(null);
      }, 200);
    }
  };

  const handleCategoryClick = (categoryKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (clickedCategory === categoryKey) {
      setClickedCategory(null);
      setActiveCategory(null);
    } else {
      setClickedCategory(categoryKey);
      setActiveCategory(categoryKey);
    }
  };

  const handleCloseDropdown = () => {
    setClickedCategory(null);
    setActiveCategory(null);
    setHoveredCategory(null);
  };

  const activeCategoryData = navigationCategories.find(
    cat => cat.key === displayedCategory
  );

  // User Navigation Items (for authenticated users)
  const userNavItems = [
    {
      key: 'home',
      href: `/${locale}`,
      icon: HiHome,
      label: locale === 'en' ? 'Home' : 'الرئيسية',
    },
    {
      key: 'my-store',
      href: `/${locale}/my-store`,
      icon: HiShoppingBag,
      label: locale === 'en' ? 'My Store' : 'متجري',
    },
    {
      key: 'profile',
      href: `/${locale}/profile`,
      icon: HiUser,
      label: locale === 'en' ? 'Profile' : 'الملف الشخصي',
    },
    {
      key: isSeller ? 'seller' : 'buyer',
      href: `/${locale}/buyer`,
      icon: HiTag,
      label: isSeller
        ? locale === 'en'
          ? 'Offers'
          : 'العروض'
        : locale === 'en'
        ? 'Buyer'
        : 'المشتري',
    },
    // Show Disputes link only for buyers
    ...(!isSeller
      ? [
          {
            key: 'disputes',
            href: `/${locale}/disputes`,
            icon: HiChatBubbleLeftRight,
            label: locale === 'en' ? 'Disputes' : 'النزاعات',
          },
        ]
      : []),
  ];

  // If affiliate, don't show navigation bar
  if (isAffiliate) {
    return null;
  }

  // Don't show navigation bar on messages route
  if (pathname?.includes('/messages')) {
    return null;
  }

  // If authenticated, show user navigation
  if (isAuthenticated) {
    return (
      <nav
        className='bg-white border-b border-rich-sand/30 sticky z-40 top-[calc(4rem+3.5rem)] md:top-20 shadow-sm'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-8'>
          {/* Mobile: Optimized for small screens */}
          <div className='flex md:hidden items-center justify-center gap-3 sm:gap-4 h-16 overflow-x-auto scrollbar-hide'>
            {userNavItems.map(item => {
              // For home route, only match exact pathname, not sub-routes
              const isActive =
                item.key === 'home'
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-1 px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px] transition-all duration-300 ${
                    isActive
                      ? 'text-saudi-green'
                      : 'text-deep-charcoal/70 active:text-saudi-green'
                  }`}
                >
                  <span className='font-display text-xs sm:text-sm font-semibold leading-tight text-center whitespace-nowrap'>
                    {item.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-saudi-green rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-full max-w-[60px] sm:max-w-[70px] opacity-100 shadow-md shadow-saudi-green/50'
                        : 'w-0 opacity-0'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Desktop: Centered, no scroll */}
          <div className='hidden md:flex items-center justify-center gap-6 lg:gap-8 h-14'>
            {userNavItems.map(item => {
              // For home route, only match exact pathname, not sub-routes
              const isActive =
                item.key === 'home'
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-4 py-2 font-medium text-sm transition-all duration-300 ${
                    isActive
                      ? 'text-saudi-green'
                      : 'text-deep-charcoal/70 hover:text-saudi-green'
                  }`}
                >
                  <span className='font-display whitespace-nowrap'>
                    {item.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-saudi-green rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-12 opacity-100 shadow-lg shadow-saudi-green/50'
                        : 'w-0 opacity-0'
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  // If not authenticated, don't show the old category navigation bar
  // Categories are now shown in the CategoriesSection component on the home page
  return null;
}
