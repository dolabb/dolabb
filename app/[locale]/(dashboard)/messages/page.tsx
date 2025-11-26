'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MessagesContent from '@/components/dashboard/MessagesContent';
import { useAppSelector } from '@/lib/store/hooks';

export default function MessagesPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  // Check both Redux state and localStorage for authentication
  const isAuthenticated = !!(user && token) || (typeof window !== 'undefined' && !!localStorage.getItem('token') && !!localStorage.getItem('user'));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, locale, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <MessagesContent />;
}

