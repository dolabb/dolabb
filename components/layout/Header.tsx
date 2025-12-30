'use client';

import {
  useGetProfileQuery,
  useUpdateLanguageMutation,
  useUpdateProfileMutation,
} from '@/lib/api/authApi';
import { useGetUnreadStatusQuery } from '@/lib/api/chatApi';
import { useGetProductsQuery } from '@/lib/api/productsApi';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { logout, updateUser } from '@/lib/store/slices/authSlice';
import { toast } from '@/utils/toast';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  HiArrowRightOnRectangle,
  HiBars3,
  HiChatBubbleLeftRight,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiUser,
  HiXMark,
} from 'react-icons/hi2';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const isOnMessagesPage = pathname?.includes('/messages');

  // Fetch unread messages status using the dedicated API endpoint
  const { data: unreadStatusData } = useGetUnreadStatusQuery(undefined, {
    skip: !isAuthenticated || isOnMessagesPage,
    // Poll every 30 seconds to keep unread status updated
    pollingInterval: 30000,
  });

  // Get unread status from API response
  const hasUnreadMessages = unreadStatusData?.hasUnreadMessages || false;
  const totalUnreadCount = unreadStatusData?.totalUnreadCount || 0;

  // Check if user is affiliate - initialize from localStorage
  // Always start as false to match server render, then update after mount
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const handleLogout = () => {
    if (isAffiliate) {
      // Clear affiliate data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('affiliate');
        localStorage.removeItem('affiliate_token');
      }
      setIsAffiliate(false);
      router.push(`/${locale}/affiliate/login`);
    } else {
      dispatch(logout());
      router.push(`/${locale}`);
    }
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNavigatingToSearch, setIsNavigatingToSearch] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useGetProductsQuery(
    { search: debouncedSearchQuery.trim() },
    {
      skip: !debouncedSearchQuery || debouncedSearchQuery.trim().length < 2,
    }
  );

  // Normalize search results - handle both array and object with products property
  const normalizedSearchResults = Array.isArray(searchResults)
    ? searchResults
    : (searchResults as any)?.products || [];

  // Debug: Log search query and results
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      console.log('🔍 Search Debug:', {
        query: debouncedSearchQuery,
        results: searchResults,
        normalizedResults: normalizedSearchResults,
        resultsCount: normalizedSearchResults?.length || 0,
        error: searchError,
        isSearching,
      });
    }
  }, [
    debouncedSearchQuery,
    searchResults,
    normalizedSearchResults,
    searchError,
    isSearching,
  ]);

  // Show/hide search dropdown based on query (show immediately when typing, not waiting for results)
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearchDropdownOpen(true);
    } else {
      setIsSearchDropdownOpen(false);
    }
  }, [searchQuery]);

  // Fetch profile data to check for address fields and get updated role
  const { data: profileData, refetch: refetchProfile } = useGetProfileQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  // Use profile data if available, otherwise fall back to Redux user
  // This ensures we have the most up-to-date role from the API
  const currentUser = profileData?.user || user;
  const isSeller = currentUser?.role === 'seller';
  const isBuyer = currentUser?.role === 'buyer';

  // Update Redux store when profile data changes (especially role)
  useEffect(() => {
    if (profileData?.user) {
      // Only update if there are actual changes to avoid unnecessary updates
      if (
        !user ||
        profileData.user.role !== user.role ||
        profileData.user.email !== user.email ||
        profileData.user.username !== user.username
      ) {
        // Update user in Redux store with latest data from API
        dispatch(updateUser(profileData.user));
      }
    }
  }, [profileData?.user, user, dispatch]);

  const [updateLanguage] = useUpdateLanguageMutation();
  const [updateProfile, { isLoading: isSwitchingRole }] =
    useUpdateProfileMutation();

  // Handle role switching
  const toggleRole = async () => {
    if (!currentUser || isSwitchingRole) return;

    const newRole = currentUser.role === 'seller' ? 'buyer' : 'seller';

    try {
      await updateProfile({ role: newRole }).unwrap();

      // Optimistically update Redux store immediately for instant UI feedback
      if (user) {
        dispatch(updateUser({ ...user, role: newRole }));
      }

      // Refetch profile to get updated role from server
      const result = await refetchProfile();

      // Update Redux store with fresh data from server
      if (result.data?.user) {
        dispatch(updateUser(result.data.user));
      }

      // Show success message
      const message =
        locale === 'en'
          ? `Switched to ${newRole === 'seller' ? 'Seller' : 'Buyer'} mode`
          : `تم التبديل إلى وضع ${newRole === 'seller' ? 'البائع' : 'المشتري'}`;
      toast.success(message);
    } catch (error) {
      console.error('Failed to switch role:', error);
      // Revert optimistic update on error
      if (user) {
        dispatch(updateUser({ ...user, role: currentUser.role }));
      }
      const message =
        locale === 'en'
          ? 'Failed to switch role. Please try again.'
          : 'فشل التبديل. يرجى المحاولة مرة أخرى.';
      toast.error(message);
    }
  };

  // Initialize affiliate status after mount to avoid hydration mismatch
  // Re-check when pathname changes (e.g., after login redirect)
  useEffect(() => {
    setIsMounted(true);
    const checkAffiliate = () => {
      if (typeof window !== 'undefined') {
        const affiliate = localStorage.getItem('affiliate');
        const affiliateToken = localStorage.getItem('affiliate_token');
        setIsAffiliate(!!(affiliate && affiliateToken));
      }
    };
    checkAffiliate();
    // Listen for storage changes (e.g., when affiliate logs in/out in another tab)
    window.addEventListener('storage', checkAffiliate);
    return () => window.removeEventListener('storage', checkAffiliate);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setIsProfileDropdownOpen(false);
      }
      // For search dropdown, only close if clicking outside both input and dropdown
      // Don't close if clicking inside the dropdown (including on result items)
      if (isSearchDropdownOpen) {
        const isClickInInput = searchInputRef.current?.contains(target);
        const isClickInDropdown = searchDropdownRef.current?.contains(target);

        // Also check if clicking on a child element of the dropdown
        const clickedElement = target.closest('[data-search-result]');
        const isClickOnResult =
          clickedElement && searchDropdownRef.current?.contains(clickedElement);

        if (!isClickInInput && !isClickInDropdown && !isClickOnResult) {
          setIsSearchDropdownOpen(false);
        }
      }
    };

    if (isProfileDropdownOpen || isSearchDropdownOpen) {
      // Use a delay to allow clicks inside dropdown to process first
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isProfileDropdownOpen, isSearchDropdownOpen]);

  const toggleLanguage = async () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';

    try {
      // Update language preference on backend
      if (isAuthenticated || isAffiliate) {
        // User is authenticated - update with token
        await updateLanguage({ language: newLocale, skipAuth: false }).unwrap();
        // Save to 'language' key for logged-in users
        if (typeof window !== 'undefined') {
          localStorage.setItem('language', newLocale);
          localStorage.removeItem('guest_language'); // Clear guest language if exists
        }
      } else {
        // User is not authenticated - update without token
        await updateLanguage({ language: newLocale, skipAuth: true }).unwrap();
        // Store language preference in localStorage for guests
        if (typeof window !== 'undefined') {
          localStorage.setItem('guest_language', newLocale);
        }
      }
    } catch (error) {
      // Log error but don't block language change
      console.error('Failed to update language preference:', error);
    }

    // Update the UI language regardless of API call result
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const isRTL = locale === 'ar';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-off-white ' : 'bg-off-white/95 backdrop-blur-sm'
      } ${isMounted && isAffiliate ? 'shadow-lg' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 md:h-20'>
          {/* Logo */}
          {isMounted && isAffiliate ? (
            <div className='flex items-center gap-2 group cursor-default'>
              <Image
                src='/Logo.svg'
                alt='Dolabb Logo'
                width={100}
                height={100}
                className='hidden md:block h-50 w-auto'
                priority
              />
              <Image
                src='/Logo.svg'
                alt='Dolabb Logo'
                width={100}
                height={100}
                className='md:hidden h-24 w-auto'
                priority
              />
            </div>
          ) : (
            <Link href={`/${locale}`} className='flex items-center gap-2 group'>
              <Image
                src='/Logo.svg'
                alt='Dolabb Logo'
                width={100}
                height={100}
                className='hidden md:block h-50 w-auto'
                priority
              />
              <Image
                src='/Logo.svg'
                alt='Dolabb Logo'
                width={100}
                height={100}
                className='md:hidden h-24 w-auto'
                priority
              />
            </Link>
          )}

          {/* Search Bar - Desktop (hidden for affiliates) */}
          {!(isMounted && isAffiliate) && (
            <div
              className='hidden md:flex flex-1 max-w-xl mx-8'
              suppressHydrationWarning
            >
              <div className='relative w-full'>
                <input
                  ref={searchInputRef}
                  type='text'
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) {
                      setIsSearchDropdownOpen(true);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      // Navigate to browse page with search query
                      const searchUrl = `/${locale}/browse?search=${encodeURIComponent(
                        searchQuery.trim()
                      )}`;
                      const query = searchQuery.trim();
                      setSearchQuery('');
                      setIsSearchDropdownOpen(false);
                      setIsNavigatingToSearch(true);
                      router.push(searchUrl);
                      // Reset navigation state after a short delay
                      setTimeout(() => setIsNavigatingToSearch(false), 1000);
                    }
                  }}
                  className={`w-full py-2 rounded-full border border-saudi-green/30 hover:border-saudi-green bg-white focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${
                    isRTL ? 'px-4 pr-10 pl-4' : 'px-4 pl-10 pr-4'
                  }`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                {isNavigatingToSearch ? (
                  <div
                    className={`absolute top-2.5 ${
                      isRTL ? 'right-3' : 'left-3'
                    }`}
                  >
                    <div className='animate-spin rounded-full h-5 w-5 border-2 border-saudi-green border-t-transparent' />
                  </div>
                ) : (
                  <HiMagnifyingGlass
                    className={`absolute top-2.5 w-5 h-5 text-deep-charcoal/50 ${
                      isRTL ? 'right-3' : 'left-3'
                    }`}
                  />
                )}
                {/* Search Results Dropdown */}
                {isSearchDropdownOpen && (
                  <div
                    ref={searchDropdownRef}
                    className={`absolute ${
                      isRTL ? 'right-0' : 'left-0'
                    } top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-rich-sand/30 z-[100] max-h-96 overflow-y-auto`}
                    onClick={e => e.stopPropagation()}
                  >
                    {isSearching ||
                    (debouncedSearchQuery.trim().length < 2 &&
                      searchQuery.trim().length >= 2) ? (
                      <div className='p-4 text-center text-deep-charcoal/70'>
                        {locale === 'en' ? 'Searching...' : 'جاري البحث...'}
                      </div>
                    ) : normalizedSearchResults &&
                      normalizedSearchResults.length > 0 ? (
                      <div className='py-2'>
                        {normalizedSearchResults.map((product: any) => {
                          // Handle both title and itemtitle fields from API
                          const productTitle =
                            (product as any).itemtitle ||
                            product.title ||
                            'Untitled Product';
                          const productId = product.id;

                          if (!productId) {
                            return null;
                          }

                          const productUrl = `/${locale}/product/${productId}`;

                          const handleClick = (e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();

                            console.log('🔗 Clicked product:', {
                              productId,
                              productTitle,
                              productUrl,
                            });

                            // Close dropdown and clear search
                            setSearchQuery('');
                            setIsSearchDropdownOpen(false);

                            // Navigate using router
                            router.push(productUrl);
                          };

                          return (
                            <div
                              key={productId}
                              data-search-result
                              onClick={handleClick}
                              className='block px-4 py-3 hover:bg-rich-sand/10 transition-colors cursor-pointer'
                            >
                              <div className='text-sm font-medium text-deep-charcoal'>
                                {productTitle}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : debouncedSearchQuery.trim().length >= 2 &&
                      !isSearching ? (
                      <div className='p-4 text-center'>
                        <p className='text-deep-charcoal/70 mb-1'>
                          {locale === 'en'
                            ? 'No products found'
                            : 'لم يتم العثور على منتجات'}
                        </p>
                        <p className='text-xs text-deep-charcoal/50'>
                          {locale === 'en'
                            ? `Searching for: "${debouncedSearchQuery}"`
                            : `البحث عن: "${debouncedSearchQuery}"`}
                        </p>
                        {searchError && (
                          <p className='text-xs text-red-500 mt-2'>
                            {locale === 'en'
                              ? 'Search error occurred'
                              : 'حدث خطأ في البحث'}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation - Desktop */}
          <nav
            className='hidden md:flex items-center gap-4'
            suppressHydrationWarning
          >
            {isAuthenticated || (isMounted && isAffiliate) ? (
              <>
                {/* Messages (hidden for affiliates) */}
                {!(isMounted && isAffiliate) && (
                  <Link
                    href={`/${locale}/messages`}
                    className='text-deep-charcoal hover:text-saudi-green transition-colors relative group'
                    title={locale === 'en' ? 'Messages' : 'الرسائل'}
                    suppressHydrationWarning
                  >
                    <HiChatBubbleLeftRight className='w-6 h-6 transition-transform group-hover:scale-110' />
                    {!isOnMessagesPage && hasUnreadMessages && (
                      <span
                        className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white'
                        title={
                          locale === 'en'
                            ? `${totalUnreadCount} unread messages`
                            : `${totalUnreadCount} رسائل غير مقروءة`
                        }
                      ></span>
                    )}
                  </Link>
                )}
                {/* Profile Dropdown */}
                <div className='relative' ref={profileDropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className='relative flex items-center justify-center w-10 h-10 rounded-full bg-rich-sand/20 hover:bg-saudi-green/10 text-deep-charcoal hover:text-saudi-green transition-all duration-200 group cursor-pointer border-2 border-transparent hover:border-saudi-green/30'
                    title={locale === 'en' ? 'Profile' : 'الملف الشخصي'}
                  >
                    <HiUser className='w-5 h-5 transition-transform group-hover:scale-110' />
                  </button>
                  {isProfileDropdownOpen && (
                    <div
                      className={`absolute ${
                        isRTL ? 'left-0' : 'right-0'
                      } mt-2 w-48 bg-white rounded-lg shadow-lg border border-rich-sand/30 py-2 z-50`}
                    >
                      {isMounted && isAffiliate ? (
                        <Link
                          href={`/${locale}/affiliate/profile`}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className='flex items-center gap-3 px-4 py-2 text-sm text-deep-charcoal hover:bg-rich-sand/10 hover:text-saudi-green transition-colors whitespace-nowrap'
                        >
                          <HiPencilSquare className='w-4 h-4 flex-shrink-0' />
                          <span className='font-medium'>
                            {locale === 'en' ? 'Profile' : 'الملف الشخصي'}
                          </span>
                        </Link>
                      ) : (
                        <Link
                          href={`/${locale}/profile`}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className='flex items-center gap-3 px-4 py-2 text-sm text-deep-charcoal hover:bg-rich-sand/10 hover:text-saudi-green transition-colors whitespace-nowrap'
                        >
                          <HiUser className='w-4 h-4 flex-shrink-0' />
                          <span className='font-medium'>
                            {locale === 'en'
                              ? 'View Profile'
                              : 'عرض الملف الشخصي'}
                          </span>
                        </Link>
                      )}
                      <div className='border-t border-rich-sand/30 my-1'></div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className='w-full flex items-center gap-3 px-4 py-2 text-sm text-deep-charcoal hover:bg-rich-sand/10 hover:text-red-600 transition-colors whitespace-nowrap cursor-pointer'
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
              !(isMounted && isAffiliate) && (
                <div
                  suppressHydrationWarning
                  className='flex items-center gap-3'
                >
                  <Link
                    href={`/${locale}/affiliate/login`}
                    className='px-4 py-2 rounded-full bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 font-display flex items-center gap-1.5'
                    title={
                      locale === 'en' ? 'Affiliate Login' : 'تسجيل دخول الشريك'
                    }
                  >
                    <span>{locale === 'en' ? 'Affiliate' : 'شريك'}</span>
                  </Link>
                  <Link
                    href={`/${locale}/login`}
                    className='px-4 py-2 rounded-full bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 font-display'
                  >
                    {locale === 'en' ? 'Log In' : 'تسجيل الدخول'}
                  </Link>
                  <Link
                    href={`/${locale}/signup`}
                    className='px-4 py-2 rounded-full bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 font-display'
                  >
                    {locale === 'en' ? 'Sign Up' : 'إنشاء حساب'}
                  </Link>
                </div>
              )
            )}
            {/* Role Switch Toggle - Only for authenticated users with seller/buyer role */}
            {isAuthenticated && !(isMounted && isAffiliate) && (isSeller || isBuyer) && (
              <div className='flex items-center gap-3'>
                <span
                  className={`text-xs font-medium whitespace-nowrap transition-colors ${
                    !isSeller
                      ? 'text-saudi-green font-semibold'
                      : 'text-deep-charcoal/70'
                  }`}
                >
                  {locale === 'en' ? 'Buyer' : 'مشتري'}
                </span>
                <button
                  onClick={toggleRole}
                  disabled={isSwitchingRole}
                  className='relative inline-flex h-7 w-14 items-center rounded-full bg-rich-sand/30 transition-colors focus:outline-none focus:ring-2 focus:ring-saudi-green focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rich-sand/40 overflow-hidden'
                  role='switch'
                  aria-checked={isSeller}
                  aria-label={
                    locale === 'en'
                      ? 'Switch between buyer and seller mode'
                      : 'التبديل بين وضع المشتري والبائع'
                  }
                >
                  {isSwitchingRole ? (
                    <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 border-saudi-green border-t-transparent rounded-full animate-spin'></div>
                  ) : (
                    <span
                      className={`absolute h-5 w-5 rounded-full shadow-md transition-all duration-200 ease-in-out ${
                        isSeller
                          ? isRTL
                            ? 'left-1 bg-saudi-green'
                            : 'right-1 bg-saudi-green'
                          : isRTL
                          ? 'right-1 bg-white'
                          : 'left-1 bg-white'
                      }`}
                    />
                  )}
                </button>
                <span
                  className={`text-xs font-medium whitespace-nowrap transition-colors ${
                    isSeller
                      ? 'text-saudi-green font-semibold'
                      : 'text-deep-charcoal/70'
                  }`}
                >
                  {locale === 'en' ? 'Seller' : 'بائع'}
                </span>
              </div>
            )}
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className='relative flex items-center justify-center w-10 h-10 rounded-full bg-rich-sand/20 hover:bg-saudi-green/10 text-deep-charcoal hover:text-saudi-green transition-all duration-200 font-semibold text-sm border-2 border-transparent hover:border-saudi-green/30 cursor-pointer group'
              title={locale === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            >
              <span className='text-base font-bold'>{locale === 'en' ? 'ع' : 'EN'}</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='md:hidden text-deep-charcoal p-2 hover:bg-rich-sand/30 rounded-lg transition-colors cursor-pointer'
            aria-label='Toggle menu'
          >
            {isMobileMenuOpen ? (
              <HiXMark className='w-6 h-6' />
            ) : (
              <HiBars3 className='w-6 h-6' />
            )}
          </button>
        </div>

        {/* Mobile Search (hidden for affiliates) */}
        {!(isMounted && isAffiliate) && (
          <div className='md:hidden pb-4' suppressHydrationWarning>
            <div className='relative'>
              <input
                ref={searchInputRef}
                type='text'
                placeholder={t('search')}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setIsSearchDropdownOpen(true);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    e.preventDefault();
                    // Navigate to browse page with search query
                    const searchUrl = `/${locale}/browse?search=${encodeURIComponent(
                      searchQuery.trim()
                    )}`;
                    setSearchQuery('');
                    setIsSearchDropdownOpen(false);
                    setIsMobileMenuOpen(false);
                    setIsNavigatingToSearch(true);
                    router.push(searchUrl);
                    // Reset navigation state after a short delay
                    setTimeout(() => setIsNavigatingToSearch(false), 1000);
                  }
                }}
                className={`w-full py-2 rounded-full border border-saudi-green/30 hover:border-saudi-green bg-white focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${
                  isRTL ? 'px-4 pr-10 pl-4' : 'px-4 pl-10 pr-4'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              {isNavigatingToSearch ? (
                <div
                  className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'}`}
                >
                  <div className='animate-spin rounded-full h-5 w-5 border-2 border-saudi-green border-t-transparent' />
                </div>
              ) : (
                <HiMagnifyingGlass
                  className={`absolute top-2.5 w-5 h-5 text-deep-charcoal/50 ${
                    isRTL ? 'right-3' : 'left-3'
                  }`}
                />
              )}
              {/* Search Results Dropdown - Mobile */}
              {isSearchDropdownOpen && (
                <div
                  ref={searchDropdownRef}
                  className={`absolute ${
                    isRTL ? 'right-0' : 'left-0'
                  } top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-rich-sand/30 z-[100] max-h-96 overflow-y-auto`}
                  onClick={e => e.stopPropagation()}
                >
                  {isSearching ||
                  (debouncedSearchQuery.trim().length < 2 &&
                    searchQuery.trim().length >= 2) ? (
                    <div className='p-4 text-center text-deep-charcoal/70'>
                      {locale === 'en' ? 'Searching...' : 'جاري البحث...'}
                    </div>
                  ) : normalizedSearchResults &&
                    normalizedSearchResults.length > 0 ? (
                    <div className='py-2'>
                      {normalizedSearchResults.map((product: any) => {
                        // Handle both title and itemtitle fields from API
                        const productTitle =
                          (product as any).itemtitle ||
                          product.title ||
                          'Untitled Product';
                        const productId = product.id;

                        if (!productId) {
                          return null;
                        }

                        const productUrl = `/${locale}/product/${productId}`;

                        const handleClick = (e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();

                          console.log('🔗 Clicked product (mobile):', {
                            productId,
                            productTitle,
                            productUrl,
                          });

                          // Close dropdown and clear search
                          setSearchQuery('');
                          setIsSearchDropdownOpen(false);
                          setIsMobileMenuOpen(false);

                          // Navigate using router
                          router.push(productUrl);
                        };

                        return (
                          <div
                            key={productId}
                            data-search-result
                            onClick={handleClick}
                            className='block px-4 py-3 hover:bg-rich-sand/10 transition-colors cursor-pointer'
                          >
                            <div className='text-sm font-medium text-deep-charcoal'>
                              {productTitle}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : debouncedSearchQuery.trim().length >= 2 &&
                    !isSearching ? (
                    <div className='p-4 text-center'>
                      <p className='text-deep-charcoal/70 mb-1'>
                        {locale === 'en'
                          ? 'No products found'
                          : 'لم يتم العثور على منتجات'}
                      </p>
                      <p className='text-xs text-deep-charcoal/50'>
                        {locale === 'en'
                          ? `Searching for: "${debouncedSearchQuery}"`
                          : `البحث عن: "${debouncedSearchQuery}"`}
                      </p>
                      {searchError && (
                        <p className='text-xs text-red-500 mt-2'>
                          {locale === 'en'
                            ? 'Search error occurred'
                            : 'حدث خطأ في البحث'}
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className='md:hidden pb-4 border-t border-rich-sand mt-4 pt-4'>
            <nav className='flex flex-col space-y-3' suppressHydrationWarning>
              {isAuthenticated || (isMounted && isAffiliate) ? (
                <>
                  {/* Messages (hidden for affiliates) */}
                  {!(isMounted && isAffiliate) && (
                    <Link
                      href={`/${locale}/messages`}
                      className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2 relative'
                      onClick={() => setIsMobileMenuOpen(false)}
                      suppressHydrationWarning
                    >
                      <HiChatBubbleLeftRight className='w-5 h-5' />
                      {locale === 'en' ? 'Messages' : 'الرسائل'}
                      {!isOnMessagesPage && hasUnreadMessages && (
                        <span
                          className='absolute left-5 top-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white'
                          title={
                            locale === 'en'
                              ? `${totalUnreadCount} unread messages`
                              : `${totalUnreadCount} رسائل غير مقروءة`
                          }
                        ></span>
                      )}
                    </Link>
                  )}
                  {/* View Profile - Mobile */}
                  <Link
                    href={
                      isMounted && isAffiliate
                        ? `/${locale}/affiliate/profile`
                        : `/${locale}/profile`
                    }
                    className='flex items-center gap-3 px-4 py-3 rounded-lg bg-rich-sand/10 hover:bg-saudi-green/10 text-deep-charcoal hover:text-saudi-green transition-all duration-200 font-medium border border-rich-sand/30 hover:border-saudi-green/30'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className='flex items-center justify-center w-8 h-8 rounded-full bg-rich-sand/20 text-saudi-green'>
                      <HiUser className='w-4 h-4' />
                    </div>
                    <span>{locale === 'en' ? 'View Profile' : 'عرض الملف الشخصي'}</span>
                  </Link>
                  {/* Logout - Mobile */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className='flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg cursor-pointer'
                  >
                    <HiArrowRightOnRectangle className='w-5 h-5' />
                    {locale === 'en' ? 'Logout' : 'تسجيل الخروج'}
                  </button>
                  {/* Role Switch Toggle - Mobile */}
                  {isAuthenticated && !(isMounted && isAffiliate) && (isSeller || isBuyer) && (
                    <div className='flex items-center justify-between w-full px-2 py-2.5'>
                      <span className='text-sm font-medium text-deep-charcoal'>
                        {locale === 'en' ? 'Mode' : 'الوضع'}
                      </span>
                      <div className='flex items-center gap-3'>
                        <span
                          className={`text-xs font-medium transition-colors ${
                            !isSeller
                              ? 'text-saudi-green font-semibold'
                              : 'text-deep-charcoal/50'
                          }`}
                        >
                          {locale === 'en' ? 'Buyer' : 'مشتري'}
                        </span>
                        <button
                          onClick={toggleRole}
                          disabled={isSwitchingRole}
                          className='relative inline-flex h-7 w-14 items-center rounded-full bg-rich-sand/30 transition-colors focus:outline-none focus:ring-2 focus:ring-saudi-green focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden'
                          role='switch'
                          aria-checked={isSeller}
                          aria-label={
                            locale === 'en'
                              ? 'Switch between buyer and seller mode'
                              : 'التبديل بين وضع المشتري والبائع'
                          }
                        >
                          {isSwitchingRole ? (
                            <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 border-saudi-green border-t-transparent rounded-full animate-spin'></div>
                          ) : (
                            <span
                              className={`absolute h-5 w-5 rounded-full shadow-md transition-all duration-200 ease-in-out ${
                                isSeller
                                  ? isRTL
                                    ? 'left-1 bg-saudi-green'
                                    : 'right-1 bg-saudi-green'
                                  : isRTL
                                  ? 'right-1 bg-white'
                                  : 'left-1 bg-white'
                              }`}
                            />
                          )}
                        </button>
                        <span
                          className={`text-xs font-medium transition-colors ${
                            isSeller
                              ? 'text-saudi-green font-semibold'
                              : 'text-deep-charcoal/50'
                          }`}
                        >
                          {locale === 'en' ? 'Seller' : 'بائع'}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Language Toggle - Mobile */}
                  <button
                    onClick={toggleLanguage}
                    className='flex items-center justify-between w-full px-4 py-3 rounded-lg bg-rich-sand/10 hover:bg-saudi-green/10 text-deep-charcoal hover:text-saudi-green transition-all duration-200 font-semibold border border-rich-sand/30 hover:border-saudi-green/30 cursor-pointer'
                  >
                    <span className='text-sm font-medium'>
                      {locale === 'en' ? 'Language' : 'اللغة'}
                    </span>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm'>
                        {locale === 'en' ? 'العربية' : 'English'}
                      </span>
                      <div className='flex items-center justify-center w-8 h-8 rounded-full bg-rich-sand/20 text-saudi-green'>
                        <span className='text-base font-bold'>
                          {locale === 'en' ? 'ع' : 'EN'}
                        </span>
                      </div>
                    </div>
                  </button>
                </>
              ) : (
                !(isMounted && isAffiliate) && (
                  <div suppressHydrationWarning className='flex flex-col gap-3'>
                    <Link
                      href={`/${locale}/affiliate/login`}
                      className='flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold shadow-md hover:shadow-lg font-display'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {locale === 'en'
                        ? 'Affiliate Login'
                        : 'تسجيل دخول الشريك'}
                    </Link>
                    <Link
                      href={`/${locale}/login`}
                      className='flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold shadow-md hover:shadow-lg font-display'
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
                  </div>
                )
              )}
              {/* Language Toggle - Only for non-authenticated users */}
              {!isAuthenticated && !(isMounted && isAffiliate) && (
                <button
                  onClick={toggleLanguage}
                  className='relative flex items-center justify-center w-10 h-10 rounded-full bg-rich-sand/20 hover:bg-saudi-green/10 text-deep-charcoal hover:text-saudi-green transition-all duration-200 font-semibold text-sm border-2 border-transparent hover:border-saudi-green/30 cursor-pointer group'
                  title={locale === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
                >
                  <span className='text-base font-bold'>{locale === 'en' ? 'ع' : 'EN'}</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
