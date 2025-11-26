import './globals.css';
import LocaleHtml from '@/components/LocaleHtml';
import ReduxProvider from '@/providers/ReduxProvider';
import AuthRestore from '@/components/shared/AuthRestore';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <ReduxProvider>
          <AuthRestore />
          <LocaleHtml>
            {children}
          </LocaleHtml>
        </ReduxProvider>
      </body>
    </html>
  );
}
