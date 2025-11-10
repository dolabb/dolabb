'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import AffiliateDashboardContent from '@/components/dashboard/AffiliateDashboardContent';

export default function AffiliateDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if affiliate is logged in
    if (typeof window !== 'undefined') {
      const storedAffiliate = localStorage.getItem('affiliate');
      if (storedAffiliate) {
        setAffiliate(JSON.parse(storedAffiliate));
      } else {
        // Redirect to login if not logged in
        router.push(`/${locale}/affiliate/login`);
      }
    }
    setLoading(false);
  }, [locale, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-deep-charcoal">Loading...</div>
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  return <AffiliateDashboardContent affiliate={affiliate} />;
}

