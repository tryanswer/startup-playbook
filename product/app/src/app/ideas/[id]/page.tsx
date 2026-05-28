'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject, getProjectThreads, updateStage, makeDecision, forkProject, backtrackToStage } from '@/lib/store';
import { Project, StageId, STAGE_CONFIG, STAGE_ORDER, ValidationSummary, StageArtifactOutput, artifactToSummary } from '@/lib/types';
import { StagePipeline } from '@/components/stage-pipeline';
import { DecisionGate } from '@/components/decision-gate';
import { ArrowLeft, FileText, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [activeStageId, setActiveStageId] = useState<StageId>('validate');
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [artifactLoading, setArtifactLoading] = useState(false);

  const refreshProject = useCallback(() => {
    const proj = getProject(projectId);
    if (proj) setProject(proj);
    else router.push('/ideas');
  }, [projectId, router]);

  // Load project from localStorage
  useEffect(() => {
    refreshProject();
  }, [refreshProject]);

  // Derive active stage — safe even when project is null
  const activeStage = project?.stages.find(s => s.id === activeStageId) ?? project?.stages[0] ?? null;

  // Auto-load artifacts from shared directory when stage changes
  const loadArtifacts = useCallback(async () => {
    if (!activeStageId || !projectId) return;
    setArtifactLoading(true);
    try {
      const response = await fetch(`/api/artifacts?projectId=${encodeURIComponent(projectId)}&stageId=${encodeURIComponent(activeStageId)}`);
      const data = await response.json();
      const artifact = data.data?.artifact as StageArtifactOutput | null;

      if (artifact) {
        setSummary(artifactToSummary(artifact));
        setReportHtml(artifact.html ?? null);

        // Sync stage status if artifact exists but stage is still pending
        if (activeStage?.status === 'pending') {
          updateStage(projectId, activeStageId, stage => ({
            ...stage,
            status: 'waiting_decision',
          }));
          refreshProject();
        }
      } else {
        setSummary(null);
        setReportHtml(null);
      }
    } catch {
      setSummary(null);
      setReportHtml(null);
    } finally {
      setArtifactLoading(false);
    }
  }, [activeStageId, projectId, activeStage?.status, refreshProject]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  if (!project || !activeStage) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" data-testid="detail-loading">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[activeStage.id];
  const threads = getProjectThreads(projectId);

  function handleDecision(decision: 'continue' | 'pivot' | 'kill') {
    if (!activeStage) return;
    makeDecision(projectId, activeStage.id as StageId, decision);
    refreshProject();

    if (decision === 'continue') {
      const currentIndex = STAGE_ORDER.indexOf(activeStage.id);
      if (currentIndex < STAGE_ORDER.length - 1) {
        setActiveStageId(STAGE_ORDER[currentIndex + 1]);
      }
    }
    if (decision === 'kill') {
      router.push('/ideas');
    }
  }

  function handleFork() {
    const forked = forkProject(projectId);
    if (forked) {
      router.push(`/ideas/${forked.id}`);
    }
  }

  function handleBacktrack(stageId: string) {
    backtrackToStage(projectId, stageId as StageId);
    refreshProject();
    setActiveStageId(stageId as StageId);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ideas" data-testid="detail-link-back" aria-label="Back to ideas" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold">{project.name}</h1>
            {project.parentId && (
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]">
                Thread {project.version}: {project.threadLabel || `Thread ${project.version}`}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{project.description}</p>
          {project.parentId && (
            <Link href={`/ideas/${project.parentId}`} className="text-xs text-[var(--accent-blue)] hover:underline mt-1 inline-block">
              ← View original
            </Link>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-6 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
        <StagePipeline
          stages={project.stages}
          activeStageId={activeStageId}
          onStageClick={id => setActiveStageId(id as StageId)}
          onBacktrack={handleBacktrack}
        />
      </div>

      {/* Stage Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: stage info, decision, threads */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-[var(--text-secondary)]">
                {stageConfig.icon} {stageConfig.label}
              </h2>
              <button
                onClick={loadArtifacts}
                disabled={artifactLoading}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Refresh artifacts"
                title="Reload artifacts from CLI output"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${artifactLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <p className="text-sm text-[var(--text-muted)] mb-3">{stageConfig.description}</p>

            {/* Status indicator */}
            {activeStage.status === 'pending' && !summary && (
              <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-muted)]">
                Awaiting CLI output. Run <code className="px-1 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--accent-blue)]">codex</code> with startup-playbook to generate artifacts.
              </div>
            )}

            {artifactLoading && (
              <div className="flex items-center gap-2 text-sm text-[var(--accent-blue)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading artifacts...
              </div>
            )}
          </div>

          {/* Decision Gate — shown when artifacts are loaded */}
          {summary && activeStage.status !== 'completed' && (
            <DecisionGate
              summary={summary}
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

          {/* Fork Thread */}
          <button
            onClick={handleFork}
            data-testid="detail-btn-fork"
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            🔀 New Thread
          </button>

          {/* Threads list */}
          {threads.length > 1 && (
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Threads</h3>
              <div className="space-y-1">
                {threads.map(thread => (
                  <Link
                    key={thread.id}
                    href={`/ideas/${thread.id}`}
                    className={`block text-sm px-2 py-1 rounded ${thread.id === projectId ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                  >
                    {thread.parentId ? `Thread ${thread.version}: ${thread.threadLabel || ''}` : 'Original'}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: report viewer */}
        <div className="lg:col-span-2 space-y-4">
          {reportHtml ? (
            <div className="rounded-xl overflow-hidden border border-[var(--border)]">
              <iframe srcDoc={reportHtml} className="w-full h-[500px] bg-white" title="Report" />
            </div>
          ) : summary ? (
            <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <p className="text-sm text-[var(--text-muted)]">
                Artifact loaded — detailed report view coming soon.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <FileText className="h-8 w-8 text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-sm text-[var(--text-muted)] mb-1">No artifacts yet</p>
              <p className="text-xs text-[var(--text-muted)] opacity-70">
                Use Codex CLI with startup-playbook to run the {stageConfig.label.toLowerCase()} stage
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Terminal placeholder — hidden for Phase 1, preserved for future */}
      {/* <AgentTerminal projectId={projectId} projectName={project.name} stageId={activeStageId} /> */}
    </div>
  );
}
