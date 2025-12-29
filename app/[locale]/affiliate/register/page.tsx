'use client';

import TermsModal from '@/components/shared/TermsModal';
import { countries, Country, defaultCountry } from '@/data/countries';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  HiEye,
  HiEyeSlash,
  HiLockClosed,
  HiPhone,
  HiUser,
  HiCamera,
  HiXMark,
} from 'react-icons/hi2';
import { useAffiliateSignupMutation, useUploadImageMutation } from '@/lib/api/authApi';
import { toast } from '@/utils/toast';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
import Image from 'next/image';

export default function AffiliateRegisterPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedCountry, setSelectedCountry] =
    useState<Country>(defaultCountry);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [affiliateSignup, { isLoading }] = useAffiliateSignupMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

  // Filter countries based on search
  const filteredCountries = countries.filter(
    country =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(
          locale === 'en'
            ? 'Please select an image file'
            : 'يرجى اختيار ملف صورة'
        );
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(
          locale === 'en'
            ? 'Image size must be less than 10MB'
            : 'يجب أن يكون حجم الصورة أقل من 10 ميجابايت'
        );
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfileImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName =
        locale === 'en' ? 'Full name is required' : 'الاسم الكامل مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email =
        locale === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email =
        locale === 'en'
          ? 'Please enter a valid email'
          : 'يرجى إدخال بريد إلكتروني صحيح';
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

    if (!formData.password) {
      newErrors.password =
        locale === 'en' ? 'Password is required' : 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password =
        locale === 'en'
          ? 'Password must be at least 6 characters'
          : 'يجب أن تكون كلمة المرور على الأقل 6 أحرف';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        locale === 'en'
          ? 'Please confirm your password'
          : 'يرجى تأكيد كلمة المرور';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword =
        locale === 'en' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Show terms modal if not accepted
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    try {
      // Step 1: Upload profile image first if provided
      let profileImageUrl: string | undefined = undefined;
      
      if (profileImage) {
        try {
          // Validate file size (10MB limit)
          const maxSize = 10 * 1024 * 1024; // 10MB in bytes
          if (profileImage.size > maxSize) {
            toast.error(
              locale === 'en'
                ? 'Image size is too large. Maximum size is 10MB. Please compress the image or choose a smaller file.'
                : 'حجم الصورة كبير جداً. الحد الأقصى هو 10 ميجابايت. يرجى ضغط الصورة أو اختيار ملف أصغر.'
            );
            return;
          }

          const imageFormData = new FormData();
          // Append file with explicit filename to ensure it's sent correctly
          imageFormData.append('image', profileImage, profileImage.name);
          
          const uploadResult = await uploadImage(imageFormData).unwrap();
          
          if (uploadResult.success && uploadResult.image_url) {
            profileImageUrl = uploadResult.image_url;
          } else {
            throw new Error('Image upload failed: No image URL returned');
          }
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          
          // Check if it's a timeout error
          const isTimeout = 
            uploadError?.message?.toLowerCase().includes('timeout') ||
            uploadError?.message?.toLowerCase().includes('time') ||
            uploadError?.code === 'ECONNABORTED' ||
            uploadError?.name === 'TimeoutError' ||
            uploadError?.error?.data?.message?.toLowerCase().includes('timeout');
          
          if (isTimeout) {
            toast.error(
              locale === 'en'
                ? 'Image upload timed out. The image might be too large or the connection is slow. Please try again with a smaller image or check your internet connection.'
                : 'انتهت مهلة تحميل الصورة. قد تكون الصورة كبيرة جداً أو الاتصال بطيء. يرجى المحاولة مرة أخرى بصورة أصغر أو التحقق من اتصال الإنترنت.'
            );
          } else {
            toast.error(
              locale === 'en'
                ? 'Failed to upload profile image. Please try again or remove the image.'
                : 'فشل تحميل صورة الملف الشخصي. يرجى المحاولة مرة أخرى أو إزالة الصورة.'
            );
          }
          return; // Stop the process if image upload fails
        }
      }

      // Step 2: Create affiliate account with the uploaded image URL
      // Get language preference from localStorage (guest_language) or use current locale
      const guestLanguage = typeof window !== 'undefined' 
        ? localStorage.getItem('guest_language') || locale 
        : locale;
      
      const result = await affiliateSignup({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        country_code: selectedCountry.code,
        profile_image_url: profileImageUrl,
        language: guestLanguage, // Include language from localStorage or current locale
      }).unwrap();

      if (result.success && result.affiliate) {
        // Store email for OTP verification
        if (typeof window !== 'undefined') {
          localStorage.setItem('affiliate_signup_email', formData.email);
          if (result.otp) {
            localStorage.setItem('affiliate_otp', result.otp);
          }
        }

        // Show success toast
        toast.success(
          locale === 'en'
            ? 'Affiliate registration successful! Please check your email for OTP verification.'
            : 'تم تسجيل الشريك بنجاح! يرجى التحقق من بريدك الإلكتروني للتحقق من رمز OTP.'
        );

        // Redirect to verify OTP page
        setTimeout(() => {
          router.push(`/${locale}/affiliate/verify-otp?email=${encodeURIComponent(formData.email)}`);
        }, 1500);
      }
    } catch (error: any) {
      handleApiErrorWithToast(error);
    }
  };

  const handleAcceptTerms = async () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    
    // Wait a bit for state to update, then directly submit
    // This avoids the double-click issue by bypassing form.requestSubmit()
    setTimeout(async () => {
      // Validate form again (terms are now accepted)
      if (!validateForm()) {
        return;
      }

      try {
        // Step 1: Upload profile image first if provided
        let profileImageUrl: string | undefined = undefined;
        
        if (profileImage) {
          try {
            // Validate file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (profileImage.size > maxSize) {
              toast.error(
                locale === 'en'
                  ? 'Image size is too large. Maximum size is 10MB. Please compress the image or choose a smaller file.'
                  : 'حجم الصورة كبير جداً. الحد الأقصى هو 10 ميجابايت. يرجى ضغط الصورة أو اختيار ملف أصغر.'
              );
              return;
            }

            const imageFormData = new FormData();
            imageFormData.append('image', profileImage, profileImage.name);
            
            const uploadResult = await uploadImage(imageFormData).unwrap();
            
            if (uploadResult.success && uploadResult.image_url) {
              profileImageUrl = uploadResult.image_url;
            } else {
              throw new Error('Image upload failed: No image URL returned');
            }
          } catch (uploadError: any) {
            console.error('Image upload failed:', uploadError);
            
            const isTimeout = 
              uploadError?.message?.toLowerCase().includes('timeout') ||
              uploadError?.message?.toLowerCase().includes('time') ||
              uploadError?.code === 'ECONNABORTED' ||
              uploadError?.name === 'TimeoutError' ||
              uploadError?.error?.data?.message?.toLowerCase().includes('timeout');
            
            if (isTimeout) {
              toast.error(
                locale === 'en'
                  ? 'Image upload timed out. The image might be too large or the connection is slow. Please try again with a smaller image or check your internet connection.'
                  : 'انتهت مهلة تحميل الصورة. قد تكون الصورة كبيرة جداً أو الاتصال بطيء. يرجى المحاولة مرة أخرى بصورة أصغر أو التحقق من اتصال الإنترنت.'
              );
            } else {
              toast.error(
                locale === 'en'
                  ? 'Failed to upload profile image. Please try again or remove the image.'
                  : 'فشل تحميل صورة الملف الشخصي. يرجى المحاولة مرة أخرى أو إزالة الصورة.'
              );
            }
            return;
          }
        }

        // Step 2: Create affiliate account with the uploaded image URL
        // Get language preference from localStorage (guest_language) or use current locale
        const guestLanguage = typeof window !== 'undefined' 
          ? localStorage.getItem('guest_language') || locale 
          : locale;
        
        const result = await affiliateSignup({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          country_code: selectedCountry.code,
          profile_image_url: profileImageUrl,
          language: guestLanguage, // Include language from localStorage or current locale
        }).unwrap();

        if (result.success && result.affiliate) {
          // Store email for OTP verification
          if (typeof window !== 'undefined') {
            localStorage.setItem('affiliate_signup_email', formData.email);
            if (result.otp) {
              localStorage.setItem('affiliate_otp', result.otp);
            }
          }

          // Show success toast
          toast.success(
            locale === 'en'
              ? 'Affiliate registration successful! Please check your email for OTP verification.'
              : 'تم تسجيل الشريك بنجاح! يرجى التحقق من بريدك الإلكتروني للتحقق من رمز OTP.'
          );

          // Redirect to verify OTP page
          setTimeout(() => {
            router.push(`/${locale}/affiliate/verify-otp?email=${encodeURIComponent(formData.email)}`);
          }, 1500);
        }
      } catch (error: any) {
        handleApiErrorWithToast(error);
      }
    }, 100);
  };

  return (
    <div
      className='min-h-screen bg-off-white flex items-center justify-center py-12 px-4'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='w-full max-w-md'>
        {/* Logo/Title */}
        <div className='text-center mb-8'>
          <h2 className='text-2xl font-semibold text-deep-charcoal font-display mb-2'>
            {locale === 'en'
              ? 'Create your affiliate account'
              : 'إنشاء حساب الشريك'}
          </h2>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'Join our affiliate program and earn commissions'
              : 'انضم إلى برنامج الشراكة واكسب العمولات'}
          </p>
        </div>

        {/* Registration Form */}
        <div className='bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Profile Image Upload */}
            <div className='flex flex-col items-center mb-4'>
              <label
                htmlFor='profile-image'
                className='block text-sm font-medium text-deep-charcoal mb-3 text-center'
              >
                {locale === 'en' ? 'Profile Picture' : 'صورة الملف الشخصي'}
              </label>
              <div className='relative'>
                <div className='w-24 h-24 rounded-full border-4 border-rich-sand overflow-hidden bg-rich-sand/10 flex items-center justify-center'>
                  {profileImagePreview ? (
                    <Image
                      src={profileImagePreview}
                      alt='Profile preview'
                      width={96}
                      height={96}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <HiUser className='w-12 h-12 text-deep-charcoal/40' />
                  )}
                </div>
                {profileImagePreview && (
                  <button
                    type='button'
                    onClick={handleRemoveImage}
                    className={`absolute -top-1 p-1.5 bg-coral-red text-white rounded-full hover:bg-coral-red/90 transition-colors shadow-md cursor-pointer ${
                      isRTL ? '-left-1' : '-right-1'
                    }`}
                    aria-label={locale === 'en' ? 'Remove image' : 'إزالة الصورة'}
                  >
                    <HiXMark className='w-4 h-4' />
                  </button>
                )}
                <label
                  htmlFor='profile-image'
                  className={`absolute bottom-0 p-2 bg-saudi-green text-white rounded-full hover:bg-saudi-green/90 transition-colors shadow-md cursor-pointer ${
                    isRTL ? 'left-0' : 'right-0'
                  }`}
                >
                  <HiCamera className='w-4 h-4' />
                </label>
                <input
                  type='file'
                  id='profile-image'
                  accept='image/*'
                  onChange={handleImageUpload}
                  className='hidden'
                  disabled={isUploadingImage}
                />
              </div>
              {isUploadingImage && (
                <p className='mt-2 text-sm text-deep-charcoal/70'>
                  {locale === 'en' ? 'Uploading image...' : 'جاري رفع الصورة...'}
                </p>
              )}
            </div>

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
                  placeholder={locale === 'en' ? 'John Doe' : 'محمد أحمد'}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                    errors.fullName ? 'border-coral-red' : 'border-rich-sand'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className='mt-1 text-sm text-coral-red'>{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-deep-charcoal mb-2'
              >
                {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder={
                  locale === 'en' ? 'you@example.com' : 'example@email.com'
                }
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                  errors.email ? 'border-coral-red' : 'border-rich-sand'
                }`}
                dir='ltr'
              />
              {errors.email && (
                <p className='mt-1 text-sm text-coral-red'>{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor='phone'
                className='block text-sm font-medium text-deep-charcoal mb-2'
              >
                {locale === 'en' ? 'Phone Number' : 'رقم الهاتف'}
              </label>
              <div className='flex gap-2'>
                {/* Country Code Selector */}
                <div className='relative' ref={countryDropdownRef}>
                  <button
                    type='button'
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className={`flex items-center gap-2 px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green transition-all bg-white cursor-pointer ${
                      errors.phone
                        ? 'border-coral-red'
                        : 'border-rich-sand hover:border-saudi-green'
                    }`}
                  >
                    <span className='text-xl'>{selectedCountry.flag}</span>
                    <span className='text-sm font-medium text-deep-charcoal'>
                      {selectedCountry.dialCode}
                    </span>
                  </button>

                  {/* Country Dropdown */}
                  {showCountryDropdown && (
                    <div className='absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-64 max-h-60 overflow-y-auto'>
                      <div className='p-2'>
                        <input
                          type='text'
                          placeholder={
                            locale === 'en'
                              ? 'Search country...'
                              : 'ابحث عن دولة...'
                          }
                          value={countrySearch}
                          onChange={e => setCountrySearch(e.target.value)}
                          className='w-full px-3 py-2 border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green text-sm mb-2'
                          onClick={e => e.stopPropagation()}
                        />
                        <div className='space-y-1 max-h-48 overflow-y-auto'>
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map(country => (
                              <button
                                key={country.code}
                                type='button'
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setShowCountryDropdown(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-saudi-green/10 transition-colors text-left cursor-pointer ${
                                  selectedCountry.code === country.code
                                    ? 'bg-saudi-green/20'
                                    : ''
                                }`}
                              >
                                <span className='text-xl'>{country.flag}</span>
                                <span className='flex-1 text-sm text-deep-charcoal'>
                                  {country.name}
                                </span>
                                <span className='text-sm font-medium text-deep-charcoal/70'>
                                  {country.dialCode}
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className='px-3 py-2 text-sm text-deep-charcoal/60 text-center'>
                              {locale === 'en'
                                ? 'No countries found'
                                : 'لم يتم العثور على دول'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div className='relative flex-1'>
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
              </div>
              {errors.phone && (
                <p className='mt-1 text-sm text-coral-red'>{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-deep-charcoal mb-2'
              >
                {locale === 'en' ? 'Password' : 'كلمة المرور'}
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <HiLockClosed className='h-5 w-5 text-deep-charcoal/40' />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id='password'
                  name='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={
                    locale === 'en' ? 'Enter your password' : 'أدخل كلمة المرور'
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                    errors.password ? 'border-coral-red' : 'border-rich-sand'
                  }`}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-deep-charcoal/40 hover:text-deep-charcoal transition-colors cursor-pointer'
                >
                  {showPassword ? (
                    <HiEyeSlash className='h-5 w-5' />
                  ) : (
                    <HiEye className='h-5 w-5' />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className='mt-1 text-sm text-coral-red'>{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-deep-charcoal mb-2'
              >
                {locale === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'}
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <HiLockClosed className='h-5 w-5 text-deep-charcoal/40' />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id='confirmPassword'
                  name='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={
                    locale === 'en'
                      ? 'Confirm your password'
                      : 'أكد كلمة المرور'
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                    errors.confirmPassword
                      ? 'border-coral-red'
                      : 'border-rich-sand'
                  }`}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-deep-charcoal/40 hover:text-deep-charcoal transition-colors cursor-pointer'
                >
                  {showConfirmPassword ? (
                    <HiEyeSlash className='h-5 w-5' />
                  ) : (
                    <HiEye className='h-5 w-5' />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='mt-1 text-sm text-coral-red'>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading || isUploadingImage}
              className='w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display cursor-pointer'
            >
              {isLoading || isUploadingImage
                ? locale === 'en'
                  ? isUploadingImage
                    ? 'Uploading image...'
                    : 'Creating account...'
                  : isUploadingImage
                  ? 'جاري رفع الصورة...'
                  : 'جاري إنشاء الحساب...'
                : locale === 'en'
                ? 'Sign Up'
                : 'إنشاء حساب'}
            </button>
          </form>

          {/* Divider */}
          <div className='my-6 flex items-center'>
            <div className='flex-1 border-t border-rich-sand'></div>
            <span className='px-4 text-sm text-deep-charcoal/60'>
              {locale === 'en' ? 'or' : 'أو'}
            </span>
            <div className='flex-1 border-t border-rich-sand'></div>
          </div>

          {/* Login Link */}
          <div className='text-center'>
            <p className='text-sm text-deep-charcoal/70'>
              {locale === 'en'
                ? 'Already have an affiliate account?'
                : 'هل لديك حساب شريك بالفعل؟'}{' '}
              <Link
                href={`/${locale}/affiliate/login`}
                className='text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors'
              >
                {locale === 'en' ? 'Log in' : 'تسجيل الدخول'}
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className='mt-6 text-center text-xs text-deep-charcoal/60'>
          {locale === 'en'
            ? 'By registering, you agree to our Terms of Service and Privacy Policy'
            : 'بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية'}
        </p>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onClose={() => setShowTermsModal(false)}
        title={locale === 'en' ? 'Accept Terms of Service' : 'قبول شروط الخدمة'}
        description={
          locale === 'en'
            ? 'You must accept our Terms of Service to register as an affiliate'
            : 'يجب عليك قبول شروط الخدمة للتسجيل كشريك'
        }
      />
    </div>
  );
}
