'use client';

import { countries, Country, defaultCountry } from '@/data/countries';
import {
  useGetAffiliateProfileQuery,
  useUpdateAffiliateProfileMutation,
} from '@/lib/api/affiliatesApi';
import { useUploadImageMutation } from '@/lib/api/authApi';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  HiArrowLeft,
  HiCamera,
  HiPhone,
  HiUser,
  HiXMark,
} from 'react-icons/hi2';

export default function AffiliateProfileContent() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useGetAffiliateProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateAffiliateProfileMutation();
  const [uploadImage, { isLoading: isUploadingImage }] =
    useUploadImageMutation();

  const affiliate = profileData?.affiliate;

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country_code: '',
    profile_image: '',
  });

  const [selectedCountry, setSelectedCountry] =
    useState<Country>(defaultCountry);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Update form data when profile loads
  useEffect(() => {
    if (affiliate) {
      setFormData({
        full_name: affiliate.full_name || '',
        phone: affiliate.phone?.replace(/^\+\d+\s/, '') || '',
        country_code: affiliate.country_code || defaultCountry.code,
        profile_image: affiliate.profile_image || '',
      });

      // Set country based on country_code
      const country =
        countries.find(c => c.code === affiliate.country_code) ||
        defaultCountry;
      setSelectedCountry(country);

      setImagePreview(affiliate.profile_image || null);
    }
  }, [affiliate]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(
        locale === 'en' ? 'Please select an image file' : 'يرجى اختيار ملف صورة'
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

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(affiliate?.profile_image || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Step 1: Upload image if new image is selected
      let profileImageUrl = formData.profile_image;

      if (imageFile) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', imageFile, imageFile.name);

          const uploadResult = await uploadImage(imageFormData).unwrap();

          if (uploadResult.success && uploadResult.image_url) {
            profileImageUrl = uploadResult.image_url;
          } else {
            throw new Error('Image upload failed: No image URL returned');
          }
        } catch (uploadError) {
          handleApiErrorWithToast(uploadError);
          return;
        }
      }

      // Step 2: Update profile
      const result = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        country_code: selectedCountry.code,
        profile_image: profileImageUrl,
      }).unwrap();

      if (result.success) {
        toast.success(
          locale === 'en'
            ? 'Profile updated successfully!'
            : 'تم تحديث الملف الشخصي بنجاح!'
        );

        // Update localStorage
        if (typeof window !== 'undefined' && result.affiliate) {
          localStorage.setItem('affiliate', JSON.stringify(result.affiliate));
        }

        // Refetch profile data
        await refetch();
        setIsEditing(false);
      }
    } catch (error) {
      handleApiErrorWithToast(error);
    }
  };

  const filteredCountries = countries.filter(
    country =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Skeleton Loading Component
  const ProfileSkeleton = () => (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button Skeleton */}
        <div className='mb-6'>
          <div className='h-6 w-40 bg-rich-sand/20 rounded skeleton-shimmer'></div>
        </div>

        {/* Header Skeleton */}
        <div className='mb-6'>
          <div className='h-9 w-64 bg-rich-sand/20 rounded mb-2 skeleton-shimmer'></div>
          <div className='h-5 w-96 bg-rich-sand/20 rounded skeleton-shimmer'></div>
        </div>

        {/* Profile Card Skeleton */}
        <div className='bg-white rounded-lg border border-rich-sand/30 shadow-sm p-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8'>
            {/* Profile Image Skeleton */}
            <div className='relative'>
              <div className='w-24 h-24 rounded-full border-4 border-rich-sand bg-rich-sand/20 skeleton-shimmer'></div>
            </div>
            <div className='flex-1 space-y-3'>
              <div className='h-7 w-48 bg-rich-sand/20 rounded skeleton-shimmer'></div>
              <div className='h-4 w-64 bg-rich-sand/20 rounded skeleton-shimmer'></div>
              <div className='h-4 w-40 bg-rich-sand/20 rounded skeleton-shimmer'></div>
            </div>
            <div className='h-10 w-36 bg-rich-sand/20 rounded-lg skeleton-shimmer'></div>
          </div>

          {/* Profile Details Skeleton */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='space-y-2'>
                <div className='h-3 w-24 bg-rich-sand/20 rounded skeleton-shimmer'></div>
                <div className='h-5 w-full bg-rich-sand/20 rounded skeleton-shimmer'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!affiliate) {
    return (
      <div
        className='min-h-screen bg-off-white flex items-center justify-center'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='text-deep-charcoal'>
          {locale === 'en'
            ? 'No profile data found'
            : 'لم يتم العثور على بيانات الملف الشخصي'}
        </div>
      </div>
    );
  }

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <button
          onClick={() => router.push(`/${locale}/affiliate/dashboard`)}
          className='flex items-center gap-2 text-deep-charcoal/70 hover:text-saudi-green transition-colors mb-6 cursor-pointer'
        >
          <HiArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          <span className='font-medium'>
            {locale === 'en' ? 'Back to Dashboard' : 'العودة إلى لوحة التحكم'}
          </span>
        </button>

        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-deep-charcoal mb-2'>
            {locale === 'en' ? 'Affiliate Profile' : 'الملف الشخصي للشريك'}
          </h1>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'Manage your affiliate profile information'
              : 'إدارة معلومات ملف الشريك الشخصي'}
          </p>
        </div>

        {/* Profile Card */}
        <div className='bg-white rounded-lg border border-rich-sand/30 shadow-sm p-6 mb-6'>
          {!isEditing ? (
            <>
              {/* View Mode */}
              <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
                <div className='relative'>
                  <div className='w-24 h-24 rounded-full border-4 border-rich-sand overflow-hidden bg-rich-sand/10 flex items-center justify-center'>
                    {affiliate.profile_image ? (
                      <Image
                        src={affiliate.profile_image}
                        alt={affiliate.full_name}
                        width={96}
                        height={96}
                        className='w-full h-full object-cover'
                        unoptimized
                      />
                    ) : (
                      <HiUser className='w-12 h-12 text-deep-charcoal/40' />
                    )}
                  </div>
                </div>
                <div className='flex-1'>
                  <h2 className='text-2xl font-bold text-deep-charcoal mb-1'>
                    {affiliate.full_name}
                  </h2>
                  <p className='text-deep-charcoal/70'>{affiliate.email}</p>
                  <p className='text-deep-charcoal/70 mt-1'>
                    {locale === 'en' ? 'Affiliate Code' : 'رمز الشريك'}:{' '}
                    <span className='font-mono font-semibold text-saudi-green'>
                      {affiliate.affiliate_code}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className='px-6 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors cursor-pointer'
                >
                  {locale === 'en' ? 'Edit Profile' : 'تعديل الملف الشخصي'}
                </button>
              </div>

              {/* Profile Details */}
              <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <p className='text-sm text-deep-charcoal/70 mb-1'>
                    {locale === 'en' ? 'Phone' : 'الهاتف'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {affiliate.phone}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-deep-charcoal/70 mb-1'>
                    {locale === 'en' ? 'Status' : 'الحالة'}
                  </p>
                  <p className='text-deep-charcoal font-medium capitalize'>
                    {affiliate.status}
                  </p>
                </div>

              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Profile Image */}
                <div className='flex flex-col items-center'>
                  <div className='relative'>
                    <div className='w-24 h-24 rounded-full border-4 border-rich-sand overflow-hidden bg-rich-sand/10 flex items-center justify-center'>
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt='Profile preview'
                          width={96}
                          height={96}
                          className='w-full h-full object-cover'
                          unoptimized
                        />
                      ) : (
                        <HiUser className='w-12 h-12 text-deep-charcoal/40' />
                      )}
                    </div>
                    {imagePreview && (
                      <button
                        type='button'
                        onClick={handleRemoveImage}
                        className={`absolute -top-1 p-1.5 bg-coral-red text-white rounded-full hover:bg-coral-red/90 transition-colors shadow-md cursor-pointer ${
                          isRTL ? '-left-1' : '-right-1'
                        }`}
                      >
                        <HiXMark className='w-4 h-4' />
                      </button>
                    )}
                    <label
                      className={`absolute bottom-0 p-2 bg-saudi-green text-white rounded-full hover:bg-saudi-green/90 transition-colors shadow-md cursor-pointer ${
                        isRTL ? 'left-0' : 'right-0'
                      }`}
                    >
                      <HiCamera className='w-4 h-4' />
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='hidden'
                        disabled={isUploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
                    {locale === 'en' ? 'Full Name' : 'الاسم الكامل'}
                  </label>
                  <input
                    type='text'
                    value={formData.full_name}
                    onChange={e =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
                    {locale === 'en' ? 'Phone Number' : 'رقم الهاتف'}
                  </label>
                  <div className='flex gap-2'>
                    <div className='relative'>
                      <button
                        type='button'
                        onClick={() =>
                          setShowCountryDropdown(!showCountryDropdown)
                        }
                        className='flex items-center gap-2 px-3 py-2 border border-rich-sand/30 rounded-lg bg-white cursor-pointer'
                      >
                        <span className='text-xl'>{selectedCountry.flag}</span>
                        <span className='text-sm font-medium'>
                          {selectedCountry.dialCode}
                        </span>
                      </button>
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
                            />
                            <div className='space-y-1 max-h-48 overflow-y-auto'>
                              {filteredCountries.map(country => (
                                <button
                                  key={country.code}
                                  type='button'
                                  onClick={() => {
                                    setSelectedCountry(country);
                                    setShowCountryDropdown(false);
                                    setCountrySearch('');
                                  }}
                                  className='w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-saudi-green/10 transition-colors text-left cursor-pointer'
                                >
                                  <span className='text-xl'>
                                    {country.flag}
                                  </span>
                                  <span className='flex-1 text-sm text-deep-charcoal'>
                                    {country.name}
                                  </span>
                                  <span className='text-sm font-medium text-deep-charcoal/70'>
                                    {country.dialCode}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className='relative flex-1'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <HiPhone className='h-5 w-5 text-deep-charcoal/40' />
                      </div>
                      <input
                        type='tel'
                        value={formData.phone}
                        onChange={e =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className='w-full pl-10 pr-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
                        dir='ltr'
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className='flex gap-4 pt-4'>
                  <button
                    type='button'
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data
                      if (affiliate) {
                        setFormData({
                          full_name: affiliate.full_name || '',
                          phone: affiliate.phone?.replace(/^\+\d+\s/, '') || '',
                          country_code:
                            affiliate.country_code || defaultCountry.code,
                          profile_image: affiliate.profile_image || '',
                        });
                        const country =
                          countries.find(
                            c => c.code === affiliate.country_code
                          ) || defaultCountry;
                        setSelectedCountry(country);
                        setImagePreview(affiliate.profile_image || null);
                        setImageFile(null);
                      }
                    }}
                    className='flex-1 px-6 py-3 border border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 transition-colors cursor-pointer'
                  >
                    {locale === 'en' ? 'Cancel' : 'إلغاء'}
                  </button>
                  <button
                    type='submit'
                    disabled={isUpdating || isUploadingImage}
                    className='flex-1 px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isUpdating || isUploadingImage
                      ? locale === 'en'
                        ? 'Updating...'
                        : 'جاري التحديث...'
                      : locale === 'en'
                      ? 'Update Profile'
                      : 'تحديث الملف الشخصي'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
