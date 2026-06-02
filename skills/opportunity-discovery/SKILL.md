---
name: opportunity-discovery
description: Use when a founder wants an AI agent to discover startup ideas from international public communities, public GitHub/open-startup projects, founder case studies, or overseas public success cases before validation.
---

# Opportunity Discovery

Use this skill before `idea-validation`. The goal is to generate a ranked opportunity backlog from public signals, not to declare that demand is validated.

## Core Rule

Discover problems and copyable patterns; do not invent markets. Every candidate must trace back to public community evidence, public case evidence, or an explicit assumption.

## Sources

Prioritize international public sources:

- Reddit, Hacker News, Indie Hackers, Product Hunt comments, public forums, and public app/tool reviews.
- GitHub repositories for indie tools, open startups, awesome lists, launch READMEs, sponsor pages, public issue threads, and source-linked project directories.
- Public founder cases from Indie Hackers, Show HN, founder blogs, Starter Story-style interviews, MicroConf-style talks, and other public overseas case libraries.

## Candidate Types

- `pain-led`: repeated community pain, complaints, manual workflows, alternative seeking, pricing pain, migration friction, integration friction, repeated questions, or purchase-intent language.
- `case-led`: public success cases with a copyable wedge, acquisition channel, pricing model, productized workflow, or validation move.

Copy the pattern, not the product. Record what is copyable and what is not copyable.

## Workflow

1. Collect normalized community posts and public case records.
2. Detect pain signals and case signals.
3. Cluster signals into candidate opportunities.
4. Score candidates by pain heat, case proof, reachable channel, solo-founder feasibility, speed to validation, clone risk, and moat dependency.
5. Select top candidates for validation.
6. Preserve the full run under `playbook/stages/discover/runs/`.
7. Refresh latest `playbook/stages/discover/input.json`, `report.json`, `handoff.json`, and `report.md`.
8. Regenerate `playbook/index.html` through `startup-playbook-artifacts`.

## Tooling

If this repository is available, use:

```bash
cd tools/opportunity-radar
npm run radar -- --input data/sample-international-radar.json --playbook-dir ../../playbook --project-id ai-ecommerce-image-optimizer --render-index
```

The tool writes the latest discover artifacts and preserves every run with a timestamped file name.

When the input JSON includes `sources`, the tool can fetch these channels directly:

- `reddit`: public subreddit listing/search JSON.
- `hacker-news`: HN Algolia story search.
- `show-hn`: HN Algolia Show HN search.
- `github`: GitHub repository search API, mapped into case candidates. Use `--github-token` or `GITHUB_TOKEN` for higher rate limits.
- `indie-hackers`: public stories HTML, mapped into case candidates with best-effort parsing.
- `product-hunt`: GraphQL API when `apiToken`, `--product-hunt-token`, or `PRODUCT_HUNT_TOKEN` is provided, otherwise public search HTML with best-effort parsing that may be blocked with `403`. API mode supports Product Hunt `posts` filters such as `featured`, `topic`, `postedAfter`, and `postedBefore`; keyword `query` is only for the public HTML fallback.

Fetched posts are merged with provided community exports before scoring. GitHub, Indie Hackers, and Product Hunt sources are merged into public case records.
If a supported live source fails because of timeout, rate limiting, or blocking, keep the run going and preserve the failure under `sourceErrors` in the discover artifacts.

## Required Output

- Opportunity discovery report.
- Source coverage summary.
- Signal summary.
- Ranked opportunity backlog.
- Top candidates.
- Community evidence and case evidence.
- Copyable vs non-copyable case patterns.
- Validation handoff for the top candidate.
- Historical run path.

## Handoff To Validation

Pass one candidate into `idea-validation` with:

- target user candidate;
- painful situation;
- promise candidate;
- first reachable channel;
- raw/source evidence references;
- recommended next experiment.

Treat the handoff as a hypothesis. The validation stage must still prove demand, reachability, and willingness to pay.

## Common Mistakes

- Treating GitHub stars, upvotes, or launch comments as paid demand.
- Copying a successful product without a new wedge or reachable channel.
- Ignoring founder-specific advantages such as audience, brand, data, or timing.
- Overwriting historical idea mining results.
- Moving to build before a candidate passes validation.
