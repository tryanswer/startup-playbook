import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/nav';
import { I18nProvider } from '@/lib/i18n-context';

export const metadata: Metadata = {
  title: 'Startup Playbook',
  description: 'AI-powered startup incubation pipeline',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <I18nProvider>
          <Nav />
          <main className="pt-14">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
