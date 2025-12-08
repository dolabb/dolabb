'use client';

import { navigationCategories, StyleCategory, SubCategory, FeaturedItem, NavigationCategory } from '@/data/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';

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

export default function CategoriesSection() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [mobileOpenCategory, setMobileOpenCategory] = useState<string | null>(
    null
  );
  const [mounted, setMounted] = useState(typeof window !== 'undefined');
  const isRTL = locale === 'ar';

  // Helper function to safely get translations with fallback
  const safeTranslate = (key: string, fallback: string): string => {
    try {
      const translated = t(key);
      return translated && translated !== key ? translated : fallback;
    } catch {
      return fallback;
    }
  };

  // Close mobile drawer when clicking outside
  useEffect(() => {
    if (mobileOpenCategory) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
          !target.closest('.category-drawer') &&
          !target.closest('.category-trigger')
        ) {
          setMobileOpenCategory(null);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileOpenCategory]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpenCategory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpenCategory]);

  const handleCategoryClick = (e: React.MouseEvent, categoryKey: string) => {
    // Only handle click on mobile, prevent default link behavior
    if (window.innerWidth < 768) {
      e.preventDefault();
      setMobileOpenCategory(categoryKey);
    }
  };

  const selectedCategory = navigationCategories.find(
    cat => cat.key === mobileOpenCategory
  );

  return (
    <section className='py-16 bg-gradient-to-b from-white to-rich-sand/10'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold text-deep-charcoal mb-3 font-display'>
            {t('shopByCategory') || 'Shop by Category'}
          </h2>
          <p className='text-deep-charcoal/60 text-lg max-w-2xl mx-auto'>
            Discover our curated collections designed for every style and
            occasion
          </p>
        </div>

        {/* Mobile: Enhanced Grid Cards */}
        <div className='grid grid-cols-2 md:hidden gap-3 mb-8'>
          {navigationCategories.map(category => {
            return (
              <div
                key={category.key}
                className='relative group category-trigger'
              >
                <Link
                  href={`/${locale}${category.href}`}
                  onClick={e => handleCategoryClick(e, category.key)}
                  className='block cursor-pointer bg-white hover:bg-saudi-green/5 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-lg border border-rich-sand/20 hover:border-saudi-green/30'
                >
                  <h3 className='font-bold text-deep-charcoal group-hover:text-saudi-green transition-colors font-display text-base'>
                    {t(category.key) || category.name}
                  </h3>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Desktop: Enhanced Category Navigation */}
        <div className='hidden md:flex items-center justify-center gap-6 mb-4'>
          {navigationCategories.map(category => {
            const isOpen = openCategory === category.key;
            const hasContent =
              category.subCategories.length > 0 ||
              category.featured.length > 0 ||
              category.styles.length > 0;

            return (
              <CategoryDropdownWrapper
                key={category.key}
                category={category}
                isOpen={isOpen}
                hasContent={hasContent}
                onToggle={() => setOpenCategory(isOpen ? null : category.key)}
                onClose={() => setOpenCategory(null)}
                t={t}
                locale={locale}
                safeTranslate={safeTranslate}
                StyleImage={StyleImage}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer - Slides from left - Using Portal for proper z-index */}
      {mounted &&
        mobileOpenCategory &&
        selectedCategory &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className='fixed inset-0 bg-black/50 md:hidden'
              onClick={() => setMobileOpenCategory(null)}
              style={{ zIndex: 99998 }}
            />

            {/* Drawer - Modern Redesign */}
            <div
              className={`category-drawer fixed top-0 ${
                isRTL ? 'right-0' : 'left-0'
              } h-full w-[90vw] max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col`}
              style={{ zIndex: 99999 }}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Header with gradient background */}
              <div className='sticky top-0 bg-gradient-to-r from-saudi-green/10 to-emerald-50 border-b border-rich-sand/20 px-6 py-5 flex items-center justify-between z-10 flex-shrink-0'>
                <h2 className='text-xl font-bold text-deep-charcoal font-display'>
                  {t(selectedCategory.key) || selectedCategory.name}
                </h2>
                <button
                  onClick={() => setMobileOpenCategory(null)}
                  className='p-2 hover:bg-white/50 rounded-xl transition-all duration-200 cursor-pointer hover:scale-110'
                  aria-label={locale === 'en' ? 'Close' : 'إغلاق'}
                >
                  <HiXMark className='w-6 h-6 text-deep-charcoal' />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className='flex-1 overflow-y-auto overscroll-contain custom-scrollbar'>
                <div className='p-6 space-y-8 pb-10'>
                  {/* Shop by Category */}
                  {selectedCategory.subCategories.length > 0 && (
                    <div>
                      <div className='flex items-center gap-2 mb-5'>
                        <div className='w-1 h-6 bg-gradient-to-b from-saudi-green to-emerald-600 rounded-full'></div>
                        <h3 className='font-bold text-deep-charcoal text-sm uppercase tracking-wider'>
                          {t('shopByCategory') || 'Shop by category'}
                        </h3>
                      </div>
                      <div className='space-y-2'>
                        {selectedCategory.subCategories.map(subCat => {
                          const browseUrl = `/${locale}/browse?category=${encodeURIComponent(
                            selectedCategory.key
                          )}&subcategory=${encodeURIComponent(subCat.name)}`;
                          return (
                            <Link
                              key={subCat.key}
                              href={browseUrl}
                              className='flex items-center gap-3 text-deep-charcoal/70 hover:text-saudi-green hover:bg-gradient-to-r hover:from-saudi-green/5 hover:to-transparent px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group border border-transparent hover:border-saudi-green/20'
                              onClick={() => setMobileOpenCategory(null)}
                            >
                              <div className='w-1.5 h-1.5 rounded-full bg-saudi-green/0 group-hover:bg-saudi-green transition-all duration-200'></div>
                              <span className='flex-1'>
                                {safeTranslate(
                                  `${selectedCategory.key}Sub.${subCat.key}`,
                                  subCat.name
                                )}
                              </span>
                              <span className='opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-saudi-green'>
                                →
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                      <Link
                        href={`/${locale}/browse?category=${encodeURIComponent(
                          selectedCategory.key
                        )}`}
                        className='flex items-center justify-between mt-5 px-4 py-3 bg-saudi-green/5 hover:bg-saudi-green/10 text-saudi-green font-semibold rounded-xl transition-all duration-200 text-sm group border border-saudi-green/20'
                        onClick={() => setMobileOpenCategory(null)}
                      >
                        <span>
                          {t('seeAll') || 'See all'} {selectedCategory.name}
                        </span>
                        <span className='transform group-hover:translate-x-1 transition-transform duration-200'>
                          →
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Featured */}
                  {selectedCategory.featured.length > 0 && (
                    <div>
                      <div className='flex items-center gap-2 mb-5'>
                        <div className='w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full'></div>
                        <h3 className='font-bold text-deep-charcoal text-sm uppercase tracking-wider'>
                          {t('featured') || 'Featured'}
                        </h3>
                      </div>
                      <div className='space-y-2'>
                        {selectedCategory.featured.map(item => {
                          const translationKey = `${selectedCategory.key}Sub.featured.${item.key}`;
                          const displayName = safeTranslate(
                            translationKey,
                            item.name
                          );
                          const isCategoryPage = item.href.startsWith(
                            `/${selectedCategory.key}`
                          );
                          const browseUrl = isCategoryPage
                            ? `/${locale}/browse?category=${encodeURIComponent(
                                selectedCategory.key
                              )}&subcategory=${encodeURIComponent(item.name)}`
                            : `/${locale}/browse?category=${encodeURIComponent(
                                selectedCategory.key
                              )}`;
                          return (
                            <Link
                              key={item.key}
                              href={browseUrl}
                              className='flex items-center gap-3 text-deep-charcoal/70 hover:text-saudi-green hover:bg-gradient-to-r hover:from-saudi-green/5 hover:to-transparent px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group border border-transparent hover:border-saudi-green/20'
                              onClick={() => setMobileOpenCategory(null)}
                            >
                              <div className='w-1.5 h-1.5 rounded-full bg-saudi-green/0 group-hover:bg-saudi-green transition-all duration-200'></div>
                              <span className='flex-1'>{displayName}</span>
                              <span className='opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-saudi-green'>
                                →
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                      <Link
                        href={`/${locale}/browse?category=${encodeURIComponent(
                          selectedCategory.key
                        )}`}
                        className='flex items-center justify-between mt-5 px-4 py-3 bg-saudi-green/5 hover:bg-saudi-green/10 text-saudi-green font-semibold rounded-xl transition-all duration-200 text-sm group border border-saudi-green/20'
                        onClick={() => setMobileOpenCategory(null)}
                      >
                        <span>
                          {t('seeAll') || 'See all'} {selectedCategory.name}
                        </span>
                        <span className='transform group-hover:translate-x-1 transition-transform duration-200'>
                          →
                        </span>
                      </Link>
                    </div>
                  )}

                  {/* Styles */}
                  {selectedCategory.styles.length > 0 && (
                    <div>
                      <div className='flex items-center gap-2 mb-5'>
                        <div className='w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full'></div>
                        <h3 className='font-bold text-deep-charcoal text-sm uppercase tracking-wider'>
                          {t('styles') || 'Styles'}
                        </h3>
                      </div>
                      <div className='grid grid-cols-2 gap-3'>
                        {selectedCategory.styles.map(style => (
                          <Link
                            key={style.key}
                            href={`/${locale}${style.href}`}
                            className='group relative aspect-square overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-saudi-green/30'
                            onClick={() => setMobileOpenCategory(null)}
                          >
                            <StyleImage
                              style={style}
                              className='group-hover:scale-110 transition-transform duration-500'
                            />
                            <div className='absolute inset-0 bg-gradient-to-t from-deep-charcoal/90 via-deep-charcoal/40 to-transparent'></div>
                            <div className='absolute inset-0 bg-saudi-green/0 group-hover:bg-saudi-green/20 transition-colors duration-300'></div>
                            <span className='absolute bottom-3 left-3 right-3 text-white font-bold text-xs text-center drop-shadow-2xl leading-tight'>
                              {safeTranslate(
                                `${selectedCategory.key}Sub.styles.${style.key}`,
                                style.name
                              )}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <Link
                        href={`/${locale}${selectedCategory.href}`}
                        className='flex items-center justify-center w-full mt-5 px-4 py-3.5 bg-gradient-to-r from-saudi-green via-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-saudi-green/90 hover:via-emerald-500/90 hover:to-teal-500/90 transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                        onClick={() => setMobileOpenCategory(null)}
                      >
                        {t('seeAll') || 'See all'} {selectedCategory.name}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </section>
  );
}

// Category Dropdown Wrapper Component with click and close button
function CategoryDropdownWrapper({
  category,
  isOpen,
  hasContent,
  onToggle,
  onClose,
  t,
  locale,
  safeTranslate,
  StyleImage,
}: {
  category: NavigationCategory;
  isOpen: boolean;
  hasContent: boolean;
  onToggle: () => void;
  onClose: () => void;
  t: (key: string) => string;
  locale: string;
  safeTranslate: (key: string, fallback: string) => string;
  StyleImage: React.ComponentType<{ style: StyleCategory; className?: string }>;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // Calculate dropdown position to keep it within viewport
  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      if (!isOpen) {
        // Only reset style when closing
        setTimeout(() => setDropdownStyle({}), 0);
      }
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const padding = 20;
      const dropdownWidth = Math.min(900, viewportWidth * 0.92);

      // Calculate center position relative to button
      const buttonCenter = buttonRect.left + buttonRect.width / 2;
      let leftPosition = buttonCenter - dropdownWidth / 2;

      // If it goes off the left side, align to left with padding
      if (leftPosition < padding) {
        leftPosition = padding;
      }

      // If it goes off the right side, align to right with padding
      if (leftPosition + dropdownWidth > viewportWidth - padding) {
        leftPosition = viewportWidth - dropdownWidth - padding;
      }

      // Get the container (parent of button)
      const container = buttonRef.current.offsetParent as HTMLElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        // Calculate position relative to container
        const relativeLeft = leftPosition - containerRect.left;
        const containerWidth = containerRect.width;
        const leftPercent = (relativeLeft / containerWidth) * 100;

        setDropdownStyle({
          left: `${leftPercent}%`,
          transform: 'translateX(0)',
        });
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(target) &&
          buttonRef.current &&
          !buttonRef.current.contains(target)
        ) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  return (
    <div className='relative'>
      <button
        ref={buttonRef}
        onClick={onToggle}
        className={`relative px-5 py-3 font-semibold text-sm transition-all duration-300 cursor-pointer rounded-lg ${
          isOpen
            ? 'text-saudi-green bg-saudi-green/5'
            : 'text-deep-charcoal/80 hover:text-saudi-green hover:bg-saudi-green/5'
        }`}
      >
        <span className='font-display relative z-10'>
          {t(category.key) || category.name}
        </span>
        <span
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-saudi-green to-emerald-500 rounded-full transition-all duration-300 ${
            isOpen
              ? 'w-full opacity-100 shadow-lg shadow-saudi-green/30'
              : 'w-0 opacity-0'
          }`}
        />
      </button>

      {/* Dropdown Menu - Desktop - Modern Redesign */}
      {hasContent && isOpen && (
        <div
          ref={dropdownRef}
          className='absolute top-full mt-3 w-[900px] max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-rich-sand/10 z-50 overflow-hidden backdrop-blur-sm'
          style={dropdownStyle}
        >
          {/* Header with category name and close button */}
          <div className='bg-gradient-to-r from-saudi-green/5 to-emerald-50 px-8 py-4 border-b border-rich-sand/20 flex items-center justify-between'>
            <h3 className='text-xl font-bold text-deep-charcoal font-display'>
              {t(category.key) || category.name}
            </h3>
            <button
              onClick={onClose}
              className='p-2 hover:bg-white/50 rounded-xl transition-all duration-200 cursor-pointer hover:scale-110'
              aria-label={locale === 'en' ? 'Close' : 'إغلاق'}
            >
              <HiXMark className='w-5 h-5 text-deep-charcoal' />
            </button>
          </div>

          <div className='max-h-[70vh] overflow-y-auto custom-scrollbar'>
            <div className='p-8'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Shop by Category */}
                {category.subCategories.length > 0 && (
                  <div className='space-y-5'>
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='w-1 h-6 bg-gradient-to-b from-saudi-green to-emerald-600 rounded-full'></div>
                      <h4 className='font-bold text-deep-charcoal text-sm uppercase tracking-wider'>
                        {t('shopByCategory') || 'Shop by category'}
                      </h4>
                    </div>
                    <div className='space-y-2'>
                      {category.subCategories.map((subCat: SubCategory) => {
                        const browseUrl = `/${locale}/browse?category=${encodeURIComponent(
                          category.key
                        )}&subcategory=${encodeURIComponent(subCat.name)}`;
                        return (
                          <Link
                            key={subCat.key}
                            href={browseUrl}
                            className='flex items-center gap-3 text-deep-charcoal/70 hover:text-saudi-green hover:bg-gradient-to-r hover:from-saudi-green/5 hover:to-transparent px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group border border-transparent hover:border-saudi-green/20'
                            onClick={onClose}
                            title={safeTranslate(
                              `${category.key}Sub.${subCat.key}`,
                              subCat.name
                            )}
                          >
                            <div className='w-1.5 h-1.5 rounded-full bg-saudi-green/0 group-hover:bg-saudi-green transition-all duration-200'></div>
                            <span className='flex-1'>
                              {safeTranslate(
                                `${category.key}Sub.${subCat.key}`,
                                subCat.name
                              )}
                            </span>
                            <span className='opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-saudi-green'>
                              →
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href={`/${locale}/browse?category=${encodeURIComponent(
                        category.key
                      )}`}
                      className='flex items-center justify-between mt-6 px-4 py-3 bg-saudi-green/5 hover:bg-saudi-green/10 text-saudi-green font-semibold rounded-xl transition-all duration-200 text-sm group border border-saudi-green/20 hover:border-saudi-green/40'
                      onClick={onClose}
                    >
                      <span>
                        {t('seeAll') || 'See all'} {category.name}
                      </span>
                      <span className='transform group-hover:translate-x-1 transition-transform duration-200'>
                        →
                      </span>
                    </Link>
                  </div>
                )}

                {/* Featured */}
                {category.featured.length > 0 && (
                  <div className='space-y-5'>
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full'></div>
                      <h4 className='font-bold text-deep-charcoal text-sm uppercase tracking-wider'>
                        {t('featured') || 'Featured'}
                      </h4>
                    </div>
                    <div className='space-y-2'>
                      {category.featured.map((item: FeaturedItem) => {
                        const translationKey = `${category.key}Sub.featured.${item.key}`;
                        const displayName = safeTranslate(
                          translationKey,
                          item.name
                        );
                        const isCategoryPage = item.href.startsWith(
                          `/${category.key}`
                        );
                        const browseUrl = isCategoryPage
                          ? `/${locale}/browse?category=${encodeURIComponent(
                              category.key
                            )}&subcategory=${encodeURIComponent(item.name)}`
                          : `/${locale}/browse?category=${encodeURIComponent(
                              category.key
                            )}`;
                        return (
                          <Link
                            key={item.key}
                            href={browseUrl}
                            className='flex items-center gap-3 text-deep-charcoal/70 hover:text-saudi-green hover:bg-gradient-to-r hover:from-saudi-green/5 hover:to-transparent px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group border border-transparent hover:border-saudi-green/20'
                            onClick={onClose}
                            title={displayName}
                          >
                            <div className='w-1.5 h-1.5 rounded-full bg-saudi-green/0 group-hover:bg-saudi-green transition-all duration-200'></div>
                            <span className='flex-1'>{displayName}</span>
                            <span className='opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-saudi-green'>
                              →
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      href={`/${locale}/browse?category=${encodeURIComponent(
                        category.key
                      )}`}
                      className='flex items-center justify-between mt-6 px-4 py-3 bg-saudi-green/5 hover:bg-saudi-green/10 text-saudi-green font-semibold rounded-xl transition-all duration-200 text-sm group border border-saudi-green/20 hover:border-saudi-green/40'
                      onClick={onClose}
                    >
                      <span>
                        {t('seeAll') || 'See all'} {category.name}
                      </span>
                      <span className='transform group-hover:translate-x-1 transition-transform duration-200'>
                        →
                      </span>
                    </Link>
                  </div>
                )}

                {/* Styles */}
                {category.styles.length > 0 && (
                  <div className='space-y-5'>
                    <div className='flex items-center gap-2 mb-4'>
                      <div className='w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full'></div>
                      <h4 className='font-bold text-deep-charcoal text-sm uppercase tracking-wider'>
                        {t('styles') || 'Styles'}
                      </h4>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      {category.styles.map((style: StyleCategory) => (
                        <Link
                          key={style.key}
                          href={`/${locale}${style.href}`}
                          className='group relative aspect-square overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-saudi-green/30'
                          onClick={onClose}
                        >
                          <StyleImage
                            style={style}
                            className='group-hover:scale-110 transition-transform duration-500'
                          />
                          <div className='absolute inset-0 bg-gradient-to-t from-deep-charcoal/90 via-deep-charcoal/40 to-transparent'></div>
                          <div className='absolute inset-0 bg-saudi-green/0 group-hover:bg-saudi-green/20 transition-colors duration-300'></div>
                          <span className='absolute bottom-4 left-4 right-4 text-white font-bold text-xs text-center drop-shadow-2xl leading-tight'>
                            {safeTranslate(
                              `${category.key}Sub.styles.${style.key}`,
                              style.name
                            )}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={`/${locale}${category.href}`}
                      className='flex items-center justify-center w-full mt-6 px-4 py-3.5 bg-gradient-to-r from-saudi-green via-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-saudi-green/90 hover:via-emerald-500/90 hover:to-teal-500/90 transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                      onClick={onClose}
                    >
                      {t('seeAll') || 'See all'} {category.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
