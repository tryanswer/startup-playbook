# Startup Playbook

A repository of reusable startup workflows from idea to product, growth, and operations. The core principle is to validate real demand first, then develop the product, and finally grow through quantifiable channels—rather than letting AI fabricate stories without evidence.

## Structure

- `playbooks/01-idea-validation`: Validate whether demand is real, where target users are, and whether they're willing to pay.
- `playbooks/02-product-development`: Turn validated problems into MVP, PRD, acceptance criteria, and release loop.
- `playbooks/03-growth-and-marketing`: SEO, ASO, content, community, landing pages, and paid intent validation.
- `playbooks/04-operations-and-analytics`: Metrics, experiment reviews, user feedback, and operational rhythm.
- `skills/business-model-design`: Business model design guide based on 499 cases—choose models by product positioning, pricing structure, and revenue growth path.
- `skills/`: Skills that can be copied to Codex / agent environments.
- `tools/google-trends-seo`: Google Trends / Keywords Everywhere keyword research tool.
- `tools/case-study-skill-miner`: Distill founder case studies into startup experience skills.
- `tools/topic-pain-miner`: Scrape Reddit public topics, generate pain point heatmaps, HTML pages, and optional LLM demand summaries.
- `tools/google-growth-stack`: GA4 tracking code generation, UTM URL construction, Search Console data export, and weekly growth reports. Supports automatic dependency detection and installation.
- `tools/china-growth-stack`: Baidu Analytics tracking code generation, Umeng+ App tracking code generation (Swift/Kotlin), Baidu Search data export, and weekly growth reports. For mainland China market.
- `plugins/startup-playbook-advisor`: Startup advisor plugin installable to Codex.
- `agents/startup-playbook-advisor.md`: Startup advisor agent settings copyable to Claude / Codex / OpenClaw.
- `templates/`: Ready-to-use templates for experiments, PRDs, SEO/ASO, and landing pages.
- `playbooks/03-growth-and-marketing/ai-distribution.md`: AI-assisted content distribution, community replies, outreach, and daily report 70/30 division of labor with human approval rules.
- `playbooks/03-growth-and-marketing/google-search-console.md`: Google Search Console integration, SEO data interpretation, and content strategy loop.
- `playbooks/03-growth-and-marketing/google-ads-cold-start.md`: Quickly validate paid intent with $50-100 small budget, Search Terms → SEO feedback loop.
- `playbooks/03-growth-and-marketing/utm-attribution.md`: UTM parameter naming conventions, attribution models, and channel effectiveness review.
- `playbooks/04-operations-and-analytics/ga4-event-tracking.md`: GA4 tracking specifications, AARRR-layered event definitions, must complete before launch.
- `playbooks/04-operations-and-analytics/retention-decision-tree.md`: Retention analysis decision tree, D1/D7/D30 thresholds and diagnostic paths.
- `playbooks/04-operations-and-analytics/china-analytics-tracking.md`: Domestic tracking specifications (Baidu Analytics + Umeng+), AARRR event definitions, and privacy compliance.
- `playbooks/03-growth-and-marketing/china-growth-stack.md`: Domestic growth operations Playbook, covering Baidu/Douyin/Xiaohongshu/WeChat four major ecosystems.
- `templates/ai-distribution-action-sort.md`: Template for splitting weekly distribution actions into AI can / Human owns / Hybrid execution.
- `templates/weekly-review-dashboard.md`: Looker Studio weekly review dashboard setup guide, connecting GA4 + Search Console + Ads.
- `case-studies/beauty-log`: Beauty Log practical records.

## Operating Principles

1. First answer three questions: Is the demand real and frequent, where are the target users, and are users willing to pay.
2. Pain points come from real user quotes, not AI guesses.
3. Market segmentation should drill down to one core pain point so users understand it in one second.
4. Look at both search data and community evidence; a single trend doesn't represent a business opportunity.
5. Validation pages must have conversion actions: waitlist, booking, purchase, or paid reservation.

## Suggested Flow

1. Use `skills/idea-validation` to validate the idea, outputting kill / pivot / continue conclusions.
2. Use `skills/reddit-demand-validation` and `tools/topic-pain-miner` to scrape user quotes from public communities, judging whether demand is real, frequent, reachable, and has purchase signals.
3. Use `tools/google-trends-seo` to check keyword trends and country/language opportunities.
4. Use `templates/landing-page-checklist.md` to quickly build a page for conversion validation.
5. After idea passes, use `skills/product-development-loop` to scope the MVP.
6. Before launch, complete GA4 tracking according to `playbooks/04-operations-and-analytics/ga4-event-tracking.md`, ensuring activation, conversion, and retention events are all trackable.
7. Before launch, unify UTM parameter naming according to `playbooks/03-growth-and-marketing/utm-attribution.md`.
8. After launch, integrate Google Search Console (see `playbooks/03-growth-and-marketing/google-search-console.md`) to track search rankings and organic traffic.
9. Use `playbooks/03-growth-and-marketing/google-ads-cold-start.md` with a small budget to validate paid intent, feeding Search Terms back to SEO.
10. Use `skills/seo-aso-growth-research` for SEO / ASO / market operations iteration.
11. If using AI for content distribution, community replies, or outreach, first use `playbooks/03-growth-and-marketing/ai-distribution.md` and `templates/ai-distribution-action-sort.md` to do a 40-action sort, keeping the 30% that founders must handle personally.
12. Every week, review using the Looker Studio dashboard built with `templates/weekly-review-dashboard.md`, and diagnose retention issues using `playbooks/04-operations-and-analytics/retention-decision-tree.md`.
13. When referencing startup cases, use `skills/case-study-skill-mining`, `skills/founder-case-patterns`, and `skills/indie-hackers-starting-up` to turn cases and guides into actionable experience.

## Startup Advisor Plugin / Skill

`startup-playbook-advisor` is a startup advisor skill/agent for the early stages of project launch. It will first converse around demand authenticity, where users are, willingness to pay, validation experiments, MVP scope, and growth path, then output kill/pivot/continue decisions and next steps.

Installation entry:

```bash
node scripts/install-startup-advisor.mjs --target claude
node scripts/install-startup-advisor.mjs --target codex-skill
node scripts/install-startup-advisor.mjs --target codex-plugin
node scripts/install-startup-advisor.mjs --target openclaw --openclaw-root /Users/neal/Documents/Projects/fatclaw/openclaw-monorepo --run-openclaw-sync
```

You can also preview full installation actions:

```bash
node scripts/install-startup-advisor.mjs --target all --dry-run
```

Common startup prompts:

- `Help me validate a startup idea.`
- `Ask me the key questions before I build.`
- `Turn this idea into a 7-day validation plan.`

## Current Research Corpus

- Indie Hackers stories: 499 public case URLs indexed, 498 readable pages learned into `skills/founder-case-patterns`.
- Indie Hackers Starting Up: 80 guide resources indexed, 78 readable pages learned into `skills/indie-hackers-starting-up`.
- Raw HTML/text is kept in ignored tool `output/` directories; committed files contain only source-linked summaries, counts, and reusable operating rules.
