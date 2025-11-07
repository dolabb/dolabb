'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HiMagnifyingGlass, HiHeart, HiBars3, HiXMark, HiTag } from 'react-icons/hi2';
import { FiShoppingBag } from 'react-icons/fi';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const isRTL = locale === 'ar';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-off-white shadow-md'
          : 'bg-off-white/95 backdrop-blur-sm'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="text-2xl md:text-3xl font-bold text-saudi-green font-display tracking-tight">
              Depop
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full py-2 rounded-full border border-rich-sand bg-white focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent ${
                  isRTL 
                    ? 'px-4 pr-10 pl-4' 
                    : 'px-4 pl-10 pr-4'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <HiMagnifyingGlass
                className={`absolute top-2.5 w-5 h-5 text-deep-charcoal/50 ${
                  isRTL ? 'right-3' : 'left-3'
                }`}
              />
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href={`/${locale}/shop`}
              className="text-deep-charcoal hover:text-saudi-green transition-colors font-medium flex items-center gap-1.5 group"
            >
              <FiShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {t('shop')}
            </Link>
            <Link
              href={`/${locale}/sell`}
              className="text-deep-charcoal hover:text-saudi-green transition-colors font-medium flex items-center gap-1.5 group"
            >
              <HiTag className="w-4 h-4 group-hover:scale-110 transition-transform" />
              {t('sell')}
            </Link>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 rounded-full bg-rich-sand text-deep-charcoal hover:bg-desert-gold transition-colors text-sm font-medium"
            >
              {locale === 'en' ? 'عربي' : 'EN'}
            </button>
            <Link
              href={`/${locale}/favorites`}
              className="text-deep-charcoal hover:text-coral-red transition-colors relative group"
              title={t('favorites')}
            >
              <HiHeart className="w-6 h-6 transition-transform group-hover:scale-110" />
            </Link>
            <Link
              href={`/${locale}/login`}
              className="px-4 py-2 rounded-lg border border-rich-sand text-deep-charcoal hover:border-saudi-green hover:text-saudi-green hover:bg-saudi-green/5 transition-all duration-200 font-medium text-sm"
            >
              {locale === 'en' ? 'Log In' : 'تسجيل الدخول'}
            </Link>
            <Link
              href={`/${locale}/signup`}
              className="px-4 py-2 rounded-lg bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 font-display"
            >
              {locale === 'en' ? 'Sign Up' : 'إنشاء حساب'}
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-deep-charcoal p-2 hover:bg-rich-sand/30 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <HiXMark className="w-6 h-6" />
            ) : (
              <HiBars3 className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 rounded-full border border-rich-sand bg-white focus:outline-none focus:ring-2 focus:ring-saudi-green ${
                isRTL 
                  ? 'px-4 pr-10 pl-4' 
                  : 'px-4 pl-10 pr-4'
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <HiMagnifyingGlass
              className={`absolute top-2.5 w-5 h-5 text-deep-charcoal/50 ${
                isRTL ? 'right-3' : 'left-3'
              }`}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-rich-sand mt-4 pt-4">
            <nav className="flex flex-col space-y-3">
              <Link
                href={`/${locale}/shop`}
                className="flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FiShoppingBag className="w-5 h-5" />
                {t('shop')}
              </Link>
              <Link
                href={`/${locale}/sell`}
                className="flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HiTag className="w-5 h-5" />
                {t('sell')}
              </Link>
              <Link
                href={`/${locale}/favorites`}
                className="flex items-center gap-3 text-deep-charcoal hover:text-coral-red transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HiHeart className="w-5 h-5" />
                {t('favorites')}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-rich-sand text-deep-charcoal hover:border-saudi-green hover:text-saudi-green hover:bg-saudi-green/5 transition-all duration-200 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {locale === 'en' ? 'Log In' : 'تسجيل الدخول'}
              </Link>
              <Link
                href={`/${locale}/signup`}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold shadow-md hover:shadow-lg font-display"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {locale === 'en' ? 'Sign Up' : 'إنشاء حساب'}
              </Link>
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 rounded-full bg-rich-sand text-deep-charcoal hover:bg-desert-gold transition-colors text-sm font-medium w-fit"
              >
                {locale === 'en' ? 'عربي' : 'EN'}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

