'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProjects } from '@/lib/store';
import { Project } from '@/lib/types';
import { StagePipeline } from '@/components/stage-pipeline';
import { Package, Terminal } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Project[]>([]);

  useEffect(() => {
    setProducts(getProjects().filter(p => p.lifecycle === 'product'));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {products.length} product{products.length !== 1 ? 's' : ''} running
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)] mb-2">No products yet.</p>
          <p className="text-sm text-[var(--text-muted)]">
            Ideas graduate to Products after completing the Build stage.
          </p>
          <Link
            href="/ideas"
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm hover:border-[var(--accent-blue)] transition-colors"
          >
            Go to Ideas →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <Link
              key={product.id}
              href={`/ideas/${product.id}`}
              className="block p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent-green)]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]" />
                    <h3 className="font-medium">{product.name}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5 line-clamp-1">
                    {product.description}
                  </p>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <StagePipeline stages={product.stages} compact />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
