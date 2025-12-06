'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const slug = params.slug as string[];

  useEffect(() => {
    // Parse slug to get category and subcategory
    const category = slug[0] || '';
    const subCategory = slug.slice(1).join('-') || '';

    // Build browse URL with category and subcategory filters
    const params = new URLSearchParams();
    if (category) {
      params.set('category', category);
    }
    if (subCategory) {
      params.set('subcategory', subCategory);
    }

    // Redirect to browse page with filters
    router.replace(`/${locale}/browse?${params.toString()}`);
  }, [slug, locale, router]);

  // Show loading state while redirecting
  return (
    <div className='min-h-screen bg-off-white flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-saudi-green mx-auto mb-4'></div>
        <p className='text-deep-charcoal'>
          {locale === 'en' ? 'Loading...' : 'جاري التحميل...'}
        </p>
      </div>
    </div>
  );
}

