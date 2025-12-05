'use client';

import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAffiliateVerifyOtpMutation, useResendOtpMutation, useUpdateLanguageMutation } from '@/lib/api/authApi';
import { toast } from '@/utils/toast';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
import { HiEnvelope } from 'react-icons/hi2';

export default function AffiliateVerifyOtpPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRTL = locale === 'ar';

  // Get email from query params or localStorage
  const emailFromParams = searchParams.get('email');
  const [email, setEmail] = useState(emailFromParams || '');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const [affiliateVerifyOtp, { isLoading: isVerifying }] = useAffiliateVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [updateLanguage] = useUpdateLanguageMutation();

  useEffect(() => {
    // Get email from localStorage if not in params
    if (!email && typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('affiliate_signup_email');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // No email found, redirect to register
        router.push(`/${locale}/affiliate/register`);
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
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
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
      document.getElementById('otp-3')?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(locale === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب');
      return;
    }

    const otpString = otp.join('');
    if (otpString.length !== 4) {
      toast.error(locale === 'en' ? 'Please enter 4-digit OTP' : 'يرجى إدخال رمز التحقق المكون من 4 أرقام');
      return;
    }

    setIsLoading(true);

    try {
      const result = await affiliateVerifyOtp({
        email,
        otp: otpString,
      }).unwrap();

      if (result.success && result.affiliate && result.token) {
        // Store affiliate data and token
        if (typeof window !== 'undefined') {
          localStorage.setItem('affiliate', JSON.stringify(result.affiliate));
          localStorage.setItem('affiliate_token', result.token);
          localStorage.removeItem('affiliate_signup_email');
          localStorage.removeItem('affiliate_otp');

          // Check if there's a stored guest language preference
          const guestLanguage = localStorage.getItem('guest_language');
          if (guestLanguage && guestLanguage !== locale) {
            // Update affiliate's language preference on backend
            try {
              await updateLanguage({ language: guestLanguage, skipAuth: false }).unwrap();
              // Clear guest language preference after applying it
              localStorage.removeItem('guest_language');
              // Redirect to the preferred language
              router.push(`/${guestLanguage}/affiliate/dashboard`);
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
            ? 'Email verified successfully! Your account is now active.'
            : 'تم التحقق من البريد الإلكتروني بنجاح! حسابك نشط الآن.'
        );

        // Redirect to affiliate dashboard
        setTimeout(() => {
          router.push(`/${locale}/affiliate/dashboard`);
        }, 1500);
      }
    } catch (error) {
      handleApiErrorWithToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error(locale === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب');
      return;
    }

    try {
      const result = await resendOtp({
        email,
        user_type: 'affiliate',
      }).unwrap();

      if (result.success) {
        toast.success(
          locale === 'en' ? 'OTP has been resent to your email.' : 'تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني.'
        );
        // Clear OTP inputs
        setOtp(['', '', '', '']);
        document.getElementById('otp-0')?.focus();
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
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 bg-saudi-green/10 rounded-full flex items-center justify-center'>
              <HiEnvelope className='w-8 h-8 text-saudi-green' />
            </div>
          </div>
          <h2 className='text-2xl font-semibold text-deep-charcoal font-display mb-2'>
            {locale === 'en' ? 'Verify Your Email' : 'تحقق من بريدك الإلكتروني'}
          </h2>
          <p className='text-deep-charcoal/70'>
            {locale === 'en'
              ? `We've sent a verification code to ${email || 'your email'}`
              : `لقد أرسلنا رمز التحقق إلى ${email || 'بريدك الإلكتروني'}`}
          </p>
        </div>

        {/* OTP Form */}
        <div className='bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30'>
          <form onSubmit={handleVerify} className='space-y-6'>
            {/* OTP Inputs */}
            <div>
              <label className='block text-sm font-medium text-deep-charcoal mb-4 text-center'>
                {locale === 'en' ? 'Enter 4-digit code' : 'أدخل الرمز المكون من 4 أرقام'}
              </label>
              <div className='flex gap-3 justify-center'>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className='w-16 h-16 text-center text-2xl font-semibold border-2 border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-all'
                    dir='ltr'
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading || isVerifying || otp.join('').length !== 4}
              className='w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display cursor-pointer'
            >
              {isLoading || isVerifying
                ? locale === 'en'
                  ? 'Verifying...'
                  : 'جاري التحقق...'
                : locale === 'en'
                ? 'Verify Email'
                : 'تحقق من البريد الإلكتروني'}
            </button>
          </form>

          {/* Resend OTP */}
          <div className='mt-6 text-center'>
            <p className='text-sm text-deep-charcoal/70 mb-2'>
              {locale === 'en' ? "Didn't receive the code?" : 'لم تستلم الرمز؟'}
            </p>
            <button
              type='button'
              onClick={handleResendOtp}
              disabled={isResending}
              className='text-sm text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isResending
                ? locale === 'en'
                  ? 'Sending...'
                  : 'جاري الإرسال...'
                : locale === 'en'
                ? 'Resend Code'
                : 'إعادة إرسال الرمز'}
            </button>
          </div>
        </div>

        {/* Back to Register */}
        <div className='mt-6 text-center'>
          <button
            type='button'
            onClick={() => router.push(`/${locale}/affiliate/register`)}
            className='text-sm text-deep-charcoal/70 hover:text-deep-charcoal transition-colors'
          >
            {locale === 'en' ? '← Back to Register' : '← العودة إلى التسجيل'}
          </button>
        </div>
      </div>
    </div>
  );
}

