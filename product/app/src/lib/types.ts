/** Core domain types for Startup Playbook */

export type StageId = 'validate' | 'business-model' | 'build' | 'grow' | 'operate';
export type StageStatus = 'pending' | 'running' | 'waiting_decision' | 'completed' | 'killed';
export type Decision = 'continue' | 'pivot' | 'kill' | 'pause' | 'back';
export type ProjectLifecycle = 'idea' | 'product';

export interface AutoTask {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

export interface Artifact {
  id: string;
  name: string;
  type: 'html' | 'json' | 'md' | 'url';
  content?: string;
  url?: string;
  createdAt: string;
}

export interface Stage {
  id: StageId;
  status: StageStatus;
  autoTasks: AutoTask[];
  artifacts: Artifact[];
  decision: Decision | null;
  decisionReason?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ValidationConfig {
  keywords?: string;
  subreddits?: string;
  geo?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  lifecycle: ProjectLifecycle;
  stages: Stage[];
  validationConfig: ValidationConfig;
  createdAt: string;
  updatedAt: string;
  /** Parent project ID when this is a fork/thread */
  parentId?: string;
  /** Version number (1 = original, 2+ = forks) */
  version: number;
  /** Label for this thread, e.g. "Pivot to B2B", "V2 with AI" */
  threadLabel?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AgentTab {
  id: string;
  projectId: string | null;
  projectName: string;
  stageId: StageId | null;
  messages: AgentMessage[];
  isActive: boolean;
}

/**
 * Standard artifact output from CLI (startup-playbook).
 * CLI writes to: .playbook-output/<projectId>/<stageId>/report.json
 * UI reads this to render stage results.
 */
export interface StageArtifactOutput {
  /** Which stage produced this */
  stage: StageId;
  /** Overall score 0-100 */
  score: number;
  /** Recommended decision */
  decision: 'continue' | 'pivot' | 'kill';
  /** One-line reasoning */
  reasoning: string;
  /** Positive signals */
  evidence: string[];
  /** Risk factors */
  concerns: string[];
  /** Detailed analysis sections (stage-specific) */
  analysis?: {
    pain?: string;
    demand?: string;
    market?: string;
    [key: string]: string | undefined;
  };
  /** Actionable next steps */
  suggestedNextSteps?: string[];
  /** Pre-rendered HTML report (optional) */
  html?: string;
  /** ISO timestamp when CLI produced this */
  generatedAt: string;
}

/** Alias for backward compat with DecisionGate */
export interface ValidationSummary {
  score: number;
  decision: 'continue' | 'pivot' | 'kill';
  reasoning: string;
  evidence: string[];
  concerns: string[];
  painAnalysis?: string;
  demandAnalysis?: string;
  marketAnalysis?: string;
  suggestedNextSteps?: string[];
}

/** Convert CLI artifact to UI summary */
export function artifactToSummary(artifact: StageArtifactOutput): ValidationSummary {
  return {
    score: artifact.score,
    decision: artifact.decision,
    reasoning: artifact.reasoning,
    evidence: artifact.evidence,
    concerns: artifact.concerns,
    painAnalysis: artifact.analysis?.pain,
    demandAnalysis: artifact.analysis?.demand,
    marketAnalysis: artifact.analysis?.market,
    suggestedNextSteps: artifact.suggestedNextSteps,
  };
}

export const STAGE_CONFIG: Record<StageId, { label: string; icon: string; description: string }> = {
  'validate': { label: 'Validate', icon: '🔍', description: 'Reddit pain mining, trends, competitor scan' },
  'business-model': { label: 'Business Model', icon: '💰', description: 'Model selection, pricing, revenue projection' },
  'build': { label: 'Build', icon: '🔨', description: 'Scaffold, develop, deploy' },
  'grow': { label: 'Grow', icon: '📈', description: 'Content, SEO, distribution channels' },
  'operate': { label: 'Operate', icon: '📊', description: 'Metrics, retention, weekly reports' },
};

export const STAGE_ORDER: StageId[] = ['validate', 'business-model', 'build', 'grow', 'operate'];
