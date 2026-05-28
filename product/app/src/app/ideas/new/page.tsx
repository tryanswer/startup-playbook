'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/store';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function NewIdeaPage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [subreddits, setSubreddits] = useState('');
  const [geo, setGeo] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!description.trim()) return;

    const ideaName = name.trim() || description.slice(0, 50).trim();
    const project = createProject(ideaName, description.trim(), {
      keywords: keywords.trim() || undefined,
      subreddits: subreddits.trim() || undefined,
      geo: geo.trim() || undefined,
    });

    router.push(`/ideas/${project.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">New Idea</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Describe your idea and we&apos;ll automatically validate it against Reddit, Google Trends, and competitor data.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Idea Name <span className="text-[var(--text-muted)]">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="e.g., AI Skin Analysis App"
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            What&apos;s your idea? <span className="text-[var(--accent-red)]">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Describe the problem you're solving and for whom. 2-3 sentences work best.&#10;&#10;e.g., An AI-powered skin analysis app that recommends personalized skincare routines for women 25-35 who are overwhelmed by product choices."
            rows={5}
            required
            className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] transition-colors resize-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Advanced options
        </button>

        {showAdvanced && (
          <div className="space-y-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium mb-1">
                Keywords <span className="text-[var(--text-muted)]">(comma-separated)</span>
              </label>
              <input
                id="keywords"
                type="text"
                value={keywords}
                onChange={event => setKeywords(event.target.value)}
                placeholder="skin care, ai beauty, skin analysis"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div>
              <label htmlFor="subreddits" className="block text-sm font-medium mb-1">
                Target Subreddits <span className="text-[var(--text-muted)]">(comma-separated)</span>
              </label>
              <input
                id="subreddits"
                type="text"
                value={subreddits}
                onChange={event => setSubreddits(event.target.value)}
                placeholder="SkincareAddiction, 30PlusSkinCare"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <div>
              <label htmlFor="geo" className="block text-sm font-medium mb-1">
                Geographic Focus
              </label>
              <select
                id="geo"
                value={geo}
                onChange={event => setGeo(event.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              >
                <option value="">Global</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="JP">Japan</option>
                <option value="CN">China</option>
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!description.trim()}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent-blue)] text-white font-medium hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start Validation
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
