# Design System — Startup Playbook App

## Visual Identity

**Positioning**: Developer-focused startup incubation tool. Dark, data-dense, terminal-native.
**Reference**: Linear + Vercel hybrid — clean dark UI with strong hierarchy and developer aesthetics.

## Colors

### Core Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0f172a` (slate-900) | Page background |
| `--bg-secondary` | `#1e293b` (slate-800) | Cards, panels |
| `--bg-tertiary` | `#334155` (slate-700) | Hover states, tags, input backgrounds |
| `--text-primary` | `#f8fafc` (slate-50) | Headings, primary text |
| `--text-secondary` | `#94a3b8` (slate-400) | Body text, labels |
| `--text-muted` | `#64748b` (slate-500) | Placeholders, disabled text |
| `--border` | `#334155` (slate-700) | Card borders, dividers |

### Accent Colors

| Token | Value | Semantic |
|---|---|---|
| `--accent-green` | `#10b981` (emerald-500) | Success, continue, completed |
| `--accent-yellow` | `#f59e0b` (amber-500) | Warning, pivot, waiting |
| `--accent-red` | `#ef4444` (red-500) | Error, kill, failed |
| `--accent-blue` | `#3b82f6` (blue-500) | Primary action, active state, links |
| `--accent-purple` | `#a855f7` (purple-500) | Agent, AI, terminal |

## Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| Page title | System sans | 1.8rem (text-2xl) | 700 (bold) |
| Section heading | System sans | 1.3rem (text-lg) | 600 (semibold) |
| Body text | System sans | 0.875rem (text-sm) | 400 (normal) |
| Labels / tags | System sans | 0.75rem (text-xs) | 500 (medium) |
| Terminal / code | System mono | 0.85rem | 400 |

Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
Mono stack: `'SF Mono', 'Fira Code', 'Cascadia Code', monospace`

## Spacing

Base unit: `4px`. Use Tailwind spacing scale.

| Context | Spacing |
|---|---|
| Card padding | `p-4` (16px) |
| Section gap | `gap-6` (24px) |
| Inner element gap | `gap-2` (8px) |
| Page horizontal padding | `px-6` (24px) |
| Page vertical padding | `py-8` (32px) |

## Border Radius

| Element | Radius |
|---|---|
| Cards, panels | `rounded-xl` (12px) |
| Buttons | `rounded-lg` (8px) |
| Tags, badges | `rounded-full` (9999px) |
| Inputs | `rounded-lg` (8px) |

## Components

### Buttons

```
Primary:    bg-accent-blue text-white rounded-lg px-4 py-2 hover:brightness-110
Secondary:  bg-bg-tertiary text-text-secondary rounded-lg px-4 py-2 hover:text-text-primary
Danger:     bg-accent-red/20 text-accent-red rounded-lg px-3 py-2
Success:    bg-accent-green/20 text-accent-green rounded-lg px-3 py-2
Ghost:      text-text-secondary hover:text-text-primary hover:bg-bg-secondary
```

### Cards

```
Default:    bg-bg-secondary border border-border rounded-xl p-4
Hoverable:  + hover:border-accent-blue/50 transition-colors
Muted:      + opacity-50
```

### Input Fields

```
Default:    bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-text-primary
            placeholder:text-text-muted focus:outline-none focus:border-accent-blue
```

### Status Indicators

```
Completed:  text-accent-green (✓ icon)
Running:    text-accent-blue (spinner icon)
Waiting:    text-accent-yellow (filled circle)
Failed:     text-accent-red (✕ icon)
Pending:    text-text-muted (empty circle)
```

## Layout

- Max content width: `max-w-6xl` (detail pages), `max-w-4xl` (list pages), `max-w-2xl` (forms)
- Nav height: `h-14` (56px), fixed top, with backdrop blur
- Sidebar/main split: `grid-cols-1 lg:grid-cols-3` (1/3 + 2/3)

## Motion

- Transitions: `transition-colors` duration 150ms (default Tailwind)
- Loading spinner: `animate-spin` on Loader2 icon
- No page transitions in V0.1
- Hover scale on home cards: `group-hover:scale-110 transition-transform`

## Accessibility Requirements

- All interactive elements must have `aria-label` when text is not visible
- All icon-only buttons must have screen reader text
- Focus states must be visible (use `focus:outline-none focus:border-accent-blue`)
- Color must not be the only indicator (always pair with icon or text)
- All form inputs must have associated `<label>`
- Interactive elements must be keyboard navigable
