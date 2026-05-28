'use client';

import { useState } from 'react';
import { ValidationSummary } from '@/lib/types';
import { ArrowRight, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface DecisionGateProps {
  summary: ValidationSummary | null;
  onDecision: (decision: 'continue' | 'pivot' | 'kill') => void;
}

export function DecisionGate({ summary, onDecision }: DecisionGateProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

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
          {/* Score + Decision — always visible */}
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl font-bold" style={{ color }}>
              {summary.score}<span className="text-sm text-[var(--text-muted)]">/100</span>
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${color}22`, color }}>
                {t(`decision.${summary.decision}`)}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{summary.reasoning}</p>
            </div>
          </div>

          {/* Compact evidence/concerns count */}
          <div className="flex gap-3 mb-3 text-xs">
            {summary.evidence.length > 0 && (
              <span className="text-[var(--accent-green)]">✓ {summary.evidence.length} {t('decision.evidence')}</span>
            )}
            {summary.concerns.length > 0 && (
              <span className="text-[var(--accent-yellow)]">⚠ {summary.concerns.length} {t('decision.concerns')}</span>
            )}
          </div>

          {/* Expand/collapse details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[var(--accent-blue)] hover:underline mb-3"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? t('decision.title') : t('decision.title')}
          </button>

          {expanded && (
            <div className="space-y-3 mb-4 pt-2 border-t border-[var(--border)]">
              {/* Analysis sections */}
              {summary.painAnalysis && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-0.5">😤 {t('decision.pain')}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{summary.painAnalysis}</p>
                </div>
              )}
              {summary.demandAnalysis && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-0.5">🔍 {t('decision.demand')}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{summary.demandAnalysis}</p>
                </div>
              )}
              {summary.marketAnalysis && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-0.5">🏢 {t('decision.market')}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{summary.marketAnalysis}</p>
                </div>
              )}

              {/* Evidence */}
              {summary.evidence.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">{t('decision.evidence')}</p>
                  <ul className="space-y-0.5">
                    {summary.evidence.map((item, index) => (
                      <li key={index} className="text-xs text-[var(--text-muted)] flex gap-1.5">
                        <span className="text-[var(--accent-green)] shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {summary.concerns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">{t('decision.concerns')}</p>
                  <ul className="space-y-0.5">
                    {summary.concerns.map((item, index) => (
                      <li key={index} className="text-xs text-[var(--text-muted)] flex gap-1.5">
                        <span className="text-[var(--accent-yellow)] shrink-0">⚠</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {summary.suggestedNextSteps && summary.suggestedNextSteps.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">🚀 {t('decision.nextSteps')}</p>
                  <ul className="space-y-0.5">
                    {summary.suggestedNextSteps.map((step, index) => (
                      <li key={index} className="text-xs text-[var(--text-muted)] flex gap-1.5">
                        <span className="text-[var(--accent-blue)] shrink-0">{index + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {t('decision.fallback')}
        </p>
      )}

      {/* Decision buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onDecision('continue')}
          data-testid="decision-btn-continue"
          aria-label="Continue to next stage"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-[var(--accent-green)]/20 text-[var(--accent-green)] text-sm font-medium hover:bg-[var(--accent-green)]/30 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          {t('decision.continue')}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onDecision('pivot')}
            data-testid="decision-btn-pivot"
            aria-label="Pivot idea"
            className="flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg bg-[var(--accent-yellow)]/20 text-[var(--accent-yellow)] text-sm hover:bg-[var(--accent-yellow)]/30 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('decision.pivot')}
          </button>
          <button
            onClick={() => onDecision('kill')}
            data-testid="decision-btn-kill"
            aria-label="Kill idea"
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
