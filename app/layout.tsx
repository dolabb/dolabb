import LocaleHtml from '@/components/LocaleHtml';
import AuthRestore from '@/components/shared/AuthRestore';
import AppPrefetch from '@/components/shared/AppPrefetch';
import ReduxProvider from '@/providers/ReduxProvider';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <AuthRestore />
          <AppPrefetch />
          <LocaleHtml>{children}</LocaleHtml>
        </ReduxProvider>
      </body>
    </html>
  );
}
