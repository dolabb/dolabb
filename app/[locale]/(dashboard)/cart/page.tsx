'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useGetCartQuery, useUnsaveProductMutation } from '@/lib/api/productsApi';
import { useCreateOfferMutation } from '@/lib/api/offersApi';
import { useGetProfileQuery } from '@/lib/api/authApi';
import { useAppSelector } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import Image from 'next/image';
import { HiTrash } from 'react-icons/hi2';

export default function CartPage() {
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const user = useAppSelector(state => state.auth.user);

  // Fetch cart data
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Fetch profile data to check for address fields
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [createOffer, { isLoading: isCreatingOffer }] = useCreateOfferMutation();
  const [unsaveProduct, { isLoading: isUnsaving }] = useUnsaveProductMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

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
    const userProfile = profileData?.user || user;
    const missingFields: string[] = [];
    
    const shippingAddress = userProfile?.shipping_address || userProfile?.shippingAddress;
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
      await refetchCart();
    } catch (error: any) {
      // Check for specific error messages from API
      const apiError = error?.data?.error || error?.data?.message;
      if (apiError === 'You cannot make an offer on your own product') {
        toast.error(
          locale === 'en'
            ? 'You cannot make an offer on your own product'
            : 'لا يمكنك تقديم عرض على منتجك الخاص'
        );
      } else {
        toast.error(
          apiError ||
            (locale === 'en'
              ? 'Failed to create offer'
              : 'فشل إنشاء العرض')
        );
      }
    }
  };

  const handleUnsaveProduct = async (productId: string) => {
    try {
      await unsaveProduct(productId).unwrap();
      toast.success(
        locale === 'en'
          ? 'Product removed from cart'
          : 'تم إزالة المنتج من السلة'
      );
      await refetchCart();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          (locale === 'en'
            ? 'Failed to remove product'
            : 'فشل إزالة المنتج')
      );
    }
  };

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-3xl font-bold text-deep-charcoal mb-8'>
          {locale === 'en' ? 'Shopping Cart' : 'سلة التسوق'}
        </h1>
        {cartData?.cart && cartData.cart.length > 0 ? (
          <div className='bg-white rounded-lg p-6 space-y-4'>
            {cartData.cart.map((item) => (
              <div
                key={item.id}
                className='flex gap-4 p-4 border-b border-rich-sand/20 last:border-b-0'
              >
                <button
                  onClick={() => handleUnsaveProduct(item.id)}
                  disabled={isUnsaving}
                  className='flex-shrink-0 w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                  aria-label={locale === 'en' ? 'Remove product' : 'إزالة المنتج'}
                >
                  <HiTrash className='w-5 h-5' />
                </button>
                <div className='relative w-24 h-24 rounded-lg overflow-hidden bg-rich-sand/20 flex-shrink-0'>
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='font-semibold text-deep-charcoal mb-1'>
                    {item.title}
                  </h3>
                  <p className='text-lg font-bold text-saudi-green mb-3'>
                    {locale === 'ar' ? 'ر.س' : 'SAR'} {item.price.toFixed(2)}
                  </p>
                  <div className='space-y-2'>
                    <input
                      type='number'
                      placeholder={
                        locale === 'en'
                          ? 'Offer amount'
                          : 'مبلغ العرض'
                      }
                      value={offerAmounts[item.id] || ''}
                      onChange={(e) =>
                        setOfferAmounts((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className='w-full max-w-xs px-3 py-2 text-sm border border-rich-sand/30 rounded focus:outline-none focus:ring-2 focus:ring-saudi-green'
                      min='0'
                      step='0.01'
                    />
                    <button
                      onClick={() => handleCreateOffer(item.id)}
                      disabled={isCreatingOffer}
                      className='px-4 py-2 bg-saudi-green text-white text-sm font-medium rounded hover:bg-saudi-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
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
            <div className='pt-4 border-t border-rich-sand/30 mt-4'>
              <div className='flex justify-between items-center'>
                <span className='text-lg font-semibold text-deep-charcoal'>
                  {locale === 'en' ? 'Total' : 'الإجمالي'}
                </span>
                <span className='text-xl font-bold text-saudi-green'>
                  {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                  {cartData.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className='bg-white rounded-lg p-8'>
            <div className='text-center mb-6'>
              <p className='text-deep-charcoal/70 mb-4'>
                {locale === 'en' ? 'Your cart is empty' : 'سلة التسوق فارغة'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

