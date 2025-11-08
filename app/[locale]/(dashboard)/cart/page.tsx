'use client';

import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CartPage() {
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const isRTL = locale === 'ar';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='bg-off-white min-h-screen py-8' dir={isRTL ? 'rtl' : 'ltr'}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-3xl font-bold text-deep-charcoal mb-8'>
          {locale === 'en' ? 'Shopping Cart' : 'سلة التسوق'}
        </h1>
        <div className='bg-white rounded-lg p-8 text-center'>
          <p className='text-deep-charcoal/70'>
            {locale === 'en' ? 'Your cart is empty' : 'سلة التسوق فارغة'}
          </p>
        </div>
      </div>
    </div>
  );
}

