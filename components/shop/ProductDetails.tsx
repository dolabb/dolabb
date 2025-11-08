'use client';

import { featuredProducts, trendingProducts } from '@/data/products';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { HiChevronDown, HiChevronUp, HiShieldCheck } from 'react-icons/hi2';

interface ProductDetailsProps {
  productId: string;
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    itemDetails: true,
    productInfo: false,
    description: true,
    shipping: false,
    tags: false,
  });
  const likesCount = 92;
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Find product from featured or trending
  const allProducts = [...featuredProducts, ...trendingProducts];
  const product = allProducts.find(p => p.id === productId) || null;

  // Generate multiple images for carousel
  // For demo, using the same image 3 times (in production, use actual product images array)
  const productImages = product
    ? [product.image, product.image, product.image]
    : [];

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

  if (!product) {
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

  // Mock seller data
  const sellerData = {
    username: 'summernorton_',
    rating: 5,
    reviews: 5,
    sold: 22,
    active: 'over a week ago',
    profileImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  };

  // Mock product details
  const productDetails = {
    size: 'XS',
    condition: 'Excellent condition',
    brand: 'Garage',
    color: 'Black',
    listed: '5 months ago',
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
            <li>/</li>
            <li>
              <Link
                href={`/${locale}/brands`}
                className='hover:text-deep-charcoal transition-colors'
              >
                {locale === 'en' ? 'Brands' : 'العلامات التجارية'}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={`/${locale}/brands/garage`}
                className='hover:text-deep-charcoal transition-colors'
              >
                Garage
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={`/${locale}/women`}
                className='hover:text-deep-charcoal transition-colors'
              >
                {locale === 'en' ? 'Women' : 'نساء'}
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={`/${locale}/women/tops`}
                className='hover:text-deep-charcoal transition-colors'
              >
                {locale === 'en' ? 'Tops' : 'قمصان'}
              </Link>
            </li>
            <li>/</li>
            <li className='text-deep-charcoal/80'>
              {locale === 'en' ? 'Crop tops' : 'قمصان قصيرة'}
            </li>
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
                {productImages.map((img, index) => (
                  <Image
                    key={index}
                    src={
                      imageError
                        ? `https://via.placeholder.com/600/006747/FFFFFF?text=${encodeURIComponent(
                            product.title
                          )}`
                        : img
                    }
                    alt={`${product.title} ${index + 1}`}
                    fill
                    className={`object-cover transition-opacity duration-500 ${
                      selectedImage === index
                        ? 'opacity-100'
                        : 'opacity-0 absolute'
                    }`}
                    onError={() => setImageError(true)}
                    unoptimized={img.includes('unsplash.com') || imageError}
                  />
                ))}
              </div>

              {/* Thumbnail Images */}
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
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-saudi-green shadow-md'
                        : 'border-rich-sand/30 hover:border-saudi-green/50'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} thumbnail ${index + 1}`}
                      fill
                      className='object-cover'
                      unoptimized={img.includes('unsplash.com')}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info Section - Middle & Right Columns */}
          <div className='lg:col-span-2 space-y-4'>
            {/* Top Section - Title, Price, Attributes, Actions */}
            <div className='bg-white rounded-lg border border-rich-sand/20 p-5 space-y-4'>
              {/* Product Title */}
              <h1 className='text-xl font-semibold text-deep-charcoal leading-tight'>
                {product.title}
              </h1>

              {/* Price */}
              <div className='text-2xl font-semibold text-deep-charcoal'>
                {locale === 'ar' ? 'ر.س' : 'SAR'} {product.price.toFixed(2)}
              </div>

              {/* Product Attributes */}
              <div className='text-sm text-deep-charcoal/70'>
                <span>
                  {locale === 'en'
                    ? `Size ${productDetails.size}`
                    : `المقاس ${productDetails.size}`}
                </span>
                <span className='mx-2'>•</span>
                <span>
                  {locale === 'en' ? productDetails.condition : 'حالة ممتازة'}
                </span>
                <span className='mx-2'>•</span>
                <Link
                  href={`/${locale}/brands/${productDetails.brand.toLowerCase()}`}
                  className='text-deep-charcoal hover:text-saudi-green transition-colors'
                >
                  {productDetails.brand}
                </Link>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-2.5 pt-2'>
                <button className='flex-1 bg-white border border-saudi-green text-saudi-green py-2.5 rounded-lg font-medium text-sm hover:bg-saudi-green/5 transition-colors'>
                  {locale === 'en' ? 'Make offer' : 'قدم عرضاً'}
                </button>
                <button className='flex-1 bg-white border border-saudi-green text-saudi-green py-2.5 rounded-lg font-medium text-sm hover:bg-saudi-green/5 transition-colors'>
                  {locale === 'en' ? 'Add to bag' : 'أضف إلى الحقيبة'}
                </button>
              </div>

              {/* Buyer Protection */}
              <div className='flex items-start gap-2 pt-2 text-xs text-deep-charcoal/60'>
                <HiShieldCheck className='w-3.5 h-3.5 text-deep-charcoal/50 mt-0.5 shrink-0' />
                <p>
                  {locale === 'en' ? (
                    <>
                      All purchases through Depop are covered by Buyer
                      Protection.{' '}
                      <Link
                        href='#'
                        className='text-deep-charcoal underline hover:text-saudi-green'
                      >
                        Learn more
                      </Link>
                    </>
                  ) : (
                    <>
                      جميع المشتريات من خلال Depop مغطاة بحماية المشتري.{' '}
                      <Link
                        href='#'
                        className='text-deep-charcoal underline hover:text-saudi-green'
                      >
                        اعرف المزيد
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Seller Information */}
            <div className='bg-white rounded-lg border border-rich-sand/20 p-5'>
              <div className='flex items-start gap-3 mb-3'>
                <div className='relative w-10 h-10 rounded-full overflow-hidden bg-rich-sand/30 shrink-0'>
                  <Image
                    src={sellerData.profileImage}
                    alt={sellerData.username}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Link
                      href={`/${locale}/seller/${sellerData.username}`}
                      className='font-semibold text-deep-charcoal hover:text-saudi-green transition-colors text-sm'
                    >
                      {sellerData.username}
                    </Link>
                  </div>
                  <div className='flex items-center gap-1.5 mb-1'>
                    {[...Array(sellerData.rating)].map((_, i) => (
                      <FaStar
                        key={i}
                        className='w-3 h-3 text-coral-red fill-current'
                      />
                    ))}
                    <span className='text-xs text-deep-charcoal/70'>
                      ({sellerData.reviews})
                    </span>
                  </div>
                  <p className='text-xs text-deep-charcoal/60'>
                    {sellerData.sold} {locale === 'en' ? 'sold' : 'مباع'} •{' '}
                    {locale === 'en'
                      ? `Active ${sellerData.active}`
                      : `نشط ${sellerData.active}`}
                  </p>
                </div>
              </div>
              <button className='w-full bg-white border border-saudi-green text-saudi-green py-2 rounded-lg font-medium text-sm hover:bg-saudi-green/5 transition-colors'>
                {locale === 'en' ? 'Ask a question' : 'اسأل سؤالاً'}
              </button>
            </div>

            {/* Collapsible Sections */}
            <div className='space-y-3'>
              {/* Item Details */}
              <div className='bg-white rounded-lg border border-rich-sand/20 overflow-hidden'>
                <button
                  onClick={() => toggleSection('itemDetails')}
                  className='w-full flex items-center justify-between p-4 hover:bg-rich-sand/10 transition-colors'
                >
                  <h2 className='text-sm font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Item Details' : 'تفاصيل العنصر'}
                  </h2>
                  {expandedSections.itemDetails ? (
                    <HiChevronUp className='w-4 h-4 text-deep-charcoal/60' />
                  ) : (
                    <HiChevronDown className='w-4 h-4 text-deep-charcoal/60' />
                  )}
                </button>
                {expandedSections.itemDetails && (
                  <div className='px-4 pb-4'>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en'
                            ? 'Brand name'
                            : 'اسم العلامة التجارية'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {productDetails.brand}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Category' : 'الفئة'}
                        </span>
                        <Link
                          href={`/${locale}/women`}
                          className='text-deep-charcoal font-medium hover:text-saudi-green text-right'
                        >
                          {locale === 'en' ? 'Women' : 'نساء'}
                        </Link>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Subcategory' : 'الفئة الفرعية'}
                        </span>
                        <Link
                          href={`/${locale}/women/tops`}
                          className='text-deep-charcoal font-medium hover:text-saudi-green text-right'
                        >
                          {locale === 'en' ? 'Tops' : 'قمصان'}
                        </Link>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Condition' : 'الحالة'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {locale === 'en'
                            ? productDetails.condition
                            : 'حالة ممتازة'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Size' : 'المقاس'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {productDetails.size}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Quantity' : 'الكمية'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          1
                        </span>
                      </div>
                      <div className='flex justify-between col-span-2'>
                        <span className='text-deep-charcoal/70'>SKU</span>
                        <span className='text-deep-charcoal font-medium'>
                          SKU-{product.id.padStart(4, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div className='bg-white rounded-lg border border-rich-sand/20 overflow-hidden'>
                <button
                  onClick={() => toggleSection('productInfo')}
                  className='w-full flex items-center justify-between p-4 hover:bg-rich-sand/10 transition-colors'
                >
                  <h2 className='text-sm font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Product Information' : 'معلومات المنتج'}
                  </h2>
                  {expandedSections.productInfo ? (
                    <HiChevronUp className='w-4 h-4 text-deep-charcoal/60' />
                  ) : (
                    <HiChevronDown className='w-4 h-4 text-deep-charcoal/60' />
                  )}
                </button>
                {expandedSections.productInfo && (
                  <div className='px-4 pb-4'>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en'
                            ? 'Has Variants'
                            : 'يحتوي على متغيرات'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {locale === 'en' ? 'No' : 'لا'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Custom Size' : 'مقاس مخصص'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {locale === 'en' ? 'No' : 'لا'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Created at' : 'تاريخ الإنشاء'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {locale === 'en' ? '2024-01-15' : '15-01-2024'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Processing Time' : 'وقت المعالجة'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {locale === 'en'
                            ? '1-2 business days'
                            : '1-2 أيام عمل'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className='bg-white rounded-lg border border-rich-sand/20 overflow-hidden'>
                <button
                  onClick={() => toggleSection('description')}
                  className='w-full flex items-center justify-between p-4 hover:bg-rich-sand/10 transition-colors'
                >
                  <h2 className='text-sm font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Description' : 'الوصف'}
                  </h2>
                  {expandedSections.description ? (
                    <HiChevronUp className='w-4 h-4 text-deep-charcoal/60' />
                  ) : (
                    <HiChevronDown className='w-4 h-4 text-deep-charcoal/60' />
                  )}
                </button>
                {expandedSections.description && (
                  <div className='px-4 pb-4'>
                    <div className='space-y-2 text-sm text-deep-charcoal/80 leading-relaxed'>
                      <p>{product.title}</p>
                      <p>• {productDetails.color}</p>
                      <p className='text-xs text-deep-charcoal/60 uppercase tracking-wide'>
                        {locale === 'en'
                          ? `LISTED ${productDetails.listed.toUpperCase()}`
                          : `مُدرج منذ ${productDetails.listed}`}
                      </p>
                      <p className='pt-2'>
                        {locale === 'en'
                          ? 'This is a beautiful, high-quality item in excellent condition. Perfect for adding to your collection or wardrobe. Authentic and carefully maintained.'
                          : 'هذه قطعة جميلة وعالية الجودة في حالة ممتازة. مثالية لإضافتها إلى مجموعتك أو خزانة ملابسك. أصلية ومحفوظة بعناية.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping */}
              <div className='bg-white rounded-lg border border-rich-sand/20 overflow-hidden'>
                <button
                  onClick={() => toggleSection('shipping')}
                  className='w-full flex items-center justify-between p-4 hover:bg-rich-sand/10 transition-colors'
                >
                  <h2 className='text-sm font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Shipping' : 'الشحن'}
                  </h2>
                  {expandedSections.shipping ? (
                    <HiChevronUp className='w-4 h-4 text-deep-charcoal/60' />
                  ) : (
                    <HiChevronDown className='w-4 h-4 text-deep-charcoal/60' />
                  )}
                </button>
                {expandedSections.shipping && (
                  <div className='px-4 pb-4'>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Price' : 'السعر'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {locale === 'en' ? '$5.99' : '5.99 دولار'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Processing Time' : 'وقت المعالجة'}
                        </span>
                        <span className='text-deep-charcoal font-medium'>
                          {locale === 'en'
                            ? '1-2 business days'
                            : '1-2 أيام عمل'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className='bg-white rounded-lg border border-rich-sand/20 overflow-hidden'>
                <button
                  onClick={() => toggleSection('tags')}
                  className='w-full flex items-center justify-between p-4 hover:bg-rich-sand/10 transition-colors'
                >
                  <h2 className='text-sm font-semibold text-deep-charcoal'>
                    {locale === 'en' ? 'Tags' : 'العلامات'}
                  </h2>
                  {expandedSections.tags ? (
                    <HiChevronUp className='w-4 h-4 text-deep-charcoal/60' />
                  ) : (
                    <HiChevronDown className='w-4 h-4 text-deep-charcoal/60' />
                  )}
                </button>
                {expandedSections.tags && (
                  <div className='px-4 pb-4'>
                    <div className='flex flex-wrap gap-2'>
                      {['vintage', 'casual', 'black', 'crop top', 'summer'].map(
                        tag => (
                          <Link
                            key={tag}
                            href={`/${locale}/search?q=${tag}`}
                            className='px-2.5 py-1 bg-rich-sand/30 text-deep-charcoal rounded-full text-xs font-medium hover:bg-rich-sand hover:text-saudi-green transition-colors'
                          >
                            #{tag}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
