# Tools

Reusable scripts that support opportunity discovery, startup validation, SEO/ASO research, market analysis, operations, and pipeline orchestration.

## Pipeline Orchestrator

- **`pipeline-orchestrator`**: End-to-end pipeline orchestrator — automatically routes between stages, transforms data via bridges, and pauses at human decision points. See [pipeline-orchestrator/README.md](./pipeline-orchestrator/README.md).
- **`_shared/credentials.mjs`**: Unified API credential management — reads from `.env`, `~/.startup-playbook/.env`, and environment variables.
- **`_shared/playbook-io.mjs`**: Shared read/write utilities for playbook artifacts (manifest, reports, handoffs).

```bash
# Quick start
node scripts/run-pipeline.mjs status      # show pipeline status
node scripts/run-pipeline.mjs inspect     # inspect next action
node scripts/run-pipeline.mjs advance     # advance one stage
node scripts/run-pipeline.mjs credentials # audit API keys
```

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
