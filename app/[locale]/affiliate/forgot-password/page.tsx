'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiEnvelope, HiPhone, HiChevronDown } from 'react-icons/hi2';
import { countries, defaultCountry, Country } from '@/data/countries';

export default function AffiliateForgotPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const isRTL = locale === 'ar';
  
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.dialCode.includes(countrySearch) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );
  
  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    
    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (method === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = locale === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = locale === 'en' ? 'Please enter a valid email' : 'يرجى إدخال بريد إلكتروني صحيح';
      }
    } else {
      if (!formData.phone.trim()) {
        newErrors.phone = locale === 'en' ? 'Phone number is required' : 'رقم الهاتف مطلوب';
      } else if (!/^[0-9]{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = locale === 'en' ? 'Please enter a valid phone number' : 'يرجى إدخال رقم هاتف صحيح';
      }
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
      setIsSubmitted(true);
      // In a real app, you would redirect to a verification page or show OTP input
      setTimeout(() => {
        router.push(`/${locale}/affiliate/reset-password?method=${method}&${method === 'email' ? `email=${formData.email}` : `phone=${selectedCountry.dialCode}${formData.phone}`}`);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-4xl font-bold text-saudi-green font-display mb-2">Depop</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-deep-charcoal font-display mb-2">
            {locale === 'en' ? 'Reset Password' : 'إعادة تعيين كلمة المرور'}
          </h2>
          <p className="text-deep-charcoal/70">
            {locale === 'en' 
              ? 'Choose how you want to reset your password' 
              : 'اختر طريقة إعادة تعيين كلمة المرور'}
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30">
          {!isSubmitted ? (
            <>
              {/* Method Selection */}
              <div className="flex gap-2 mb-6 p-1 bg-rich-sand/30 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setErrors({});
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                    method === 'email'
                      ? 'bg-white text-saudi-green shadow-sm'
                      : 'text-deep-charcoal/70 hover:text-deep-charcoal'
                  }`}
                >
                  {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('phone');
                    setErrors({});
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                    method === 'phone'
                      ? 'bg-white text-saudi-green shadow-sm'
                      : 'text-deep-charcoal/70 hover:text-deep-charcoal'
                  }`}
                >
                  {locale === 'en' ? 'Phone' : 'الهاتف'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {method === 'email' ? (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-deep-charcoal mb-2">
                      {locale === 'en' ? 'Email Address' : 'عنوان البريد الإلكتروني'}
                    </label>
                    <div className="relative">
                      <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                        <HiEnvelope className="h-5 w-5 text-deep-charcoal/40" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={locale === 'en' ? 'you@example.com' : 'example@email.com'}
                        className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                          errors.email
                            ? 'border-coral-red'
                            : 'border-rich-sand'
                        }`}
                        dir="ltr"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-coral-red">{errors.email}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-deep-charcoal mb-2">
                      {locale === 'en' ? 'Phone Number' : 'رقم الهاتف'}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center gap-2 px-3 py-3 border border-rich-sand rounded-lg hover:border-saudi-green transition-colors bg-white min-w-[120px]"
                        >
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm text-deep-charcoal">{selectedCountry.dialCode}</span>
                          <HiChevronDown className={`w-4 h-4 text-deep-charcoal/50 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-rich-sand rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            <div className="p-2 sticky top-0 bg-white border-b border-rich-sand">
                              <input
                                type="text"
                                placeholder={locale === 'en' ? 'Search...' : 'بحث...'}
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                className="w-full px-3 py-2 border border-rich-sand rounded-md focus:outline-none focus:ring-2 focus:ring-saudi-green text-sm"
                                dir="ltr"
                              />
                            </div>
                            {filteredCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setShowCountryDropdown(false);
                                  setCountrySearch('');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-rich-sand/30 transition-colors text-left"
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="flex-1 text-sm text-deep-charcoal">{country.name}</span>
                                <span className="text-sm text-deep-charcoal/70">{country.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative flex-1">
                        <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                          <HiPhone className="h-5 w-5 text-deep-charcoal/40" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder={locale === 'en' ? '1234567890' : '1234567890'}
                          className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                            errors.phone
                              ? 'border-coral-red'
                              : 'border-rich-sand'
                          }`}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-coral-red">{errors.phone}</p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display"
                >
                  {isLoading
                    ? (locale === 'en' ? 'Sending...' : 'جاري الإرسال...')
                    : (locale === 'en' ? 'Send Reset Link' : 'إرسال رابط إعادة التعيين')}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-saudi-green/10 flex items-center justify-center">
                <HiEnvelope className="w-8 h-8 text-saudi-green" />
              </div>
              <h3 className="text-xl font-semibold text-deep-charcoal mb-2">
                {locale === 'en' ? 'Check your inbox' : 'تحقق من بريدك الوارد'}
              </h3>
              <p className="text-deep-charcoal/70 mb-6">
                {method === 'email'
                  ? (locale === 'en' 
                      ? `We've sent a password reset link to ${formData.email}` 
                      : `لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى ${formData.email}`)
                  : (locale === 'en'
                      ? `We've sent a verification code to ${selectedCountry.dialCode}${formData.phone}`
                      : `لقد أرسلنا رمز التحقق إلى ${selectedCountry.dialCode}${formData.phone}`)}
              </p>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}/affiliate/login`}
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

