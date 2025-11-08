'use client';

import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProfileContent from '@/components/dashboard/ProfileContent';

export default function ProfilePage() {
  const locale = useLocale();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <ProfileContent />;
}

