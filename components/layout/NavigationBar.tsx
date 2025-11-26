'use client';

import { useAuth } from '@/contexts/AuthContext';
import { navigationCategories, StyleCategory } from '@/data/navigation';
import { gsap } from 'gsap';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import {
  HiClock,
  HiHome,
  HiShoppingBag,
  HiSparkles,
  HiTag,
  HiUser,
  HiUserGroup,
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
  const { isAuthenticated } = useAuth();
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
      gsap.fromTo(
        dropdown,
        {
          opacity: 0,
          y: -20,
          display: 'block',
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
      key: 'buyer',
      href: `/${locale}/buyer`,
      icon: HiTag,
      label: isSeller 
        ? (locale === 'en' ? 'Offers' : 'العروض')
        : (locale === 'en' ? 'Buyer' : 'المشتري'),
    },
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
          <div className='flex md:hidden items-center justify-center gap-2 sm:gap-3 h-14 overflow-x-auto scrollbar-hide'>
            {userNavItems.map(item => {
              const IconComponent = item.icon;
              // For home route, only match exact pathname, not sub-routes
              const isActive =
                item.key === 'home'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-1.5 min-w-[60px] sm:min-w-[70px] transition-all duration-300 ${
                    isActive
                      ? 'text-saudi-green'
                      : 'text-deep-charcoal/70 active:text-saudi-green'
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  <span className='font-display text-[10px] sm:text-xs font-medium leading-tight text-center'>
                    {item.label}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-saudi-green rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-full max-w-[50px] sm:max-w-[60px] opacity-100 shadow-md shadow-saudi-green/50'
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
              const IconComponent = item.icon;
              // For home route, only match exact pathname, not sub-routes
              const isActive =
                item.key === 'home'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');

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
                  <IconComponent
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110' : ''
                    }`}
                  />
                  <span className='font-display'>{item.label}</span>
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

  // If not authenticated, show category navigation
  return (
    <nav
      className='bg-white border-b border-rich-sand/30 sticky z-40 top-[calc(4rem+3.5rem)] md:top-20'
      dir={isRTL ? 'rtl' : 'ltr'}
      onMouseLeave={handleCategoryLeave}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center justify-center gap-8 h-14'>
          {navigationCategories.map(category => {
            const isActive =
              clickedCategory === category.key ||
              activeCategory === category.key;
            const IconComponent = categoryIcons[category.key];
            return (
              <div key={category.key} className='relative'>
                <button
                  onClick={e => handleCategoryClick(category.key, e)}
                  className={`relative px-3 py-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'text-saudi-green'
                      : 'text-deep-charcoal/70 hover:text-saudi-green'
                  }`}
                  onMouseEnter={() => handleCategoryEnter(category.key)}
                >
                  {IconComponent && (
                    <IconComponent
                      className={`w-4 h-4 transition-transform ${
                        isActive ? 'scale-110' : ''
                      }`}
                    />
                  )}
                  <span className='font-display'>
                    {t(category.key) || category.name}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-saudi-green rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-12 opacity-100 shadow-lg shadow-saudi-green/50'
                        : 'w-0 opacity-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Mobile Navigation - Categories Bar */}
        <div className='md:hidden'>
          <div className='flex items-center gap-2 sm:gap-3 h-14 overflow-x-auto scrollbar-hide px-2'>
            {navigationCategories.map(category => {
              const isActive =
                clickedCategory === category.key ||
                activeCategory === category.key;
              const IconComponent = categoryIcons[category.key];
              return (
                <button
                  key={category.key}
                  onClick={e => handleCategoryClick(category.key, e)}
                  className={`relative flex flex-col items-center justify-center gap-1 px-2 sm:px-3 py-1.5 min-w-[60px] sm:min-w-[70px] transition-all duration-300 flex-shrink-0 ${
                    isActive
                      ? 'text-saudi-green'
                      : 'text-deep-charcoal/70 active:text-saudi-green'
                  }`}
                >
                  {IconComponent && (
                    <IconComponent
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                        isActive ? 'scale-110' : ''
                      }`}
                    />
                  )}
                  <span className='font-display text-[10px] sm:text-xs font-medium leading-tight text-center whitespace-nowrap'>
                    {t(category.key) || category.name}
                  </span>
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-saudi-green rounded-full transition-all duration-300 ${
                      isActive
                        ? 'w-full max-w-[50px] sm:max-w-[60px] opacity-100 shadow-md shadow-saudi-green/50'
                        : 'w-0 opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {activeCategoryData && (
        <div
          ref={dropdownRef}
          className='absolute top-full left-0 right-0 bg-white border-t border-rich-sand/30 shadow-lg z-30'
          style={{ display: 'none' }}
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
          }}
          onMouseLeave={handleCategoryLeave}
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {activeCategoryData.subCategories.length > 0 && (
                <div className='dropdown-item'>
                  <h3 className='font-bold text-deep-charcoal mb-4 text-lg'>
                    {t('shopByCategory') || 'Shop by category'}
                  </h3>
                  <div className='grid grid-cols-2 gap-2'>
                    {activeCategoryData.subCategories.map(subCat => (
                      <Link
                        key={subCat.key}
                        href={`/${locale}${subCat.href}`}
                        className='text-deep-charcoal/70 hover:text-saudi-green hover:font-medium transition-all duration-200 text-sm py-1.5 px-2 rounded hover:bg-saudi-green/5'
                        onClick={handleCloseDropdown}
                      >
                        {safeTranslate(
                          `${activeCategoryData.key}Sub.${subCat.key}`,
                          subCat.name
                        )}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/${locale}${activeCategoryData.href}`}
                    className='mt-4 inline-block w-full text-sm text-saudi-green underline underline-offset-2 hover:underline-offset-4 transition-all duration-200'
                    onClick={handleCloseDropdown}
                  >
                    {t('seeAll') || 'See all'} {activeCategoryData.name}
                  </Link>
                </div>
              )}

              {activeCategoryData.featured.length > 0 && (
                <div className='dropdown-item'>
                  <h3 className='font-bold text-deep-charcoal mb-4 text-lg'>
                    {t('featured') || 'Featured'}
                  </h3>
                  <div className='grid grid-cols-2 text-nowrap gap-3'>
                    {activeCategoryData.featured.map(item => {
                      const translationKey = `${activeCategoryData.key}Sub.featured.${item.key}`;
                      const displayName = safeTranslate(
                        translationKey,
                        item.name
                      );
                      return (
                        <Link
                          key={item.key}
                          href={`/${locale}${item.href}`}
                          className='text-deep-charcoal/70 hover:text-saudi-green hover:font-medium transition-all duration-200 text-sm py-1.5 px-2 rounded hover:bg-saudi-green/5'
                          onClick={handleCloseDropdown}
                        >
                          {displayName}
                        </Link>
                      );
                    })}
                  </div>
                  <Link
                    href={`/${locale}${activeCategoryData.href}`}
                    className='mt-4 inline-block w-full text-sm text-saudi-green underline underline-offset-2 hover:underline-offset-4 transition-all duration-200'
                    onClick={handleCloseDropdown}
                  >
                    {t('seeAll') || 'See all'} {activeCategoryData.name}
                  </Link>
                </div>
              )}

              {activeCategoryData.styles.length > 0 && (
                <div className='dropdown-item'>
                  <h3 className='font-bold text-deep-charcoal mb-4 text-lg'>
                    {t('styles') || 'Styles'}
                  </h3>
                  <div className='grid grid-cols-2 gap-3'>
                    {activeCategoryData.styles.map(style => (
                      <Link
                        key={style.key}
                        href={`/${locale}${style.href}`}
                        className='group relative aspect-square overflow-hidden rounded-lg'
                        onClick={handleCloseDropdown}
                      >
                        <StyleImage
                          style={style}
                          className='group-hover:scale-105'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-deep-charcoal/70 to-transparent' />
                        <span className='absolute bottom-2 left-2 right-2 text-white font-semibold text-sm text-center'>
                          {safeTranslate(
                            `${activeCategoryData.key}Sub.styles.${style.key}`,
                            style.name
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href={`/${locale}${activeCategoryData.href}`}
                    className='mt-4 inline-flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm shadow-md hover:shadow-lg'
                    onClick={handleCloseDropdown}
                  >
                    {t('seeAll') || 'See all'} {activeCategoryData.name}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
