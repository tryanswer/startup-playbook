'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lightbulb, Package, Terminal, Rocket } from 'lucide-react';

const navItems = [
  { href: '/ideas', label: 'Ideas', icon: Lightbulb },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/agent', label: 'Agent', icon: Terminal },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
          <Rocket className="h-5 w-5 text-[var(--accent-blue)]" />
          Startup Playbook
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
