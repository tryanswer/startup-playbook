'use client';

import { Stage, STAGE_CONFIG, STAGE_ORDER } from '@/lib/types';
import { Check, X, Loader2, Circle } from 'lucide-react';

interface StagePipelineProps {
  stages: Stage[];
  onStageClick?: (stageId: string) => void;
  activeStageId?: string;
  compact?: boolean;
}

function StageIcon({ status }: { status: Stage['status'] }) {
  switch (status) {
    case 'completed':
      return <Check className="h-3.5 w-3.5 text-[var(--accent-green)]" />;
    case 'killed':
      return <X className="h-3.5 w-3.5 text-[var(--accent-red)]" />;
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 text-[var(--accent-blue)] animate-spin" />;
    case 'waiting_decision':
      return <Circle className="h-3.5 w-3.5 text-[var(--accent-yellow)] fill-[var(--accent-yellow)]" />;
    default:
      return <Circle className="h-3.5 w-3.5 text-[var(--text-muted)]" />;
  }
}

export function StagePipeline({ stages, onStageClick, activeStageId, compact = false }: StagePipelineProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STAGE_ORDER.map((stageId, index) => {
        const stage = stages.find(s => s.id === stageId);
        if (!stage) return null;
        const config = STAGE_CONFIG[stageId];
        const isActive = activeStageId === stageId;
        const isClickable = stage.status !== 'pending' || index === 0 || stages[index - 1]?.status === 'completed';

        return (
          <div key={stageId} className="flex items-center gap-1">
            {index > 0 && (
              <span className="text-[var(--text-muted)] text-xs mx-0.5">→</span>
            )}
            <button
              onClick={() => isClickable && onStageClick?.(stageId)}
              disabled={!isClickable}
              data-testid={`pipeline-stage-${stageId}`}
              aria-label={`${config.label} stage, status: ${stage.status}`}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors ${
                isActive
                  ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] border border-[var(--accent-blue)]/40'
                  : isClickable
                    ? 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                    : 'text-[var(--text-muted)] opacity-50 cursor-default'
              }`}
            >
              <StageIcon status={stage.status} />
              {!compact && <span>{config.label}</span>}
              {compact && <span>{config.icon}</span>}
            </button>
          </div>
        );
      })}
    </div>
  );
}
