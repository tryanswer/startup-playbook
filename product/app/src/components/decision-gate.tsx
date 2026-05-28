'use client';

import { ValidationSummary } from '@/lib/types';
import { ArrowRight, RotateCcw, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface DecisionGateProps {
  summary: ValidationSummary | null;
  onDecision: (decision: 'continue' | 'pivot' | 'kill') => void;
}

export function DecisionGate({ summary, onDecision }: DecisionGateProps) {
  const { t } = useI18n();
  const decisionColors = {
    continue: 'var(--accent-green)',
    pivot: 'var(--accent-yellow)',
    kill: 'var(--accent-red)',
  };

  const color = summary ? decisionColors[summary.decision] : 'var(--text-muted)';

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{t('decision.title')}</h3>

      {summary ? (
        <>
          {/* Score */}
          <div className="text-center mb-4">
            <div className="text-3xl font-bold" style={{ color }}>
              {t(`decision.${summary.decision}`)}
            </div>
            <div className="text-sm text-[var(--text-muted)] mt-1">
              {t('decision.score', { score: summary.score })}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-2">{summary.reasoning}</p>
          </div>

          {/* Evidence */}
          {summary.evidence.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">{t('decision.evidence')}</p>
              <ul className="space-y-1">
                {summary.evidence.map((item, index) => (
                  <li key={index} className="text-xs text-[var(--text-secondary)] flex gap-1.5">
                    <span className="text-[var(--accent-green)]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Concerns */}
          {summary.concerns.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">{t('decision.concerns')}</p>
              <ul className="space-y-1">
                {summary.concerns.map((item, index) => (
                  <li key={index} className="text-xs text-[var(--text-secondary)] flex gap-1.5">
                    <span className="text-[var(--accent-yellow)]">⚠</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {t('decision.completed')}
        </p>
      )}

      {/* Decision buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onDecision('continue')}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-sm font-medium hover:bg-[var(--accent-green)]/30 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          {t('decision.continue')}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onDecision('pivot')}
            className="flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)] text-sm hover:bg-[var(--accent-yellow)]/30 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('decision.pivot')}
          </button>
          <button
            onClick={() => onDecision('kill')}
            className="flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg bg-[var(--accent-red)]/20 text-[var(--accent-red)] text-sm hover:bg-[var(--accent-red)]/30 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            {t('decision.kill')}
          </button>
        </div>
      </div>
    </div>
  );
}
