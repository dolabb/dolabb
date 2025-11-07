'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { navigationCategories } from '@/data/navigation';
import Image from 'next/image';
import { 
  HiChevronDown, 
  HiBars3, 
  HiXMark,
  HiSparkles,
  HiTag,
  HiShoppingBag,
  HiArrowTrendingUp,
  HiUserGroup,
  HiUser,
  HiAcademicCap
} from 'react-icons/hi2';
import { MdSportsSoccer } from 'react-icons/md';
import { StyleCategory } from '@/data/navigation';

// Style Image Component with error handling
const StyleImage = ({ style, className = '' }: { style: StyleCategory; className?: string }) => {
  const [imageError, setImageError] = useState(false);
  
  const imageSrc = imageError 
    ? `https://via.placeholder.com/300/006747/FFFFFF?text=${encodeURIComponent(style.name)}`
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
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  women: HiUserGroup,
  men: HiUser,
  kids: HiAcademicCap,
  sports: MdSportsSoccer,
  brands: HiSparkles,
  trending: HiArrowTrendingUp,
  sale: HiTag,
};

// Ordinal Icon Component
const OrdinalIcon = ({ number, className = '' }: { number: number; className?: string }) => {
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  const ordinal = `${number}${getOrdinalSuffix(number)}`;

  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="38" fill="#006747" opacity="0.1" />
      <circle cx="40" cy="40" r="36" stroke="#006747" strokeWidth="2.5" />
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="700"
        fill="#006747"
        fontFamily="Poppins, sans-serif"
      >
        {ordinal}
      </text>
    </svg>
  );
};

export default function NavigationBar() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [clickedCategory, setClickedCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileOpenCategory, setMobileOpenCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Determine which category should be active (clicked takes priority, then hover)
  const displayedCategory = clickedCategory || activeCategory;

  useEffect(() => {
    if (typeof window === 'undefined' || !dropdownRef.current) return;

    const dropdown = dropdownRef.current;
    const isVisible = displayedCategory !== null;

    if (isVisible) {
      // Show animation
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

      // Animate children
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
      // Hide animation
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

  // Mobile menu animation
  useEffect(() => {
    if (typeof window === 'undefined' || !mobileMenuRef.current) return;

    if (isMobileMenuOpen) {
      // Show animation
      gsap.fromTo(
        mobileMenuRef.current,
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
    }
  }, [isMobileMenuOpen]);

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
    // Only hide on mouse leave if not clicked
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
      // If clicking the same category, close it
      setClickedCategory(null);
      setActiveCategory(null);
    } else {
      // Open the clicked category
      setClickedCategory(categoryKey);
      setActiveCategory(categoryKey);
    }
  };

  const handleCloseDropdown = () => {
    setClickedCategory(null);
    setActiveCategory(null);
    setHoveredCategory(null);
  };

  const handleMobileCategoryToggle = (categoryKey: string) => {
    if (mobileOpenCategory === categoryKey) {
      setMobileOpenCategory(null);
    } else {
      setMobileOpenCategory(categoryKey);
    }
  };

  const activeCategoryData = navigationCategories.find(
    (cat) => cat.key === displayedCategory
  );

  return (
    <nav
      className="relative bg-white border-b border-rich-sand/30 shadow-sm sticky top-16 md:top-20 z-30"
      dir={isRTL ? 'rtl' : 'ltr'}
      onMouseLeave={handleCategoryLeave}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center gap-8 h-14">
          {navigationCategories.map((category) => {
            const isActive = clickedCategory === category.key || activeCategory === category.key;
            const IconComponent = categoryIcons[category.key];
            return (
              <div key={category.key} className="relative">
                <button
                  onClick={(e) => handleCategoryClick(category.key, e)}
                  className={`relative px-3 py-2 font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'text-saudi-green'
                      : 'text-deep-charcoal/70 hover:text-saudi-green'
                  }`}
                  onMouseEnter={() => handleCategoryEnter(category.key)}
                >
                  {IconComponent && (
                    <IconComponent className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  )}
                  <span className="font-display">{t(category.key) || category.name}</span>
                  {/* Green Underline with decorative effect */}
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

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 transition-colors rounded-lg hover:bg-rich-sand/30 ${
                isMobileMenuOpen ? 'text-saudi-green' : 'text-deep-charcoal'
              }`}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <HiXMark className="w-6 h-6" />
              ) : (
                <HiBars3 className="w-6 h-6" />
              )}
            </button>
            <div className={`text-sm font-semibold transition-colors ${
              isMobileMenuOpen ? 'text-saudi-green' : 'text-deep-charcoal'
            }`}>
              Menu
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div
              ref={mobileMenuRef}
              className="fixed top-[calc(4rem+3.5rem)] left-0 right-0 bottom-0 bg-white border-t border-rich-sand/30 shadow-lg z-50 overflow-y-auto"
            >
              <div className="px-4 py-4 pb-8">
                {navigationCategories.map((category) => {
                  const isOpen = mobileOpenCategory === category.key;
                  const categoryData = navigationCategories.find((cat) => cat.key === category.key);
                  return (
                    <div key={category.key} className="border-b border-rich-sand/20 last:border-0">
                      <button
                        onClick={() => handleMobileCategoryToggle(category.key)}
                        className={`relative w-full flex items-center justify-between py-4 text-left font-medium transition-all duration-300 ${
                          isOpen ? 'text-saudi-green' : 'text-deep-charcoal'
                        }`}
                      >
                        <span className="flex items-center gap-3 relative">
                          {/* Category Icon */}
                          {(() => {
                            const IconComponent = categoryIcons[category.key];
                            return IconComponent ? (
                              <IconComponent className={`w-5 h-5 transition-transform ${isOpen ? 'scale-110 text-saudi-green' : ''}`} />
                            ) : null;
                          })()}
                          {/* Green Underline Indicator */}
                          <span className={`h-2 w-2 rounded-full bg-saudi-green transition-all duration-300 ${
                            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                          }`} />
                          <span className="font-display">{t(category.key) || category.name}</span>
                          {/* Green Underline */}
                          <span
                            className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} h-0.5 bg-saudi-green rounded-full transition-all duration-300 ${
                              isOpen
                                ? 'w-full opacity-100 shadow-sm shadow-saudi-green/30'
                                : 'w-0 opacity-0'
                            }`}
                          />
                        </span>
                        <HiChevronDown
                          className={`w-5 h-5 transition-all duration-300 ${
                            isOpen 
                              ? 'rotate-180 text-saudi-green' 
                              : 'rotate-0 text-deep-charcoal/50'
                          }`}
                        />
                      </button>

                      {/* Mobile Submenu */}
                      {isOpen && categoryData && (
                        <div className="pb-4 pl-4 pr-2 space-y-4 bg-off-white/50 rounded-lg mt-2 mb-2">
                          {/* Featured */}
                          {categoryData.featured.length > 0 && (
                            <div className="pt-2">
                              <h4 className="font-bold text-deep-charcoal mb-3 text-sm border-b-2 border-saudi-green/30 pb-2">
                                {t('shopByCategory') || 'Shop by category'}
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                {categoryData.subCategories.map((subCat, index) => (
                                  <Link
                                    key={subCat.key}
                                    href={`/${locale}${subCat.href}`}
                                    className="group flex flex-col items-center gap-2 text-deep-charcoal/80 active:text-saudi-green hover:text-saudi-green hover:font-semibold active:font-semibold transition-all duration-200 py-3 px-2 rounded-lg hover:bg-saudi-green/10 active:bg-saudi-green/15 border border-rich-sand/30 hover:border-saudi-green/40 active:border-saudi-green bg-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    <OrdinalIcon number={index + 1} className="w-20 h-20 group-active:scale-110 transition-transform duration-200" />
                                    <span className="text-xs font-medium text-center group-hover:font-semibold group-active:font-semibold">
                                      {t(`${categoryData.key}Sub.${subCat.key}`) || subCat.name}
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Featured */}
                          {categoryData.featured.length > 0 && (
                            <div className="pt-2">
                              <h4 className="font-bold text-deep-charcoal mb-3 text-sm border-b-2 border-saudi-green/30 pb-2">
                                {t('featured') || 'Featured'}
                              </h4>
                              <div className="flex flex-col gap-1.5">
                                {categoryData.featured.map((item) => (
                                  <Link
                                    key={item.key}
                                    href={`/${locale}${item.href}`}
                                    className="text-deep-charcoal/80 active:text-saudi-green hover:text-saudi-green hover:font-semibold active:font-semibold transition-all duration-200 text-sm py-2.5 px-3 rounded-lg hover:bg-saudi-green/10 active:bg-saudi-green/15 border border-rich-sand/30 hover:border-saudi-green/40 active:border-saudi-green bg-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    {t(`${categoryData.key}Sub.featured.${item.key}`) || item.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Styles */}
                          {categoryData.styles.length > 0 && (
                            <div className="pt-2">
                              <h4 className="font-bold text-deep-charcoal mb-3 text-sm border-b-2 border-saudi-green/30 pb-2">
                                {t('styles') || 'Styles'}
                              </h4>
                              <div className="grid grid-cols-2 gap-2.5">
                                {categoryData.styles.map((style) => (
                                  <Link
                                    key={style.key}
                                    href={`/${locale}${style.href}`}
                                    className="group relative aspect-square overflow-hidden rounded-lg border-2 border-rich-sand/30 hover:border-saudi-green/50 active:border-saudi-green transition-all duration-300 bg-white"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    <StyleImage style={style} className="group-active:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal/80 via-deep-charcoal/40 to-transparent" />
                                    <span className="absolute bottom-2 left-2 right-2 text-white font-semibold text-xs text-center drop-shadow-lg">
                                      {t(`${categoryData.key}Sub.styles.${style.key}`) || style.name}
                                    </span>
                                    {/* Green overlay on active */}
                                    <div className="absolute inset-0 bg-saudi-green/0 group-active:bg-saudi-green/10 transition-colors duration-300" />
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {activeCategoryData && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white border-t border-rich-sand/30 shadow-lg z-40"
          style={{ display: 'none' }}
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
          }}
          onMouseLeave={handleCategoryLeave}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Featured */}
              {activeCategoryData.featured.length > 0 && (
                <div className="dropdown-item">
                  <h3 className="font-bold text-deep-charcoal mb-4 text-lg">
                    {t('featured') || 'Featured'}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {activeCategoryData.featured.map((item) => (
                      <Link
                        key={item.key}
                        href={`/${locale}${item.href}`}
                        className="text-deep-charcoal/70 hover:text-saudi-green hover:font-medium transition-all duration-200 text-sm py-1.5 px-2 rounded hover:bg-saudi-green/5"
                        onClick={handleCloseDropdown}
                      >
                        {t(`${activeCategoryData.key}Sub.featured.${item.key}`) || item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Categories */}
              {activeCategoryData.styles.length > 0 && (
                <div className="dropdown-item">
                  <h3 className="font-bold text-deep-charcoal mb-4 text-lg">
                    {t('styles') || 'Styles'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {activeCategoryData.styles.map((style) => (
                      <Link
                        key={style.key}
                        href={`/${locale}${style.href}`}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                        onClick={handleCloseDropdown}
                      >
                        <StyleImage style={style} className="group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal/70 to-transparent" />
                        <span className="absolute bottom-2 left-2 right-2 text-white font-semibold text-sm text-center">
                          {t(`${activeCategoryData.key}Sub.styles.${style.key}`) || style.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

