import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import NavigationBar from '@/components/layout/NavigationBar';
import { AuthProvider } from '@/contexts/AuthContext';
import { locales } from '@/i18n';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Depop Clone - Buy and Sell Unique Fashion',
  description: 'Buy and sell unique fashion from independent creators',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <div className='min-h-screen flex flex-col'>
          <Header />
          <NavigationBar />
          <main className='grow pt-32 md:pt-20 relative z-10'>{children}</main>
          <Footer />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
