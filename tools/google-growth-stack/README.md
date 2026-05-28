# Google Growth Stack

CLI tools for GA4 tracking setup, UTM URL building, Google Search Console data export, and weekly growth reports. Designed for indie founders targeting international markets through the Google ecosystem.

## Prerequisites

Run the dependency checker first:

```bash
cd tools/google-growth-stack
npm run check-deps
```

This will verify and optionally auto-install:

- **Node.js >= 20**
- **gcloud CLI** (for Google API auth)
- **gcloud auth** (application-default login)

Use `--auto-install` to skip confirmation prompts:

```bash
npm run check-deps -- --auto-install
```

## Setup

```bash
cd tools/google-growth-stack
npm install
```

Optional: create `config.json` for default settings:

```json
{
  "ga4PropertyId": "properties/123456789",
  "searchConsoleSiteUrl": "https://yourapp.com"
}
```

## Commands

### check-deps

Check and auto-install system dependencies.

```bash
npm run check-deps
```

### generate-gtag

Generate GA4 tracking code (HTML snippet + JS helper module) with all AARRR events pre-defined.

```bash
npm run generate-gtag -- --measurement-id G-XXXXXXXXXX
```

Outputs:
- `output/gtag-snippet.html` — paste into `<head>`
- `output/ga4-tracking.mjs` — import and call tracking functions

### build-utm

Build UTM-tagged URLs with naming convention validation.

```bash
# Single URL
npm run build-utm -- --base https://yourapp.com --source reddit --medium community --campaign launch_may

# Batch from JSON
npm run build-utm -- --batch data/utm-batch.json --output output/utm-urls.md
```

### pull-search-console

Export Google Search Console data to Markdown with opportunity analysis.

```bash
npm run pull-search-console -- --site https://yourapp.com --days 7 --output output/search-console.md
```

Highlights:
- 🔴 High impressions + low CTR queries (optimize snippet)
- 🟡 Position 5-15 queries (easiest to push to page 1)
- Country breakdown

### weekly-report

Generate a combined GA4 + Search Console weekly report.

```bash
npm run weekly-report -- --config config.json
```

Outputs a Markdown file with:
- GA4 overview (users, sessions, engagement) with week-over-week comparison
- Key events breakdown (sign_up, first_value_delivered, purchase, etc.)
- Search Console top queries with CTR and position
- Decision template (continue / adjust / stop)
