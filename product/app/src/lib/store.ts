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
  };
  const projects = getProjects();
  projects.unshift(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return project;
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
