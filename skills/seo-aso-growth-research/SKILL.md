---
name: seo-aso-growth-research
description: Use when researching SEO, ASO, localization, keyword opportunities, country trends, landing-page copy, or growth content for a startup product.
---

# SEO / ASO Growth Research

Use this skill to translate validated user pain into search, app-store, and content growth opportunities.

## Workflow

1. Define market, country, language, user segment, and buying intent.
2. Check `indie-hackers-starting-up` and `founder-case-patterns` for acquisition channels that worked in similar markets.
3. Build keyword clusters: problem, solution, comparison, purchase, brand, and adjacent use cases.
4. Check Google Trends for direction, geography, related queries, and seasonality.
5. Add Keywords Everywhere data when available: volume, CPC, competition, and 12-month trend.
6. Compare against competitor pages, app titles, subtitles, descriptions, reviews, and FAQ.
7. Rewrite copy for each language from user pain, not literal translation.
8. Produce actions for landing pages, App Store, Google Play, content, and experiments.
9. If AI is used for distribution, apply `playbooks/03-growth-and-marketing/ai-distribution.md`: AI may scan, summarize, score, draft, and report; humans must approve external replies, cold outreach, customer messages, competitor positioning, and final wording that affects trust.
10. Track impressions, clicks, rankings, conversion, payment intent, user objections, human minutes, AI cost, and cost-per-outcome.

## Required Output

- Keyword cluster report.
- Country and language opportunity ranking.
- SEO landing-page recommendations.
- ASO title/subtitle/description recommendations.
- Content experiment backlog.
- Measurement plan.
- AI distribution action split and never-write list when AI-assisted posting, replies, or outreach are in scope.

## Standardized Artifact Output

After completing growth research, use `startup-playbook-artifacts` when the user asks to save, export, render, document, persist, or resume the result.

Write or refresh:

```text
playbook/stages/grow/input.json
playbook/stages/grow/report.json
playbook/stages/grow/handoff.json
playbook/stages/grow/report.md
```

The `report.json` must follow the Startup Playbook artifact protocol and include `analysis.marketRouting`, `analysis.keywordClusters`, `analysis.seoAso`, `analysis.channels`, `analysis.paidValidation`, `analysis.utmPlan`, `analysis.aiDistribution`, and `analysis.measurementPlan`.

The `handoff.json` must include active channels, UTM conventions, SEO/ASO targets, paid test setup if any, content backlog, and measurement plan thresholds.

## Tool Notes

- Prefer `tools/google-trends-seo` when this repository is available.
- Use `tools/google-growth-stack pull-search-console` to export Search Console query and page data for analysis.
- Use `tools/google-growth-stack weekly-report` to generate a combined GA4 + Search Console Markdown summary.
- Connect Google Search Console per `playbooks/03-growth-and-marketing/google-search-console.md` to get real click, impression, CTR, and position data.
- Use `playbooks/03-growth-and-marketing/google-ads-cold-start.md` for paid keyword validation; feed Ads Search Terms back into SEO keyword clusters.
- Apply `playbooks/03-growth-and-marketing/utm-attribution.md` to all external links for consistent channel attribution.
- Google Trends is relative interest, not absolute search volume.
- If paid keyword data is unavailable, mark volume/CPC confidence as limited.
- SEO/ASO should inform landing page and product positioning, not only metadata.
