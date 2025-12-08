'use client';

import DeleteConfirmModal from '@/components/shared/DeleteConfirmModal';
import {
  productsApi,
  useDeleteProductMutation,
  useGetProductDetailQuery,
} from '@/lib/api/productsApi';
import { useAppDispatch } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import { formatPrice } from '@/utils/formatPrice';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  // Only fetch if itemId is valid
  const {
    data: product,
    isLoading,
    error,
  } = useGetProductDetailQuery(itemId, {
    skip: !itemId,
  });
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Log for debugging
  useEffect(() => {
    if (itemId) {
      console.log('Fetching product details for ID:', itemId);
    }
  }, [itemId]);

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
      dispatch(productsApi.util.invalidateTags(['Product', 'FeaturedProducts', 'TrendingProducts']));
      router.push(`/${locale}/my-store`);
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || 'Failed to delete product');
    }
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
              <div className='relative aspect-square bg-rich-sand/20 rounded-lg overflow-hidden mb-4'>
                {mainImage ? (
                  <Image
                    src={mainImage.replace(/\s+/g, '')}
                    alt={product?.title || 'Product image'}
                    fill
                    className='object-contain'
                    unoptimized
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
                  {formatPrice(product.price, locale, 2, product.currency || (product as any).Currency)}
                  {product.originalPrice &&
                    product.originalPrice > product.price && (
                      <span className='text-lg text-deep-charcoal/60 line-through ml-2'>
                        {formatPrice(product.originalPrice, locale, 2, product.currency || (product as any).Currency)}
                      </span>
                    )}
                </p>
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
                      <p className='font-medium text-deep-charcoal'>
                        {product.quantity}
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
                          {formatPrice(product.shippingInfo.cost, locale, 2, product.currency || (product as any).Currency)}
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
                          {product.seller.username?.charAt(0)?.toUpperCase() || 'S'}
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
