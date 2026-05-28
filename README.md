# Startup Playbook

Reusable startup workflows from idea to product, growth, and operations. The core principle is to validate real demand before building, then grow through measurable channels instead of letting AI invent stories without evidence.

## Structure

- `playbooks/01-idea-validation`: Validate whether demand is real, where target users are, and whether they are willing to pay.
- `playbooks/02-product-development`: Turn validated problems into MVP scope, PRDs, acceptance criteria, and launch loops.
- `playbooks/03-growth-and-marketing`: SEO, ASO, content, community, landing-page, and paid-intent validation.
- `playbooks/04-operations-and-analytics`: Metrics, experiment reviews, user feedback, and operating cadence.
- `skills/`: Skills that can be copied into Codex or agent environments.
- `tools/google-trends-seo`: Google Trends / Keywords Everywhere keyword research tools.
- `tools/case-study-skill-miner`: Convert founder case studies into reusable startup skills.
- `tools/topic-pain-miner`: Fetch public Reddit topics and generate pain heatmaps, HTML pages, and optional LLM demand summaries.
- `plugins/startup-playbook-advisor`: Installable Codex startup advisor plugin.
- `agents/startup-playbook-advisor.md`: Startup advisor agent instructions for Claude, Codex, or OpenClaw.
- `templates/`: Copy-ready experiment, PRD, SEO/ASO, and landing-page templates.
- `playbooks/03-growth-and-marketing/ai-distribution.md`: 70/30 operating rules for AI-assisted content distribution, community replies, outreach, and daily reports.
- `templates/ai-distribution-action-sort.md`: Template for splitting a week's distribution work into AI can / Human owns / Hybrid.
- `case-studies/beauty-log`: Beauty Log field case study.

## Operating Principles

1. Answer three questions first: Is demand real and frequent? Where are the target users? Are they willing to pay?
2. Pain must come from real user language, not AI guesses.
3. Segment the market down to one audience, one situation, and one core pain so users can understand the product in one second.
4. Check both search data and community evidence; a single trend does not prove a business opportunity.
5. Validation pages must include a conversion action: waitlist, booking, purchase, or paid preorder.

## Suggested Flow

1. Use `skills/idea-validation` to validate the idea and decide kill / pivot / continue.
2. Use `skills/reddit-demand-validation` and `tools/topic-pain-miner` to collect user language from public communities and judge whether demand is real, frequent, reachable, and tied to buying signals.
3. Use `tools/google-trends-seo` to check keyword trends and country/language opportunities.
4. Use `templates/landing-page-checklist.md` to build a fast conversion test.
5. After the idea passes validation, use `skills/product-development-loop` to narrow the MVP.
6. After launch, use `skills/seo-aso-growth-research` for SEO / ASO / market operations iteration.
7. If AI is used for content distribution, community replies, or outreach, first use `playbooks/03-growth-and-marketing/ai-distribution.md` and `templates/ai-distribution-action-sort.md` for a 40-action sort, preserving the 30% that the founder must personally own.
8. When startup examples are needed, use `skills/case-study-skill-mining`, `skills/founder-case-patterns`, and `skills/indie-hackers-starting-up` to convert cases and guides into executable lessons.

## Startup Advisor Plugin / Skill

`startup-playbook-advisor` is a startup advisor skill / agent for the pre-build stage. It first guides a conversation around demand reality, user reachability, willingness to pay, validation experiments, MVP scope, and growth path, then outputs a kill / pivot / continue decision and next steps.

Install targets:

```bash
node scripts/install-startup-advisor.mjs --target claude
node scripts/install-startup-advisor.mjs --target codex-skill
node scripts/install-startup-advisor.mjs --target codex-plugin
node scripts/install-startup-advisor.mjs --target openclaw --openclaw-root /Users/neal/Documents/Projects/fatclaw/openclaw-monorepo --run-openclaw-sync
```

Preview the full install plan:

```bash
node scripts/install-startup-advisor.mjs --target all --dry-run
```

Common starting prompts:

- `Help me validate a startup idea.`
- `Ask me the key questions before I build.`
- `Turn this idea into a 7-day validation plan.`

## Current Research Corpus

- Indie Hackers stories: 499 public case URLs indexed, 498 readable pages learned into `skills/founder-case-patterns`.
- Indie Hackers Starting Up: 80 guide resources indexed, 78 readable pages learned into `skills/indie-hackers-starting-up`.
- Raw HTML/text is kept in ignored tool `output/` directories; committed files contain only source-linked summaries, counts, and reusable operating rules.
