'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiLockClosed, HiEye, HiEyeSlash, HiCheckCircle } from 'react-icons/hi2';

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';
  
  const identifier = searchParams.get('email') || searchParams.get('phone') || '';
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!identifier) {
      router.push(`/${locale}/forgot-password`);
    }
  }, [identifier, locale, router]);

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

    if (!formData.password) {
      newErrors.password = locale === 'en' ? 'Password is required' : 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = locale === 'en' ? 'Password must be at least 8 characters' : 'يجب أن تكون كلمة المرور على الأقل 8 أحرف';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = locale === 'en' 
        ? 'Password must contain uppercase, lowercase, and number' 
        : 'يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = locale === 'en' ? 'Please confirm your password' : 'يرجى تأكيد كلمة المرور';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = locale === 'en' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة';
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
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-saudi-green/10 flex items-center justify-center">
              <HiCheckCircle className="w-8 h-8 text-saudi-green" />
            </div>
            <h2 className="text-2xl font-semibold text-deep-charcoal font-display mb-2">
              {locale === 'en' ? 'Password Reset Successful!' : 'تم إعادة تعيين كلمة المرور بنجاح!'}
            </h2>
            <p className="text-deep-charcoal/70 mb-6">
              {locale === 'en' 
                ? 'Your password has been reset successfully. Redirecting to login...' 
                : 'تم إعادة تعيين كلمة المرور بنجاح. جاري إعادة التوجيه لتسجيل الدخول...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-4xl font-bold text-saudi-green font-display mb-2">Depop</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-deep-charcoal font-display mb-2">
            {locale === 'en' ? 'Create New Password' : 'إنشاء كلمة مرور جديدة'}
          </h2>
          <p className="text-deep-charcoal/70">
            {locale === 'en' 
              ? `Enter your new password for ${identifier}` 
              : `أدخل كلمة المرور الجديدة لـ ${identifier}`}
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-deep-charcoal mb-2">
                {locale === 'en' ? 'New Password' : 'كلمة المرور الجديدة'}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <HiLockClosed className="h-5 w-5 text-deep-charcoal/40" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={locale === 'en' ? 'Enter new password' : 'أدخل كلمة المرور الجديدة'}
                  className={`w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                    errors.password
                      ? 'border-coral-red'
                      : 'border-rich-sand'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-deep-charcoal/40 hover:text-deep-charcoal transition-colors`}
                >
                  {showPassword ? (
                    <HiEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-coral-red">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-deep-charcoal/60">
                {locale === 'en' 
                  ? 'Must be at least 8 characters with uppercase, lowercase, and number' 
                  : 'يجب أن تكون 8 أحرف على الأقل مع حرف كبير وصغير ورقم'}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-deep-charcoal mb-2">
                {locale === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'}
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                  <HiLockClosed className="h-5 w-5 text-deep-charcoal/40" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={locale === 'en' ? 'Confirm new password' : 'أكد كلمة المرور الجديدة'}
                  className={`w-full ${isRTL ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                    errors.confirmPassword
                      ? 'border-coral-red'
                      : 'border-rich-sand'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-deep-charcoal/40 hover:text-deep-charcoal transition-colors`}
                >
                  {showConfirmPassword ? (
                    <HiEyeSlash className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-coral-red">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display"
            >
              {isLoading
                ? (locale === 'en' ? 'Resetting...' : 'جاري إعادة التعيين...')
                : (locale === 'en' ? 'Reset Password' : 'إعادة تعيين كلمة المرور')}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}/login`}
              className="text-sm text-saudi-green hover:text-saudi-green/80 font-medium transition-colors"
            >
              {locale === 'en' ? '← Back to Login' : '← العودة لتسجيل الدخول'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

