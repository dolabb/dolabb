'use client';

import {
  useGetProductDetailQuery,
  useSaveProductMutation,
} from '@/lib/api/productsApi';
import { useCreateOfferMutation } from '@/lib/api/offersApi';
import { useSendMessageMutation } from '@/lib/api/chatApi';
import OfferModal from '@/components/shared/OfferModal';
import { toast } from '@/utils/toast';
import { formatPrice } from '@/utils/formatPrice';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { HiChevronDown, HiChevronUp, HiShieldCheck } from 'react-icons/hi2';
import { canUserPurchaseProduct } from '@/utils/productValidation';

interface ProductDetailsProps {
  productId: string;
}

// Product Details Skeleton Loading Component
const ProductDetailsSkeleton = ({ isRTL }: { isRTL: boolean }) => (
  <div className='bg-white min-h-screen' dir={isRTL ? 'rtl' : 'ltr'}>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
      {/* Breadcrumbs Skeleton */}
      <nav className='mb-4'>
        <div className='flex items-center gap-1.5'>
          <div className='h-4 bg-rich-sand/30 rounded w-16 skeleton-shimmer' />
          <div className='h-4 bg-rich-sand/30 rounded w-4 skeleton-shimmer' />
          <div className='h-4 bg-rich-sand/30 rounded w-20 skeleton-shimmer' />
          <div className='h-4 bg-rich-sand/30 rounded w-4 skeleton-shimmer' />
          <div className='h-4 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
          <div className='h-4 bg-rich-sand/30 rounded w-4 skeleton-shimmer' />
          <div className='h-4 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
        </div>
      </nav>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
        {/* Image Section Skeleton - Left Column */}
        <div className='lg:col-span-1'>
          <div className='sticky top-20'>
            {/* Main Image Skeleton */}
            <div className='relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden mb-3 skeleton-shimmer' />

            {/* Thumbnail Images Skeleton */}
            <div className='grid grid-cols-3 gap-2'>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className='aspect-square bg-rich-sand/20 rounded-lg skeleton-shimmer'
                />
              ))}
            </div>
          </div>
        </div>

        {/* Product Info Section Skeleton - Middle & Right Columns */}
        <div className='lg:col-span-2 space-y-4'>
          {/* Top Section Skeleton */}
          <div className='bg-white rounded-lg border border-rich-sand/20 p-5 space-y-4'>
            {/* Title Skeleton */}
            <div className='h-7 bg-rich-sand/30 rounded w-3/4 skeleton-shimmer' />

            {/* Price Skeleton */}
            <div className='h-8 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />

            {/* Attributes Skeleton */}
            <div className='flex gap-2'>
              <div className='h-4 bg-rich-sand/30 rounded w-20 skeleton-shimmer' />
              <div className='h-4 bg-rich-sand/30 rounded w-4 skeleton-shimmer' />
              <div className='h-4 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
              <div className='h-4 bg-rich-sand/30 rounded w-4 skeleton-shimmer' />
              <div className='h-4 bg-rich-sand/30 rounded w-16 skeleton-shimmer' />
            </div>

            {/* Action Buttons Skeleton */}
            <div className='flex gap-2.5 pt-2'>
              <div className='flex-1 h-10 bg-rich-sand/30 rounded-lg skeleton-shimmer' />
              <div className='flex-1 h-10 bg-rich-sand/30 rounded-lg skeleton-shimmer' />
            </div>

            {/* Buyer Protection Skeleton */}
            <div className='h-4 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
          </div>

          {/* Seller Info Section Skeleton */}
          <div className='bg-white rounded-lg border border-rich-sand/20 p-5'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 rounded-full bg-rich-sand/20 skeleton-shimmer' />
              <div className='flex-1 space-y-2'>
                <div className='h-5 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
              </div>
            </div>
          </div>

          {/* Details Sections Skeleton */}
          <div className='bg-white rounded-lg border border-rich-sand/20 p-5 space-y-4'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='space-y-2'>
                <div className='h-5 bg-rich-sand/30 rounded w-40 skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
                <div className='h-4 bg-rich-sand/30 rounded w-5/6 skeleton-shimmer' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const currentUser = useAppSelector(state => state.auth.user);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [sellerImageError, setSellerImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    itemDetails: true,
    productInfo: false,
    description: true,
    shipping: false,
    tags: false,
  });
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch product from API
  const {
    data: product,
    isLoading,
    error,
  } = useGetProductDetailQuery(productId, {
    skip: !productId,
  });

  // Save product mutation
  const [saveProduct, { isLoading: isSaving }] = useSaveProductMutation();

  // Create offer mutation
  const [createOffer, { isLoading: isCreatingOffer }] =
    useCreateOfferMutation();

  // Send message mutation
  const [sendMessage, { isLoading: isSendingMessage }] =
    useSendMessageMutation();

  // Normalize image URL (similar to ProductCard)
  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    // Clean any spaces in URL first
    let trimmed = url.trim().replace(/\s+/g, '');
    if (trimmed.includes('cdn.dolabb.com')) {
      try {
        // Extract the path after cdn.dolabb.com
        const urlObj = new URL(trimmed);
        const path = urlObj.pathname + urlObj.search;
        // Use Next.js proxy route - remove leading slash if present to avoid double slashes
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `/api/cdn${cleanPath}`;
      } catch (error) {
        // If URL parsing fails, try simple string replacement
        const path = trimmed.replace('https://cdn.dolabb.com', '').replace('http://cdn.dolabb.com', '');
        return `/api/cdn${path}`;
      }
    }
    return trimmed;
  };

  // Get product images from API response
  const getProductImages = (): string[] => {
    if (!product) return [];
    // Check for "Images" (capital I) first, then "images" (lowercase)
    const productWithImages = product as {
      Images?: string[];
      images?: string[];
    };
    const images = productWithImages.Images || productWithImages.images || [];
    // Filter out empty/invalid images and clean/normalize URLs
    return images
      .filter(
        img => img && img.trim() !== '' && img !== 'undefined' && img !== 'null'
      )
      .map(img => normalizeImageUrl(img));
  };

  const productImages = getProductImages();
  const likesCount = product?.likes || 0;

  // Get seller data from product (computed early to use in hooks)
  const sellerData = {
    username: product?.seller?.username || 'Unknown',
    rating: product?.seller?.rating || 0,
    reviews: 0, // Not available in API
    sold: product?.seller?.totalSales || 0,
    active: 'Active', // Not available in API
    profileImage: product?.seller?.profileImage || '',
  };

  // Check if current user can purchase this product
  const canPurchase = canUserPurchaseProduct(
    currentUser?.id,
    product?.seller?.id
  );

  // Reset seller image error when seller profile image changes
  // This must be called before any early returns to maintain hooks order
  useEffect(() => {
    if (sellerData.profileImage) {
      setSellerImageError(false);
    }
  }, [sellerData.profileImage]);

  // Auto carousel effect
  useEffect(() => {
    if (productImages.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setSelectedImage(prev => (prev + 1) % productImages.length);
      }, 4000); // Change image every 4 seconds

      return () => {
        if (carouselIntervalRef.current) {
          clearInterval(carouselIntervalRef.current);
        }
      };
    }
  }, [productImages.length]);

  // Pause carousel on hover
  const handleImageHover = () => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
    }
  };

  // Resume carousel on mouse leave
  const handleImageLeave = () => {
    if (productImages.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setSelectedImage(prev => (prev + 1) % productImages.length);
      }, 4000);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle offer submission
  const handleOfferSubmit = async (offerAmount: number) => {
    // Check authentication before proceeding
    if (!isAuthenticated) {
      toast.error(
        locale === 'en'
          ? 'Please login to make an offer'
          : 'يرجى تسجيل الدخول لعمل عرض'
      );
      router.push(`/${locale}/login`);
      return;
    }

    try {
      // Create the offer
      const offerResponse = await createOffer({
        productId: productId,
        offerAmount: offerAmount,
      }).unwrap();

      // Get seller ID from product
      const sellerId = product?.seller?.id;
      if (!sellerId) {
        throw new Error('Seller ID not found');
      }

      // Get offer ID from response (if available)
      const offerId = offerResponse?.offer?.id || null;

      // Send chat message to seller
      let chatMessageSent = false;
      try {
        await sendMessage({
          receiverId: sellerId,
          text:
            locale === 'en'
              ? `I've made an offer of SAR ${offerAmount.toFixed(2)} for "${product?.title || 'this product'}".`
              : `لقد قدمت عرضاً بقيمة ر.س ${offerAmount.toFixed(2)} على "${product?.title || 'هذا المنتج'}".`,
          productId: productId,
          attachments: [],
          offerId: offerId,
        }).unwrap();
        chatMessageSent = true;
      } catch (chatError: any) {
        // Log chat error but don't fail the whole process
        console.error('Failed to send chat message:', chatError);
        // If it's a 401, the interceptor will handle redirect, so we should return early
        if (chatError?.status === 401 || chatError?.response?.status === 401) {
          return; // Let the interceptor handle the redirect
        }
      }

      // Both APIs succeeded - show success message and redirect
      toast.success(
        locale === 'en'
          ? 'Offer created successfully!'
          : 'تم إنشاء العرض بنجاح!'
      );
      setShowOfferModal(false);

      // Verify token still exists before redirecting (in case it was cleared)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        // Redirect to messages page after both APIs succeed
        // Use window.location for a full page reload to ensure auth state is refreshed
        window.location.href = `/${locale}/messages`;
      } else {
        // Token was cleared (likely expired), redirect to login
        toast.error(
          locale === 'en'
            ? 'Your session has expired. Please login again.'
            : 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
        );
        router.push(`/${locale}/login`);
      }
    } catch (error: any) {
      // Check if it's a 401 error (handled by interceptor, but we catch it here too)
      if (error?.status === 401 || error?.response?.status === 401) {
        toast.error(
          locale === 'en'
            ? 'Your session has expired. Please login again.'
            : 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
        );
        router.push(`/${locale}/login`);
        return;
      }

      // Check for specific error messages from API
      const apiError = error?.data?.error || error?.data?.message;
      const errorMessage =
        apiError ||
        error?.message ||
        (locale === 'en'
          ? 'Failed to create offer. Please try again.'
          : 'فشل إنشاء العرض. يرجى المحاولة مرة أخرى.');
      
      // Show localized error message
      if (apiError === 'You cannot make an offer on your own product') {
        toast.error(
          locale === 'en'
            ? 'You cannot make an offer on your own product'
            : 'لا يمكنك تقديم عرض على منتجك الخاص'
        );
      } else {
      toast.error(errorMessage);
      }
      throw error; // Re-throw to prevent modal from closing on error
    }
  };

  // Loading state
  if (isLoading) {
    return <ProductDetailsSkeleton isRTL={isRTL} />;
  }

  // Error or not found state
  if (error || !product) {
    return (
      <div
        className='min-h-screen bg-white flex items-center justify-center'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='text-center'>
          <h1 className='text-xl font-semibold text-deep-charcoal mb-3'>
            {locale === 'en' ? 'Product not found' : 'المنتج غير موجود'}
          </h1>
          <Link
            href={`/${locale}`}
            className='text-sm text-saudi-green hover:text-saudi-green/80 font-medium'
          >
            {locale === 'en' ? 'Back to home' : 'العودة إلى الصفحة الرئيسية'}
          </Link>
        </div>
      </div>
    );
  }

  // Get product details from API product
  const getConditionLabel = (condition: string) => {
    const conditionMap: Record<string, { en: string; ar: string }> = {
      new: { en: 'Brand new', ar: 'جديد تماماً' },
      'like-new': { en: 'Like new', ar: 'شبه جديد' },
      good: { en: 'Used - Good', ar: 'مستعمل - جيد' },
      fair: { en: 'Used - Fair', ar: 'مستعمل - عادل' },
    };
    return conditionMap[condition] || { en: condition, ar: condition };
  };

  const conditionLabel = getConditionLabel(product.condition || 'new');

  const productDetails = {
    size: product.size || (product as any).Size || 'One Size',
    condition: locale === 'en' ? conditionLabel.en : conditionLabel.ar,
    brand: product.brand || 'Unknown',
    color: product.color || (product as any).Color || 'N/A',
    listed:
      product.createdAt || (product as any).created_at
        ? new Date(
            product.createdAt || (product as any).created_at
          ).toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Recently',
  };

  return (
    <div className='bg-white min-h-screen' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        {/* Breadcrumbs */}
        <nav className='mb-4'>
          <ol className='flex items-center gap-1.5 text-xs text-deep-charcoal/60 flex-wrap'>
            <li>
              <Link
                href={`/${locale}`}
                className='hover:text-deep-charcoal transition-colors'
              >
                {locale === 'en' ? 'Home' : 'الرئيسية'}
              </Link>
            </li>
            {product.brand && (
              <>
                <li>/</li>
                <li>
                  <Link
                    href={`/${locale}/browse?brand=${encodeURIComponent(
                      product.brand
                    )}`}
                    className='hover:text-deep-charcoal transition-colors'
                  >
                    {product.brand}
                  </Link>
                </li>
              </>
            )}
            {product.category && (
              <>
                <li>/</li>
                <li>
                  <Link
                    href={`/${locale}/browse?category=${encodeURIComponent(
                      product.category
                    )}`}
                    className='hover:text-deep-charcoal transition-colors'
                  >
                    {product.category.charAt(0).toUpperCase() +
                      product.category.slice(1)}
                  </Link>
                </li>
              </>
            )}
            {product.subcategory && (
              <>
                <li>/</li>
                <li>
                  <Link
                    href={`/${locale}/browse?category=${encodeURIComponent(
                      product.category || ''
                    )}&subcategory=${encodeURIComponent(product.subcategory)}`}
                    className='hover:text-deep-charcoal transition-colors'
                  >
                    {product.subcategory}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className='text-deep-charcoal/80'>{product.title}</li>
          </ol>
        </nav>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          {/* Image Section - Left Column */}
          <div className='lg:col-span-1'>
            <div className='sticky top-20'>
              {/* Main Image Carousel */}
              <div
                className='relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden mb-3'
                onMouseEnter={handleImageHover}
                onMouseLeave={handleImageLeave}
              >
                {productImages.length > 0 ? (
                  productImages.map((img, index) => {
                    const isProxied = img.startsWith('/api/cdn');
                    const shouldUnoptimize = 
                      imageError ||
                      img.includes('unsplash.com') ||
                      img.includes('cloudinary.com') ||
                      img.includes('onrender.com') ||
                      isProxied;
                    
                    return isProxied ? (
                      <img
                        key={index}
                        src={
                          imageError
                            ? `https://via.placeholder.com/600/006747/FFFFFF?text=${encodeURIComponent(
                                product.title || 'Product'
                              )}`
                            : img
                        }
                        alt={`${product.title || 'Product'} ${index + 1}`}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${
                          selectedImage === index
                            ? 'opacity-100'
                            : 'opacity-0 absolute'
                        }`}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <Image
                        key={index}
                        src={
                          imageError
                            ? `https://via.placeholder.com/600/006747/FFFFFF?text=${encodeURIComponent(
                                product.title || 'Product'
                              )}`
                            : img
                        }
                        alt={`${product.title || 'Product'} ${index + 1}`}
                        fill
                        className={`object-cover transition-opacity duration-500 ${
                          selectedImage === index
                            ? 'opacity-100'
                            : 'opacity-0 absolute'
                        }`}
                        onError={() => setImageError(true)}
                        unoptimized={shouldUnoptimize}
                      />
                    );
                  })
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-rich-sand to-saudi-green/10'>
                    <span className='text-deep-charcoal/40 text-sm text-center px-4'>
                      {product.title || 'No Image'}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {productImages.length > 0 && (
                <div className='grid grid-cols-3 gap-2'>
                  {productImages.slice(0, 3).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        // Reset carousel timer when manually selecting
                        if (carouselIntervalRef.current) {
                          clearInterval(carouselIntervalRef.current);
                        }
                        if (productImages.length > 1) {
                          carouselIntervalRef.current = setInterval(() => {
                            setSelectedImage(
                              prev => (prev + 1) % productImages.length
                            );
                          }, 4000);
                        }
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === index
                          ? 'border-saudi-green shadow-md'
                          : 'border-rich-sand/30 hover:border-saudi-green/50'
                      }`}
                    >
                      {img.startsWith('/api/cdn') ? (
                        <img
                          src={img}
                          alt={`${product.title || 'Product'} thumbnail ${
                            index + 1
                          }`}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <Image
                          src={img}
                          alt={`${product.title || 'Product'} thumbnail ${
                            index + 1
                          }`}
                          fill
                          className='object-cover'
                          unoptimized={
                            img.includes('unsplash.com') ||
                            img.includes('cloudinary.com') ||
                            img.includes('onrender.com')
                          }
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info Section - Middle & Right Columns */}
          <div className='lg:col-span-2 space-y-3 sm:space-y-4'>
            {/* Top Section - Title, Price, Attributes, Actions */}
            <div className='bg-white rounded-xl sm:rounded-lg border border-rich-sand/20 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm'>
              {/* Product Title */}
              <h1 className='text-lg sm:text-xl font-bold text-deep-charcoal leading-snug'>
                {product.title || (product as any).itemtitle}
              </h1>

              {/* Price - More prominent on mobile */}
              <div className='text-2xl sm:text-3xl font-bold text-saudi-green'>
                {formatPrice(
                  product.price,
                  locale,
                  2,
                  (product as any).Currency || (product as any).currency || product.currency
                )}
              </div>

              {/* Product Attributes - Pill style for mobile */}
              <div className='flex flex-wrap gap-2 sm:gap-0 sm:block text-sm text-deep-charcoal/70'>
                <span className='inline-flex items-center px-2.5 py-1 sm:px-0 sm:py-0 bg-rich-sand/20 sm:bg-transparent rounded-full sm:rounded-none'>
                  {locale === 'en'
                    ? `Size ${productDetails.size}`
                    : `المقاس ${productDetails.size}`}
                </span>
                <span className='hidden sm:inline mx-2'>•</span>
                <span className='inline-flex items-center px-2.5 py-1 sm:px-0 sm:py-0 bg-rich-sand/20 sm:bg-transparent rounded-full sm:rounded-none'>
                  {locale === 'en' ? productDetails.condition : 'حالة ممتازة'}
                </span>
                <span className='hidden sm:inline mx-2'>•</span>
                <Link
                  href={`/${locale}/brands/${productDetails.brand.toLowerCase()}`}
                  className='inline-flex items-center px-2.5 py-1 sm:px-0 sm:py-0 bg-saudi-green/10 sm:bg-transparent text-saudi-green sm:text-deep-charcoal rounded-full sm:rounded-none font-medium sm:font-normal hover:text-saudi-green transition-colors'
                >
                  {productDetails.brand}
                </Link>
              </div>

              {/* Action Buttons - Stacked on mobile for better touch targets */}
              <div className='flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2'>
                {canPurchase ? (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error(
                        locale === 'en'
                          ? 'Please login to make an offer'
                          : 'يرجى تسجيل الدخول لعمل عرض'
                      );
                      router.push(`/${locale}/login`);
                      return;
                    }
                    setShowOfferModal(true);
                  }}
                  className='w-full sm:flex-1 bg-saudi-green text-white py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg font-semibold text-base sm:text-sm hover:bg-saudi-green/90 active:scale-[0.98] transition-all cursor-pointer shadow-sm'
                >
                  {locale === 'en' ? 'Make an Offer' : 'قدم عرضاً'}
                </button>
                ) : (
                  <div className='w-full bg-rich-sand/20 border border-rich-sand/40 text-deep-charcoal/70 py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg font-medium text-sm text-center px-4'>
                    {locale === 'en'
                      ? 'This is your own product'
                      : 'هذا منتجك الخاص'}
                  </div>
                )}
                {canPurchase && (
                  <button
                    onClick={async () => {
                      // Check authentication first
                      if (!isAuthenticated) {
                        toast.error(
                          locale === 'en'
                            ? 'Please login to add items to bag'
                            : 'يرجى تسجيل الدخول لإضافة المنتجات إلى الحقيبة'
                        );
                        router.push(`/${locale}/login`);
                        return;
                      }

                      // Add to bag logic - call save product API
                      try {
                        await saveProduct(productId).unwrap();
                        toast.success(
                          locale === 'en'
                            ? 'Item added to bag!'
                            : 'تم إضافة المنتج إلى الحقيبة!'
                        );
                      } catch (error: any) {
                        // Check if it's an authentication error
                        if (error?.status === 401 || error?.response?.status === 401) {
                          toast.error(
                            locale === 'en'
                              ? 'Your session has expired. Please login again.'
                              : 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
                          );
                          router.push(`/${locale}/login`);
                          return;
                        }
                        toast.error(
                          locale === 'en'
                            ? 'Failed to add item to bag. Please try again.'
                            : 'فشل إضافة المنتج إلى الحقيبة. يرجى المحاولة مرة أخرى.'
                        );
                      }
                    }}
                    disabled={isSaving}
                    className='w-full sm:flex-1 bg-white border-2 border-saudi-green text-saudi-green py-3.5 sm:py-2.5 rounded-xl sm:rounded-lg font-semibold text-base sm:text-sm hover:bg-saudi-green/5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isSaving
                      ? locale === 'en'
                        ? 'Adding...'
                        : 'جاري الإضافة...'
                      : locale === 'en'
                      ? 'Add to Bag'
                      : 'أضف إلى الحقيبة'}
                  </button>
                )}
              </div>

              {/* Buyer Protection - Card style on mobile */}
              <div className='flex items-center gap-3 p-3 sm:p-0 bg-emerald-50/50 sm:bg-transparent rounded-lg sm:rounded-none mt-2'>
                <div className='w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center bg-saudi-green/10 sm:bg-transparent rounded-full shrink-0'>
                  <HiShieldCheck className='w-4 h-4 sm:w-3.5 sm:h-3.5 text-saudi-green sm:text-deep-charcoal/50' />
                </div>
                <p className='text-xs sm:text-xs text-deep-charcoal/70 sm:text-deep-charcoal/60'>
                  {locale === 'en' ? (
                    <>
                      Buyer Protection included.{' '}
                      <Link
                        href='#'
                        className='text-saudi-green sm:text-deep-charcoal underline hover:text-saudi-green font-medium sm:font-normal'
                      >
                        Learn more
                      </Link>
                    </>
                  ) : (
                    <>
                      حماية المشتري مشمولة.{' '}
                      <Link
                        href='#'
                        className='text-saudi-green sm:text-deep-charcoal underline hover:text-saudi-green font-medium sm:font-normal'
                      >
                        اعرف المزيد
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Seller Information */}
            <div className='bg-white rounded-xl sm:rounded-lg border border-rich-sand/20 p-4 sm:p-5 shadow-sm'>
              <div className='flex items-center gap-3 sm:gap-3 mb-3 sm:mb-3'>
                <div className='relative w-14 h-14 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-rich-sand/30 shrink-0 ring-2 ring-saudi-green/20'>
                  {sellerData.profileImage && !sellerImageError ? (
                    <Image
                      key={sellerData.profileImage}
                      src={sellerData.profileImage}
                      alt={sellerData.username}
                      fill
                      className='object-cover'
                      unoptimized
                      onError={() => {
                        setSellerImageError(true);
                      }}
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center bg-saudi-green text-white font-bold text-lg sm:text-xs'>
                      {sellerData.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-0.5 sm:mb-1'>
                    <div className='font-bold text-deep-charcoal text-base sm:text-sm'>
                      {sellerData.username}
                    </div>
                  </div>
                  <div className='flex items-center gap-1.5 mb-1'>
                    {[...Array(sellerData.rating)].map((_, i) => (
                      <FaStar
                        key={i}
                        className='w-3.5 h-3.5 sm:w-3 sm:h-3 text-amber-400 fill-current'
                      />
                    ))}
                    <span className='text-sm sm:text-xs text-deep-charcoal/70 font-medium'>
                      {sellerData.rating > 0 ? sellerData.rating.toFixed(1) : locale === 'en' ? 'New' : 'جديد'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-xs sm:text-xs text-deep-charcoal/60'>
                    <span className='inline-flex items-center gap-1'>
                      <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full'></span>
                      {locale === 'en' ? 'Active' : 'نشط'}
                    </span>
                    <span>•</span>
                    <span>{sellerData.sold} {locale === 'en' ? 'sold' : 'مباع'}</span>
                  </div>
                </div>
              </div>
              {canPurchase ? (
                <button
                  onClick={() => {
                    // Check authentication first
                    if (!isAuthenticated) {
                      toast.error(
                        locale === 'en'
                          ? 'Please login to chat with the seller'
                          : 'يرجى تسجيل الدخول للدردشة مع البائع'
                      );
                      router.push(`/${locale}/login`);
                      return;
                    }

                    // Get seller ID from product
                    const sellerId = product?.seller?.id;
                    if (!sellerId) {
                      toast.error(
                        locale === 'en'
                          ? 'Seller information not available'
                          : 'معلومات البائع غير متاحة'
                      );
                      return;
                    }

                    // Navigate to messages page with sellerId query parameter
                    router.push(`/${locale}/messages?sellerId=${sellerId}`);
                  }}
                  className='w-full bg-deep-charcoal text-white py-3 sm:py-2 rounded-xl sm:rounded-lg font-semibold text-base sm:text-sm hover:bg-deep-charcoal/90 active:scale-[0.98] transition-all cursor-pointer'
                >
                  {locale === 'en' ? 'Message Seller' : 'راسل البائع'}
                </button>
              ) : (
                <div className='w-full bg-rich-sand/10 text-deep-charcoal/50 py-3 sm:py-2 rounded-xl sm:rounded-lg font-medium text-sm text-center'>
                  {locale === 'en' ? 'This is your listing' : 'هذا إعلانك'}
                </div>
              )}
            </div>

            {/* Collapsible Sections */}
            <div className='space-y-2 sm:space-y-3'>
              {/* Item Details */}
              <div className='bg-white rounded-xl sm:rounded-lg border border-rich-sand/20 overflow-hidden shadow-sm'>
                <button
                  onClick={() => toggleSection('itemDetails')}
                  className='w-full flex items-center justify-between p-4 sm:p-4 hover:bg-rich-sand/10 active:bg-rich-sand/20 transition-colors cursor-pointer'
                >
                  <h2 className='text-base sm:text-sm font-bold sm:font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Item Details' : 'تفاصيل العنصر'}
                  </h2>
                  <div className='w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center bg-rich-sand/20 sm:bg-transparent rounded-full'>
                    {expandedSections.itemDetails ? (
                      <HiChevronUp className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    ) : (
                      <HiChevronDown className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    )}
                  </div>
                </button>
                {expandedSections.itemDetails && (
                  <div className='px-4 pb-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3'>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en'
                            ? 'Brand'
                            : 'العلامة التجارية'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {productDetails.brand}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Category' : 'الفئة'}
                        </span>
                        <Link
                          href={`/${locale}/${product.category || 'browse'}`}
                          className='text-sm text-saudi-green font-semibold hover:underline'
                        >
                          {product.category
                            ? product.category.charAt(0).toUpperCase() +
                              product.category.slice(1)
                            : locale === 'en'
                            ? 'N/A'
                            : 'غير متاح'}
                        </Link>
                      </div>
                      {product.subcategory && (
                        <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                          <span className='text-sm text-deep-charcoal/70'>
                            {locale === 'en' ? 'Subcategory' : 'الفئة الفرعية'}
                          </span>
                          <Link
                            href={`/${locale}/${
                              product.category || 'browse'
                            }?subcategory=${product.subcategory}`}
                            className='text-sm text-saudi-green font-semibold hover:underline'
                          >
                            {product.subcategory}
                          </Link>
                        </div>
                      )}
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Condition' : 'الحالة'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {locale === 'en'
                            ? productDetails.condition
                            : 'حالة ممتازة'}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Size' : 'المقاس'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {productDetails.size}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b-0 sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Quantity' : 'الكمية'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {(product as any).Quantity || product.quantity || 1}
                        </span>
                      </div>
                      {(product as any).Gender && (
                        <div className='flex justify-between items-center py-2 sm:py-0 border-rich-sand/10'>
                          <span className='text-sm text-deep-charcoal/70'>
                            {locale === 'en' ? 'Gender' : 'الجنس'}
                          </span>
                          <span className='text-sm text-deep-charcoal font-semibold'>
                            {(product as any).Gender}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div className='bg-white rounded-xl sm:rounded-lg border border-rich-sand/20 overflow-hidden shadow-sm'>
                <button
                  onClick={() => toggleSection('productInfo')}
                  className='w-full flex items-center justify-between p-4 sm:p-4 hover:bg-rich-sand/10 active:bg-rich-sand/20 transition-colors cursor-pointer'
                >
                  <h2 className='text-base sm:text-sm font-bold sm:font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Product Information' : 'معلومات المنتج'}
                  </h2>
                  <div className='w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center bg-rich-sand/20 sm:bg-transparent rounded-full'>
                    {expandedSections.productInfo ? (
                      <HiChevronUp className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    ) : (
                      <HiChevronDown className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    )}
                  </div>
                </button>
                {expandedSections.productInfo && (
                  <div className='px-4 pb-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3'>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en'
                            ? 'Has Variants'
                            : 'يحتوي على متغيرات'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {locale === 'en' ? 'No' : 'لا'}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Custom Size' : 'مقاس مخصص'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {locale === 'en' ? 'No' : 'لا'}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Listed on' : 'تاريخ الإدراج'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {product.createdAt || (product as any).created_at
                            ? new Date(
                                product.createdAt || (product as any).created_at
                              ).toLocaleDateString(
                                locale === 'en' ? 'en-US' : 'ar-SA',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )
                            : locale === 'en'
                            ? 'N/A'
                            : 'غير متاح'}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b-0 sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Processing' : 'وقت المعالجة'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {product.shippingInfo?.estimatedDays ||
                          (product as any)['Processing Time (days)']
                            ? `${
                                product.shippingInfo?.estimatedDays ||
                                (product as any)['Processing Time (days)']
                              } ${
                                locale === 'en' ? 'days' : 'يوم'
                              }`
                            : locale === 'en'
                            ? 'N/A'
                            : 'غير متاح'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className='bg-white rounded-xl sm:rounded-lg border border-rich-sand/20 overflow-hidden shadow-sm'>
                <button
                  onClick={() => toggleSection('description')}
                  className='w-full flex items-center justify-between p-4 sm:p-4 hover:bg-rich-sand/10 active:bg-rich-sand/20 transition-colors cursor-pointer'
                >
                  <h2 className='text-base sm:text-sm font-bold sm:font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Description' : 'الوصف'}
                  </h2>
                  <div className='w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center bg-rich-sand/20 sm:bg-transparent rounded-full'>
                    {expandedSections.description ? (
                      <HiChevronUp className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    ) : (
                      <HiChevronDown className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    )}
                  </div>
                </button>
                {expandedSections.description && (
                  <div className='px-4 pb-4'>
                    <div className='space-y-3 text-sm sm:text-sm text-deep-charcoal/80 leading-relaxed'>
                      {productDetails.color &&
                        productDetails.color !== 'N/A' && (
                          <div className='inline-flex items-center gap-2 px-3 py-1.5 bg-rich-sand/20 rounded-full'>
                            <span className='w-3 h-3 rounded-full bg-deep-charcoal/30'></span>
                            <span className='text-sm font-medium text-deep-charcoal'>{productDetails.color}</span>
                          </div>
                        )}
                      <p className='text-xs text-deep-charcoal/50 uppercase tracking-wider'>
                        {locale === 'en'
                          ? `Listed ${productDetails.listed}`
                          : `مُدرج ${productDetails.listed}`}
                      </p>
                      <p className='whitespace-pre-wrap text-deep-charcoal/70 leading-6'>
                        {product.description ||
                          (locale === 'en'
                            ? 'No description available.'
                            : 'لا يوجد وصف متاح.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping */}
              <div className='bg-white rounded-xl sm:rounded-lg border border-rich-sand/20 overflow-hidden shadow-sm'>
                <button
                  onClick={() => toggleSection('shipping')}
                  className='w-full flex items-center justify-between p-4 sm:p-4 hover:bg-rich-sand/10 active:bg-rich-sand/20 transition-colors cursor-pointer'
                >
                  <h2 className='text-base sm:text-sm font-bold sm:font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Shipping' : 'الشحن'}
                  </h2>
                  <div className='w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center bg-rich-sand/20 sm:bg-transparent rounded-full'>
                    {expandedSections.shipping ? (
                      <HiChevronUp className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    ) : (
                      <HiChevronDown className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    )}
                  </div>
                </button>
                {expandedSections.shipping && (
                  <div className='px-4 pb-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3'>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Shipping Cost' : 'تكلفة الشحن'}
                        </span>
                        <span className='text-sm text-saudi-green font-bold'>
                          {formatPrice(
                            product.shippingInfo?.cost ||
                            (product as any)['Shipping Cost'] ||
                            0,
                            locale,
                            2,
                            (product as any).Currency || (product as any).currency || product.currency
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between items-center py-2 sm:py-0 border-b sm:border-0 border-rich-sand/10'>
                        <span className='text-sm text-deep-charcoal/70'>
                          {locale === 'en' ? 'Delivery Time' : 'وقت التوصيل'}
                        </span>
                        <span className='text-sm text-deep-charcoal font-semibold'>
                          {product.shippingInfo?.estimatedDays ||
                          (product as any)['Processing Time (days)']
                            ? `${
                                product.shippingInfo?.estimatedDays ||
                                (product as any)['Processing Time (days)']
                              } ${locale === 'en' ? 'days' : 'أيام'}`
                            : locale === 'en'
                            ? 'Contact seller'
                            : 'تواصل مع البائع'}
                        </span>
                      </div>
                      {product.shippingInfo?.locations ||
                      (product as any)['Shipping Locations'] ? (
                        <div className='flex justify-between items-center py-2 sm:py-0 border-b-0 sm:border-0 border-rich-sand/10 col-span-1 sm:col-span-2'>
                          <span className='text-sm text-deep-charcoal/70'>
                            {locale === 'en'
                              ? 'Ships to'
                              : 'يشحن إلى'}
                          </span>
                          <span className='text-sm text-deep-charcoal font-semibold'>
                            {(
                              product.shippingInfo?.locations ||
                              (product as any)['Shipping Locations'] ||
                              []
                            ).join(', ')}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className='bg-white rounded-xl sm:rounded-lg border border-rich-sand/20 overflow-hidden shadow-sm'>
                <button
                  onClick={() => toggleSection('tags')}
                  className='w-full flex items-center justify-between p-4 sm:p-4 hover:bg-rich-sand/10 active:bg-rich-sand/20 transition-colors cursor-pointer'
                >
                  <h2 className='text-base sm:text-sm font-bold sm:font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Tags' : 'العلامات'}
                  </h2>
                  <div className='w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center bg-rich-sand/20 sm:bg-transparent rounded-full'>
                    {expandedSections.tags ? (
                      <HiChevronUp className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    ) : (
                      <HiChevronDown className='w-5 h-5 sm:w-4 sm:h-4 text-deep-charcoal/60' />
                    )}
                  </div>
                </button>
                {expandedSections.tags && (
                  <div className='px-4 pb-4'>
                    <div className='flex flex-wrap gap-2'>
                      {(product.tags || (product as any)['Tags/Keywords'] || [])
                        .length > 0 ? (
                        (
                          product.tags ||
                          (product as any)['Tags/Keywords'] ||
                          []
                        ).map((tag: string) => (
                          <span
                            key={tag}
                            className='px-3 py-1.5 sm:px-2.5 sm:py-1 bg-saudi-green/10 text-saudi-green rounded-full text-sm sm:text-xs font-semibold sm:font-medium hover:bg-saudi-green/20 transition-colors cursor-pointer'
                          >
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <p className='text-deep-charcoal/50 text-sm'>
                          {locale === 'en'
                            ? 'No tags available'
                            : 'لا توجد علامات متاحة'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      <OfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        productPrice={product.price}
        productTitle={product.title || (product as any).itemtitle || 'Product'}
        onSubmit={handleOfferSubmit}
        isLoading={isCreatingOffer || isSendingMessage}
        currency={(product as any).Currency || (product as any).currency || product.currency}
      />
    </div>
  );
}
