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

/** Validation report summary (from idea-validator output) */
export interface ValidationSummary {
  score: number;
  decision: 'continue' | 'pivot' | 'kill';
  reasoning: string;
  evidence: string[];
  concerns: string[];
}

export const STAGE_CONFIG: Record<StageId, { label: string; icon: string; description: string }> = {
  'validate': { label: 'Validate', icon: '🔍', description: 'Reddit pain mining, trends, competitor scan' },
  'business-model': { label: 'Business Model', icon: '💰', description: 'Model selection, pricing, revenue projection' },
  'build': { label: 'Build', icon: '🔨', description: 'Scaffold, develop, deploy' },
  'grow': { label: 'Grow', icon: '📈', description: 'Content, SEO, distribution channels' },
  'operate': { label: 'Operate', icon: '📊', description: 'Metrics, retention, weekly reports' },
};

export const STAGE_ORDER: StageId[] = ['validate', 'business-model', 'build', 'grow', 'operate'];
