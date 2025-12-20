'use client';

import { useLocale } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import DisputeDetailContent from '@/components/dashboard/DisputeDetailContent';
import { useAppSelector } from '@/lib/store/hooks';

export default function DisputeDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const disputeId = params?.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated || !disputeId) {
    return null;
  }

  return <DisputeDetailContent disputeId={disputeId} />;
}

