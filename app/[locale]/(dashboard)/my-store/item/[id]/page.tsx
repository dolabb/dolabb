'use client';

import { useLocale } from 'next-intl';
import { useAppSelector } from '@/lib/store/hooks';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import ItemDetailView from '@/components/dashboard/ItemDetailView';

export default function ItemDetailPage() {
  const locale = useLocale();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <ItemDetailView itemId={itemId} />;
}

