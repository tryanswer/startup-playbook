'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProjects } from '@/lib/store';
import { Project } from '@/lib/types';
import { StagePipeline } from '@/components/stage-pipeline';
import { Plus, Terminal } from 'lucide-react';

export default function IdeasPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects().filter(p => p.lifecycle === 'idea'));
  }, []);

  const ideas = projects;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Ideas</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {ideas.length} idea{ideas.length !== 1 ? 's' : ''} in incubation
          </p>
        </div>
        <Link
          href="/ideas/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-sm font-medium hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Idea
        </Link>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)] mb-4">No ideas yet. Start by submitting one.</p>
          <Link
            href="/ideas/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-blue)] text-white text-sm"
          >
            <Plus className="h-4 w-4" />
            New Idea
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map(project => {
            const currentStage = project.stages.find(
              s => s.status === 'running' || s.status === 'waiting_decision'
            ) || project.stages.find(s => s.status === 'pending');

            return (
              <Link
                key={project.id}
                href={`/ideas/${project.id}`}
                className="block p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent-blue)]/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-0.5 line-clamp-1">
                      {project.description}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <StagePipeline stages={project.stages} />
                  {currentStage && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {currentStage.status === 'running' ? '🔄 Running' :
                       currentStage.status === 'waiting_decision' ? '⏳ Needs decision' :
                       'Next: ' + currentStage.id}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
