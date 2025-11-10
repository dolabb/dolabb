'use client';

import { useLocale, useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const isRTL = locale === 'ar';

  return (
    <section
      className='relative min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-saudi-green via-off-white to-rich-sand overflow-hidden'
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-5'>
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--deep-charcoal) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <div className='relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold text-deep-charcoal mb-6 font-display tracking-tight'>
          {t('title')}
        </h1>
        <p className='text-lg md:text-xl lg:text-2xl text-deep-charcoal/80 mb-8 max-w-2xl mx-auto leading-relaxed font-medium'>
          {t('subtitle')}
        </p>
      </div>

      {/* Decorative Elements */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-off-white to-transparent'></div>
    </section>
  );
}
