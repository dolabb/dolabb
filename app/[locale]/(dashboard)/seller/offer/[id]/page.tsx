'use client';

import { useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAppSelector } from '@/lib/store/hooks';
import OfferShipmentPage from '@/components/dashboard/OfferShipmentPage';

export default function SellerOfferDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const offerId = params?.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = !!user;
  const isSeller = user?.role === 'seller';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    } else if (!isSeller) {
      router.push(`/${locale}/buyer`);
    }
  }, [isAuthenticated, isSeller, locale, router]);

  if (!isAuthenticated || !isSeller || !offerId) {
    return null;
  }

  return <OfferShipmentPage offerId={offerId} />;
}

