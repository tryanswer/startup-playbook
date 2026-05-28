import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';
import { I18nProvider } from '@/lib/i18n-context';
import { ErrorTrackingInit } from '@/components/error-tracking-init';

export const metadata: Metadata = {
  title: 'Startup Playbook',
  description: 'AI-powered startup incubation pipeline',
  openGraph: {
    title: 'Startup Playbook',
    description: 'AI-powered startup incubation pipeline',
    type: 'website',
  },
  other: {
    'theme-color': '#0a0a0a',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen">
        <I18nProvider>
          <ErrorTrackingInit />
          <Nav />
          <main className="pt-14">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
