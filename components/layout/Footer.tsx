'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import {
  HiDocumentText,
  HiQuestionMarkCircle,
  HiShieldCheck,
  HiShoppingBag,
  HiTag,
} from 'react-icons/hi';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <footer
      className='bg-deep-charcoal text-off-white mt-20'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Brand */}
          <div className='col-span-1'>
            <div className='text-2xl font-bold text-saudi-green mb-4 font-display'>
              Depop
            </div>
            <p className='text-rich-sand text-sm leading-relaxed'>
              {locale === 'en'
                ? 'Buy and sell unique fashion from independent creators'
                : 'اشتري وبيع الأزياء الفريدة من المبدعين المستقلين'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='font-semibold mb-4 text-desert-gold font-display'>
              {locale === 'en' ? 'Quick Links' : 'روابط سريعة'}
            </h3>
            <ul className='space-y-2.5 text-sm'>
              <li>
                <Link
                  href={`/${locale}/shop`}
                  className='flex items-center gap-2 hover:text-rich-sand transition-colors group'
                >
                  <HiShoppingBag className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {locale === 'en' ? 'Shop' : 'تسوق'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/sell`}
                  className='flex items-center gap-2 hover:text-rich-sand transition-colors group'
                >
                  <HiTag className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {locale === 'en' ? 'Sell' : 'بيع'}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className='flex items-center gap-2 hover:text-rich-sand transition-colors group'
                >
                  <HiQuestionMarkCircle className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {t('about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className='font-semibold mb-4 text-desert-gold font-display'>
              {locale === 'en' ? 'Support' : 'الدعم'}
            </h3>
            <ul className='space-y-2.5 text-sm'>
              <li>
                <Link
                  href={`/${locale}/help`}
                  className='flex items-center gap-2 hover:text-rich-sand transition-colors group'
                >
                  <HiQuestionMarkCircle className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {t('help')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className='flex items-center gap-2 hover:text-rich-sand transition-colors group'
                >
                  <HiDocumentText className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className='flex items-center gap-2 hover:text-rich-sand transition-colors group'
                >
                  <HiShieldCheck className='w-4 h-4 group-hover:scale-110 transition-transform' />
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className='font-semibold mb-4 text-desert-gold font-display'>
              {locale === 'en' ? 'Follow Us' : 'تابعنا'}
            </h3>
            <div className='flex gap-4'>
              <a
                href='#'
                className='hover:text-desert-gold transition-colors hover:scale-110 transform duration-200'
                aria-label='Facebook'
              >
                <FaFacebook className='w-6 h-6' />
              </a>
              <a
                href='#'
                className='hover:text-desert-gold transition-colors hover:scale-110 transform duration-200'
                aria-label='Twitter'
              >
                <FaTwitter className='w-6 h-6' />
              </a>
              <a
                href='#'
                className='hover:text-desert-gold transition-colors hover:scale-110 transform duration-200'
                aria-label='Instagram'
              >
                <FaInstagram className='w-6 h-6' />
              </a>
            </div>
          </div>
        </div>

        <div className='border-t border-rich-sand/20 mt-8 pt-8 text-center text-sm text-rich-sand'>
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
