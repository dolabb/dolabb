'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiMapPin, HiPhone, HiUser } from 'react-icons/hi2';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/utils/toast';

export default function CheckoutPage() {
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';

  // Get offer data from URL params
  const offerId = searchParams.get('offerId');
  const product = searchParams.get('product');
  const size = searchParams.get('size');
  const price = searchParams.get('price');
  const offerPrice = searchParams.get('offerPrice');
  const shipping = searchParams.get('shipping');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Saudi Arabia',
    additionalInfo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  useEffect(() => {
    // Redirect if no offer data
    if (!offerId || !product || !offerPrice) {
      router.push(`/${locale}/messages`);
    }
  }, [offerId, product, offerPrice, locale, router]);

  // Fetch order summary from API
  useEffect(() => {
    const fetchOrderSummary = async () => {
      if (!offerId) return;

      setIsLoadingSummary(true);
      try {
        const response = await apiClient.get(`/api/offers/${offerId}/order-summary/`);
        if (response.data.success && response.data.orderSummary) {
          setOrderSummary(response.data.orderSummary);
        }
      } catch (error: any) {
        console.error('Error fetching order summary:', error);
        // Don't show error toast, just use fallback data from URL params
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchOrderSummary();
  }, [offerId]);

  if (!isAuthenticated || !offerId || !product || !offerPrice) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName =
        locale === 'en' ? 'Full name is required' : 'الاسم الكامل مطلوب';
    }

    if (!formData.phone.trim()) {
      newErrors.phone =
        locale === 'en' ? 'Phone number is required' : 'رقم الهاتف مطلوب';
    } else if (!/^[0-9]{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone =
        locale === 'en'
          ? 'Please enter a valid phone number'
          : 'يرجى إدخال رقم هاتف صحيح';
    }

    if (!formData.address.trim()) {
      newErrors.address =
        locale === 'en' ? 'Address is required' : 'العنوان مطلوب';
    }

    if (!formData.city.trim()) {
      newErrors.city = locale === 'en' ? 'City is required' : 'المدينة مطلوبة';
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode =
        locale === 'en' ? 'Postal code is required' : 'الرمز البريدي مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!offerId) {
      toast.error(
        locale === 'en'
          ? 'Offer ID is required'
          : 'معرف العرض مطلوب'
      );
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Get affiliate code if available
      let affiliateCode = '';
      try {
        const storedItems = JSON.parse(localStorage.getItem('listedItems') || '[]');
        const item = storedItems.find((item: any) => item.title === product);
        affiliateCode = item?.affiliateCode || '';
      } catch (e) {
        console.error('Error getting affiliate code:', e);
      }

      // Call Django backend checkout API to create order
      console.log('Creating order with Django backend...');
      const checkoutResponse = await apiClient.post('/api/payment/checkout/', {
        offerId: offerId,
        deliveryAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country,
          additionalInfo: formData.additionalInfo.trim(),
        },
        affiliateCode: affiliateCode || undefined,
      });

      const checkoutData = checkoutResponse.data;
      console.log('Checkout API response:', checkoutData);

      if (checkoutData.success && checkoutData.orderId) {
        // Store real orderId in sessionStorage for payment page
        sessionStorage.setItem('orderId', checkoutData.orderId);
        
        // Redirect to payment page with offer data and orderId
        const params = new URLSearchParams({
          offerId: offerId || '',
          product: product || '',
          size: size || '',
          price: price || '',
          offerPrice: offerPrice || '',
          shipping: shipping || '',
          orderId: checkoutData.orderId, // Include real orderId
        });
        
        router.push(`/${locale}/payment?${params.toString()}`);
      } else {
        throw new Error(checkoutData.error || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      setIsCreatingOrder(false);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          (locale === 'en'
                            ? 'Failed to create order. Please try again.'
                            : 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.');
      
      toast.error(errorMessage);
    }
  };

  // Use API data if available, otherwise fall back to URL params
  const displayProduct = orderSummary?.productTitle || product;
  const displayOriginalPrice = orderSummary?.originalPrice?.toFixed(2) || price;
  const displayOfferPrice = orderSummary?.offerPrice?.toFixed(2) || offerPrice;
  const displayShipping = orderSummary?.shippingPrice?.toFixed(2) || shipping;
  const displayPlatformFee = orderSummary?.platformFee?.toFixed(2) || '0.00';
  const displayTax = orderSummary?.platformTax?.amount?.toFixed(2) || '0.00';
  const displayTotal = orderSummary?.finalTotal?.toFixed(2) || 
    (parseFloat(offerPrice || '0') + parseFloat(shipping || '0')).toFixed(2);

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-3xl font-bold text-deep-charcoal mb-8'>
          {locale === 'en' ? 'Checkout' : 'الدفع'}
        </h1>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Delivery Address Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4 flex items-center gap-2'>
                <HiMapPin className='w-5 h-5 text-saudi-green' />
                {locale === 'en' ? 'Delivery Address' : 'عنوان التسليم'}
              </h2>

              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Full Name */}
                <div>
                  <label
                    htmlFor='fullName'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Full Name' : 'الاسم الكامل'}
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <HiUser className='h-5 w-5 text-deep-charcoal/40' />
                    </div>
                    <input
                      type='text'
                      id='fullName'
                      name='fullName'
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={
                        locale === 'en' ? 'John Doe' : 'محمد أحمد'
                      }
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.fullName
                          ? 'border-coral-red'
                          : 'border-rich-sand'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className='mt-1 text-sm text-coral-red'>
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor='phone'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Phone Number' : 'رقم الهاتف'}
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <HiPhone className='h-5 w-5 text-deep-charcoal/40' />
                    </div>
                    <input
                      type='tel'
                      id='phone'
                      name='phone'
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={
                        locale === 'en' ? '123 456 7890' : '50 123 4567'
                      }
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.phone ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                      dir='ltr'
                    />
                  </div>
                  {errors.phone && (
                    <p className='mt-1 text-sm text-coral-red'>{errors.phone}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor='address'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Street Address' : 'عنوان الشارع'}
                  </label>
                  <input
                    type='text'
                    id='address'
                    name='address'
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={
                      locale === 'en'
                        ? '123 Main Street'
                        : '123 شارع الرئيسي'
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      errors.address ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                  />
                  {errors.address && (
                    <p className='mt-1 text-sm text-coral-red'>
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* City and Postal Code */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='city'
                      className='block text-sm font-medium text-deep-charcoal mb-2'
                    >
                      {locale === 'en' ? 'City' : 'المدينة'}
                    </label>
                    <input
                      type='text'
                      id='city'
                      name='city'
                      value={formData.city}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'Riyadh' : 'الرياض'}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.city ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                    />
                    {errors.city && (
                      <p className='mt-1 text-sm text-coral-red'>
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='postalCode'
                      className='block text-sm font-medium text-deep-charcoal mb-2'
                    >
                      {locale === 'en' ? 'Postal Code' : 'الرمز البريدي'}
                    </label>
                    <input
                      type='text'
                      id='postalCode'
                      name='postalCode'
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? '12345' : '12345'}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.postalCode
                          ? 'border-coral-red'
                          : 'border-rich-sand'
                      }`}
                    />
                    {errors.postalCode && (
                      <p className='mt-1 text-sm text-coral-red'>
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label
                    htmlFor='country'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Country' : 'الدولة'}
                  </label>
                  <select
                    id='country'
                    name='country'
                    value={formData.country}
                    onChange={handleChange}
                    className='w-full px-4 py-3 border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all'
                  >
                    <option value='Saudi Arabia'>
                      {locale === 'en' ? 'Saudi Arabia' : 'المملكة العربية السعودية'}
                    </option>
                    <option value='UAE'>
                      {locale === 'en' ? 'United Arab Emirates' : 'الإمارات العربية المتحدة'}
                    </option>
                    <option value='Kuwait'>
                      {locale === 'en' ? 'Kuwait' : 'الكويت'}
                    </option>
                  </select>
                </div>

                {/* Additional Info */}
                <div>
                  <label
                    htmlFor='additionalInfo'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en'
                      ? 'Additional Information (Optional)'
                      : 'معلومات إضافية (اختياري)'}
                  </label>
                  <textarea
                    id='additionalInfo'
                    name='additionalInfo'
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    rows={3}
                    placeholder={
                      locale === 'en'
                        ? 'Apartment, suite, etc. (optional)'
                        : 'شقة، جناح، إلخ (اختياري)'
                    }
                    className='w-full px-4 py-3 border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all resize-none'
                  />
                </div>

                <button
                  type='submit'
                  disabled={isCreatingOrder}
                  className='w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 shadow-lg hover:shadow-xl font-display cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isCreatingOrder
                    ? (locale === 'en' ? 'Creating Order...' : 'جاري إنشاء الطلب...')
                    : (locale === 'en' ? 'Continue to Payment' : 'المتابعة إلى الدفع')}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-lg border border-rich-sand/30 p-6 sticky top-20'>
              <h2 className='text-xl font-semibold text-deep-charcoal mb-4'>
                {locale === 'en' ? 'Order Summary' : 'ملخص الطلب'}
              </h2>

              {isLoadingSummary ? (
                <div className='text-center py-8'>
                  <p className='text-deep-charcoal/60'>
                    {locale === 'en' ? 'Loading...' : 'جاري التحميل...'}
                  </p>
                </div>
              ) : (
                <div className='space-y-4 mb-6'>
                  {/* Product Info */}
                  <div>
                    {orderSummary?.productImage && (
                      <img
                        src={orderSummary.productImage}
                        alt={displayProduct}
                        className='w-full h-48 object-cover rounded-lg mb-3'
                      />
                    )}
                    <p className='text-sm text-deep-charcoal/70 mb-1'>
                      {locale === 'en' ? 'Product' : 'المنتج'}
                    </p>
                    <p className='font-semibold text-deep-charcoal'>{displayProduct}</p>
                    {size && (
                      <p className='text-sm text-deep-charcoal/60'>
                        {locale === 'en' ? 'Size' : 'المقاس'}: {size}
                      </p>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className='border-t border-rich-sand/30 pt-4 space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-deep-charcoal/70'>
                        {locale === 'en' ? 'Original Price' : 'السعر الأصلي'}
                      </span>
                      <span className='text-deep-charcoal line-through'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {displayOriginalPrice}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-deep-charcoal/70'>
                        {locale === 'en' ? 'Offer Price' : 'سعر العرض'}
                      </span>
                      <span className='font-semibold text-saudi-green'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {displayOfferPrice}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-deep-charcoal/70'>
                        {locale === 'en' ? 'Shipping' : 'الشحن'}
                      </span>
                      <span className='text-deep-charcoal'>
                        +{locale === 'ar' ? 'ر.س' : 'SAR'} {displayShipping}
                      </span>
                    </div>
                    {parseFloat(displayPlatformFee) > 0 && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-deep-charcoal/70'>
                          {locale === 'en' ? 'Platform Fee' : 'رسوم المنصة'}
                        </span>
                        <span className='text-deep-charcoal'>
                          +{locale === 'ar' ? 'ر.س' : 'SAR'} {displayPlatformFee}
                        </span>
                      </div>
                    )}
                    {parseFloat(displayTax) > 0 && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-deep-charcoal/70'>
                          {orderSummary?.platformTax?.label || 
                           (locale === 'en' ? 'Tax (VAT 15%)' : 'الضريبة (ضريبة القيمة المضافة 15%)')}
                        </span>
                        <span className='text-deep-charcoal'>
                          +{locale === 'ar' ? 'ر.س' : 'SAR'} {displayTax}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className='border-t border-rich-sand/30 pt-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-lg font-semibold text-deep-charcoal'>
                        {locale === 'en' ? 'Total' : 'الإجمالي'}
                      </span>
                      <span className='text-xl font-bold text-saudi-green'>
                        {locale === 'ar' ? 'ر.س' : 'SAR'} {displayTotal}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

