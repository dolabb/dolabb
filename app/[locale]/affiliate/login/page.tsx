'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HiEnvelope, HiEye, HiEyeSlash, HiLockClosed } from 'react-icons/hi2';

export default function AffiliateLoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const { login } = useAuth();
  const isRTL = locale === 'ar';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

    setIsLoading(true);

    // In production, this would authenticate with backend
    // For now, check if affiliate exists in localStorage
    setTimeout(() => {
      setIsLoading(false);
      
      // Simulate checking affiliate data
      // In production, this would be an API call
      const storedAffiliates = JSON.parse(
        localStorage.getItem('affiliates') || '[]'
      );
      const affiliate = storedAffiliates.find(
        (a: any) => a.email === formData.email
      );

      if (affiliate) {
        // Store affiliate session
        localStorage.setItem('affiliate', JSON.stringify(affiliate));
        // Redirect to affiliate dashboard
        router.push(`/${locale}/affiliate/dashboard`);
      } else {
        setErrors({
          email: locale === 'en' ? 'Invalid credentials' : 'بيانات الدخول غير صحيحة',
        });
      }
    }, 1500);
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
              ? 'Log in to your affiliate account'
              : 'سجل الدخول إلى حساب الشريك'}
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
                href={`/${locale}/affiliate/forgot-password`}
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
              {locale === 'en'
                ? "Don't have an affiliate account?"
                : 'ليس لديك حساب شريك؟'}{' '}
              <Link
                href={`/${locale}/affiliate/register`}
                className='text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors'
              >
                {locale === 'en' ? 'Register' : 'التسجيل'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

