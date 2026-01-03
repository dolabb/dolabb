'use client';

import { apiClient } from '@/lib/api/client';
import { useAppSelector } from '@/lib/store/hooks';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import {
  HiChatBubbleLeftRight,
  HiClock,
  HiEnvelope,
  HiPaperAirplane,
  HiSparkles,
} from 'react-icons/hi2';

export default function ContactPage() {
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const user = useAppSelector(state => state.auth.user);

  const [formData, setFormData] = useState({
    name: user?.full_name || user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = locale === 'en' ? 'Name is required' : 'الاسم مطلوب';
    }

    if (!formData.email.trim()) {
      newErrors.email =
        locale === 'en' ? 'Email is required' : 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email =
        locale === 'en'
          ? 'Please enter a valid email'
          : 'يرجى إدخال بريد إلكتروني صحيح';
    }

    if (!formData.subject.trim()) {
      newErrors.subject =
        locale === 'en' ? 'Subject is required' : 'الموضوع مطلوب';
    }

    if (!formData.message.trim()) {
      newErrors.message =
        locale === 'en' ? 'Message is required' : 'الرسالة مطلوبة';
    } else if (formData.message.trim().length < 10) {
      newErrors.message =
        locale === 'en'
          ? 'Message must be at least 10 characters'
          : 'يجب أن تكون الرسالة على الأقل 10 أحرف';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Map subject values to match API expectations
      const subjectMap: Record<string, string> = {
        general: 'General Inquiry',
        support: 'Technical Support',
        billing: 'Billing Question',
        partnership: 'Partnership Inquiry',
        report: 'Report an Issue',
        other: 'Other',
      };

      const apiSubject = subjectMap[formData.subject] || formData.subject;

      const response = await apiClient.post('/api/auth/contact/', {
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: apiSubject,
        message: formData.message.trim(),
      });

      if (response.data.success) {
        // Use the message from API response if available, otherwise use default
        const successMessage =
          response.data.message ||
          (locale === 'en'
            ? 'Thank you for contacting us! We will get back to you soon.'
            : 'شكراً لتواصلك معنا! سنعود إليك قريباً.');

        toast.success(successMessage);

        // Reset form (keep user info if logged in)
        setFormData({
          name: user?.full_name || user?.username || '',
          email: user?.email || '',
          phone: user?.phone || '',
          subject: '',
          message: '',
        });
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error: unknown) {
      handleApiErrorWithToast(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className='min-h-screen bg-gradient-to-br from-saudi-green/5 via-off-white to-emerald-50/30 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-7xl mx-auto'>
        {/* Hero Header Section */}
        <div className='text-center mb-8 sm:mb-12 md:mb-16 relative'>
          {/* Decorative Background Elements */}
          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <div className='w-64 h-64 sm:w-96 sm:h-96 bg-saudi-green/5 rounded-full blur-3xl'></div>
          </div>

          <div className='relative z-10'>
            {/* Icon with animated background */}
            <div className='inline-flex items-center justify-center mb-6 sm:mb-8 relative'>
              <div className='absolute inset-0 bg-gradient-to-br from-saudi-green/20 to-emerald-600/20 rounded-3xl blur-xl animate-pulse'></div>
              <div className='relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-saudi-green to-emerald-600 shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300'>
                <HiChatBubbleLeftRight className='w-10 h-10 sm:w-12 sm:h-12 text-white' />
              </div>
            </div>

            <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-deep-charcoal mb-4 sm:mb-6 font-display leading-tight'>
              {locale === 'en' ? (
                <>
                  Get in{' '}
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-saudi-green to-emerald-600'>
                    Touch
                  </span>
                </>
              ) : (
                <>
                  تواصل{' '}
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-saudi-green to-emerald-600'>
                    معنا
                  </span>
                </>
              )}
            </h1>

            <div className='h-2 w-32 sm:w-40 bg-gradient-to-r from-saudi-green via-emerald-500 to-saudi-green rounded-full mx-auto mb-4 sm:mb-6'></div>

            <p className='text-deep-charcoal/70 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-4'>
              {locale === 'en'
                ? "Have a question or need assistance? We're here to help! Drop us a message and we'll get back to you as soon as possible."
                : 'لديك سؤال أو تحتاج مساعدة؟ نحن هنا لمساعدتك! أرسل لنا رسالة وسنعود إليك في أقرب وقت ممكن.'}
            </p>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className='grid lg:grid-cols-3 gap-6 sm:gap-8'>
          {/* Left Sidebar - Contact Info (Desktop) */}
          <div className='lg:col-span-1 hidden lg:block'>
            <div className='sticky top-24 space-y-6'>
              {/* Email Card */}
              <div className='bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-rich-sand/30 p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-saudi-green/10 to-emerald-500/10 flex items-center justify-center mb-5 group'>
                    <HiEnvelope className='w-10 h-10 text-saudi-green group-hover:scale-110 transition-transform duration-300' />
                  </div>
                  <h3 className='font-bold text-deep-charcoal mb-3 text-xl'>
                    {locale === 'en' ? 'Email Us' : 'راسلنا'}
                  </h3>
                  <a
                    href='mailto:contact@dolabb.com'
                    className='text-saudi-green hover:text-emerald-600 transition-colors text-lg font-semibold break-all mb-6'
                  >
                    contact@dolabb.com
                  </a>

                  {/* Response Time Info */}
                  <div className='w-full pt-6 border-t border-rich-sand/30'>
                    <div className='flex items-center justify-center gap-3 text-deep-charcoal/70'>
                      <div className='p-2 rounded-lg bg-saudi-green/10'>
                        <HiClock className='w-5 h-5 text-saudi-green' />
                      </div>
                      <div className='text-left'>
                        <p className='text-sm font-semibold text-deep-charcoal'>
                          {locale === 'en' ? 'Response Time' : 'وقت الاستجابة'}
                        </p>
                        <p className='text-xs text-deep-charcoal/60'>
                          {locale === 'en' ? 'Within 24 hours' : 'خلال 24 ساعة'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Info Card */}
              <div className='bg-gradient-to-br from-saudi-green/10 to-emerald-500/10 rounded-3xl border border-saudi-green/20 p-6 backdrop-blur-sm'>
                <div className='flex items-start gap-4'>
                  <div className='p-3 rounded-xl bg-white/50'>
                    <HiSparkles className='w-6 h-6 text-saudi-green' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-deep-charcoal mb-2'>
                      {locale === 'en' ? 'Quick Support' : 'دعم سريع'}
                    </h4>
                    <p className='text-sm text-deep-charcoal/70 leading-relaxed'>
                      {locale === 'en'
                        ? 'Our team is ready to assist you with any questions or concerns.'
                        : 'فريقنا جاهز لمساعدتك في أي أسئلة أو مخاوف.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-rich-sand/30 p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden'>
              {/* Decorative Background Pattern */}
              <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-saudi-green/5 to-transparent rounded-full blur-3xl'></div>
              <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-full blur-3xl'></div>

              <div className='relative z-10'>
                {/* Email Card for Mobile/Tablet */}
                <div className='lg:hidden mb-8'>
                  <div className='bg-gradient-to-br from-saudi-green/10 to-emerald-500/10 rounded-2xl border border-saudi-green/20 p-6 backdrop-blur-sm'>
                    <div className='flex items-center gap-4'>
                      <div className='flex-shrink-0 w-16 h-16 rounded-xl bg-white/50 flex items-center justify-center'>
                        <HiEnvelope className='w-8 h-8 text-saudi-green' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-bold text-deep-charcoal mb-1 text-lg'>
                          {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                        </h3>
                        <a
                          href='mailto:contact@dolabb.com'
                          className='text-saudi-green hover:text-emerald-600 transition-colors text-sm sm:text-base font-semibold break-all'
                        >
                          contact@dolabb.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Header */}
                <div className='mb-8 sm:mb-10'>
                  <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-deep-charcoal mb-3 font-display'>
                    {locale === 'en' ? 'Send us a Message' : 'أرسل لنا رسالة'}
                  </h2>
                  <p className='text-deep-charcoal/60 text-sm sm:text-base'>
                    {locale === 'en'
                      ? "Fill out the form below and we'll get back to you soon."
                      : 'املأ النموذج أدناه وسنعود إليك قريباً.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-6'>
                  {/* Name */}
                  <div className='group'>
                    <label
                      htmlFor='name'
                      className='block text-sm sm:text-base font-semibold text-deep-charcoal mb-2.5 group-focus-within:text-saudi-green transition-colors'
                    >
                      {locale === 'en' ? 'Full Name' : 'الاسم الكامل'} *
                    </label>
                    <input
                      type='text'
                      id='name'
                      name='name'
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={locale === 'en' ? 'John Doe' : 'محمد أحمد'}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-saudi-green/20 focus:border-saudi-green transition-all text-sm sm:text-base bg-white/50 backdrop-blur-sm ${
                        errors.name
                          ? 'border-coral-red focus:border-coral-red focus:ring-coral-red/20'
                          : 'border-rich-sand/50 hover:border-rich-sand'
                      }`}
                      disabled={isAuthenticated && !!user?.full_name}
                    />
                    {errors.name && (
                      <p className='mt-2 text-sm text-coral-red flex items-center gap-1'>
                        <span>•</span>
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Email and Phone Row */}
                  <div className='grid sm:grid-cols-2 gap-5 sm:gap-6'>
                    <div className='group'>
                      <label
                        htmlFor='email'
                        className='block text-sm sm:text-base font-semibold text-deep-charcoal mb-2.5 group-focus-within:text-saudi-green transition-colors'
                      >
                        {locale === 'en' ? 'Email' : 'البريد الإلكتروني'} *
                      </label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={
                          locale === 'en'
                            ? 'you@example.com'
                            : 'example@email.com'
                        }
                        className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-saudi-green/20 focus:border-saudi-green transition-all text-sm sm:text-base bg-white/50 backdrop-blur-sm ${
                          errors.email
                            ? 'border-coral-red focus:border-coral-red focus:ring-coral-red/20'
                            : 'border-rich-sand/50 hover:border-rich-sand'
                        }`}
                        dir='ltr'
                        disabled={isAuthenticated && !!user?.email}
                      />
                      {errors.email && (
                        <p className='mt-2 text-sm text-coral-red flex items-center gap-1'>
                          <span>•</span>
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>

                    <div className='group'>
                      <label
                        htmlFor='phone'
                        className='block text-sm sm:text-base font-semibold text-deep-charcoal mb-2.5 group-focus-within:text-saudi-green transition-colors'
                      >
                        {locale === 'en'
                          ? 'Phone (Optional)'
                          : 'الهاتف (اختياري)'}
                      </label>
                      <input
                        type='tel'
                        id='phone'
                        name='phone'
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={
                          locale === 'en'
                            ? '+966 50 123 4567'
                            : '+966 50 123 4567'
                        }
                        className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-saudi-green/20 focus:border-saudi-green transition-all text-sm sm:text-base bg-white/50 backdrop-blur-sm ${
                          errors.phone
                            ? 'border-coral-red focus:border-coral-red focus:ring-coral-red/20'
                            : 'border-rich-sand/50 hover:border-rich-sand'
                        }`}
                        dir='ltr'
                      />
                      {errors.phone && (
                        <p className='mt-2 text-sm text-coral-red flex items-center gap-1'>
                          <span>•</span>
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className='group'>
                    <label
                      htmlFor='subject'
                      className='block text-sm sm:text-base font-semibold text-deep-charcoal mb-2.5 group-focus-within:text-saudi-green transition-colors'
                    >
                      {locale === 'en' ? 'Subject' : 'الموضوع'} *
                    </label>
                    <select
                      id='subject'
                      name='subject'
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-saudi-green/20 focus:border-saudi-green transition-all bg-white/50 backdrop-blur-sm text-sm sm:text-base cursor-pointer ${
                        errors.subject
                          ? 'border-coral-red focus:border-coral-red focus:ring-coral-red/20'
                          : 'border-rich-sand/50 hover:border-rich-sand'
                      }`}
                    >
                      <option value=''>
                        {locale === 'en' ? 'Select a subject' : 'اختر موضوعاً'}
                      </option>
                      <option value='general'>
                        {locale === 'en' ? 'General Inquiry' : 'استفسار عام'}
                      </option>
                      <option value='support'>
                        {locale === 'en' ? 'Technical Support' : 'الدعم الفني'}
                      </option>
                      <option value='billing'>
                        {locale === 'en'
                          ? 'Billing Question'
                          : 'سؤال عن الفواتير'}
                      </option>
                      <option value='partnership'>
                        {locale === 'en'
                          ? 'Partnership Inquiry'
                          : 'استفسار عن الشراكة'}
                      </option>
                      <option value='report'>
                        {locale === 'en'
                          ? 'Report an Issue'
                          : 'الإبلاغ عن مشكلة'}
                      </option>
                      <option value='other'>
                        {locale === 'en' ? 'Other' : 'أخرى'}
                      </option>
                    </select>
                    {errors.subject && (
                      <p className='mt-2 text-sm text-coral-red flex items-center gap-1'>
                        <span>•</span>
                        <span>{errors.subject}</span>
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div className='group'>
                    <label
                      htmlFor='message'
                      className='block text-sm sm:text-base font-semibold text-deep-charcoal mb-2.5 group-focus-within:text-saudi-green transition-colors'
                    >
                      {locale === 'en' ? 'Message' : 'الرسالة'} *
                    </label>
                    <textarea
                      id='message'
                      name='message'
                      value={formData.message}
                      onChange={handleChange}
                      rows={7}
                      placeholder={
                        locale === 'en'
                          ? 'Tell us how we can help you...'
                          : 'أخبرنا كيف يمكننا مساعدتك...'
                      }
                      className={`w-full px-5 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-saudi-green/20 focus:border-saudi-green transition-all resize-none text-sm sm:text-base bg-white/50 backdrop-blur-sm ${
                        errors.message
                          ? 'border-coral-red focus:border-coral-red focus:ring-coral-red/20'
                          : 'border-rich-sand/50 hover:border-rich-sand'
                      }`}
                    />
                    {errors.message && (
                      <p className='mt-2 text-sm text-coral-red flex items-center gap-1'>
                        <span>•</span>
                        <span>{errors.message}</span>
                      </p>
                    )}
                    <p className='mt-2.5 text-xs sm:text-sm text-deep-charcoal/50 flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-saudi-green/40'></span>
                      <span>
                        {locale === 'en'
                          ? `${formData.message.length} characters`
                          : `${formData.message.length} حرف`}
                      </span>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className='pt-4'>
                    <button
                      type='submit'
                      disabled={isSubmitting}
                      className='w-full bg-gradient-to-r from-saudi-green via-emerald-600 to-saudi-green bg-size-200 bg-pos-0 hover:bg-pos-100 text-white py-4 sm:py-5 rounded-xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display flex items-center justify-center gap-3 text-base sm:text-lg md:text-xl shadow-lg relative overflow-hidden group'
                    >
                      {/* Animated background */}
                      <div className='absolute inset-0 bg-gradient-to-r from-emerald-600 to-saudi-green opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                      <span className='relative z-10 flex items-center gap-3'>
                        {isSubmitting ? (
                          <>
                            <span className='animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent'></span>
                            <span>
                              {locale === 'en'
                                ? 'Sending...'
                                : 'جاري الإرسال...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <HiPaperAirplane className='w-6 h-6 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300' />
                            <span>
                              {locale === 'en'
                                ? 'Send Message'
                                : 'إرسال الرسالة'}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
