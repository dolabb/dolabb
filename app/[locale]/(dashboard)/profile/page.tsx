'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileContent from '@/components/dashboard/ProfileContent';
import { useAppSelector } from '@/lib/store/hooks';

export default function ProfilePage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <ProfileContent />;
}

