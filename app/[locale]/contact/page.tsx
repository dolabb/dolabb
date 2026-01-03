'use client';

import { apiClient } from '@/lib/api/client';
import { useAppSelector } from '@/lib/store/hooks';
import { handleApiErrorWithToast } from '@/utils/errorHandler';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { HiEnvelope, HiPaperAirplane } from 'react-icons/hi2';

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
      const response = await apiClient.post('/api/contact/', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        userId: user?.id || undefined,
      });

      if (response.data.success) {
        toast.success(
          locale === 'en'
            ? 'Thank you for contacting us! We will get back to you soon.'
            : 'شكراً لتواصلك معنا! سنعود إليك قريباً.'
        );

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
      className='min-h-screen bg-gradient-to-br from-off-white via-white to-off-white py-12 px-4'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-saudi-green to-emerald-600 mb-6 shadow-lg'>
            <HiEnvelope className='w-10 h-10 text-white' />
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-deep-charcoal mb-4 font-display'>
            {locale === 'en' ? 'Contact Us' : 'اتصل بنا'}
          </h1>
          <div className='h-1.5 w-32 bg-gradient-to-r from-saudi-green to-emerald-500 rounded-full mx-auto mb-4'></div>
          <p className='text-deep-charcoal/70 text-lg max-w-2xl mx-auto'>
            {locale === 'en'
              ? "We'd love to hear from you! Send us a message and we'll respond as soon as possible."
              : 'نحب أن نسمع منك! أرسل لنا رسالة وسنرد في أقرب وقت ممكن.'}
          </p>
        </div>

        <div className='max-w-3xl mx-auto'>
          {/* Contact Information Card */}
          <div className='mb-8'>
            <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-6 hover:shadow-xl transition-shadow duration-300 inline-block'>
              <div className='flex items-center gap-4'>
                <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-saudi-green/10 to-emerald-500/10 flex items-center justify-center'>
                  <HiEnvelope className='w-6 h-6 text-saudi-green' />
                </div>
                <div>
                  <h3 className='font-semibold text-deep-charcoal mb-1'>
                    {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                  </h3>
                  <a
                    href='mailto:contact@dolabb.com'
                    className='text-saudi-green hover:text-saudi-green/80 transition-colors text-sm'
                  >
                    contact@dolabb.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className='bg-white rounded-2xl shadow-lg border border-rich-sand/20 p-8 md:p-10'>
              <h2 className='text-2xl font-bold text-deep-charcoal mb-6 font-display'>
                {locale === 'en' ? 'Send us a Message' : 'أرسل لنا رسالة'}
              </h2>

              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Name */}
                <div>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
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
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                      errors.name ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                    disabled={isAuthenticated && !!user?.full_name}
                  />
                  {errors.name && (
                    <p className='mt-1 text-sm text-coral-red'>{errors.name}</p>
                  )}
                </div>

                {/* Email and Phone Row */}
                <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='email'
                      className='block text-sm font-medium text-deep-charcoal mb-2'
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
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.email ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                      dir='ltr'
                      disabled={isAuthenticated && !!user?.email}
                    />
                    {errors.email && (
                      <p className='mt-1 text-sm text-coral-red'>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor='phone'
                      className='block text-sm font-medium text-deep-charcoal mb-2'
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
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all ${
                        errors.phone ? 'border-coral-red' : 'border-rich-sand'
                      }`}
                      dir='ltr'
                    />
                    {errors.phone && (
                      <p className='mt-1 text-sm text-coral-red'>
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor='subject'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Subject' : 'الموضوع'} *
                  </label>
                  <select
                    id='subject'
                    name='subject'
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all bg-white ${
                      errors.subject ? 'border-coral-red' : 'border-rich-sand'
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
                      {locale === 'en' ? 'Report an Issue' : 'الإبلاغ عن مشكلة'}
                    </option>
                    <option value='other'>
                      {locale === 'en' ? 'Other' : 'أخرى'}
                    </option>
                  </select>
                  {errors.subject && (
                    <p className='mt-1 text-sm text-coral-red'>
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor='message'
                    className='block text-sm font-medium text-deep-charcoal mb-2'
                  >
                    {locale === 'en' ? 'Message' : 'الرسالة'} *
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder={
                      locale === 'en'
                        ? 'Tell us how we can help you...'
                        : 'أخبرنا كيف يمكننا مساعدتك...'
                    }
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-transparent transition-all resize-none ${
                      errors.message ? 'border-coral-red' : 'border-rich-sand'
                    }`}
                  />
                  {errors.message && (
                    <p className='mt-1 text-sm text-coral-red'>
                      {errors.message}
                    </p>
                  )}
                  <p className='mt-1 text-xs text-deep-charcoal/60'>
                    {locale === 'en'
                      ? `${formData.message.length} characters`
                      : `${formData.message.length} حرف`}
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full bg-gradient-to-r from-saudi-green to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-saudi-green/90 hover:to-emerald-600/90 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-display flex items-center justify-center gap-2'
                >
                  {isSubmitting ? (
                    <>
                      <span className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></span>
                      <span>
                        {locale === 'en' ? 'Sending...' : 'جاري الإرسال...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <HiPaperAirplane className='w-5 h-5' />
                      <span>
                        {locale === 'en' ? 'Send Message' : 'إرسال الرسالة'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
