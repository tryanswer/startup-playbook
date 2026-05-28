# Startup Playbook

> Evidence first. Build second. Grow with data.

An open-source, end-to-end startup methodology for indie hackers and solo founders — from idea validation to product launch, growth, and operational analytics. Powered by real-world patterns from **499 founder case studies**.

## Why This Exists

Most founders fail not because they cannot build, but because they **build before validating**. They fall in love with an idea, spend months coding, launch to silence, then blame the market.

This playbook enforces a different discipline:

1. **Prove the pain is real** — with user quotes, not AI-generated stories.
2. **Prove someone will pay** — with preorders or manual services, not signup counts.
3. **Then build** — the smallest product that delivers the core value.
4. **Then grow** — with measurable channels, not spray-and-pray content.
5. **Then iterate** — with data-driven decisions, not founder anxiety.

Every guide, template, and tool in this repo is designed to prevent the most common indie hacker mistake: **building something nobody wants.**

## What's Inside

### Playbooks (Step-by-Step Guides)

| Stage | Playbook | What it covers |
|---|---|---|
| **① Validate** | [`01-idea-validation`](playbooks/01-idea-validation/) | Three-gate validation: real demand? reachable users? willing to pay? |
| **② Build** | [`02-product-development`](playbooks/02-product-development/) | AI-native development, stability & security, tech stack, MVP scoping, launch checklist, post-launch iteration |
| **③ Grow** | [`03-growth-and-marketing`](playbooks/03-growth-and-marketing/) | SEO, Google Ads cold start, Search Console, UTM attribution, AI distribution, China market growth |
| **④ Operate** | [`04-operations-and-analytics`](playbooks/04-operations-and-analytics/) | GA4/Baidu event tracking, retention decision trees, weekly review protocol |

### Skills (AI Agent-Ready)

Reusable skill files for Claude, Codex, or any AI agent environment:

| Skill | Purpose |
|---|---|
| [`idea-validation`](skills/idea-validation/) | Validate demand with community pain, search trends, and paid-intent signals |
| [`business-model-design`](skills/business-model-design/) | Choose business model and pricing based on 499 case patterns |
| [`product-development-loop`](skills/product-development-loop/) | Turn validated ideas into MVP → launch → data-driven iteration |
| [`seo-aso-growth-research`](skills/seo-aso-growth-research/) | SEO/ASO keyword research and growth channel planning |
| [`reddit-demand-validation`](skills/reddit-demand-validation/) | Mine Reddit/forums for demand evidence before building |
| [`founder-case-patterns`](skills/founder-case-patterns/) | 499 case-derived patterns for channels, pricing, validation, and MVP |
| [`indie-hackers-starting-up`](skills/indie-hackers-starting-up/) | Stage-based founder guide from 80 startup resources |
| [`ai-native-development`](skills/ai-native-development/) | AI-native build workflow: Superpowers spec, DESIGN.md + taste-skill, six stability pillars, agent audit |
| [`startup-playbook-advisor`](skills/startup-playbook-advisor/) | Full advisor agent: ask the right questions, output kill/pivot/continue |

### Tools (CLI Scripts)

| Tool | What it does |
|---|---|
| [`google-trends-seo`](tools/google-trends-seo/) | Google Trends & Keywords Everywhere keyword research |
| [`topic-pain-miner`](tools/topic-pain-miner/) | Reddit public topic scraping → pain heatmaps + HTML reports |
| [`case-study-skill-miner`](tools/case-study-skill-miner/) | Extract founder case studies into reusable skills |
| [`idea-validator`](tools/idea-validator/) | Automated idea validation: Reddit pain + Trends demand + competitor scan → HTML decision report |
| [`google-growth-stack`](tools/google-growth-stack/) | GA4 code gen, UTM builder, Search Console export, weekly report |
| [`china-growth-stack`](tools/china-growth-stack/) | Baidu Analytics + Umeng+ code gen, Baidu search export, weekly report |

### Templates

| Template | Purpose |
|---|---|
| [`experiment-brief.md`](templates/experiment-brief.md) | Record validation experiments and decisions |
| [`product-requirements.md`](templates/product-requirements.md) | MVP PRD with acceptance criteria and metrics |
| [`landing-page-checklist.md`](templates/landing-page-checklist.md) | Landing page message, proof, conversion, and measurement checklist |
| [`seo-aso-report.md`](templates/seo-aso-report.md) | SEO/ASO keyword cluster and action report |
| [`weekly-review-dashboard.md`](templates/weekly-review-dashboard.md) | Looker Studio dashboard setup (GA4 + Search Console + Ads) |
| [`ai-distribution-action-sort.md`](templates/ai-distribution-action-sort.md) | AI can / Human owns / Hybrid weekly action split |

## Quick Start

### Option 1: Use the Advisor Agent

Install the startup advisor as a skill in your AI environment:

```bash
# Claude
node scripts/install-startup-advisor.mjs --target claude

# Codex skill
node scripts/install-startup-advisor.mjs --target codex-skill

# Codex plugin
node scripts/install-startup-advisor.mjs --target codex-plugin

# Preview all targets
node scripts/install-startup-advisor.mjs --target all --dry-run
```

Then start with one of these prompts:

- `Help me validate a startup idea.`
- `Ask me the key questions before I build.`
- `Turn this idea into a 7-day validation plan.`

### Option 2: Follow the Playbook Manually

**Week 1 — Validate**

1. Read [`playbooks/01-idea-validation`](playbooks/01-idea-validation/) and answer the three gate questions.
2. Run `tools/topic-pain-miner` to collect real user pain from Reddit.
3. Run `tools/google-trends-seo` to check keyword trends.
4. Build a landing page using [`templates/landing-page-checklist.md`](templates/landing-page-checklist.md).
5. Decide: **kill / pivot / continue**.

**Week 2-3 — Build**

6. Choose your business model with [`skills/business-model-design`](skills/business-model-design/).
7. Pick a tech stack from [`tech-stack-selection.md`](playbooks/02-product-development/tech-stack-selection.md).
8. Scope the MVP using [`templates/product-requirements.md`](templates/product-requirements.md).
9. Set up analytics before launch: [`ga4-event-tracking.md`](playbooks/04-operations-and-analytics/ga4-event-tracking.md).
10. Follow the [`mvp-launch-checklist.md`](playbooks/02-product-development/mvp-launch-checklist.md).

**Week 4+ — Grow & Iterate**

11. Connect [Google Search Console](playbooks/03-growth-and-marketing/google-search-console.md) and run a [$50 Google Ads test](playbooks/03-growth-and-marketing/google-ads-cold-start.md).
12. Set up your [weekly review dashboard](templates/weekly-review-dashboard.md).
13. Use the [post-launch iteration guide](playbooks/02-product-development/post-launch-iteration.md) to diagnose and decide.

### Option 3: China Market

For products targeting mainland China, use the parallel China stack:

- [`china-growth-stack.md`](playbooks/03-growth-and-marketing/china-growth-stack.md) — Baidu (百度), Douyin (抖音), Xiaohongshu (小红书), WeChat (微信) ecosystems
- [`china-analytics-tracking.md`](playbooks/04-operations-and-analytics/china-analytics-tracking.md) — Baidu Analytics (百度统计) + Umeng+ (友盟+)
- [`tools/china-growth-stack`](tools/china-growth-stack/) — CLI tools for Baidu tracking, search data, and weekly reports

## Operating Principles

1. **Demand must be real and frequent.** If you cannot find 20 real user complaints, the problem may not exist.
2. **Pain comes from user quotes, not AI guesses.** Collect raw language from communities, reviews, and support tickets.
3. **Segment until one-second clarity.** One user group, one situation, one pain. If a stranger cannot understand it instantly, it is too broad.
4. **Search data and community evidence together.** A single trend does not prove a business opportunity.
5. **Every validation page needs a conversion action.** Waitlist, booking, purchase, or paid reservation — not just "learn more."
6. **Revenue validates demand faster than signups.** Charge from day one, even if it is a manual service.
7. **AI handles the mechanical 70%, founders own the converting 30%.** Never auto-send messages that could damage trust.

## Research Corpus

This playbook's case-derived skills are built on real founder data:

| Source | Cases | Readable | Output |
|---|---|---|---|
| Indie Hackers founder stories | 499 | 498 | [`skills/founder-case-patterns`](skills/founder-case-patterns/) |
| Indie Hackers Starting Up guides | 80 | 78 | [`skills/indie-hackers-starting-up`](skills/indie-hackers-starting-up/) |

Raw HTML/text is kept in ignored `output/` directories. Committed files contain only source-linked summaries, counts, and reusable operating rules.

## Contributing

This is a living playbook. Contributions welcome:

- **New case studies** — add to `case-studies/` with source links and pattern tags.
- **New tools** — add to `tools/` following the existing Node.js ESM pattern.
- **Playbook improvements** — PRs that add evidence-backed guides or fix errors.
- **Translations** — the project is English-first; translations should reference the original files.

## License

MIT
