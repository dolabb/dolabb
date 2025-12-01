'use client';

import { useGetProfileQuery } from '@/lib/api/authApi';
import { useCreateOfferMutation } from '@/lib/api/offersApi';
import { useGetCartQuery, useGetProductsQuery } from '@/lib/api/productsApi';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { logout, updateUser } from '@/lib/store/slices/authSlice';
import { toast } from '@/utils/toast';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  HiArrowRightOnRectangle,
  HiBars3,
  HiChatBubbleLeftRight,
  HiMagnifyingGlass,
  HiPencilSquare,
  HiShoppingBag,
  HiUser,
  HiUserGroup,
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

  // Check if user is affiliate - initialize from localStorage
  // Use useState with function to avoid hydration mismatch
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [mounted, setMounted] = useState(false);

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
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch cart data when authenticated
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 30000, // Poll every 30 seconds to keep cart updated
  });

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
    error: searchError 
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
  }, [debouncedSearchQuery, searchResults, normalizedSearchResults, searchError, isSearching]);

  // Show/hide search dropdown based on query (show immediately when typing, not waiting for results)
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearchDropdownOpen(true);
    } else {
      setIsSearchDropdownOpen(false);
    }
  }, [searchQuery]);

  // Fetch profile data to check for address fields and get updated role
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Use profile data if available, otherwise fall back to Redux user
  // This ensures we have the most up-to-date role from the API
  const currentUser = profileData?.user || user;

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

  const [createOffer, { isLoading: isCreatingOffer }] =
    useCreateOfferMutation();

  // Mark component as mounted to prevent hydration mismatch
  useLayoutEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  // Initialize affiliate status after mount to avoid hydration mismatch
  useEffect(() => {
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
  }, []);

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
      if (
        cartDropdownRef.current &&
        !cartDropdownRef.current.contains(target)
      ) {
        setIsCartDropdownOpen(false);
      }
      // For search dropdown, only close if clicking outside both input and dropdown
      // Don't close if clicking inside the dropdown (including on result items)
      if (isSearchDropdownOpen) {
        const isClickInInput = searchInputRef.current?.contains(target);
        const isClickInDropdown = searchDropdownRef.current?.contains(target);
        
        // Also check if clicking on a child element of the dropdown
        const clickedElement = target.closest('[data-search-result]');
        const isClickOnResult = clickedElement && searchDropdownRef.current?.contains(clickedElement);
        
        if (!isClickInInput && !isClickInDropdown && !isClickOnResult) {
          setIsSearchDropdownOpen(false);
        }
      }
    };

    if (isProfileDropdownOpen || isCartDropdownOpen || isSearchDropdownOpen) {
      // Use a delay to allow clicks inside dropdown to process first
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isProfileDropdownOpen, isCartDropdownOpen, isSearchDropdownOpen]);

  const handleCreateOffer = async (productId: string) => {
    const offerAmount = parseFloat(offerAmounts[productId] || '0');
    if (!offerAmount || offerAmount <= 0) {
      toast.error(
        locale === 'en'
          ? 'Please enter a valid offer amount'
          : 'يرجى إدخال مبلغ عرض صحيح'
      );
      return;
    }

    // Check if user has required address fields
    const userProfile = currentUser;
    const missingFields: string[] = [];

    const shippingAddress =
      userProfile?.shipping_address || userProfile?.shippingAddress;
    const zipCode = userProfile?.zip_code || userProfile?.zipCode;
    const houseNumber = userProfile?.house_number || userProfile?.houseNumber;

    if (!shippingAddress || shippingAddress.trim() === '') {
      missingFields.push(locale === 'en' ? 'shipping address' : 'عنوان الشحن');
    }
    if (!zipCode || zipCode.trim() === '') {
      missingFields.push(locale === 'en' ? 'zip code' : 'الرمز البريدي');
    }
    if (!houseNumber || houseNumber.trim() === '') {
      missingFields.push(locale === 'en' ? 'house number' : 'رقم المنزل');
    }

    if (missingFields.length > 0) {
      toast.error(
        locale === 'en'
          ? `Please update your profile to add ${missingFields.join(', ')}`
          : `يرجى تحديث ملفك الشخصي لإضافة ${missingFields.join('، ')}`
      );
      return;
    }

    try {
      await createOffer({ productId, offerAmount }).unwrap();
      toast.success(
        locale === 'en'
          ? 'Offer created successfully!'
          : 'تم إنشاء العرض بنجاح!'
      );
      setOfferAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[productId];
        return newAmounts;
      });
      // Refetch cart after creating offer
      await refetchCart();
    } catch (error: unknown) {
      // Check for specific error messages from API
      const errorData = error && typeof error === 'object' && 'data' in error
        ? (error as { data?: { error?: string; message?: string } })?.data
          : undefined;
      const apiError = errorData?.error || errorData?.message;
      
      if (apiError === 'You cannot make an offer on your own product') {
        toast.error(
          locale === 'en'
            ? 'You cannot make an offer on your own product'
            : 'لا يمكنك تقديم عرض على منتجك الخاص'
        );
      } else {
      toast.error(
          apiError ||
          (locale === 'en' ? 'Failed to create offer' : 'فشل إنشاء العرض')
      );
      }
    }
  };

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
      } ${isAffiliate ? 'shadow-lg' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 md:h-20'>
          {/* Logo */}
          {isAffiliate ? (
            <div className='flex items-center gap-2 group cursor-default'>
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
            </div>
          ) : (
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
          )}

          {/* Search Bar - Desktop (hidden for affiliates) */}
          {(!mounted || !isAffiliate) && (
            <div className='hidden md:flex flex-1 max-w-xl mx-8'>
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
                {/* Search Results Dropdown */}
                {isSearchDropdownOpen && (
                  <div
                    ref={searchDropdownRef}
                    className={`absolute ${
                      isRTL ? 'right-0' : 'left-0'
                    } top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-rich-sand/30 z-[100] max-h-96 overflow-y-auto`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isSearching || (debouncedSearchQuery.trim().length < 2 && searchQuery.trim().length >= 2) ? (
                      <div className='p-4 text-center text-deep-charcoal/70'>
                        {locale === 'en' ? 'Searching...' : 'جاري البحث...'}
                      </div>
                    ) : normalizedSearchResults && normalizedSearchResults.length > 0 ? (
                      <div className='py-2'>
                        {normalizedSearchResults.map((product: any) => {
                          // Handle both title and itemtitle fields from API
                          const productTitle = (product as any).itemtitle || product.title || 'Untitled Product';
                          const productId = product.id;
                          
                          if (!productId) {
                            return null;
                          }
                          
                          const productUrl = `/${locale}/product/${productId}`;
                          
                          const handleClick = (e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            console.log('🔗 Clicked product:', { productId, productTitle, productUrl });
                            
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
                    ) : debouncedSearchQuery.trim().length >= 2 && !isSearching ? (
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
            {isAuthenticated || isAffiliate ? (
              <>
                {/* Cart Dropdown (hidden for affiliates) */}
                {(!mounted || !isAffiliate) && (
                  <div className='relative' ref={cartDropdownRef}>
                    <button
                      onClick={async () => {
                        const newState = !isCartDropdownOpen;
                        setIsCartDropdownOpen(newState);
                        // Refetch cart when opening dropdown
                        if (newState && isAuthenticated) {
                          await refetchCart();
                        }
                      }}
                      className='text-deep-charcoal hover:text-saudi-green transition-colors flex group cursor-pointer'
                      title={locale === 'en' ? 'Cart' : 'السلة'}
                    >
                      <HiShoppingBag className='w-6 h-6 transition-transform group-hover:scale-110' />
                      {cartData?.itemCount && cartData.itemCount > 0 && (
                        <span className='absolute top-0 right-0 bg-saudi-green text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none'>
                          {cartData.itemCount > 9 ? '9+' : cartData.itemCount}
                        </span>
                      )}
                    </button>
                    {isCartDropdownOpen && (
                      <div
                        className={`absolute ${
                          isRTL ? 'left-0' : 'right-0'
                        } mt-2 w-80 bg-white rounded-lg shadow-lg border border-rich-sand/30 z-50 max-h-[600px] overflow-y-auto`}
                      >
                        <div className='p-4 border-b border-rich-sand/30'>
                          <h3 className='font-semibold text-deep-charcoal'>
                            {locale === 'en' ? 'Shopping Cart' : 'سلة التسوق'}
                          </h3>
                          {cartData?.itemCount && cartData.itemCount > 0 && (
                            <p className='text-sm text-deep-charcoal/70 mt-1'>
                              {cartData.itemCount}{' '}
                              {locale === 'en' ? 'item(s)' : 'عنصر'}
                            </p>
                          )}
                        </div>
                        {cartData?.cart && cartData.cart.length > 0 ? (
                          <div className='p-2'>
                            {cartData.cart.map(item => (
                              <div
                                key={item.id}
                                className='flex gap-3 p-3 border-b border-rich-sand/20 last:border-b-0 hover:bg-rich-sand/10 transition-colors'
                              >
                                <div className='relative w-16 h-16 rounded-lg overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                                  <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className='object-cover'
                                    unoptimized
                                  />
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <h4 className='font-medium text-sm text-deep-charcoal truncate'>
                                    {item.title}
                                  </h4>
                                  <p className='text-sm font-semibold text-saudi-green mt-1'>
                                    {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                                    {item.price.toFixed(2)}
                                  </p>
                                  <div className='mt-2 space-y-2'>
                                    <input
                                      type='number'
                                      placeholder={
                                        locale === 'en'
                                          ? 'Offer amount'
                                          : 'مبلغ العرض'
                                      }
                                      value={offerAmounts[item.id] || ''}
                                      onChange={e =>
                                        setOfferAmounts(prev => ({
                                          ...prev,
                                          [item.id]: e.target.value,
                                        }))
                                      }
                                      className='w-full px-2 py-1 text-sm border border-rich-sand/30 rounded focus:outline-none focus:ring-2 focus:ring-saudi-green'
                                      min='0'
                                      step='0.01'
                                    />
                                    <button
                                      onClick={() => handleCreateOffer(item.id)}
                                      disabled={isCreatingOffer}
                                      className='w-full px-3 py-1.5 bg-saudi-green text-white text-sm font-medium rounded hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                                    >
                                      {isCreatingOffer
                                        ? locale === 'en'
                                          ? 'Creating...'
                                          : 'جاري الإنشاء...'
                                        : locale === 'en'
                                        ? 'Proceed to make offer'
                                        : 'المتابعة لعمل عرض'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className='p-3 border-t border-rich-sand/30 mt-2'>
                              <div className='flex justify-between items-center mb-2'>
                                <span className='font-semibold text-deep-charcoal'>
                                  {locale === 'en' ? 'Total' : 'الإجمالي'}
                                </span>
                                <span className='font-bold text-saudi-green'>
                                  {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                                  {cartData.totalAmount.toFixed(2)}
                                </span>
                              </div>
                              <Link
                                href={`/${locale}/cart`}
                                onClick={() => setIsCartDropdownOpen(false)}
                                className='block w-full text-center px-4 py-2 bg-saudi-green text-white rounded hover:bg-saudi-green/90 transition-colors font-medium text-sm'
                              >
                                {locale === 'en' ? 'View Cart' : 'عرض السلة'}
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className='p-8 text-center'>
                            <HiShoppingBag className='w-12 h-12 text-deep-charcoal/30 mx-auto mb-3' />
                            <p className='text-deep-charcoal/70 text-sm'>
                              {locale === 'en'
                                ? 'Your cart is empty'
                                : 'سلة التسوق فارغة'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* Messages (hidden for affiliates) */}
                {(!mounted || !isAffiliate) && (
                  <Link
                    href={`/${locale}/messages`}
                    className='text-deep-charcoal hover:text-saudi-green transition-colors relative group'
                    title={locale === 'en' ? 'Messages' : 'الرسائل'}
                  >
                    <HiChatBubbleLeftRight className='w-6 h-6 transition-transform group-hover:scale-110' />
                  </Link>
                )}
                {/* Profile Dropdown */}
                <div className='relative' ref={profileDropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className='text-deep-charcoal hover:text-saudi-green transition-colors relative group cursor-pointer'
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
                      {isAffiliate ? (
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
                          <HiPencilSquare className='w-4 h-4 flex-shrink-0' />
                          <span className='font-medium'>
                            {locale === 'en'
                              ? 'Edit Profile'
                              : 'تعديل الملف الشخصي'}
                          </span>
                        </Link>
                      )}
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
              (!mounted || !isAffiliate) && (
                <>
                  <Link
                    href={`/${locale}/affiliate/login`}
                    className='px-4 py-2 rounded-full bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 font-display flex items-center gap-1.5'
                    title={
                      locale === 'en' ? 'Affiliate Login' : 'تسجيل دخول الشريك'
                    }
                  >
                    <HiUserGroup className='w-4 h-4' />
                    <span className='hidden lg:inline'>
                      {locale === 'en' ? 'Affiliate' : 'شريك'}
                    </span>
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
                </>
              )
            )}
            <button
              onClick={toggleLanguage}
              className='px-6 py-2 rounded-full border border-saudi-green/30 bg-white text-saudi-green hover:bg-saudi-green hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer'
            >
              <span className='text-base'>{locale === 'en' ? 'ع' : 'EN'}</span>
              <span className='text-xs'>{locale === 'en' ? 'AR' : 'EN'}</span>
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
        {(!mounted || !isAffiliate) && (
          <div className='md:hidden pb-4'>
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
              {/* Search Results Dropdown - Mobile */}
              {isSearchDropdownOpen && (
                <div
                  ref={searchDropdownRef}
                  className={`absolute ${
                    isRTL ? 'right-0' : 'left-0'
                  } top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-rich-sand/30 z-[100] max-h-96 overflow-y-auto`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isSearching || (debouncedSearchQuery.trim().length < 2 && searchQuery.trim().length >= 2) ? (
                    <div className='p-4 text-center text-deep-charcoal/70'>
                      {locale === 'en' ? 'Searching...' : 'جاري البحث...'}
                    </div>
                  ) : normalizedSearchResults && normalizedSearchResults.length > 0 ? (
                    <div className='py-2'>
                      {normalizedSearchResults.map((product: any) => {
                        // Handle both title and itemtitle fields from API
                        const productTitle = (product as any).itemtitle || product.title || 'Untitled Product';
                        const productId = product.id;
                        
                        if (!productId) {
                          return null;
                        }
                        
                        const productUrl = `/${locale}/product/${productId}`;
                        
                        const handleClick = (e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          console.log('🔗 Clicked product (mobile):', { productId, productTitle, productUrl });
                          
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
                  ) : debouncedSearchQuery.trim().length >= 2 && !isSearching ? (
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
              {isAuthenticated || isAffiliate ? (
                <>
                  {/* Cart (hidden for affiliates) */}
                  {(!mounted || !isAffiliate) && (
                    <div className='relative'>
                      <Link
                        href={`/${locale}/cart`}
                        className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2'
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className='relative'>
                          <HiShoppingBag className='w-5 h-5' />
                          {cartData?.itemCount && cartData.itemCount > 0 && (
                            <span className='absolute top-0 right-0 bg-saudi-green text-white text-[10px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center leading-none'>
                              {cartData.itemCount > 9
                                ? '9+'
                                : cartData.itemCount}
                            </span>
                          )}
                        </div>
                        {locale === 'en' ? 'Cart' : 'السلة'}
                      </Link>
                    </div>
                  )}
                  {/* Messages (hidden for affiliates) */}
                  {(!mounted || !isAffiliate) && (
                    <Link
                      href={`/${locale}/messages`}
                      className='flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <HiChatBubbleLeftRight className='w-5 h-5' />
                      {locale === 'en' ? 'Messages' : 'الرسائل'}
                    </Link>
                  )}
                  {/* Profile Dropdown - Mobile */}
                  <div className='border-t border-rich-sand/30 pt-2 mt-2'>
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      }
                      className='w-full flex items-center gap-3 text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2 cursor-pointer'
                    >
                      <HiUser className='w-5 h-5 flex-shrink-0' />
                      <span className='text-sm whitespace-nowrap'>
                        {locale === 'en' ? 'Profile' : 'الملف الشخصي'}
                      </span>
                    </button>
                    {isProfileDropdownOpen && (
                      <div className='pl-8 pt-2 space-y-2'>
                        {isAffiliate ? (
                          <Link
                            href={`/${locale}/affiliate/profile`}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setIsProfileDropdownOpen(false);
                            }}
                            className='flex items-center gap-3 text-sm text-deep-charcoal hover:text-saudi-green transition-colors font-medium py-2 whitespace-nowrap'
                          >
                            <HiPencilSquare className='w-4 h-4 flex-shrink-0' />
                            <span>
                              {locale === 'en' ? 'Profile' : 'الملف الشخصي'}
                            </span>
                          </Link>
                        ) : (
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
                        )}
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                            setIsProfileDropdownOpen(false);
                          }}
                          className='w-full flex items-center gap-3 text-sm text-deep-charcoal hover:text-red-600 transition-colors font-medium py-2 whitespace-nowrap cursor-pointer'
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
                (!mounted || !isAffiliate) && (
                  <>
                    <Link
                      href={`/${locale}/affiliate/login`}
                      className='flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-saudi-green text-white hover:bg-saudi-green/90 transition-all duration-200 font-semibold shadow-md hover:shadow-lg font-display'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <HiUserGroup className='w-5 h-5' />
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
                  </>
                )
              )}
              <button
                onClick={toggleLanguage}
                className='px-4 py-2 rounded-lg border border-saudi-green/30 bg-white text-saudi-green hover:bg-saudi-green hover:text-white transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md flex items-center gap-2 w-fit cursor-pointer'
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
