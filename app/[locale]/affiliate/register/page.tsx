'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HiUser, HiLockClosed, HiEye, HiEyeSlash, HiBuildingOffice2, HiCreditCard, HiDocumentText } from 'react-icons/hi2';
import { countries, defaultCountry, Country } from '@/data/countries';
import TermsModal from '@/components/shared/TermsModal';

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
    bankName: '',
    accountNumber: '',
    iban: '',
    accountHolderName: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = locale === 'en' ? 'Full name is required' : 'الاسم الكامل مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email = locale === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = locale === 'en' ? 'Please enter a valid email' : 'يرجى إدخال بريد إلكتروني صحيح';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = locale === 'en' ? 'Phone number is required' : 'رقم الهاتف مطلوب';
    } else if (!/^[0-9]{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = locale === 'en' ? 'Please enter a valid phone number' : 'يرجى إدخال رقم هاتف صحيح';
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

    if (!formData.bankName.trim()) {
      newErrors.bankName = locale === 'en' ? 'Bank name is required' : 'اسم البنك مطلوب';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = locale === 'en' ? 'Account number is required' : 'رقم الحساب مطلوب';
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = locale === 'en' ? 'Account holder name is required' : 'اسم صاحب الحساب مطلوب';
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

    setIsLoading(true);
    
    try {
      // Call API to register affiliate
      const response = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          countryCode: selectedCountry.code,
          dialCode: selectedCountry.dialCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Store affiliate data
      if (typeof window !== 'undefined') {
        localStorage.setItem('affiliate', JSON.stringify(data.affiliate));
      }
      
      // Redirect to affiliate dashboard
      router.push(`/${locale}/affiliate/dashboard`);
    } catch (error: any) {
      alert(error.message || (locale === 'en' ? 'Registration failed. Please try again.' : 'فشل التسجيل. يرجى المحاولة مرة أخرى.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    // Automatically submit form after accepting terms
    setIsLoading(true);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-block">
            <h1 className="text-4xl font-bold text-saudi-green font-display mb-2">Depop</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-deep-charcoal font-display mb-2">
            {locale === 'en' ? 'Affiliate Registration' : 'تسجيل كشريك'}
          </h2>
          <p className="text-deep-charcoal/70">
            {locale === 'en' ? 'Join our affiliate program and earn commissions' : 'انضم إلى برنامج الشراكة واكسب العمولات'}
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-rich-sand/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Information Section */}
            <div className="border-b border-rich-sand/30 pb-4">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-4 flex items-center gap-2">
                <HiUser className="w-5 h-5 text-saudi-green" />
                {locale === 'en' ? 'Personal Information' : 'المعلومات الشخصية'}
              </h3>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Full Name' : 'الاسم الكامل'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiUser className="h-5 w-5 text-deep-charcoal/40" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'John Doe' : 'محمد أحمد'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.fullName ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-coral-red">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={locale === 'en' ? 'you@example.com' : 'example@email.com'}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      errors.email ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-coral-red">{errors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Phone Number' : 'رقم الهاتف'}
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Selector */}
                    <div className="relative" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className={`flex items-center gap-2 px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green transition-all bg-white cursor-pointer ${
                          errors.phone
                            ? 'border-coral-red'
                            : 'border-rich-sand hover:border-saudi-green'
                        }`}
                      >
                        <span className="text-xl">{selectedCountry.flag}</span>
                        <span className="text-sm font-medium text-deep-charcoal">{selectedCountry.dialCode}</span>
                      </button>
                      
                      {/* Country Dropdown */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-2 bg-white border border-rich-sand rounded-lg shadow-lg z-50 w-64 max-h-60 overflow-y-auto">
                          <div className="p-2">
                            <input
                              type="text"
                              placeholder={locale === 'en' ? 'Search country...' : 'ابحث عن دولة...'}
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full px-3 py-2 border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green text-sm mb-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(country);
                                    setShowCountryDropdown(false);
                                    setCountrySearch('');
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-saudi-green/10 transition-colors text-left cursor-pointer ${
                                    selectedCountry.code === country.code ? 'bg-saudi-green/20' : ''
                                  }`}
                                >
                                  <span className="text-xl">{country.flag}</span>
                                  <span className="flex-1 text-sm text-deep-charcoal">{country.name}</span>
                                  <span className="text-sm font-medium text-deep-charcoal/70">{country.dialCode}</span>
                                </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-deep-charcoal/60 text-center">
                                  {locale === 'en' ? 'No countries found' : 'لم يتم العثور على دول'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Phone Input */}
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiUser className="h-5 w-5 text-deep-charcoal/40" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={locale === 'en' ? '123 456 7890' : '50 123 4567'}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
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

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Password' : 'كلمة المرور'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiLockClosed className="h-5 w-5 text-deep-charcoal/40" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'Enter your password' : 'أدخل كلمة المرور'}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.password
                          ? 'border-coral-red'
                          : 'border-rich-sand'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-deep-charcoal/40 hover:text-deep-charcoal transition-colors cursor-pointer"
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
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Confirm Password' : 'تأكيد كلمة المرور'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiLockClosed className="h-5 w-5 text-deep-charcoal/40" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'Confirm your password' : 'أكد كلمة المرور'}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.confirmPassword
                          ? 'border-coral-red'
                          : 'border-rich-sand'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-deep-charcoal/40 hover:text-deep-charcoal transition-colors cursor-pointer"
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
              </div>
            </div>

            {/* Bank Account Information Section */}
            <div className="border-b border-rich-sand/30 pb-4">
              <h3 className="text-lg font-semibold text-deep-charcoal mb-4 flex items-center gap-2">
                <HiBuildingOffice2 className="w-5 h-5 text-saudi-green" />
                {locale === 'en' ? 'Bank Account Details' : 'تفاصيل الحساب البنكي'}
              </h3>
              
              <div className="space-y-4">
                {/* Bank Name */}
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Bank Name' : 'اسم البنك'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiBuildingOffice2 className="h-5 w-5 text-deep-charcoal/40" />
                    </div>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'Bank Name' : 'اسم البنك'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.bankName ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                    />
                  </div>
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-coral-red">{errors.bankName}</p>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Account Number' : 'رقم الحساب'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiCreditCard className="h-5 w-5 text-deep-charcoal/40" />
                    </div>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'Account Number' : 'رقم الحساب'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.accountNumber ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                      dir="ltr"
                    />
                  </div>
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-coral-red">{errors.accountNumber}</p>
                  )}
                </div>

                {/* IBAN (Optional) */}
                <div>
                  <label htmlFor="iban" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'IBAN (Optional)' : 'رقم الآيبان (اختياري)'}
                  </label>
                  <input
                    type="text"
                    id="iban"
                    name="iban"
                    value={formData.iban}
                    onChange={handleChange}
                    placeholder={locale === 'en' ? 'IBAN' : 'رقم الآيبان'}
                    className="w-full px-4 py-3 border border-rich-sand rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all"
                    dir="ltr"
                  />
                </div>

                {/* Account Holder Name */}
                <div>
                  <label htmlFor="accountHolderName" className="block text-sm font-medium text-deep-charcoal mb-2">
                    {locale === 'en' ? 'Account Holder Name' : 'اسم صاحب الحساب'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HiUser className="h-5 w-5 text-deep-charcoal/40" />
                    </div>
                    <input
                      type="text"
                      id="accountHolderName"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'Account Holder Name' : 'اسم صاحب الحساب'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.accountHolderName ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                    />
                  </div>
                  {errors.accountHolderName && (
                    <p className="mt-1 text-sm text-coral-red">{errors.accountHolderName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-saudi-green text-white py-3 rounded-lg font-semibold hover:bg-saudi-green/90 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display cursor-pointer"
            >
              {isLoading
                ? (locale === 'en' ? 'Registering...' : 'جاري التسجيل...')
                : (locale === 'en' ? 'Register as Affiliate' : 'التسجيل كشريك')}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-rich-sand"></div>
            <span className="px-4 text-sm text-deep-charcoal/60">
              {locale === 'en' ? 'or' : 'أو'}
            </span>
            <div className="flex-1 border-t border-rich-sand"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-deep-charcoal/70">
              {locale === 'en' ? 'Already have an affiliate account?' : 'هل لديك حساب شريك بالفعل؟'}{' '}
              <Link
                href={`/${locale}/affiliate/login`}
                className="text-saudi-green hover:text-saudi-green/80 font-semibold transition-colors"
              >
                {locale === 'en' ? 'Log in' : 'تسجيل الدخول'}
              </Link>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-deep-charcoal/60">
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
        description={locale === 'en' ? 'You must accept our Terms of Service to register as an affiliate' : 'يجب عليك قبول شروط الخدمة للتسجيل كشريك'}
      />
    </div>
  );
}

