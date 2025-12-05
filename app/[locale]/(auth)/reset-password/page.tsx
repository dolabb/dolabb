'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HiLockClosed, HiEye, HiEyeSlash, HiCheckCircle, HiKey } from 'react-icons/hi2';
import { useResetPasswordMutation } from '@/lib/api/authApi';
import { toast } from '@/utils/toast';
import { handleApiErrorWithToast } from '@/utils/errorHandler';

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';
  
  const emailFromParams = searchParams.get('email') || '';
  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState(['', '', '', '']);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    // Get email from localStorage if not in params
    if (!email && typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('reset_password_email');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // No email found, redirect to forgot password
      router.push(`/${locale}/forgot-password`);
    }
    }
  }, [email, locale, router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      // Focus last input
      document.getElementById('reset-otp-3')?.focus();
    }
  };

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

    const otpString = otp.join('');
    if (otpString.length !== 4) {
      newErrors.otp = locale === 'en' ? 'Please enter 4-digit OTP' : 'يرجى إدخال رمز التحقق المكون من 4 أرقام';
    }

    if (!formData.password) {
      newErrors.password = locale === 'en' ? 'Password is required' : 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      newErrors.password = locale === 'en' ? 'Password must be at least 6 characters' : 'يجب أن تكون كلمة المرور على الأقل 6 أحرف';
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
    
    if (!validateForm() || !email) {
      return;
    }

    try {
      const otpString = otp.join('');
      const result = await resetPassword({
        email,
        otp: otpString,
        new_password: formData.password,
        confirm_password: formData.confirmPassword,
      }).unwrap();

      if (result.success) {
        // Clear stored email
        if (typeof window !== 'undefined') {
          localStorage.removeItem('reset_password_email');
        }

        toast.success(
          locale === 'en'
            ? 'Password reset successfully! Please login with your new password.'
            : 'تم إعادة تعيين كلمة المرور بنجاح! يرجى تسجيل الدخول بكلمة المرور الجديدة.'
        );

      setIsSuccess(true);
        
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
      }
    } catch (error) {
      handleApiErrorWithToast(error);
    }
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
            <h1 className='text-4xl font-bold text-saudi-green font-display mb-2'>
              <img src="/Logo.svg" alt="Dolabb" className='w-20 h-20' />
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold text-deep-charcoal font-display mb-2">
            {locale === 'en' ? 'Create New Password' : 'إنشاء كلمة مرور جديدة'}
          </h2>
          <p className="text-deep-charcoal/70">
            {locale === 'en' 
              ? `Enter OTP and your new password for ${email || 'your account'}` 
              : `أدخل رمز التحقق وكلمة المرور الجديدة لـ ${email || 'حسابك'}`}
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-deep-charcoal mb-2">
                {locale === 'en' ? 'Enter OTP' : 'أدخل رمز التحقق'}
              </label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`reset-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-16 h-16 text-center text-2xl font-semibold border-2 border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-all"
                    dir="ltr"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              {errors.otp && (
                <p className="mt-1 text-sm text-coral-red text-center">{errors.otp}</p>
              )}
              <p className="mt-2 text-xs text-deep-charcoal/60 text-center">
                {locale === 'en' 
                  ? 'Check your email for the OTP code' 
                  : 'تحقق من بريدك الإلكتروني للحصول على رمز التحقق'}
              </p>
            </div>

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
                  ? 'Must be at least 6 characters' 
                  : 'يجب أن تكون 6 أحرف على الأقل'}
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

