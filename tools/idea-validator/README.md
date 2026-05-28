# Idea Validator

Automated startup idea validation. Input an idea, get a **kill / pivot / continue** decision report backed by evidence from Reddit, Google Trends, and competitor analysis.

## Quick Start

```bash
cd tools/idea-validator
node scripts/validate.mjs --idea "AI skin analysis app for women 25-35"
```

This runs three data collection steps automatically, then generates an HTML decision report:

1. **Reddit Pain Mining** — scrapes Reddit for frustration signals, pain themes, and payment intent.
2. **Trends & Demand Check** — queries Google autocomplete for buyer-intent keywords and demand signals.
3. **Competitor Scan** — identifies existing solutions and assesses market maturity.
4. **Decision Report** — scores all evidence and outputs kill/pivot/continue with reasoning.

The report opens as a self-contained HTML file in `output/`.

## Usage

```bash
# Basic — auto-extracts keywords from the idea
node scripts/validate.mjs --idea "invoice tool for freelancers"

# With specific keywords and subreddits
node scripts/validate.mjs \
  --idea "AI writing assistant for blog posts" \
  --keywords "ai writer,ai copywriting,blog writing tool" \
  --subreddits "blogging,content_marketing,Entrepreneur"

# Target a specific geography
node scripts/validate.mjs --idea "recipe meal planner" --geo US

# Skip a data source (e.g., if Reddit is blocked)
node scripts/validate.mjs --idea "budget tracker app" --skip-reddit

# Run individual steps
node scripts/reddit-pain.mjs --keywords "freelance invoice"
node scripts/trends-check.mjs --keywords "invoice tool,billing software"
node scripts/competitor-scan.mjs --keywords "freelance invoice tool"
node scripts/generate-report.mjs --idea "Invoice tool for freelancers"
```

## Options

| Flag | Description | Default |
|---|---|---|
| `--idea` | Required. The idea to validate | — |
| `--keywords` | Override search keywords (comma-separated) | Auto-extracted from idea |
| `--subreddits` | Target subreddits (comma-separated) | Search all of Reddit |
| `--geo` | Geographic focus (US, GB, DE, etc.) | Global |
| `--limit` | Max Reddit posts per search | 100 |
| `--skip-reddit` | Skip Reddit pain mining | false |
| `--skip-trends` | Skip trends/demand check | false |
| `--skip-competitors` | Skip competitor scan | false |
| `--output` | Custom path for HTML report | `output/report-*.html` |

## How Scoring Works

The validator scores evidence across three dimensions:

| Dimension | Max Points | Strong Signal |
|---|---|---|
| **Reddit Pain** | 40 | Pain rate ≥40%, payment signals ≥10% |
| **Search Demand** | 25 | Demand score ≥60, buyer-intent queries ≥5 |
| **Market Maturity** | 20 | Growing market with 2+ competitors |

**Decision thresholds**:

| Score | Decision | Meaning |
|---|---|---|
| ≥60 | **Continue** | Strong evidence — proceed to MVP |
| 35-59 | **Pivot** | Mixed signals — narrow the niche or change angle |
| <35 | **Kill** | Insufficient evidence — do not build |

## Output

The HTML report includes:

- **Decision banner**: kill/pivot/continue with score and reasoning.
- **Evidence summary**: supporting evidence and concerns.
- **Reddit analysis**: pain rate, payment signals, top user quotes with source links.
- **Search demand**: demand score, buyer-intent queries, signal classification.
- **Competitor landscape**: market maturity, identified competitors.
- **Next steps**: specific actions based on the decision.

## Proxy

If Reddit is blocked from your network, set proxy environment variables:

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
node scripts/validate.mjs --idea "your idea"
```

## Limitations

- Reddit data is limited to public posts (no comments, no private communities).
- Google Trends API is not used directly (no stable public endpoint); autocomplete is used as a proxy.
- Competitor detection is heuristic-based — may miss niche or non-English competitors.
- The tool provides evidence, not certainty. Always talk to real users before building.
- For deeper keyword analysis, use `tools/google-trends-seo` with a Keywords Everywhere API key.

## Integration with Playbook

This tool automates steps 1-3 of the `skills/idea-validation` workflow:

```
Manual workflow:                    Automated with idea-validator:
1. Mine pain ore          →        npm run reddit (automatic)
2. Quantify pain          →        Pain rate + theme frequency (automatic)
3. Validate demand        →        npm run trends (automatic)
4. Check competitors      →        npm run competitors (automatic)
5. Check payment intent   →        Payment signal analysis (automatic)
6. Generate decision      →        HTML report with score (automatic)
7. Build landing page     →        Still manual (use templates/)
8. Talk to users          →        Still manual (always will be)
```
