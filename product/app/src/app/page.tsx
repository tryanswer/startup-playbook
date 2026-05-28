'use client';

import Link from 'next/link';
import { Lightbulb, Package, Terminal, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          {t('home.title')}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-12">
          {t('home.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link
            href="/ideas"
            data-testid="home-card-ideas"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent-blue)] transition-colors group"
          >
            <Lightbulb className="h-8 w-8 text-[var(--accent-yellow)] group-hover:scale-110 transition-transform" />
            <span className="font-medium">{t('home.ideas.label')}</span>
            <span className="text-sm text-[var(--text-muted)]">{t('home.ideas.desc')}</span>
          </Link>

          <Link
            href="/products"
            data-testid="home-card-products"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent-green)] transition-colors group"
          >
            <Package className="h-8 w-8 text-[var(--accent-green)] group-hover:scale-110 transition-transform" />
            <span className="font-medium">{t('home.products.label')}</span>
            <span className="text-sm text-[var(--text-muted)]">{t('home.products.desc')}</span>
          </Link>

          <Link
            href="/agent"
            data-testid="home-card-agent"
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent-purple)] transition-colors group"
          >
            <Terminal className="h-8 w-8 text-[var(--accent-purple)] group-hover:scale-110 transition-transform" />
            <span className="font-medium">{t('home.agent.label')}</span>
            <span className="text-sm text-[var(--text-muted)]">{t('home.agent.desc')}</span>
          </Link>
        </div>

        <Link
          href="/ideas/new"
          data-testid="home-btn-start"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent-blue)] text-white font-medium hover:brightness-110 transition-all"
        >
          {t('home.cta')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
