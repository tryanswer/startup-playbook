/**
 * Local storage-based state management.
 * No auth, no server DB — everything in localStorage for the prototype.
 */

import { Project, AgentTab, Stage, StageId, STAGE_ORDER, Decision } from './types';

const PROJECTS_KEY = 'sp_projects';
const AGENT_TABS_KEY = 'sp_agent_tabs';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultStages(): Stage[] {
  return STAGE_ORDER.map((id, index) => ({
    id,
    status: index === 0 ? 'pending' : 'pending',
    autoTasks: [],
    artifacts: [],
    decision: null,
  }));
}

// --- Projects ---

export function getProjects(): Project[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(PROJECTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getProject(projectId: string): Project | undefined {
  return getProjects().find(p => p.id === projectId);
}

export function createProject(name: string, description: string, config: { keywords?: string; subreddits?: string; geo?: string } = {}): Project {
  const project: Project = {
    id: generateId(),
    name,
    description,
    lifecycle: 'idea',
    stages: createDefaultStages(),
    validationConfig: config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  const projects = getProjects();
  projects.unshift(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return project;
}

/**
 * Fork a new thread from an existing project.
 * Creates a new project that inherits name/description but resets all stages.
 * The original project is preserved unchanged.
 */
export function forkProject(parentId: string, threadLabel?: string): Project | undefined {
  const parent = getProject(parentId);
  if (!parent) return undefined;

  // Count existing threads to determine version number
  const siblings = getProjects().filter(p => p.parentId === parentId || p.id === parentId);
  const nextVersion = siblings.length + 1;

  const forked: Project = {
    id: generateId(),
    name: parent.name,
    description: parent.description,
    lifecycle: 'idea',
    stages: createDefaultStages(),
    validationConfig: { ...parent.validationConfig },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentId,
    version: nextVersion,
    threadLabel: threadLabel || `Thread ${nextVersion}`,
  };

  const projects = getProjects();
  projects.unshift(forked);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return forked;
}

/** Get all threads (forks) of a project, including the original */
export function getProjectThreads(projectId: string): Project[] {
  const project = getProject(projectId);
  if (!project) return [];
  // Find the root project ID
  const rootId = project.parentId || project.id;
  return getProjects().filter(p => p.id === rootId || p.parentId === rootId);
}

/**
 * Backtrack a stage: reset it and all subsequent stages to pending.
 * This allows revisiting earlier decisions without losing the project.
 */
export function backtrackToStage(projectId: string, targetStageId: StageId): Project | undefined {
  const targetIndex = STAGE_ORDER.indexOf(targetStageId);
  return updateProject(projectId, project => ({
    ...project,
    lifecycle: targetIndex <= 2 ? 'idea' as const : project.lifecycle, // If backtracking before Build, revert to idea
    stages: project.stages.map((stage, index) => {
      if (index >= targetIndex) {
        return {
          ...stage,
          status: index === targetIndex ? 'pending' as const : 'pending' as const,
          decision: null,
          decisionReason: undefined,
          completedAt: undefined,
          autoTasks: [],
          artifacts: index === targetIndex ? stage.artifacts : [], // Keep artifacts of target stage for reference
        };
      }
      return stage;
    }),
  }));
}

export function updateProject(projectId: string, updater: (project: Project) => Project): Project | undefined {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index === -1) return undefined;
  projects[index] = updater(projects[index]);
  projects[index].updatedAt = new Date().toISOString();
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return projects[index];
}

export function updateStage(projectId: string, stageId: StageId, updater: (stage: Stage) => Stage): Project | undefined {
  return updateProject(projectId, project => ({
    ...project,
    stages: project.stages.map(stage =>
      stage.id === stageId ? updater(stage) : stage
    ),
  }));
}

export function makeDecision(projectId: string, stageId: StageId, decision: Decision, reason?: string): Project | undefined {
  return updateProject(projectId, project => {
    const stageIndex = STAGE_ORDER.indexOf(stageId);
    const updatedStages = project.stages.map((stage, index) => {
      if (stage.id === stageId) {
        return {
          ...stage,
          decision,
          decisionReason: reason,
          status: decision === 'continue' ? 'completed' as const : decision === 'kill' ? 'killed' as const : stage.status,
          completedAt: decision === 'continue' || decision === 'kill' ? new Date().toISOString() : stage.completedAt,
        };
      }
      // If continuing, unlock the next stage
      if (decision === 'continue' && index === stageIndex + 1) {
        return { ...stage, status: 'pending' as const };
      }
      return stage;
    });

    // Graduate to product when Build is completed
    const lifecycle = decision === 'continue' && stageId === 'build' ? 'product' as const : project.lifecycle;

    return { ...project, stages: updatedStages, lifecycle };
  });
}

export function deleteProject(projectId: string): void {
  const projects = getProjects().filter(p => p.id !== projectId);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// --- Agent Tabs ---

export function getAgentTabs(): AgentTab[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(AGENT_TABS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function createAgentTab(projectId: string | null, projectName: string, stageId: StageId | null): AgentTab {
  const tab: AgentTab = {
    id: generateId(),
    projectId,
    projectName,
    stageId,
    messages: [],
    isActive: true,
  };
  const tabs = getAgentTabs();
  tabs.push(tab);
  localStorage.setItem(AGENT_TABS_KEY, JSON.stringify(tabs));
  return tab;
}

export function addAgentMessage(tabId: string, role: 'user' | 'assistant', content: string): void {
  const tabs = getAgentTabs();
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;
  tab.messages.push({
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(AGENT_TABS_KEY, JSON.stringify(tabs));
}

export function closeAgentTab(tabId: string): void {
  const tabs = getAgentTabs().filter(t => t.id !== tabId);
  localStorage.setItem(AGENT_TABS_KEY, JSON.stringify(tabs));
}
