# Google Trends SEO Research

Standalone keyword research scripts for startup marketing, SEO, ASO, and landing-page copy planning. This tool was first used for the Beauty Log case study, but the seed CSV can be replaced for any product.

This folder is intentionally outside the product repo. It reads API keys from environment variables only and does not store credentials in files.

## Requirements

- Node.js 20 or newer
- Keywords Everywhere credits for search volume, CPC, competition, and 12-month trend data
- Network access to `trends.google.com` for Google Trends data

## Setup

```bash
cd /Users/neal/Documents/Projects/startup-playbook/tools/google-trends-seo
npm test
```

Set the Keywords Everywhere key in your shell when you need paid keyword metrics:

```bash
export KEYWORDS_EVERYWHERE_API_KEY="..."
```

Do not commit `.env` files or API keys.

## Proxy

The npm scripts run Node with `--use-env-proxy`, so they respect proxy variables set before startup:

```bash
export HTTPS_PROXY="http://127.0.0.1:26001"
export HTTP_PROXY="http://127.0.0.1:26001"
export ALL_PROXY="socks5://127.0.0.1:26001"
npm run trends -- --country us --group core --limit 5
```

You can also pass a proxy directly. The script will re-run itself once with Node proxy support enabled:

```bash
npm run trends -- --proxy http://127.0.0.1:26001 --country us --group core --limit 5
```

## Keyword Seed File

Seed keywords live in:

```text
data/color-diagnosis-keywords.csv
```

Columns:

- `group`: keyword cluster such as `core`, `hair`, `makeup`, `japan`, `korea`
- `market`: product market grouping such as `global`, `jp`, `kr`, `de`
- `country`: two-letter country code used by the APIs
- `language`: language code
- `keyword`: search term
- `intent`: user intent such as `diagnosis`, `problem`, `hair`, `makeup`, `outfit`, `app`
- `priority`: manual planning priority, where `1` is strongest
- `notes`: why the keyword matters

## Keywords Everywhere

Preview credit usage without consuming credits:

```bash
npm run keywords -- --dry-run
npm run keywords -- --dry-run --country us --group core --limit 5
```

Fetch paid metrics:

```bash
npm run keywords -- \
  --country us \
  --group core \
  --out output/keywords-everywhere-us-core
```

The script first calls the credits endpoint. If credits are lower than the selected keyword count, it stops before requesting keyword data.

Useful filters:

```bash
--country us,jp,kr
--market global,jp
--group core,hair,makeup
--language en,ja,ko
--intent diagnosis,app
--max-priority 2
--limit 20
```

Outputs:

```text
output/keywords-everywhere-*.csv
output/keywords-everywhere-*.raw.json
```

## Google Trends

Fetch relative interest and related queries:

```bash
npm run trends -- \
  --proxy http://127.0.0.1:26001 \
  --country us \
  --group core \
  --batch-size 1 \
  --delay-ms 3000 \
  --retries 2 \
  --retry-delay-ms 12000 \
  --no-related \
  --out output/google-trends-us-core
```

Google Trends compares at most 5 terms per request, so `--batch-size` is capped at 5.

Useful options:

```bash
--time "today 12-m"
--time "today 5-y"
--hl en-US
--country us,jp,kr,de,fr,es,ru,in
--group core
--batch-size 1
--delay-ms 3000
--retries 2
--retry-delay-ms 12000
--no-related
```

Outputs:

```text
output/google-trends-*-timeseries.csv
output/google-trends-*-related.csv
output/google-trends-*.raw.json
```

If the local network cannot reach `trends.google.com`, set proxy variables before running. Google sometimes rate-limits widget endpoints; use `--batch-size 1`, larger delays, and `--no-related` for a more stable first pass.

## Merge Report

If you only use Google Trends, generate a Trends-only report:

```bash
npm run trends:report -- \
  --trends output/google-trends-us-core-timeseries.csv \
  --related output/google-trends-us-core-related.csv \
  --title "Google Trends Keyword Report" \
  --out output/trends-report-us-core
```

After you have both Keywords Everywhere and Google Trends CSV files, you can generate a combined report:

```bash
npm run merge -- \
  --keywords output/keywords-everywhere-us-core.csv \
  --trends output/google-trends-us-core-timeseries.csv \
  --title "Keyword Opportunity Report" \
  --out output/keyword-report-us-core
```

Outputs:

```text
output/trends-report-*.csv
output/trends-report-*.json
output/trends-report-*.md
output/keyword-report-*.csv
output/keyword-report-*.json
output/keyword-report-*.md
```

The merged `seo_score` is a planning score for prioritizing SEO/ASO work. It combines search volume, CPC, trend interest, and the manual seed priority. It is not a paid-media bidding model.

## Suggested Workflow

1. Export proxy variables if Google is not reachable directly.
2. Fetch Google Trends for one market first, such as `--country us --group core`.
3. Generate a Trends-only markdown report with `npm run trends:report`.
4. Expand to Japan, Korea, Germany, France, Spain, Russia, and India after the core English terms look useful.
5. Optional: add Keywords Everywhere later if paid volume/CPC metrics are needed.
