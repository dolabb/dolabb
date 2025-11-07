import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales } from '@/i18n';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <NavigationBar />
        <main className="grow pt-16 md:pt-20">
          {children}
        </main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}

