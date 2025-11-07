import './globals.css';
import LocaleHtml from '@/components/LocaleHtml';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        <LocaleHtml>
          {children}
        </LocaleHtml>
      </body>
    </html>
  );
}
