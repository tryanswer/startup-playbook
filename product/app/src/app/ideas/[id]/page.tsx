'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, updateStage, makeDecision } from '@/lib/store';
import { Project, Stage, StageId, STAGE_CONFIG, STAGE_ORDER, ValidationSummary } from '@/lib/types';
import { StagePipeline } from '@/components/stage-pipeline';
import { DecisionGate } from '@/components/decision-gate';
import { AgentTerminal } from '@/components/agent-terminal';
import { ArrowLeft, Play, Terminal, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [activeStageId, setActiveStageId] = useState<StageId>('validate');
  const [showAgent, setShowAgent] = useState(false);
  const [validationHtml, setValidationHtml] = useState<string | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);

  const refreshProject = useCallback(() => {
    const proj = getProject(projectId);
    if (proj) setProject(proj);
    else router.push('/ideas');
  }, [projectId, router]);

  useEffect(() => {
    refreshProject();
  }, [refreshProject]);

  if (!project) return null;

  const activeStage = project.stages.find(s => s.id === activeStageId)!;
  const stageConfig = STAGE_CONFIG[activeStageId];

  async function handleRunValidation() {
    const currentProject = getProject(projectId);
    if (!currentProject) return;

    // Update stage to running
    updateStage(projectId, 'validate', stage => ({
      ...stage,
      status: 'running',
      startedAt: new Date().toISOString(),
      autoTasks: [
        { id: 'reddit', label: 'Reddit Pain Mining', status: 'running' },
        { id: 'trends', label: 'Trends & Demand Check', status: 'pending' },
        { id: 'competitors', label: 'Competitor Scan', status: 'pending' },
        { id: 'report', label: 'Generate Report', status: 'pending' },
      ],
    }));
    refreshProject();

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: currentProject.description,
          keywords: currentProject.validationConfig.keywords,
          subreddits: currentProject.validationConfig.subreddits,
          geo: currentProject.validationConfig.geo,
        }),
      });

      const data = await response.json();

      if (data.error) {
        updateStage(projectId, 'validate', stage => ({
          ...stage,
          status: 'waiting_decision',
          autoTasks: stage.autoTasks.map(t => ({ ...t, status: 'failed' as const })),
        }));
        refreshProject();
        return;
      }

      // Update with results
      updateStage(projectId, 'validate', stage => ({
        ...stage,
        status: 'waiting_decision',
        autoTasks: [
          { id: 'reddit', label: 'Reddit Pain Mining', status: 'completed' },
          { id: 'trends', label: 'Trends & Demand Check', status: 'completed' },
          { id: 'competitors', label: 'Competitor Scan', status: 'completed' },
          { id: 'report', label: 'Generate Report', status: 'completed' },
        ],
        artifacts: [
          { id: 'report-html', name: 'Validation Report', type: 'html', content: data.html, createdAt: new Date().toISOString() },
          { id: 'report-json', name: 'Validation Data', type: 'json', content: JSON.stringify(data.summary), createdAt: new Date().toISOString() },
        ],
      }));

      setValidationHtml(data.html);
      setValidationSummary(data.summary);
      refreshProject();
    } catch {
      updateStage(projectId, 'validate', stage => ({
        ...stage,
        status: 'waiting_decision',
        autoTasks: stage.autoTasks.map(t =>
          t.status === 'running' ? { ...t, status: 'failed' as const } : t
        ),
      }));
      refreshProject();
    }
  }

  function handleDecision(decision: 'continue' | 'pivot' | 'kill') {
    makeDecision(projectId, activeStageId, decision);
    refreshProject();

    if (decision === 'continue') {
      const currentIndex = STAGE_ORDER.indexOf(activeStageId);
      if (currentIndex < STAGE_ORDER.length - 1) {
        setActiveStageId(STAGE_ORDER[currentIndex + 1]);
      }
    }
    if (decision === 'kill') {
      router.push('/ideas');
    }
  }

  // Load existing report from artifacts
  useEffect(() => {
    const reportArtifact = activeStage.artifacts.find(a => a.id === 'report-html');
    if (reportArtifact?.content) setValidationHtml(reportArtifact.content);

    const summaryArtifact = activeStage.artifacts.find(a => a.id === 'report-json');
    if (summaryArtifact?.content) {
      try { setValidationSummary(JSON.parse(summaryArtifact.content)); } catch { /* ignore */ }
    }
  }, [activeStage]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ideas" data-testid="detail-link-back" aria-label="Back to ideas" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{project.name}</h1>
          <p className="text-sm text-[var(--text-muted)]">{project.description}</p>
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-6 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
        <StagePipeline
          stages={project.stages}
          activeStageId={activeStageId}
          onStageClick={id => setActiveStageId(id as StageId)}
        />
      </div>

      {/* Stage Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: tasks & artifacts */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
              {stageConfig.icon} {stageConfig.label}
            </h2>

            {/* Auto Tasks */}
            {activeStage.autoTasks.length > 0 ? (
              <div className="space-y-2 mb-4">
                {activeStage.autoTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    {task.status === 'completed' && <span className="text-[var(--accent-green)]">✓</span>}
                    {task.status === 'running' && <Loader2 className="h-3.5 w-3.5 text-[var(--accent-blue)] animate-spin" />}
                    {task.status === 'pending' && <span className="text-[var(--text-muted)]">○</span>}
                    {task.status === 'failed' && <span className="text-[var(--accent-red)]">✕</span>}
                    <span className={task.status === 'pending' ? 'text-[var(--text-muted)]' : ''}>{task.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)] mb-4">{stageConfig.description}</p>
            )}

            {/* Run button */}
            {activeStageId === 'validate' && activeStage.status === 'pending' && (
              <button
                onClick={handleRunValidation}
                data-testid="detail-btn-run"
                className="flex items-center gap-2 w-full px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-sm font-medium hover:brightness-110"
              >
                <Play className="h-4 w-4" />
                Run Validation
              </button>
            )}

            {activeStage.status === 'running' && (
              <div className="flex items-center gap-2 text-sm text-[var(--accent-blue)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </div>
            )}
          </div>

          {/* Artifacts */}
          {activeStage.artifacts.length > 0 && (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Artifacts</h3>
              <div className="space-y-2">
                {activeStage.artifacts.map(artifact => (
                  <div key={artifact.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span>{artifact.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Gate */}
          {activeStage.status === 'waiting_decision' && (
            <DecisionGate
              summary={validationSummary}
              onDecision={handleDecision}
            />
          )}

          {activeStage.status === 'completed' && activeStage.decision && (
            <div className="p-4 rounded-xl bg-[var(--accent-green)]/10 border border-[var(--accent-green)]/30">
              <p className="text-sm text-[var(--accent-green)] font-medium">
                ✓ Decision: {activeStage.decision.toUpperCase()}
              </p>
              {activeStage.decisionReason && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{activeStage.decisionReason}</p>
              )}
            </div>
          )}

          {/* Agent toggle */}
          <button
            onClick={() => setShowAgent(!showAgent)}
            data-testid="detail-btn-agent"
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Terminal className="h-4 w-4" />
            {showAgent ? 'Hide Agent' : 'Open Agent'}
          </button>
        </div>

        {/* Right panel: report or agent */}
        <div className="lg:col-span-2">
          {showAgent ? (
            <AgentTerminal
              projectId={projectId}
              projectName={project.name}
              stageId={activeStageId}
            />
          ) : validationHtml ? (
            <div className="rounded-xl overflow-hidden border border-[var(--border)]">
              <iframe
                srcDoc={validationHtml}
                className="w-full h-[700px] bg-white"
                title="Validation Report"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-center">
                <p className="text-[var(--text-muted)] mb-2">
                  {activeStage.status === 'pending'
                    ? 'Run validation to see the report'
                    : activeStage.status === 'running'
                      ? 'Validation in progress...'
                      : 'No report available'
                  }
                </p>
                {activeStage.status === 'pending' && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Or open the Agent to explore manually
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
