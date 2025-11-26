'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import AffiliateProfileContent from '@/components/dashboard/AffiliateProfileContent';

export default function AffiliateProfilePage() {
  const locale = useLocale();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if affiliate is logged in
    if (typeof window !== 'undefined') {
      const storedAffiliate = localStorage.getItem('affiliate');
      const storedToken = localStorage.getItem('affiliate_token');
      
      if (storedAffiliate && storedToken) {
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
      <div className="min-h-screen bg-off-white flex items-center justify-center" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-deep-charcoal">{locale === 'en' ? 'Loading...' : 'جاري التحميل...'}</div>
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  return <AffiliateProfileContent />;
}

