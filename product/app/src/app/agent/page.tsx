'use client';

import { useEffect, useState } from 'react';
import { getProjects } from '@/lib/store';
import { Project } from '@/lib/types';
import { AgentTerminal } from '@/components/agent-terminal';
import { Plus, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface Tab {
  id: string;
  projectId: string;
  projectName: string;
  stageId: string | null;
}

export default function AgentPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showNewTab, setShowNewTab] = useState(false);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  function createTab(projectId: string, projectName: string, stageId: string | null = null) {
    const tab: Tab = {
      id: `tab-${Date.now()}`,
      projectId,
      projectName,
      stageId,
    };
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
    setShowNewTab(false);
  }

  function closeTab(tabId: string) {
    setTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(tabs.length > 1 ? tabs[tabs.length - 2]?.id || null : null);
    }
  }

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-sm cursor-pointer transition-colors ${
              activeTabId === tab.id
                ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-t border-l border-r border-[var(--border)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="max-w-[120px] truncate">{tab.projectName}</span>
            <button
              onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }}
              className="hover:text-[var(--accent-red)] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowNewTab(true)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-4 overflow-hidden">
        {showNewTab && (
          <div className="max-w-md mx-auto mt-12">
            <h2 className="text-lg font-medium mb-4">{t('agent.newTab')}</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {t('agent.newTab.desc')}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => createTab('', 'Free Session')}
                className="w-full text-left px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent-purple)] transition-colors"
              >
                <span className="font-medium">{t('agent.freeSession')}</span>
                <span className="block text-xs text-[var(--text-muted)] mt-0.5">{t('agent.freeSession.desc')}</span>
              </button>
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => createTab(project.id, project.name)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent-purple)] transition-colors"
                >
                  <span className="font-medium">{project.name}</span>
                  <span className="block text-xs text-[var(--text-muted)] mt-0.5">{project.description.slice(0, 80)}</span>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  {t('agent.noProjects')}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowNewTab(false)}
              className="mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {t('agent.cancel')}
            </button>
          </div>
        )}

        {activeTab && !showNewTab && (
          <AgentTerminal
            projectId={activeTab.projectId}
            projectName={activeTab.projectName}
            stageId={activeTab.stageId as import('@/lib/types').StageId | null}
            className="h-full"
          />
        )}

        {!activeTab && !showNewTab && tabs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-[var(--text-muted)] mb-4">{t('agent.noTabs')}</p>
            <button
              onClick={() => setShowNewTab(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-purple)] text-white text-sm hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              {t('ideas.new')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
