'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaInstagram, FaTiktok } from 'react-icons/fa';
import { HiEnvelope, HiDocumentText } from 'react-icons/hi2';

export default function Footer() {
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'ar';

  // Social media links
  const socialLinks = {
    instagram: 'https://www.instagram.com/dolabb.buy.sell.style',
    tiktok: 'https://www.tiktok.com/@dolabb.buy.sell.style',
  };

  // Don't show footer on messages route
  if (pathname?.includes('/messages')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className='bg-gradient-to-br from-white via-off-white to-saudi-green/5 border-t-2 border-rich-sand/30 relative overflow-hidden'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative Background Elements */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-0 left-1/4 w-96 h-96 bg-saudi-green/5 rounded-full blur-3xl'></div>
        <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16'>
        {/* Main Footer Content */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-12'>
          {/* Logo & Brand Section */}
          <div className='lg:col-span-1'>
            <Link
              href={`/${locale}`}
              className='inline-block group transition-transform hover:scale-105 mb-4'
            >
              <Image
                src='/Logo.svg'
                alt='dوُlabb! Logo'
                width={160}
                height={120}
                priority
                className='drop-shadow-lg'
              />
            </Link>
            <p className='text-deep-charcoal/70 text-sm leading-relaxed max-w-xs'>
              {locale === 'en'
                ? 'Your trusted marketplace for buying and selling unique fashion items.'
                : 'سوقك الموثوق لشراء وبيع العناصر الأزياء الفريدة.'}
            </p>
          </div>

          {/* Quick Links Section */}
          <div className='lg:col-span-1'>
            <h3 className='text-deep-charcoal font-bold text-lg mb-4 sm:mb-6 font-display'>
              {locale === 'en' ? 'Quick Links' : 'روابط سريعة'}
            </h3>
            <ul className='space-y-3'>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className='flex items-center gap-2 text-deep-charcoal/70 hover:text-saudi-green transition-colors duration-200 group text-sm sm:text-base'
                >
                  <HiDocumentText className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  <span>
                    {locale === 'en' ? 'Terms and Services' : 'شروط الخدمة'}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className='flex items-center gap-2 text-deep-charcoal/70 hover:text-saudi-green transition-colors duration-200 group text-sm sm:text-base'
                >
                  <HiEnvelope className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  <span>{locale === 'en' ? 'Contact Us' : 'اتصل بنا'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Section */}
          <div className='lg:col-span-1'>
            <h3 className='text-deep-charcoal font-bold text-lg mb-4 sm:mb-6 font-display'>
              {locale === 'en' ? 'Follow Us' : 'تابعنا'}
            </h3>
            <p className='text-deep-charcoal/70 text-sm mb-4 sm:mb-6'>
              {locale === 'en'
                ? 'Stay connected with us on social media'
                : 'ابق على اتصال معنا على وسائل التواصل الاجتماعي'}
            </p>
            <div className='flex items-center gap-4'>
              <a
                href={socialLinks.instagram}
                target='_blank'
                rel='noopener noreferrer'
                className='group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500'
                aria-label='Instagram'
              >
                <FaInstagram className='w-6 h-6 sm:w-7 sm:h-7 text-deep-charcoal group-hover:text-white transition-colors duration-300' />
                <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-300'></div>
              </a>
              <a
                href={socialLinks.tiktok}
                target='_blank'
                rel='noopener noreferrer'
                className='group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-black hover:to-gray-800'
                aria-label='TikTok'
              >
                <FaTiktok className='w-6 h-6 sm:w-7 sm:h-7 text-deep-charcoal group-hover:text-white transition-colors duration-300' />
                <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-black/0 to-gray-800/0 group-hover:from-black/20 group-hover:to-gray-800/20 transition-all duration-300'></div>
              </a>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className='lg:col-span-1'>
            <h3 className='text-deep-charcoal font-bold text-lg mb-4 sm:mb-6 font-display'>
              {locale === 'en' ? 'Get in Touch' : 'تواصل معنا'}
            </h3>
            <div className='space-y-4'>
              <a
                href='mailto:contact@dolabb.com'
                className='flex items-center gap-3 text-deep-charcoal/70 hover:text-saudi-green transition-colors duration-200 group'
              >
                <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-saudi-green/10 to-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform'>
                  <HiEnvelope className='w-5 h-5 text-saudi-green' />
                </div>
                <div>
                  <p className='text-xs text-deep-charcoal/50 mb-0.5'>
                    {locale === 'en' ? 'Email' : 'البريد الإلكتروني'}
                  </p>
                  <p className='text-sm sm:text-base font-medium'>
                    contact@dolabb.com
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className='h-px bg-gradient-to-r from-transparent via-rich-sand/50 to-transparent mb-6 sm:mb-8'></div>

        {/* Bottom Section */}
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
          <p className='text-deep-charcoal/60 text-xs sm:text-sm text-center sm:text-left'>
            © {currentYear} Dolabb.{' '}
            {locale === 'en'
              ? 'All rights reserved.'
              : 'جميع الحقوق محفوظة.'}
          </p>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-saudi-green animate-pulse'></div>
            <span className='text-xs sm:text-sm text-deep-charcoal/60'>
              {locale === 'en' ? 'Made with ❤️ in Saudi Arabia' : 'صُنع بـ ❤️ في المملكة العربية السعودية'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
