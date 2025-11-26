'use client';

import { useLocale } from 'next-intl';
import { useAppSelector } from '@/lib/store/hooks';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useGetProductDetailQuery } from '@/lib/api/productsApi';
import ListItemForm from '@/components/dashboard/ListItemForm';
import Link from 'next/link';
import { HiArrowLeft } from 'react-icons/hi2';

export default function EditProductPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const { data: product, isLoading, error } = useGetProductDetailQuery(productId);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className='bg-off-white min-h-screen py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8'>
            <div className='space-y-4'>
              <div className='h-8 bg-rich-sand/30 rounded w-3/4' />
              <div className='h-4 bg-rich-sand/30 rounded w-1/2' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='bg-off-white min-h-screen py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='bg-white rounded-lg border border-rich-sand/30 p-8 text-center'>
            <p className='text-deep-charcoal/70 mb-4'>
              {locale === 'en' ? 'Product not found' : 'المنتج غير موجود'}
            </p>
            <Link
              href={`/${locale}/my-store`}
              className='inline-block text-saudi-green hover:text-saudi-green/80'
            >
              {locale === 'en' ? 'Back to My Store' : 'العودة إلى متجري'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-off-white min-h-screen py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <Link
          href={`/${locale}/my-store/item/${productId}`}
          className='inline-flex items-center gap-2 text-saudi-green hover:text-saudi-green/80 mb-6 font-medium'
        >
          <HiArrowLeft className='w-5 h-5' />
          {locale === 'en' ? 'Back to Product Details' : 'العودة إلى تفاصيل المنتج'}
        </Link>
        <ListItemForm
          productId={productId}
          initialData={product}
          onCancel={() => router.push(`/${locale}/my-store/item/${productId}`)}
        />
      </div>
    </div>
  );
}

