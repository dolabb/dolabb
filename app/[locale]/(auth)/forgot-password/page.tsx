'use client';

import { useForgotPasswordMutation } from '@/lib/api/authApi';
import { useAppSelector } from '@/lib/store/hooks';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HiEnvelope } from 'react-icons/hi2';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const [formData, setFormData] = useState({
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email =
        locale === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email =
        locale === 'en'
          ? 'Please enter a valid email'
          : 'يرجى إدخال بريد إلكتروني صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Get language preference: from localStorage (guest) or current locale
      let language = locale;
      if (typeof window !== 'undefined') {
        const guestLanguage = localStorage.getItem('guest_language');
        if (guestLanguage) {
          language = guestLanguage;
        } else if (isAuthenticated) {
          // For authenticated users, use current locale (their preference should be saved)
          language = locale;
        }
      }

      const result = await forgotPassword({
        email: formData.email,
        language,
      }).unwrap();

      if (result.success) {
        // Store email for reset password page
        if (typeof window !== 'undefined') {
          localStorage.setItem('reset_password_email', formData.email);
        }

        toast.success(
          locale === 'en'
            ? 'Password reset OTP sent to your email.'
            : 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
        );

        setIsSubmitted(true);

        // Redirect to reset password page after 2 seconds
        setTimeout(() => {
          router.push(`/${locale}/reset-password?email=${formData.email}`);
        }, 2000);
      }
    } catch (error) {
      handleApiErrorWithToast(error);
    }
  };

  return (
    <div
      className='min-h-screen bg-off-white flex items-center justify-center py-12 px-4'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='w-full max-w-md'>
        {/* Logo/Title */}
        <div className='text-center mb-8'>
          <Link href={`/${locale}`} className='inline-block'>
            <h1 className='text-4xl font-bold text-saudi-green font-display mb-2'>
              <img src="/Logo.svg" alt="Dolabb" className='w-20 h-20' />
            </h1>
          </Link>
          <h2 className='text-2xl font-semibold text-deep-charcoal font-display mb-2'>
            {locale === 'en' ? 'Reset Password' : 'إعادة تعيين كلمة المرور'}
          </h2>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'Choose how you want to reset your password'
              : 'اختر طريقة إعادة تعيين كلمة المرور'}
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className='bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30'>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className='space-y-5'>
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-deep-charcoal mb-2'
                >
                  {locale === 'en'
                    ? 'Email Address'
                    : 'عنوان البريد الإلكتروني'}
                </label>
                <div className='relative'>
                  <div
                    className={`absolute inset-y-0 ${
                      isRTL ? 'right-0 pr-3' : 'left-0 pl-3'
                    } flex items-center pointer-events-none`}
                  >
                    <HiEnvelope className='h-5 w-5 text-deep-charcoal/40' />
                  </div>
                  <input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={
                      locale === 'en' ? 'you@example.com' : 'example@email.com'
                    }
                    className={`w-full ${
                      isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
                    } py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      errors.email ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                    dir='ltr'
                  />
                </div>
                {errors.email && (
                  <p className='mt-1 text-sm text-coral-red'>{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isLoading}
                className='w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display'
              >
                {isLoading
                  ? locale === 'en'
                    ? 'Sending...'
                    : 'جاري الإرسال...'
                  : locale === 'en'
                  ? 'Get Otp Password'
                  : 'احصل على رمز كلمة المرور'}
              </button>
            </form>
          ) : (
            <div className='text-center py-4'>
              <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-saudi-green/10 flex items-center justify-center'>
                <HiEnvelope className='w-8 h-8 text-saudi-green' />
              </div>
              <h3 className='text-xl font-semibold text-deep-charcoal mb-2'>
                {locale === 'en' ? 'Check your inbox' : 'تحقق من بريدك الوارد'}
              </h3>
              <p className='text-deep-charcoal/70 mb-6'>
                {locale === 'en'
                  ? `We've sent a password reset OTP to ${formData.email}`
                  : `لقد أرسلنا رمز إعادة تعيين كلمة المرور إلى ${formData.email}`}
              </p>
            </div>
          )}

          {/* Back to Login */}
          <div className='mt-6 text-center'>
            <Link
              href={`/${locale}/login`}
              className='text-sm text-saudi-green hover:text-saudi-green/80 font-medium transition-colors'
            >
              {locale === 'en' ? '← Back to Login' : '← العودة لتسجيل الدخول'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
