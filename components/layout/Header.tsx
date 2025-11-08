'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  HiArrowRightOnRectangle,
  HiBars3,
  HiChatBubbleLeftRight,
  HiHeart,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiShoppingBag,
  HiTag,
  HiUser,
  HiXMark,
} from 'react-icons/hi2';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const isRTL = locale === 'ar';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-off-white ' : 'bg-off-white/95 backdrop-blur-sm'
      }`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 md:h-20'>
          {/* Logo */}
          <Link href={`/${locale}`} className='flex items-center gap-2 group'>
            <Image
              src='/Logo.svg'
              alt='Depop Logo'
              width={100}
              height={100}
              className='hidden md:block h-50 w-auto'
              priority
            />
            <Image
              src='/Reslogo.svg'
              alt='Depop Logo'
              width={100}
              height={100}
              className='md:hidden h-6 w-auto'
              priority
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className='hidden md:flex flex-1 max-w-xl mx-8'>
            <div className='relative w-full'>
              <input
                type='text'
                placeholder={t('search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full py-2 rounded-full border border-saudi-green/30 hover:border-saudi-green bg-white focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${
                  isRTL ? 'px-4 pr-10 pl-4' : 'px-4 pl-10 pr-4'
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
          <nav className='hidden md:flex items-center gap-4'>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => router.push(`/${locale}/my-store`)}
                  className='text-deep-charcoal hover:text-saudi-green transition-colors font-medium flex items-center gap-1.5 group'
                >
                  <HiTag className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {locale === 'en' ? 'Sell now' : 'بيع الآن'}
                </button>
                <Link
                  href={`/${locale}/cart`}
                  className='text-deep-charcoal hover:text-saudi-green transition-colors relative group'
                  title={locale === 'en' ? 'Cart' : 'السلة'}
                >
                  <HiShoppingBag className='w-6 h-6 transition-transform group-hover:scale-110' />
                </Link>
                <Link
                  href={`/${locale}/messages`}
                  className='text-deep-charcoal hover:text-saudi-green transition-colors relative group'
                  title={locale === 'en' ? 'Messages' : 'الرسائل'}
                >
                  <HiChatBubbleLeftRight className='w-6 h-6 transition-transform group-hover:scale-110' />
                </Link>
                {/* Profile Dropdown */}
                <div className='relative' ref={profileDropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className='text-deep-charcoal hover:text-saudi-green transition-colors relative group'
                    title={locale === 'en' ? 'Profile' : 'الملف الشخصي'}
                  >
                    <HiUser className='w-6 h-6 transition-transform group-hover:scale-110' />
                  </button>
                  {isProfileDropdownOpen && (
                    <div
                      className={`absolute ${
                        isRTL ? 'left-0' : 'right-0'
                      } mt-2 w-48 bg-white rounded-lg shadow-lg border border-rich-sand/30 py-2 z-50`}
                    >
                      <Link
                        href={`/${locale}/profile`}
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className='flex items-center gap-3 px-4 py-2 text-sm text-deep-charcoal hover:bg-rich-sand/10 hover:text-saudi-green transition-colors whitespace-nowrap'
                      >
                        <HiPencilSquare className='w-4 h-4 flex-shrink-0' />
                        <span className='font-medium'>
                          {locale === 'en'
                            ? 'Edit Profile'
                            : 'تعديل الملف الشخصي'}
                        </span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileDropdownOpen(false);
                          router.push(`/${locale}`);
                        }}
                        className='w-full flex items-center gap-3 px-4 py-2 text-sm text-deep-charcoal hover:bg-rich-sand/10 hover:text-red-600 transition-colors whitespace-nowrap'
                      >
                        <HiArrowRightOnRectangle className='w-4 h-4 flex-shrink-0' />
                        <span className='font-medium'>
                          {locale === 'en' ? 'Logout' : 'تسجيل الخروج'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push(`/${locale}/login`)}
                  className='text-deep-charcoal hover:text-saudi-green transition-colors font-medium flex items-center gap-1.5 group'
                >
                  <HiTag className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {t('sell')}
                </button>
                <Link
                  href={`/${locale}/favorites`}
                  className='text-deep-charcoal hover:text-saudi-green transition-colors relative group'
                  title={t('favorites')}
                >
                  <HiHeart className='w-6 h-6 transition-transform group-hover:scale-110 fill-saudi-green/50 text-saudi-green' />
                </Link>
                <Link
                  href={`/${locale}/login`}
                  className='px-4 py-2 rounded-full border border-rich-sand text-deep-charcoal hover:border-saudi-green hover:text-saudi-green hover:bg-saudi-green/5 transition-all duration-200 font-medium text-sm'
                >
                  {locale === 'en' ? 'Log In' : 'تسجيل الدخول'}
                </Link>
                <Link
                  href={`/${locale}/signup`}
                  className='px-4 py-2 rounded-full bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 font-display'
                >
                  {locale === 'en' ? 'Sign Up' : 'إنشاء حساب'}
                </Link>
              </>
            )}
            <button
              onClick={toggleLanguage}
              className='px-6 py-2 rounded-full border border-saudi-green/30 bg-white text-saudi-green hover:bg-saudi-green hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md flex items-center gap-2'
            >
              <span className='text-base'>{locale === 'en' ? 'ع' : 'EN'}</span>
              <span className='text-xs'>{locale === 'en' ? 'AR' : 'EN'}</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='md:hidden text-deep-charcoal p-2 hover:bg-rich-sand/30 rounded-lg transition-colors'
            aria-label='Toggle menu'
          >
            {isMobileMenuOpen ? (
              <HiXMark className='w-6 h-6' />
            ) : (
              <HiBars3 className='w-6 h-6' />
            )}
          </button>
        </div>

        {/* Mobile Search */}
        <div className='md:hidden pb-4'>
          <div className='relative'>
            <input
              type='text'
              placeholder={t('search')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full py-2 rounded-full border border-saudi-green/30 hover:border-saudi-green bg-white focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${
                isRTL ? 'px-4 pr-10 pl-4' : 'px-4 pl-10 pr-4'
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
          <div className='md:hidden pb-4 border-t border-rich-sand mt-4 pt-4'>
            <nav className='flex flex-col space-y-3'>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push(`/${locale}/my-store`);
                    }}
                    className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2 text-left'
                  >
                    <HiTag className='w-5 h-5' />
                    {locale === 'en' ? 'Sell now' : 'بيع الآن'}
                  </button>
                  <Link
                    href={`/${locale}/cart`}
                    className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HiShoppingBag className='w-5 h-5' />
                    {locale === 'en' ? 'Cart' : 'السلة'}
                  </Link>
                  <Link
                    href={`/${locale}/messages`}
                    className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HiChatBubbleLeftRight className='w-5 h-5' />
                    {locale === 'en' ? 'Messages' : 'الرسائل'}
                  </Link>
                  {/* Profile Dropdown - Mobile */}
                  <div className='border-t border-rich-sand/30 pt-2 mt-2'>
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      }
                      className='w-full flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2'
                    >
                      <HiUser className='w-5 h-5 flex-shrink-0' />
                      <span className='text-sm whitespace-nowrap'>
                        {locale === 'en' ? 'Profile' : 'الملف الشخصي'}
                      </span>
                    </button>
                    {isProfileDropdownOpen && (
                      <div className='pl-8 pt-2 space-y-2'>
                        <Link
                          href={`/${locale}/profile`}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setIsProfileDropdownOpen(false);
                          }}
                          className='flex items-center gap-3 text-sm text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2 whitespace-nowrap'
                        >
                          <HiPencilSquare className='w-4 h-4 flex-shrink-0' />
                          <span>
                            {locale === 'en'
                              ? 'Edit Profile'
                              : 'تعديل الملف الشخصي'}
                          </span>
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                            setIsProfileDropdownOpen(false);
                            router.push(`/${locale}`);
                          }}
                          className='w-full flex items-center gap-3 text-sm text-deep-charcoal hover:text-red-600 transition-colors font-medium py-2 whitespace-nowrap'
                        >
                          <HiArrowRightOnRectangle className='w-4 h-4 flex-shrink-0' />
                          <span>
                            {locale === 'en' ? 'Logout' : 'تسجيل الخروج'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push(`/${locale}/login`);
                    }}
                    className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2 text-left'
                  >
                    <HiTag className='w-5 h-5' />
                    {t('sell')}
                  </button>
                  <Link
                    href={`/${locale}/favorites`}
                    className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HiHeart className='w-5 h-5 fill-saudi-green text-saudi-green' />
                    {t('favorites')}
                  </Link>
                  <Link
                    href={`/${locale}/login`}
                    className='flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-rich-sand text-deep-charcoal hover:border-saudi-green hover:text-saudi-green hover:bg-saudi-green/5 transition-all duration-200 font-medium'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {locale === 'en' ? 'Log In' : 'تسجيل الدخول'}
                  </Link>
                  <Link
                    href={`/${locale}/signup`}
                    className='flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold shadow-md hover:shadow-lg font-display'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {locale === 'en' ? 'Sign Up' : 'إنشاء حساب'}
                  </Link>
                </>
              )}
              <button
                onClick={toggleLanguage}
                className='px-4 py-2 rounded-lg border border-saudi-green/30 bg-white text-saudi-green hover:bg-saudi-green hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md flex items-center gap-2 w-fit'
              >
                <span className='text-base'>
                  {locale === 'en' ? 'ع' : 'EN'}
                </span>
                <span className='text-xs'>{locale === 'en' ? 'AR' : 'EN'}</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
