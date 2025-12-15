'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useGetCartQuery, useUnsaveProductMutation } from '@/lib/api/productsApi';
import { useGetProfileQuery } from '@/lib/api/authApi';
import { useAppSelector } from '@/lib/store/hooks';
import { toast } from '@/utils/toast';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image';
import { HiTrash, HiShoppingCart } from 'react-icons/hi2';

export default function CartPage() {
  const locale = useLocale();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const router = useRouter();
  const isRTL = locale === 'ar';
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const user = useAppSelector(state => state.auth.user);

  // Fetch cart data
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Fetch profile data to check for address fields
  const { data: profileData } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [unsaveProduct, { isLoading: isUnsaving }] = useUnsaveProductMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

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

  const handleProceedToCheckout = async () => {
    if (!cartData?.cart || cartData.cart.length === 0) {
      toast.error(
        locale === 'en'
          ? 'Your cart is empty'
          : 'سلة التسوق فارغة'
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

    setIsCheckingOut(true);

    try {
      // Collect all cart product IDs
      const cartItems = cartData.cart.map(item => item.id);

      // Call checkout API
      const response = await apiClient.post('/api/payment/checkout/', {
        cartItems,
      });

      const checkoutData = response.data;
      
      // Debug logging
      console.log('Cart totalAmount:', cartData.totalAmount);
      console.log('Checkout API response:', checkoutData);
      console.log('Checkout checkoutData.price:', checkoutData.checkoutData?.price);
      console.log('Checkout checkoutData.total:', checkoutData.checkoutData?.total);
      console.log('Is group order:', checkoutData.isGroup);

      // Handle both single seller and multi-seller (group) checkout responses
      const isGroupOrder = checkoutData.isGroup === true;
      const hasValidOrder = isGroupOrder 
        ? (checkoutData.orderIds && checkoutData.orderIds.length > 0)
        : checkoutData.orderId;

      if (checkoutData.success && hasValidOrder) {
        // Store checkout data in sessionStorage for payment page
        sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData.checkoutData));
        sessionStorage.setItem('checkoutType', 'cart');
        
        if (isGroupOrder) {
          // Multi-seller group order - store array of order IDs
          sessionStorage.setItem('isGroupOrder', 'true');
          sessionStorage.setItem('orderIds', JSON.stringify(checkoutData.orderIds));
          sessionStorage.setItem('orderId', checkoutData.orderIds[0]); // Primary order for compatibility
          if (checkoutData.orders) {
            sessionStorage.setItem('groupOrders', JSON.stringify(checkoutData.orders));
          }
        } else {
          // Single seller order
          sessionStorage.setItem('isGroupOrder', 'false');
          sessionStorage.setItem('orderId', checkoutData.orderId);
          sessionStorage.removeItem('orderIds');
          sessionStorage.removeItem('groupOrders');
        }
        
        // Redirect to payment page with cart checkout params
        // Pass all necessary data in URL params as backup
        const params = new URLSearchParams({
          type: 'cart',
          orderId: isGroupOrder ? checkoutData.orderIds[0] : checkoutData.orderId,
          total: checkoutData.checkoutData?.total?.toString() || '0',
          price: checkoutData.checkoutData?.price?.toString() || '0',
          shipping: checkoutData.checkoutData?.shipping?.toString() || '0',
          platformFee: checkoutData.checkoutData?.platformFee?.toString() || '0',
          currency: checkoutData.checkoutData?.currency || 'SAR',
        });
        
        // Add group order flag and orderIds to URL params
        if (isGroupOrder) {
          params.set('isGroup', 'true');
          params.set('orderIds', checkoutData.orderIds.join(','));
        }
        
        router.push(`/${locale}/payment?${params.toString()}`);
      } else {
        throw new Error(checkoutData.error || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      
      const errorResponse = error.response?.data || {};
      const errorMessage = errorResponse.error || errorResponse.message || '';
      
      // Handle specific error messages
      if (errorMessage.includes('same seller') || errorMessage.includes('All items in cart must be from the same seller')) {
        toast.error(
          locale === 'en'
            ? 'You can only checkout items from one seller at a time. Please remove items from other sellers.'
            : 'يمكنك فقط شراء منتجات من بائع واحد في كل مرة. يرجى إزالة المنتجات من البائعين الآخرين.',
          { duration: 6000 }
        );
      } else if (errorMessage.includes('not available') || errorMessage.includes('One of the products in cart is not available')) {
        toast.error(
          locale === 'en'
            ? 'Some items are no longer available and were removed from your cart.'
            : 'بعض المنتجات لم تعد متوفرة وتم إزالتها من سلتك.',
          { duration: 6000 }
        );
        // Reload cart to show updated items
        await refetchCart();
      } else if (errorMessage.includes('own product') || errorMessage.includes('You cannot purchase your own product')) {
        toast.error(
          locale === 'en'
            ? 'You cannot purchase your own product. Please remove it from your cart.'
            : 'لا يمكنك شراء منتجك الخاص. يرجى إزالته من سلتك.',
          { duration: 6000 }
        );
      } else {
        toast.error(
          errorMessage ||
          (locale === 'en'
            ? 'Failed to proceed to checkout. Please try again.'
            : 'فشل الانتقال إلى الدفع. يرجى المحاولة مرة أخرى.')
        );
      }
    } finally {
      setIsCheckingOut(false);
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
            {/* Cart Items */}
            {cartData.cart.map((item) => (
              <div
                key={item.id}
                className='flex gap-4 p-4 border-b border-rich-sand/20 last:border-b-0'
              >
                <button
                  onClick={() => handleUnsaveProduct(item.id)}
                  disabled={isUnsaving || isCheckingOut}
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
                  <p className='text-lg font-bold text-saudi-green'>
                    {locale === 'ar' ? 'ر.س' : 'SAR'} {item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            {/* Cart Summary */}
            <div className='pt-4 border-t border-rich-sand/30 mt-4'>
              <div className='flex justify-between items-center mb-4'>
                <span className='text-lg font-semibold text-deep-charcoal'>
                  {locale === 'en' ? 'Subtotal' : 'المجموع الفرعي'} ({cartData.itemCount} {locale === 'en' ? 'items' : 'منتجات'})
                </span>
                <span className='text-xl font-bold text-saudi-green'>
                  {locale === 'ar' ? 'ر.س' : 'SAR'}{' '}
                  {cartData.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                disabled={isCheckingOut}
                className='w-full bg-saudi-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {isCheckingOut ? (
                  <>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                    <span>{locale === 'en' ? 'Processing...' : 'جاري المعالجة...'}</span>
                  </>
                ) : (
                  <>
                    <HiShoppingCart className='w-5 h-5' />
                    <span>{locale === 'en' ? 'Proceed to checkout' : 'المتابعة إلى الدفع'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className='bg-white rounded-lg p-8'>
            <div className='text-center mb-6'>
              <HiShoppingCart className='w-16 h-16 text-deep-charcoal/30 mx-auto mb-4' />
              <p className='text-deep-charcoal/70 mb-4'>
                {locale === 'en' ? 'Your cart is empty' : 'سلة التسوق فارغة'}
              </p>
              <button
                onClick={() => router.push(`/${locale}/browse`)}
                className='bg-saudi-green text-white px-6 py-2 rounded-lg font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer'
              >
                {locale === 'en' ? 'Continue Shopping' : 'متابعة التسوق'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
