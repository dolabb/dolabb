'use client';

import ProductCard from '@/components/shared/ProductCard';
import { featuredProducts } from '@/data/products';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadImageMutation,
} from '@/lib/api/authApi';
import { useAppSelector } from '@/lib/store/hooks';
import type { User } from '@/types/auth';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { HiPencilSquare, HiUser, HiXMark } from 'react-icons/hi2';

// Skeleton Loading Component
const ProfileSkeleton = ({ isRTL }: { isRTL: boolean }) => (
  <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
      {/* User Profile Header Skeleton */}
      <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
          <div className='relative w-24 h-24 rounded-full overflow-hidden bg-rich-sand/20 skeleton-shimmer' />
          <div className='flex-1 space-y-3'>
            <div className='h-8 bg-rich-sand/30 rounded w-48 skeleton-shimmer' />
            <div className='h-4 bg-rich-sand/30 rounded w-32 skeleton-shimmer' />
          </div>
        </div>
      </div>

      {/* Profile Details Section Skeleton */}
      <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-6 h-6 bg-rich-sand/30 rounded skeleton-shimmer' />
          <div className='h-6 bg-rich-sand/30 rounded w-40 skeleton-shimmer' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='space-y-2'>
              <div className='h-3 bg-rich-sand/30 rounded w-24 skeleton-shimmer' />
              <div className='h-5 bg-rich-sand/30 rounded w-full skeleton-shimmer' />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Update Profile Modal Component
interface UpdateProfileModalProps {
  profileUser: User | null;
  onClose: () => void;
  onUpdate: (data: {
    full_name?: string;
    username?: string;
    bio?: string;
    location?: string;
    profile_image?: string;
    shipping_address?: string;
    zip_code?: string;
    house_number?: string;
  }) => Promise<void>;
  onUploadImage: (file: File) => Promise<string>;
  isUpdating: boolean;
  locale: string;
  isRTL: boolean;
}

const UpdateProfileModal = ({
  profileUser,
  onClose,
  onUpdate,
  onUploadImage,
  isUpdating,
  locale,
  isRTL,
}: UpdateProfileModalProps) => {
  const [formData, setFormData] = useState({
    full_name: profileUser?.full_name || '',
    username: profileUser?.username || '',
    bio: profileUser?.bio || '',
    location: profileUser?.location || '',
    profile_image: profileUser?.profile_image || '',
    shipping_address: profileUser?.shipping_address || profileUser?.shippingAddress || '',
    zip_code: profileUser?.zip_code || profileUser?.zipCode || '',
    house_number: profileUser?.house_number || profileUser?.houseNumber || '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(
    profileUser?.profile_image || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        locale === 'en'
          ? 'Invalid file type. Please upload JPEG, PNG, GIF, or WEBP image.'
          : 'نوع الملف غير صالح. يرجى رفع صورة JPEG أو PNG أو GIF أو WEBP.'
      );
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        locale === 'en'
          ? 'File size too large. Maximum size is 10MB.'
          : 'حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت.'
      );
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let profileImageUrl = formData.profile_image;

      // Upload image if a new file is selected
      if (imageFile) {
        profileImageUrl = await onUploadImage(imageFile);
      }

      // Update profile with all data
      await onUpdate({
        full_name: formData.full_name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        profile_image: profileImageUrl,
        shipping_address: formData.shipping_address,
        zip_code: formData.zip_code,
        house_number: formData.house_number,
      });
    } catch {
      // Error is already handled in onUpdate/onUploadImage
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-rich-sand/30'>
          <h2 className='text-2xl font-bold text-deep-charcoal'>
            {locale === 'en' ? 'Update Profile' : 'تحديث الملف الشخصي'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-rich-sand/20 rounded-full transition-colors cursor-pointer'
          >
            <HiXMark className='w-6 h-6 text-deep-charcoal' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6'>
          {/* Profile Image */}
          <div className='flex flex-col items-center gap-4'>
            <div className='relative w-32 h-32 rounded-full overflow-hidden bg-rich-sand/20'>
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt='Profile preview'
                  fill
                  className='object-cover'
                  unoptimized
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-4xl font-bold text-saudi-green'>
                  {formData.username?.[0]?.toUpperCase() ||
                    formData.full_name?.[0]?.toUpperCase() ||
                    'U'}
                </div>
              )}
            </div>
            <label className='flex flex-col items-center gap-2 cursor-pointer'>
              <span className='px-4 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors'>
                {locale === 'en' ? 'Upload Image' : 'رفع صورة'}
              </span>
              <input
                type='file'
                accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
                onChange={handleImageChange}
                className='hidden'
              />
              <p className='text-xs text-deep-charcoal/60'>
                {locale === 'en'
                  ? 'JPEG, PNG, GIF, WEBP (Max 10MB)'
                  : 'JPEG، PNG، GIF، WEBP (حد أقصى 10 ميجابايت)'}
              </p>
            </label>
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

          {/* Username */}
          <div>
            <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Username' : 'اسم المستخدم'}
            </label>
            <input
              type='text'
              value={formData.username}
              onChange={e =>
                setFormData({ ...formData, username: e.target.value })
              }
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Bio' : 'نبذة'}
            </label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green resize-none'
              placeholder={
                locale === 'en'
                  ? 'Tell us about yourself...'
                  : 'أخبرنا عن نفسك...'
              }
            />
          </div>

          {/* Location */}
          <div>
            <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Location' : 'الموقع'}
            </label>
            <input
              type='text'
              value={formData.location}
              onChange={e =>
                setFormData({ ...formData, location: e.target.value })
              }
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
              placeholder={
                locale === 'en' ? 'City, Country' : 'المدينة، الدولة'
              }
            />
          </div>

          {/* Shipping Address */}
          <div>
            <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Shipping Address' : 'عنوان الشحن'}
            </label>
            <input
              type='text'
              value={formData.shipping_address}
              onChange={e =>
                setFormData({ ...formData, shipping_address: e.target.value })
              }
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
              placeholder={
                locale === 'en' ? '123 Main Street' : '123 الشارع الرئيسي'
              }
            />
          </div>

          {/* Zip Code */}
          <div>
            <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
              {locale === 'en' ? 'Zip Code' : 'الرمز البريدي'}
            </label>
            <input
              type='text'
              value={formData.zip_code}
              onChange={e =>
                setFormData({ ...formData, zip_code: e.target.value })
              }
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
              placeholder={locale === 'en' ? '12345' : '12345'}
            />
          </div>

          {/* House Number */}
          <div>
            <label className='block text-sm font-semibold text-deep-charcoal mb-2'>
              {locale === 'en' ? 'House Number' : 'رقم المنزل'}
            </label>
            <input
              type='text'
              value={formData.house_number}
              onChange={e =>
                setFormData({ ...formData, house_number: e.target.value })
              }
              className='w-full px-4 py-2 border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
              placeholder={locale === 'en' ? 'Apt 4B' : 'شقة 4ب'}
            />
          </div>

          {/* Buttons */}
          <div className='flex gap-4 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-6 py-3 border border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 transition-colors cursor-pointer'
            >
              {locale === 'en' ? 'Cancel' : 'إلغاء'}
            </button>
            <button
              type='submit'
              disabled={isUpdating}
              className='flex-1 px-6 py-3 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isUpdating
                ? locale === 'en'
                  ? 'Updating...'
                  : 'جاري التحديث...'
                : locale === 'en'
                ? 'Update Profile'
                : 'تحديث الملف الشخصي'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProfileContent() {
  const locale = useLocale();
  const user = useAppSelector(state => state.auth.user);
  const isRTL = locale === 'ar';
  const isBuyer = user?.role === 'buyer';
  const [activeTab, setActiveTab] = useState<
    'reviews' | 'profileDetails'
  >('profileDetails');
  const [imageError, setImageError] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();

  // Helper function to normalize image URL
  const normalizeImageUrl = (url: string | undefined | null): string => {
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
      return '';
    }

    // If URL starts with http://, convert to https://
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    // If URL is relative (starts with /), prepend base URL
    if (url.startsWith('/')) {
      url = `https://dolabb-backend-2vsj.onrender.com${url}`;
    }

    return url;
  };

  // Fetch profile data from API for buyers and sellers
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useGetProfileQuery(undefined);

  // Print API response to console
  useEffect(() => {
    if (profileData) {
      console.log('Profile API Response:', profileData);
      console.log('Profile Image URL:', profileData.user?.profile_image);
    }
    if (profileError) {
      console.error('Profile API Error:', profileError);
    }
  }, [profileData, profileError]);

  // Use API data if available, otherwise fall back to Redux user data
  const profileUser = profileData?.user || user;

  // Reset image error when profile image URL changes
  useEffect(() => {
    setImageError(false);
  }, [profileUser?.profile_image]);

  // Mock user data
  const userStats = {
    followers: 1234,
    following: 567,
    rating: 4.8,
    reviews: 42,
  };

  // Mock shop products
  const shopProducts = featuredProducts.slice(0, 6);

  // Mock reviews
  const reviews = [
    {
      id: '1',
      reviewer: 'buyer123',
      rating: 5,
      comment: 'Great product, fast shipping!',
      date: '2024-01-10',
    },
    {
      id: '2',
      reviewer: 'fashion_lover',
      rating: 4,
      comment: 'Good quality, as described.',
      date: '2024-01-08',
    },
  ];

  // Format joined date
  const formatJoinedDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Show loading state
  if (isLoadingProfile) {
    return <ProfileSkeleton isRTL={isRTL} />;
  }

  // Show error state
  if (profileError) {
    return (
      <div
        className='bg-off-white min-h-screen py-8'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
            <div className='text-center py-12'>
              <p className='text-red-600'>
                {locale === 'en'
                  ? 'Error loading profile'
                  : 'خطأ في تحميل الملف الشخصي'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For buyers: Show only profile details (no shop/reviews tabs)
  if (isBuyer) {
    return (
      <div
        className='bg-off-white min-h-screen py-8'
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* User Profile Header */}
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
              <div className='relative w-24 h-24 rounded-full overflow-hidden bg-rich-sand/20'>
                {profileUser?.profile_image &&
                profileUser.profile_image.trim() !== '' &&
                profileUser.profile_image !== 'undefined' &&
                profileUser.profile_image !== 'null' &&
                !imageError ? (
                  <Image
                    key={profileUser.profile_image}
                    src={normalizeImageUrl(profileUser.profile_image)}
                    alt={profileUser.username || 'User'}
                    fill
                    className='object-cover'
                    unoptimized
                    onError={() => {
                      setImageError(true);
                    }}
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-3xl font-bold text-saudi-green'>
                    {profileUser?.username?.[0]?.toUpperCase() ||
                      profileUser?.full_name?.[0]?.toUpperCase() ||
                      'U'}
                  </div>
                )}
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-4 mb-2'>
                  <h1 className='text-2xl font-bold text-deep-charcoal'>
                    {profileUser?.full_name || profileUser?.username || 'User'}
                  </h1>
                </div>
                <p className='text-deep-charcoal/70 mb-4'>
                  @{profileUser?.username || 'username'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Details Section */}
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-3'>
                <HiUser className='w-6 h-6 text-saudi-green' />
                <h2 className='text-xl font-semibold text-deep-charcoal'>
                  {locale === 'en' ? 'Profile Details' : 'تفاصيل الملف الشخصي'}
                </h2>
              </div>
              <button
                onClick={() => setShowUpdateModal(true)}
                className='flex items-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer'
              >
                <HiPencilSquare className='w-5 h-5' />
                {locale === 'en' ? 'Update Profile' : 'تحديث الملف الشخصي'}
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Full Name' : 'الاسم الكامل'}
                </p>
                <p className='text-deep-charcoal font-medium'>
                  {profileUser?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Username' : 'اسم المستخدم'}
                </p>
                <p className='text-deep-charcoal font-medium'>
                  @{profileUser?.username || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                </p>
                <p className='text-deep-charcoal font-medium'>
                  {profileUser?.email || 'N/A'}
                </p>
              </div>
              {profileUser?.phone && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Phone' : 'الهاتف'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.phone}
                  </p>
                </div>
              )}

              {profileUser?.bio && (
                <div className='md:col-span-2'>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Bio' : 'نبذة'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.bio}
                  </p>
                </div>
              )}
              {profileUser?.location && (
                <div className='md:col-span-2'>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Location' : 'الموقع'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.location}
                  </p>
                </div>
              )}
              {profileUser?.joined_date && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Joined Date' : 'تاريخ الانضمام'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {formatJoinedDate(profileUser.joined_date)}
                  </p>
                </div>
              )}
              {(profileUser?.shipping_address || profileUser?.shippingAddress) && (
                <div className='md:col-span-2'>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Shipping Address' : 'عنوان الشحن'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.shipping_address || profileUser.shippingAddress}
                  </p>
                </div>
              )}
              {(profileUser?.zip_code || profileUser?.zipCode) && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Zip Code' : 'الرمز البريدي'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.zip_code || profileUser.zipCode}
                  </p>
                </div>
              )}
              {(profileUser?.house_number || profileUser?.houseNumber) && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'House Number' : 'رقم المنزل'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.house_number || profileUser.houseNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Update Profile Modal */}
        {showUpdateModal && (
          <UpdateProfileModal
            profileUser={profileUser}
            onClose={() => setShowUpdateModal(false)}
            onUpdate={async (data: {
              full_name?: string;
              username?: string;
              bio?: string;
              location?: string;
              profile_image?: string;
              shipping_address?: string;
              zip_code?: string;
              house_number?: string;
            }) => {
              try {
                await updateProfile(data).unwrap();
                toast.success(
                  locale === 'en'
                    ? 'Profile updated successfully!'
                    : 'تم تحديث الملف الشخصي بنجاح!'
                );
                setShowUpdateModal(false);
                // Refetch profile data
                window.location.reload();
              } catch (error: unknown) {
                const err = error as {
                  data?: { message?: string; error?: string };
                };
                toast.error(
                  err?.data?.message ||
                    err?.data?.error ||
                    (locale === 'en'
                      ? 'Failed to update profile'
                      : 'فشل تحديث الملف الشخصي')
                );
              }
            }}
            onUploadImage={async (file: File) => {
              try {
                // Validate file size (10MB limit)
                const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                if (file.size > maxSize) {
                  toast.error(
                    locale === 'en'
                      ? 'Image size is too large. Maximum size is 10MB. Please compress the image or choose a smaller file.'
                      : 'حجم الصورة كبير جداً. الحد الأقصى هو 10 ميجابايت. يرجى ضغط الصورة أو اختيار ملف أصغر.'
                  );
                  throw new Error('File size too large');
                }

                const formData = new FormData();
                formData.append('image', file);
                const result = await uploadImage(formData).unwrap();
                toast.success(
                  locale === 'en'
                    ? 'Image uploaded successfully!'
                    : 'تم رفع الصورة بنجاح!'
                );
                return result.image_url;
              } catch (error: any) {
                const err = error as {
                  data?: { message?: string; error?: string };
                };
                
                // Check if it's a timeout error
                const isTimeout = 
                  error?.message?.toLowerCase().includes('timeout') ||
                  error?.message?.toLowerCase().includes('time') ||
                  error?.code === 'ECONNABORTED' ||
                  error?.name === 'TimeoutError' ||
                  err?.data?.message?.toLowerCase().includes('timeout');
                
                if (isTimeout) {
                  toast.error(
                    locale === 'en'
                      ? 'Image upload timed out. The image might be too large or the connection is slow. Please try again with a smaller image or check your internet connection.'
                      : 'انتهت مهلة تحميل الصورة. قد تكون الصورة كبيرة جداً أو الاتصال بطيء. يرجى المحاولة مرة أخرى بصورة أصغر أو التحقق من اتصال الإنترنت.'
                  );
                } else {
                  toast.error(
                    err?.data?.message ||
                      err?.data?.error ||
                      (locale === 'en'
                        ? 'Failed to upload image'
                        : 'فشل رفع الصورة')
                  );
                }
                throw error;
              }
            }}
            isUpdating={isUpdating || isUploading}
            locale={locale}
            isRTL={isRTL}
          />
        )}
      </div>
    );
  }

  // For sellers: Show profile with shop and reviews tabs
  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* User Profile Header */}
        <div className='bg-white rounded-lg border border-rich-sand/30 p-6 mb-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6'>
            <div className='relative w-24 h-24 rounded-full overflow-hidden bg-rich-sand/20'>
              {profileUser?.profile_image &&
              profileUser.profile_image.trim() !== '' &&
              profileUser.profile_image !== 'undefined' &&
              profileUser.profile_image !== 'null' &&
              !imageError ? (
                <Image
                  key={profileUser.profile_image}
                  src={normalizeImageUrl(profileUser.profile_image)}
                  alt={profileUser.username || 'User'}
                  fill
                  className='object-cover'
                  unoptimized
                  onError={() => {
                    setImageError(true);
                  }}
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center text-3xl font-bold text-saudi-green'>
                  {profileUser?.username?.[0]?.toUpperCase() ||
                    profileUser?.full_name?.[0]?.toUpperCase() ||
                    'U'}
                </div>
              )}
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-4 mb-2'>
                <h1 className='text-2xl font-bold text-deep-charcoal'>
                  {profileUser?.full_name ||
                    `@${profileUser?.username || 'username'}`}
                </h1>
              </div>
              <p className='text-deep-charcoal/70 mb-2'>
                @{profileUser?.username || 'username'}
              </p>
              <div className='flex flex-wrap items-center gap-4 text-sm text-deep-charcoal/70'>
                <div className='flex items-center gap-1'>
                  <FaStar className='w-4 h-4 text-yellow-400 fill-yellow-400' />
                  <strong className='text-deep-charcoal'>
                    {userStats.rating}
                  </strong>
                  <span className='text-deep-charcoal/60'>
                    ({userStats.reviews}{' '}
                    {locale === 'en' ? 'reviews' : 'مراجعة'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-4 mb-6 border-b border-rich-sand/30'>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Reviews' : 'المراجعات'}
          </button>
          <button
            onClick={() => setActiveTab('profileDetails')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'profileDetails'
                ? 'border-saudi-green text-saudi-green'
                : 'border-transparent text-deep-charcoal/70 hover:text-saudi-green'
            }`}
          >
            {locale === 'en' ? 'Profile Details' : 'تفاصيل الملف الشخصي'}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profileDetails' && (
          <div className='bg-white rounded-lg border border-rich-sand/30 p-6'>
            <div className='flex items-center justify-between mb-6'>
              <div className='flex items-center gap-3'>
                <HiUser className='w-6 h-6 text-saudi-green' />
                <h2 className='text-xl font-semibold text-deep-charcoal'>
                  {locale === 'en' ? 'Profile Details' : 'تفاصيل الملف الشخصي'}
                </h2>
              </div>
              <button
                onClick={() => setShowUpdateModal(true)}
                className='flex items-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg font-semibold hover:bg-saudi-green/90 transition-colors shadow-md hover:shadow-lg cursor-pointer'
              >
                <HiPencilSquare className='w-5 h-5' />
                {locale === 'en' ? 'Update Profile' : 'تحديث الملف الشخصي'}
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Full Name' : 'الاسم الكامل'}
                </p>
                <p className='text-deep-charcoal font-medium'>
                  {profileUser?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Username' : 'اسم المستخدم'}
                </p>
                <p className='text-deep-charcoal font-medium'>
                  @{profileUser?.username || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                  {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                </p>
                <p className='text-deep-charcoal font-medium'>
                  {profileUser?.email || 'N/A'}
                </p>
              </div>
              {profileUser?.phone && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Phone' : 'الهاتف'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.phone}
                  </p>
                </div>
              )}
              {profileUser?.bio && (
                <div className='md:col-span-2'>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Bio' : 'نبذة'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.bio}
                  </p>
                </div>
              )}
              {profileUser?.location && (
                <div className='md:col-span-2'>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Location' : 'الموقع'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.location}
                  </p>
                </div>
              )}
              {profileUser?.joined_date && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Joined Date' : 'تاريخ الانضمام'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {formatJoinedDate(profileUser.joined_date)}
                  </p>
                </div>
              )}
              {(profileUser?.shipping_address || profileUser?.shippingAddress) && (
                <div className='md:col-span-2'>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Shipping Address' : 'عنوان الشحن'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.shipping_address || profileUser.shippingAddress}
                  </p>
                </div>
              )}
              {(profileUser?.zip_code || profileUser?.zipCode) && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'Zip Code' : 'الرمز البريدي'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.zip_code || profileUser.zipCode}
                  </p>
                </div>
              )}
              {(profileUser?.house_number || profileUser?.houseNumber) && (
                <div>
                  <p className='text-xs font-semibold text-deep-charcoal/60 uppercase tracking-wide mb-1'>
                    {locale === 'en' ? 'House Number' : 'رقم المنزل'}
                  </p>
                  <p className='text-deep-charcoal font-medium'>
                    {profileUser.house_number || profileUser.houseNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className='space-y-4'>
            {reviews.map(review => (
              <div
                key={review.id}
                className='bg-white rounded-lg border border-rich-sand/30 p-6'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h3 className='font-semibold text-deep-charcoal mb-1'>
                      @{review.reviewer}
                    </h3>
                    <div className='flex items-center gap-1'>
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-rich-sand fill-rich-sand'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className='text-sm text-deep-charcoal/60'>
                    {review.date}
                  </span>
                </div>
                <p className='text-deep-charcoal/80'>{review.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Update Profile Modal for Sellers */}
        {showUpdateModal && (
          <UpdateProfileModal
            profileUser={profileUser}
            onClose={() => setShowUpdateModal(false)}
            onUpdate={async (data: {
              full_name?: string;
              username?: string;
              bio?: string;
              location?: string;
              profile_image?: string;
              shipping_address?: string;
              zip_code?: string;
              house_number?: string;
            }) => {
              try {
                await updateProfile(data).unwrap();
                toast.success(
                  locale === 'en'
                    ? 'Profile updated successfully!'
                    : 'تم تحديث الملف الشخصي بنجاح!'
                );
                setShowUpdateModal(false);
                // Refetch profile data
                window.location.reload();
              } catch (error: unknown) {
                const err = error as {
                  data?: { message?: string; error?: string };
                };
                toast.error(
                  err?.data?.message ||
                    err?.data?.error ||
                    (locale === 'en'
                      ? 'Failed to update profile'
                      : 'فشل تحديث الملف الشخصي')
                );
              }
            }}
            onUploadImage={async (file: File) => {
              try {
                // Validate file size (10MB limit)
                const maxSize = 10 * 1024 * 1024; // 10MB in bytes
                if (file.size > maxSize) {
                  toast.error(
                    locale === 'en'
                      ? 'Image size is too large. Maximum size is 10MB. Please compress the image or choose a smaller file.'
                      : 'حجم الصورة كبير جداً. الحد الأقصى هو 10 ميجابايت. يرجى ضغط الصورة أو اختيار ملف أصغر.'
                  );
                  throw new Error('File size too large');
                }

                const formData = new FormData();
                formData.append('image', file);
                const result = await uploadImage(formData).unwrap();
                toast.success(
                  locale === 'en'
                    ? 'Image uploaded successfully!'
                    : 'تم رفع الصورة بنجاح!'
                );
                return result.image_url;
              } catch (error: any) {
                const err = error as {
                  data?: { message?: string; error?: string };
                };
                
                // Check if it's a timeout error
                const isTimeout = 
                  error?.message?.toLowerCase().includes('timeout') ||
                  error?.message?.toLowerCase().includes('time') ||
                  error?.code === 'ECONNABORTED' ||
                  error?.name === 'TimeoutError' ||
                  err?.data?.message?.toLowerCase().includes('timeout');
                
                if (isTimeout) {
                  toast.error(
                    locale === 'en'
                      ? 'Image upload timed out. The image might be too large or the connection is slow. Please try again with a smaller image or check your internet connection.'
                      : 'انتهت مهلة تحميل الصورة. قد تكون الصورة كبيرة جداً أو الاتصال بطيء. يرجى المحاولة مرة أخرى بصورة أصغر أو التحقق من اتصال الإنترنت.'
                  );
                } else {
                  toast.error(
                    err?.data?.message ||
                      err?.data?.error ||
                      (locale === 'en'
                        ? 'Failed to upload image'
                        : 'فشل رفع الصورة')
                  );
                }
                throw error;
              }
            }}
            isUpdating={isUpdating || isUploading}
            locale={locale}
            isRTL={isRTL}
          />
        )}
      </div>
    </div>
  );
}
