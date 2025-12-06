'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaInstagram, FaTiktok } from 'react-icons/fa';

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
      className='bg-white border-t border-rich-sand/30'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Main Footer Content */}
        <div>
          <div className='flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8'>
            {/* Logo Section */}
            <div className='flex flex-col items-center md:items-start gap-3'>
              <Link
                href={`/${locale}`}
                className='flex items-center gap-2 group transition-transform hover:scale-105'
              >
                <Image
                  src='/Logo.svg'
                  alt='dalabb Logo'
                  width={160}
                  height={120}
                  priority
                  className='drop-shadow-sm'
                />
              </Link>
            </div>

            {/* Social Media Section */}
            <div className='flex flex-col items-center gap-4'>
              <h3 className='text-deep-charcoal font-semibold text-sm uppercase tracking-wider'>
                {locale === 'en' ? 'Follow Us' : 'تابعنا'}
              </h3>
              <div className='flex items-center gap-5'>
                <a
                  href={socialLinks.instagram}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group relative flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500'
                  aria-label='Instagram'
                >
                  <FaInstagram className='w-5 h-5 text-deep-charcoal group-hover:text-white transition-colors duration-300' />
                </a>
                <a
                  href={socialLinks.tiktok}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group relative flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 hover:bg-gradient-to-br hover:from-black hover:to-gray-800'
                  aria-label='TikTok'
                >
                  <FaTiktok className='w-5 h-5 text-deep-charcoal group-hover:text-white transition-colors duration-300' />
                </a>
              </div>
            </div>

            {/* Terms and Services Section */}
            <div className='flex flex-col items-center md:items-end gap-3'>
              <Link
                href={`/${locale}/terms`}
                className='text-saudi-green hover:text-saudi-green/80 transition-all duration-200 font-semibold text-sm md:text-base hover:underline underline-offset-4'
              >
                {locale === 'en' ? 'Terms and Services' : 'شروط الخدمة'}
              </Link>
              <p className='text-deep-charcoal/60 text-xs text-center md:text-right'>
                © {currentYear} Dolabb.{' '}
                {locale === 'en'
                  ? 'All rights reserved.'
                  : 'جميع الحقوق محفوظة.'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className='h-px bg-gradient-to-r from-transparent via-rich-sand/50 to-transparent'></div>
      </div>
    </footer>
  );
}
