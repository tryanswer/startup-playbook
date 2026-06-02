# 00 Opportunity Discovery

Use this stage before idea validation. The goal is to discover candidate opportunities from public international signals and preserve every mining run.

## What To Mine

- Community pain: Reddit, Hacker News, Indie Hackers, Product Hunt comments, public forums, and public reviews.
- Copyable cases: GitHub indie projects, open startups, Show HN launches, founder blogs, public interviews, and source-linked overseas case libraries.

## What To Extract

For each candidate, record:

- target user;
- painful situation;
- source evidence;
- first reachable channel;
- candidate type: `pain-led` or `case-led`;
- copyable pattern;
- what is not copyable;
- first validation experiment;
- score and scoring breakdown.

## Decision Rule

Advance to validation only when a candidate has:

- repeated pain or credible case proof;
- a reachable user surface;
- a validation action that can run within one week;
- manageable clone and moat risk.

Discovery does not prove demand. It only decides which idea deserves validation next.

## CLI

```bash
cd tools/opportunity-radar
npm run radar -- \
  --input data/sample-international-radar.json \
  --playbook-dir ../../playbook \
  --project-id ai-ecommerce-image-optimizer \
  --render-index
```

For live source fetching, use a `sources` config:

```bash
cd tools/opportunity-radar
npm run radar -- \
  --input data/sample-live-sources.json \
  --playbook-dir ../../playbook \
  --project-id ai-ecommerce-image-optimizer \
  --render-index
```

Supported live source types are `reddit`, `hacker-news`, `show-hn`, `github`, `indie-hackers`, and `product-hunt`.
Use `--github-token` or `GITHUB_TOKEN` for higher GitHub API rate limits. Use `--product-hunt-token` or `PRODUCT_HUNT_TOKEN` for Product Hunt GraphQL; without it the tool falls back to best-effort public search HTML parsing, which Product Hunt may block with `403`. Product Hunt GraphQL supports launch filters such as `featured`, `topic`, `postedAfter`, and `postedBefore`; keyword `query` is only used by the public HTML fallback.

The latest stage artifacts are refreshed, and every run is preserved under:

```text
playbook/stages/discover/runs/
```
