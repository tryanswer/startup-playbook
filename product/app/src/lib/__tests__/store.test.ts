/**
 * Core store tests — covers project CRUD and stage transitions.
 * Run: cd product/app && npx vitest run
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for Node.js test environment
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
Object.defineProperty(globalThis, 'window', { value: globalThis });

// Import after mocking
const { createProject, getProjects, getProject, updateStage, makeDecision, deleteProject } = await import('../store');

describe('Store: Project CRUD', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('creates a project with default stages', () => {
    const project = createProject('Test Idea', 'An AI app for testing');
    expect(project.name).toBe('Test Idea');
    expect(project.description).toBe('An AI app for testing');
    expect(project.lifecycle).toBe('idea');
    expect(project.stages).toHaveLength(5);
    expect(project.stages[0].id).toBe('validate');
    expect(project.stages[0].status).toBe('pending');
  });

  it('lists all projects', () => {
    createProject('Idea 1', 'First');
    createProject('Idea 2', 'Second');
    const projects = getProjects();
    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe('Idea 2'); // newest first
  });

  it('gets a project by ID', () => {
    const created = createProject('Find Me', 'Searchable');
    const found = getProject(created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Find Me');
  });

  it('returns undefined for non-existent project', () => {
    expect(getProject('nonexistent')).toBeUndefined();
  });

  it('deletes a project', () => {
    const project = createProject('Delete Me', 'Temporary');
    deleteProject(project.id);
    expect(getProject(project.id)).toBeUndefined();
    expect(getProjects()).toHaveLength(0);
  });
});

describe('Store: Stage Transitions', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('updates a stage status', () => {
    const project = createProject('Stage Test', 'Testing stages');
    updateStage(project.id, 'validate', stage => ({
      ...stage,
      status: 'running',
      startedAt: new Date().toISOString(),
    }));
    const updated = getProject(project.id)!;
    expect(updated.stages[0].status).toBe('running');
    expect(updated.stages[0].startedAt).toBeDefined();
  });

  it('continue decision completes current stage', () => {
    const project = createProject('Decision Test', 'Testing decisions');
    updateStage(project.id, 'validate', stage => ({ ...stage, status: 'waiting_decision' }));
    makeDecision(project.id, 'validate', 'continue');
    const updated = getProject(project.id)!;
    expect(updated.stages[0].status).toBe('completed');
    expect(updated.stages[0].decision).toBe('continue');
    expect(updated.stages[0].completedAt).toBeDefined();
  });

  it('kill decision marks stage as killed', () => {
    const project = createProject('Kill Test', 'Testing kill');
    makeDecision(project.id, 'validate', 'kill');
    const updated = getProject(project.id)!;
    expect(updated.stages[0].status).toBe('killed');
    expect(updated.stages[0].decision).toBe('kill');
  });

  it('graduating from build changes lifecycle to product', () => {
    const project = createProject('Graduate Test', 'Testing graduation');
    // Complete validate and business-model first
    makeDecision(project.id, 'validate', 'continue');
    makeDecision(project.id, 'business-model', 'continue');
    makeDecision(project.id, 'build', 'continue');
    const updated = getProject(project.id)!;
    expect(updated.lifecycle).toBe('product');
  });

  it('pivot decision keeps stage in current status', () => {
    const project = createProject('Pivot Test', 'Testing pivot');
    updateStage(project.id, 'validate', stage => ({ ...stage, status: 'waiting_decision' }));
    makeDecision(project.id, 'validate', 'pivot');
    const updated = getProject(project.id)!;
    expect(updated.stages[0].decision).toBe('pivot');
    // Status stays as waiting_decision (not completed or killed)
    expect(updated.stages[0].status).toBe('waiting_decision');
  });
});

describe('Store: Validation Config', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('stores validation config with project', () => {
    const project = createProject('Config Test', 'Testing config', {
      keywords: 'skin care, ai beauty',
      subreddits: 'SkincareAddiction',
      geo: 'US',
    });
    expect(project.validationConfig.keywords).toBe('skin care, ai beauty');
    expect(project.validationConfig.subreddits).toBe('SkincareAddiction');
    expect(project.validationConfig.geo).toBe('US');
  });
});
