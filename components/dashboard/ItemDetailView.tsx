'use client';

import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import {
  productsApi,
  useDeleteProductMutation,
  useGetProductDetailQuery,
} from '@/lib/api/productsApi';
import { useAppDispatch } from '@/lib/store/hooks';
import { formatPrice } from '@/utils/formatPrice';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { HiArrowLeft, HiPencil, HiTrash } from 'react-icons/hi2';

interface ItemDetailViewProps {
  itemId: string;
}

export default function ItemDetailView({ itemId }: ItemDetailViewProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const router = useRouter();
  const dispatch = useAppDispatch();

  // ALL HOOKS MUST BE CALLED AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sellerImageError, setSellerImageError] = useState(false);

  // Image zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Only fetch if itemId is valid
  const {
    data: product,
    isLoading,
    error,
    isFetching,
    isSuccess,
  } = useGetProductDetailQuery(itemId, {
    skip: !itemId,
  });
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Log for debugging - API call initiation
  useEffect(() => {
    if (itemId) {
      console.log('=== PRODUCT DETAILS API CALL ===');
      console.log('Fetching product details for ID:', itemId);
      console.log('API Endpoint: /api/products/' + itemId + '/');
      console.log('Timestamp:', new Date().toISOString());
    }
  }, [itemId]);

  // Log for debugging - API response
  useEffect(() => {
    if (isLoading || isFetching) {
      console.log('Product details API: Loading...');
    }
    if (isSuccess && product) {
      console.log('=== PRODUCT DETAILS API RESPONSE ===');
      console.log('Status: Success');
      console.log('Product ID:', product.id);
      console.log('Product Title:', product.title);
      console.log(
        'Product Quantity:',
        (product as any).Quantity ?? product.quantity
      );
      console.log(
        'Is Out of Stock:',
        product.isOutOfStock ??
          (product.quantity === null ||
            product.quantity === undefined ||
            product.quantity <= 0)
      );
      console.log('Full Product Data:', product);
      console.log('Timestamp:', new Date().toISOString());
      console.log('===================================');
    }
    if (error) {
      console.error('=== PRODUCT DETAILS API ERROR ===');
      console.error('Error fetching product details:', error);
      console.error('Product ID:', itemId);
      console.error('Timestamp:', new Date().toISOString());
      console.error('================================');
    }
  }, [isLoading, isFetching, isSuccess, product, error, itemId]);

  // Helper to get images from API (handles both "Images" and "images")
  const getProductImages = (): string[] => {
    if (!product) return [];
    // Check for "Images" (capital I) first, then "images" (lowercase)
    const productWithImages = product as {
      Images?: string[];
      images?: string[];
    };
    return productWithImages.Images || productWithImages.images || [];
  };

  // Get product images - use empty array as fallback
  const productImages = getProductImages();

  // Reset selected image index when product changes
  useEffect(() => {
    if (product && productImages.length > 0) {
      setSelectedImageIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  // Reset seller image error when seller profile image changes
  useEffect(() => {
    setSellerImageError(false);
  }, [product?.seller?.profileImage]);

  // Ensure selectedImageIndex is valid
  const validImageIndex =
    selectedImageIndex >= productImages.length ? 0 : selectedImageIndex;
  const mainImage = productImages[validImageIndex] || productImages[0] || '';

  const handleDelete = async () => {
    try {
      await deleteProduct(itemId).unwrap();
      toast.success('Product deleted successfully');
      // Invalidate and refetch seller products, featured products, and trending products
      dispatch(
        productsApi.util.invalidateTags([
          'Product',
          'FeaturedProducts',
          'TrendingProducts',
        ])
      );
      router.push(`/${locale}/my-store`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Failed to delete product');
    }
  };

  // Handle image hover for zoom
  const handleImageHover = () => {
    setIsZoomed(true);
  };

  // Handle image leave
  const handleImageLeave = () => {
    setIsZoomed(false);
  };

  // Handle mouse move for zoom effect
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  if (isLoading) {
    return (
      <div
        className='bg-off-white min-h-screen py-8'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Back Button Skeleton */}
          <div className='mb-6'>
            <div className='h-6 bg-rich-sand/30 rounded w-32' />
          </div>

          <div className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8'>
              {/* Image Section Skeleton */}
              <div>
                <div className='relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden mb-4' />
                <div className='grid grid-cols-4 gap-2'>
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className='aspect-square bg-rich-sand/20 rounded-lg'
                    />
                  ))}
                </div>
              </div>

              {/* Details Section Skeleton */}
              <div className='space-y-6'>
                <div className='space-y-4'>
                  <div className='h-10 bg-rich-sand/30 rounded w-3/4' />
                  <div className='h-8 bg-rich-sand/30 rounded w-1/3' />
                  <div className='flex gap-4'>
                    <div className='h-6 bg-rich-sand/30 rounded w-20' />
                    <div className='h-6 bg-rich-sand/30 rounded w-24' />
                  </div>
                </div>

                <div className='border-t border-rich-sand/30 pt-6 space-y-4'>
                  <div className='h-6 bg-rich-sand/30 rounded w-1/4' />
                  <div className='h-4 bg-rich-sand/30 rounded w-full' />
                  <div className='h-4 bg-rich-sand/30 rounded w-5/6' />

                  <div className='grid grid-cols-2 gap-4'>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className='space-y-2'>
                        <div className='h-3 bg-rich-sand/30 rounded w-1/2' />
                        <div className='h-4 bg-rich-sand/30 rounded w-3/4' />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div
        className='bg-off-white min-h-screen py-8'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70'>
              {locale === 'en' ? 'Product not found' : 'المنتج غير موجود'}
            </p>
            <Link
              href={`/${locale}/my-store`}
              className='mt-4 inline-block text-saudi-green hover:text-saudi-green/80'
            >
              {locale === 'en' ? 'Back to My Store' : 'العودة إلى متجري'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Type guard: if we reach here and not loading, product must exist
  if (!product) {
    return null;
  }

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <Link
          href={`/${locale}/my-store`}
          className='inline-flex items-center gap-2 text-saudi-green hover:text-saudi-green/80 mb-6 font-medium'
        >
          <HiArrowLeft className='w-5 h-5' />
          {locale === 'en' ? 'Back to My Store' : 'العودة إلى متجري'}
        </Link>

        <div className='bg-white rounded-lg border border-rich-sand/30 overflow-hidden'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8'>
            {/* Images */}
            <div>
              {/* Main Image */}
              <div
                ref={imageContainerRef}
                className='relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden mb-4'
                style={{
                  cursor: isZoomed
                    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23006747' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3Cline x1='8' y1='11' x2='14' y2='11'/%3E%3Cline x1='11' y1='8' x2='11' y2='14'/%3E%3C/svg%3E") 12 12, zoom-out`
                    : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23006747' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3Cline x1='11' y1='8' x2='11' y2='14'/%3E%3Cline x1='8' y1='11' x2='14' y2='11'/%3E%3C/svg%3E") 12 12, zoom-in`,
                }}
                onMouseEnter={handleImageHover}
                onMouseLeave={handleImageLeave}
                onMouseMove={handleImageMouseMove}
              >
                {mainImage ? (
                  <Image
                    src={mainImage.replace(/\s+/g, '')}
                    alt={product?.title || 'Product image'}
                    fill
                    className='object-contain transition-transform duration-200 ease-out'
                    style={
                      isZoomed
                        ? {
                            transform: `scale(2.5)`,
                            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                          }
                        : {
                            transform: 'scale(1)',
                          }
                    }
                    unoptimized
                    draggable={false}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-rich-sand to-saudi-green/10'>
                    <span className='text-deep-charcoal/40 text-xs text-center px-2'>
                      {product?.title || 'No Image'}
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery - Show all images */}
              {productImages.length > 1 && (
                <div className='grid grid-cols-4 gap-2'>
                  {productImages.map((img: string, index: number) => {
                    const imageUrl = img.replace(/\s+/g, '');
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-saudi-green ring-2 ring-saudi-green/50'
                            : 'border-transparent hover:border-saudi-green/50'
                        }`}
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`${product?.title || 'Product'} ${index + 1}`}
                            fill
                            className='object-contain'
                            unoptimized
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-rich-sand to-saudi-green/10'>
                            <span className='text-deep-charcoal/40 text-xs'>
                              {index + 1}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Show image count if more than 4 */}
              {productImages.length > 4 && (
                <p className='text-sm text-deep-charcoal/60 mt-2 text-center'>
                  {locale === 'en'
                    ? `${productImages.length} images total`
                    : `${productImages.length} صورة إجمالاً`}
                </p>
              )}
            </div>

            {/* Details */}
            <div className='space-y-6'>
              <div>
                <div className='flex items-start justify-between mb-2'>
                  <h1 className='text-3xl font-bold text-deep-charcoal'>
                    {product?.title || ''}
                  </h1>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={`/${locale}/my-store/item/${product.id}/edit`}
                      className='flex items-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-medium hover:bg-saudi-green/90 transition-colors'
                    >
                      <HiPencil className='w-4 h-4' />
                      {locale === 'en' ? 'Edit' : 'تعديل'}
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors'
                    >
                      <HiTrash className='w-4 h-4' />
                      {locale === 'en' ? 'Delete' : 'حذف'}
                    </button>
                  </div>
                </div>
                <p className='text-2xl font-bold text-saudi-green mb-4'>
                  {formatPrice(
                    product.price,
                    locale,
                    2,
                    product.currency || (product as any).Currency
                  )}
                  {product.originalPrice &&
                    product.originalPrice > product.price && (
                      <span className='text-lg text-deep-charcoal/60 line-through ml-2'>
                        {formatPrice(
                          product.originalPrice,
                          locale,
                          2,
                          product.currency || (product as any).Currency
                        )}
                      </span>
                    )}
                </p>

                {/* Out of Stock Alert */}
                {(product.isOutOfStock ??
                  (product.quantity ||
                    product.Quantity === null ||
                    product.quantity ||
                    product.Quantity === undefined ||
                    product.quantity ||
                    product.Quantity <= 0)) && (
                  <div className='mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
                    <div className='flex items-start gap-3'>
                      <div className='flex-1'>
                        <h4 className='font-semibold text-amber-800 mb-1'>
                          {locale === 'en' ? 'Out of Stock' : 'غير متوفر'}
                        </h4>
                        <p className='text-sm text-amber-700 mb-3'>
                          {locale === 'en'
                            ? 'This product is currently out of stock. Update the quantity to make it available again.'
                            : 'هذا المنتج غير متوفر حالياً. قم بتحديث الكمية لجعله متاحاً مرة أخرى.'}
                        </p>
                        <Link
                          href={`/${locale}/my-store/item/${product.id}/edit`}
                          className='inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm'
                        >
                          <HiPencil className='w-4 h-4' />
                          {locale === 'en' ? 'Update Stock' : 'تحديث المخزون'}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <div className='flex items-center gap-4 text-sm text-deep-charcoal/70'>
                  {product.likes !== undefined && product.likes > 0 && (
                    <span>
                      {product.likes} {locale === 'en' ? 'likes' : 'إعجاب'}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.status === 'approved' ||
                      product.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : product.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : product.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {product.status === 'approved' ||
                    product.status === 'active'
                      ? locale === 'en'
                        ? 'Active'
                        : 'نشط'
                      : product.status === 'pending'
                      ? locale === 'en'
                        ? 'Pending'
                        : 'قيد الانتظار'
                      : product.status === 'rejected'
                      ? locale === 'en'
                        ? 'Rejected'
                        : 'مرفوض'
                      : locale === 'en'
                      ? 'Sold'
                      : 'مباع'}
                  </span>
                </div>
              </div>

              <div className='border-t border-rich-sand/30 pt-6 space-y-4'>
                <div>
                  <h3 className='font-semibold text-deep-charcoal mb-2'>
                    {locale === 'en' ? 'Description' : 'الوصف'}
                  </h3>
                  <p className='text-deep-charcoal/80'>{product.description}</p>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  {product.category && (
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Category' : 'الفئة'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {product.category}
                      </p>
                    </div>
                  )}
                  {product.subcategory && (
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Subcategory' : 'الفئة الفرعية'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {product.subcategory}
                      </p>
                    </div>
                  )}
                  {product.size && (
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Size' : 'المقاس'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {product.size}
                      </p>
                    </div>
                  )}
                  {product.condition && (
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Condition' : 'الحالة'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {product.condition}
                      </p>
                    </div>
                  )}
                  {product.brand && (
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Brand' : 'العلامة التجارية'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {product.brand}
                      </p>
                    </div>
                  )}
                  {product.quantity !== undefined && (
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Quantity' : 'الكمية'}
                      </span>
                      <p
                        className={`font-medium ${
                          product.isOutOfStock ??
                          (product.quantity === null ||
                            product.quantity === undefined ||
                            product.quantity <= 0)
                            ? 'text-red-600 font-semibold'
                            : 'text-deep-charcoal'
                        }`}
                      >
                        {product.quantity}{' '}
                        {(product.isOutOfStock ??
                          (product.quantity === null ||
                            product.quantity === undefined ||
                            product.quantity <= 0)) && (
                          <span className='text-xs'>
                            ({locale === 'en' ? 'out of stock' : 'غير متوفر'})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {product.color && (
                    <div>
                      <span className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Color' : 'اللون'}
                      </span>
                      <p className='font-medium text-deep-charcoal'>
                        {product.color}
                      </p>
                    </div>
                  )}
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div>
                    <span className='text-sm text-deep-charcoal/60'>
                      {locale === 'en' ? 'Tags' : 'العلامات'}
                    </span>
                    <div className='flex flex-wrap gap-2 mt-2'>
                      {product.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-saudi-green/10 text-saudi-green rounded-full text-sm'
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.shippingInfo && (
                  <div className='border-t border-rich-sand/30 pt-4'>
                    <h3 className='font-semibold text-deep-charcoal mb-3'>
                      {locale === 'en'
                        ? 'Shipping Information'
                        : 'معلومات الشحن'}
                    </h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <span className='text-sm text-deep-charcoal/60'>
                          {locale === 'en' ? 'Shipping Cost' : 'تكلفة الشحن'}
                        </span>
                        <p className='font-medium text-deep-charcoal'>
                          {formatPrice(
                            product.shippingInfo.cost,
                            locale,
                            2,
                            product.currency || (product as any).Currency
                          )}
                        </p>
                      </div>
                      <div>
                        <span className='text-sm text-deep-charcoal/60'>
                          {locale === 'en'
                            ? 'Estimated Days'
                            : 'الأيام المقدرة'}
                        </span>
                        <p className='font-medium text-deep-charcoal'>
                          {product.shippingInfo.estimatedDays}{' '}
                          {locale === 'en' ? 'days' : 'أيام'}
                        </p>
                      </div>
                      {product.shippingInfo.locations &&
                        product.shippingInfo.locations.length > 0 && (
                          <div className='col-span-2'>
                            <span className='text-sm text-deep-charcoal/60'>
                              {locale === 'en'
                                ? 'Shipping Locations'
                                : 'مواقع الشحن'}
                            </span>
                            <p className='font-medium text-deep-charcoal'>
                              {product.shippingInfo.locations.join(', ')}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {product.seller && (
                  <div className='border-t border-rich-sand/30 pt-4'>
                    <h3 className='font-semibold text-deep-charcoal mb-3'>
                      {locale === 'en'
                        ? 'Seller Information'
                        : 'معلومات البائع'}
                    </h3>
                    <div className='flex items-center gap-3'>
                      {product.seller.profileImage && !sellerImageError ? (
                        <Image
                          key={product.seller.profileImage}
                          src={product.seller.profileImage}
                          alt={product.seller.username}
                          width={40}
                          height={40}
                          className='rounded-full'
                          unoptimized
                          onError={() => {
                            setSellerImageError(true);
                          }}
                        />
                      ) : (
                        <div className='w-10 h-10 rounded-full bg-saudi-green/20 flex items-center justify-center text-saudi-green font-semibold text-sm'>
                          {product.seller.username?.charAt(0)?.toUpperCase() ||
                            'S'}
                        </div>
                      )}
                      <div>
                        <p className='font-medium text-deep-charcoal'>
                          {product.seller.username}
                        </p>
                        {product.seller.rating !== undefined && (
                          <p className='text-sm text-deep-charcoal/60'>
                            {locale === 'en' ? 'Rating' : 'التقييم'}:{' '}
                            {product.seller.rating}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {product.createdAt && (
                  <div className='text-sm text-deep-charcoal/60'>
                    {locale === 'en' ? 'Listed on' : 'تم الإدراج في'}:{' '}
                    {new Date(product.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={locale === 'en' ? 'Delete Product' : 'حذف المنتج'}
        message={
          locale === 'en'
            ? 'Are you sure you want to delete this product? This action cannot be undone.'
            : 'هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.'
        }
        confirmText={locale === 'en' ? 'Yes, Delete' : 'نعم، احذف'}
        cancelText={locale === 'en' ? 'Cancel' : 'إلغاء'}
      />
    </div>
  );
}
