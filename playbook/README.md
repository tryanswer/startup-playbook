# AI Ecommerce Image Optimizer Playbook

This is a full advisor pipeline run for the idea, now with a discover-stage opportunity radar before validation:

> Use ChatGPT / GPT Image 2 to help Taobao, JD, Amazon, and cross-border ecommerce sellers optimize product display images.

The run intentionally mixes verified external facts with mock seller signals so the full artifact workflow can be exercised. Mock evidence is marked with `"mock": true` in `evidence.json`.

## Current Decision

Discovery has a separate latest decision: continue to validation with the top preserved opportunity candidate from `stages/discover/report.json`.

The earlier validation decision remains: pivot in validation mode. The ecommerce image idea is promising, but the first audience is too broad. The recommended wedge is cross-border Amazon sellers with 10-200 active SKUs.

## Next Move

Run a one-week paid manual-service sprint:

- 10 qualified seller replies.
- 5 calls or image audits.
- 2 paid SKU image packs.
- Average revision count under 2 per pack.

Do not build a self-serve SaaS until real paid evidence replaces the mock signals.

Discover-stage mining runs are preserved under `stages/discover/runs/` so each idea radar result remains available even when the latest `discover` report is refreshed.
