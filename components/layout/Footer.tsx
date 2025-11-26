'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'ar';

  // Don't show footer on messages route
  if (pathname?.includes('/messages')) {
    return null;
  }

  return (
    <footer
      className='bg-rich-sand/30 border-t border-rich-sand/30'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 '>
        <div className='flex items-center justify-between'>
          {/* Logo */}
          <Link href={`/${locale}`} className='flex items-center gap-2 group'>
            <Image
              src='/Logo.svg'
              alt='dalabb Logo'
              width={100}
              height={100}
              priority
            />
          </Link>

          {/* Terms of Service Link */}
          <Link
            href={`/${locale}/terms`}
            className='text-saudi-green hover:text-saudi-green/80 transition-colors font-medium text-sm md:text-base'
          >
            {locale === 'en' ? 'Terms of Service' : 'شروط الخدمة'}
          </Link>
        </div>
      </div>
    </footer>
  );
}
