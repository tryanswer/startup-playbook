# Tools

Reusable scripts that support opportunity discovery, startup validation, SEO/ASO research, market analysis, operations, and pipeline orchestration.

## Pipeline Orchestrator

- **`pipeline-orchestrator`**: End-to-end pipeline orchestrator — automatically routes between stages, transforms data via bridges, and pauses at human decision points.
- **`pipeline-orchestrator/stage-executors.mjs`**: Stage auto-executors — maps each stage to an automated analysis function (discover, validate, business-model).
- **`_shared/credentials.mjs`**: Unified API credential management — reads from `.env`, `~/.startup-playbook/.env`, and environment variables.
- **`_shared/playbook-io.mjs`**: Shared read/write utilities for playbook artifacts (manifest, reports, handoffs).

```bash
# Quick start
node scripts/run-pipeline.mjs status                     # show pipeline status
node scripts/run-pipeline.mjs inspect                    # inspect next action
node scripts/run-pipeline.mjs advance --auto-run --confirm  # auto-execute + advance
node scripts/run-pipeline.mjs run --to business-model --auto-run --confirm  # run through multiple stages
node scripts/run-pipeline.mjs credentials                # audit API keys
```

## Data Collection Layer

Unified data collection framework with 11 source adapters covering global and China markets.

```bash
# Quick start
node scripts/collect-data.mjs list                              # list all sources
node scripts/collect-data.mjs list --region china               # list China sources only
node scripts/collect-data.mjs test reddit --community SaaS -l 5 # quick test
node scripts/collect-data.mjs test hacker-news -q "ai startup"  # test HN search
node scripts/collect-data.mjs test v2ex --node create -l 5      # test V2EX
node scripts/collect-data.mjs collect --sources reddit,hacker-news -q "saas" -o data/out.json
node scripts/collect-data.mjs credentials                       # audit API keys
```

**Global Sources (8)**:
| Source | Type | Auth | Notes |
|--------|------|------|-------|
| Reddit | community | free | Public JSON API, ~1 req/s |
| Hacker News | community | free | Algolia API |
| GitHub | case | optional | `GITHUB_TOKEN` for higher limits |
| Product Hunt | case | required | `PRODUCT_HUNT_TOKEN` (GraphQL v2) |
| Google Trends | trend | free | Requires `google-trends-api` npm package |
| App Store | review | free | Requires `app-store-scraper` npm package |
| Twitter / X | community | required | `TWITTER_BEARER_TOKEN` (API v2) |
| Google Autocomplete | trend | free | Suggest API |

**China Sources (3)**:
| Source | Type | Auth | Notes |
|--------|------|------|-------|
| V2EX | community | optional | `V2EX_TOKEN` for higher limits |
| 知乎 (Zhihu) | community | free | Web scraping + API |
| 小红书 (RED) | community | free | Requires `playwright` npm package |

**Shared modules**:
- `_shared/http-client.mjs` — Enhanced HTTP client with retry, rate limiting, proxy support (undici ProxyAgent)
- `_shared/data-sources/index.mjs` — Unified source registry and `collectFromSources()` API
- `_shared/data-sources/*.mjs` — Individual source adapters

## Data Analysis Module

Signal extraction, opportunity scoring, and automated report generation from collected data.

```bash
# Analyze previously collected data
node scripts/analyze-data.mjs analyze data/collected.json -o analysis/

# Collect + analyze in one step (recommended)
node scripts/analyze-data.mjs collect-analyze \
  --sources hacker-news,github,google-autocomplete -q "ai invoice tool" -o analysis/

# Regenerate Markdown report from analysis JSON
node scripts/analyze-data.mjs report analysis/report.json -o analysis/
```

**Analysis pipeline**: `collect → extract signals → fuse → score → model match → report`

| Component | File | Description |
|-----------|------|-------------|
| Signal Extractor | `_shared/analyzers/signal-extractor.mjs` | 19 detection rules across 3 categories (pain/demand/supply) |
| Opportunity Scorer | `_shared/analyzers/opportunity-scorer.mjs` | 5-dimension scoring (100 pts): painHeat, caseProof, demandTrend, channelReach, feasibility |
| Signal Fusion | `_shared/analyzers/signal-fusion.mjs` | Cross-source clustering, triangulation, confidence scoring, gap analysis |
| Report Generator | `_shared/analyzers/report-generator.mjs` | Structured JSON + Markdown reports with evidence and next steps |
| Business Model Matcher | `_shared/analyzers/business-model-matcher.mjs` | 5 model patterns (SaaS/Service/Course/Marketplace/DevTool) + pricing checklist |

**Decision thresholds**: ≥65 → ✅ Continue | 40–64 → 🔄 Pivot | <40 → ❌ Kill

**Pipeline integration**: Use `--stage discover` to auto-write playbook stage artifacts:
```bash
node scripts/analyze-data.mjs collect-analyze \
  --sources hacker-news,github -q "ai tool" --stage discover
# Writes: playbook/stages/discover/{input,report,handoff}.json + report.md
```

## Automated Scheduling

GitHub Actions workflow for periodic collection and analysis: `.github/workflows/collect-analyze.yml`

- **Schedule**: Every Monday at 08:00 UTC (configurable)
- **Manual trigger**: `workflow_dispatch` with custom query, sources, and stage
- **Steps**: collect → analyze → commit report → job summary

## Stage Tools

- `opportunity-radar`: International public community and case mining into preserved `discover` stage opportunity candidates.
- `idea-validator`: Automated idea validation — Reddit pain mining, Google Trends demand check, competitor scan → HTML decision report with kill/pivot/continue scoring.
- `topic-pain-miner`: public Reddit topic mining for pain heatmaps, demand validation, HTML reports, and optional LLM summaries.
- `google-trends-seo`: Google Trends / Keywords Everywhere keyword research tool.
- `google-growth-stack`: GA4 tracking code generation, UTM URL building, Google Search Console data export, and weekly growth report. Run `npm run check-deps` to verify and auto-install system dependencies (gcloud CLI, etc.).
- `china-growth-stack`: 百度统计 + 友盟+ 埋点代码生成、百度搜索数据导出和每周增长报告。面向中国大陆市场。Run `npm run check-deps` to verify API credentials.

## Community Tools

- `case-study-skill-miner`: source-linked founder case extraction and skill synthesis.
- `indie-hackers-reply`: Indie Hackers comment capture, low-pressure reply drafting, and confirmation-gated public posting.
