'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { HiEnvelope, HiEye, HiEyeSlash, HiLockClosed } from 'react-icons/hi2';
import { useLoginMutation, useUpdateLanguageMutation, useResendOtpMutation } from '@/lib/api/authApi';
import { useAppDispatch } from '@/lib/store/hooks';
import { setCredentials } from '@/lib/store/slices/authSlice';
import { toast } from '@/utils/toast';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
export default function LoginPage() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isRTL = locale === 'ar';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [updateLanguage] = useUpdateLanguageMutation();
  const [resendOtp] = useResendOtpMutation();

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

    if (!formData.password) {
      newErrors.password =
        locale === 'en' ? 'Password is required' : 'كلمة المرور مطلوبة';
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
      const result = await login({
        email: formData.email,
        password: formData.password,
      }).unwrap();

      // Check if login response has success: false
      if (result.success === false) {
        // Extract error message to check if it's verification pending
        const errorMessage = (result as any).error || '';
        const isVerificationPending = 
          errorMessage.toLowerCase().includes('verification pending') ||
          errorMessage.toLowerCase().includes('verify your email');

        if (isVerificationPending) {
          // Call resend OTP API
          try {
            await resendOtp({
              email: formData.email,
              user_type: 'user',
            }).unwrap();

            // Store email for verify-otp page
            if (typeof window !== 'undefined') {
              localStorage.setItem('signup_email', formData.email);
            }

            // Show info toast
            toast.info(
              locale === 'en'
                ? 'Please verify your email. OTP has been sent to your email address.'
                : 'يرجى التحقق من بريدك الإلكتروني. تم إرسال رمز التحقق إلى عنوان بريدك الإلكتروني.',
              { duration: 6000 }
            );

            // Redirect to verify-otp page after a short delay with user_type
            setTimeout(() => {
              router.push(`/${locale}/verify-otp?email=${encodeURIComponent(formData.email)}&user_type=buyer`);
            }, 1500);
          } catch (otpError) {
            // If OTP send fails, show error but still redirect
            handleApiErrorWithToast(otpError);
            setTimeout(() => {
              router.push(`/${locale}/verify-otp?email=${encodeURIComponent(formData.email)}`);
            }, 2000);
          }
        } else {
          // Other errors, show them
          handleApiErrorWithToast(new Error(errorMessage));
        }
        return;
      }

      if (result.success && result.user && result.token) {
        // Store credentials in Redux
        dispatch(setCredentials({
          user: result.user,
          token: result.token,
        }));

        // Dispatch custom event to sync AuthContext
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-state-changed'));
        }

        // Check if there's a stored guest language preference
        if (typeof window !== 'undefined') {
          const guestLanguage = localStorage.getItem('guest_language');
          if (guestLanguage && guestLanguage !== locale) {
            // Update user's language preference on backend
            try {
              await updateLanguage({ language: guestLanguage, skipAuth: false }).unwrap();
              // Clear guest language preference after applying it
              localStorage.removeItem('guest_language');
              // Redirect to the preferred language
              const newPath = pathname.replace(`/${locale}`, `/${guestLanguage}`);
              if (result.user.role === 'seller') {
                router.push(`/${guestLanguage}/my-store`);
              } else {
                router.push(`/${guestLanguage}`);
              }
              return;
            } catch (error) {
              // If language update fails, continue with normal flow
              console.error('Failed to update language preference:', error);
            }
          }
        }

        // Show success toast
        toast.success(
          locale === 'en'
            ? `Welcome back, ${result.user.full_name}!`
            : `مرحباً بعودتك، ${result.user.full_name}!`
        );

        // Check for return URL (e.g., from product page when user tried to buy/make offer)
        if (typeof window !== 'undefined') {
          const returnUrl = localStorage.getItem('returnUrl');
          if (returnUrl) {
            // Clear the return URL
            localStorage.removeItem('returnUrl');
            // Redirect to the stored return URL
            setTimeout(() => {
              router.push(returnUrl);
            }, 1000);
            return;
          }
        }

        // Redirect based on role (default behavior)
        setTimeout(() => {
          if (result.user.role === 'seller') {
            router.push(`/${locale}/my-store`);
          } else {
            router.push(`/${locale}`);
          }
        }, 1000);
      }
    } catch (error: any) {
      // Extract error message from RTK Query error structure
      const errorData = error?.data || error?.error?.data;
      const errorMessage = 
        errorData?.error || 
        errorData?.message || 
        error?.error || 
        '';
      
      // Check if error is due to verification pending
      const isVerificationPending = 
        errorMessage?.toLowerCase().includes('verification pending') ||
        errorMessage?.toLowerCase().includes('verify your email');

      if (isVerificationPending) {
        // Call resend OTP API
        try {
          await resendOtp({
            email: formData.email,
            user_type: 'user',
          }).unwrap();

          // Store email for verify-otp page
          if (typeof window !== 'undefined') {
            localStorage.setItem('signup_email', formData.email);
          }

          // Show info toast
          toast.info(
            locale === 'en'
              ? 'Please verify your email. OTP has been sent to your email address.'
              : 'يرجى التحقق من بريدك الإلكتروني. تم إرسال رمز التحقق إلى عنوان بريدك الإلكتروني.',
            { duration: 6000 }
          );

          // Redirect to verify-otp page after a short delay
          setTimeout(() => {
            router.push(`/${locale}/verify-otp?email=${encodeURIComponent(formData.email)}`);
          }, 1500);
        } catch (otpError) {
          // If OTP send fails, show error but still redirect
          handleApiErrorWithToast(otpError);
          setTimeout(() => {
            router.push(`/${locale}/verify-otp?email=${encodeURIComponent(formData.email)}`);
          }, 2000);
        }
      } else {
        // Handle other errors normally
        handleApiErrorWithToast(error);
      }
    }
  };

  return (
    <div
      className='min-h-screen bg-off-white flex items-center justify-center py-12 px-4'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='w-full max-w-md'>
        {/* Logo/Title */}
        <div className='text-center'>
          <h2 className='text-2xl font-semibold text-deep-charcoal font-display mb-2'>
            {locale === 'en' ? 'Welcome back' : 'مرحباً بعودتك'}
          </h2>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? 'Log in to your account'
              : 'سجل الدخول إلى حسابك'}
          </p>
        </div>

        {/* Login Form */}
        <div className='bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30'>
          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Email */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-deep-charcoal mb-2'
              >
                {locale === 'en'
                  ? 'Email or Username'
                  : 'البريد الإلكتروني أو اسم المستخدم'}
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <HiEnvelope className='h-5 w-5 text-deep-charcoal/40' />
                </div>
                <input
                  type='text'
                  id='email'
                  name='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={
                    locale === 'en' ? 'you@example.com' : 'example@email.com'
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                    errors.email ? 'border-coral-red' : 'border-rich-sand'
                  }`}
                  dir='ltr'
                />
              </div>
              {errors.email && (
                <p className='mt-1 text-sm text-coral-red'>{errors.email}</p>
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

            {/* Remember Me & Forgot Password */}
            <div className='flex items-center justify-between'>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className=''
                />
                <span className='text-sm text-deep-charcoal'>
                  {locale === 'en' ? 'Remember me' : 'تذكرني'}
                </span>
              </label>
              <Link
                href={`/${locale}/forgot-password`}
                className='text-sm text-saudi-green hover:text-saudi-green/80 font-medium transition-colors'
              >
                {locale === 'en' ? 'Forgot password?' : 'نسيت كلمة المرور؟'}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display cursor-pointer'
            >
              {isLoading
                ? locale === 'en'
                  ? 'Logging in...'
                  : 'جاري تسجيل الدخول...'
                : locale === 'en'
                ? 'Log In'
                : 'تسجيل الدخول'}
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

          {/* Signup Link */}
          <div className='text-center'>
            <p className='text-sm text-deep-charcoal/70'>
              {locale === 'en' ? "Don't have an account?" : 'ليس لديك حساب؟'}{' '}
              <Link
                href={`/${locale}/signup`}
                className='text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors'
              >
                {locale === 'en' ? 'Sign up' : 'إنشاء حساب'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
