# Opportunity Radar

Mine public international community and case signals into Startup Playbook `discover` artifacts.

The tool produces two candidate types:

- `pain-led`: repeated public community pain such as pricing complaints, manual workflows, alternative seeking, integration friction, migration friction, repeated questions, and purchase-intent language.
- `case-led`: public success cases with copyable wedges, channels, pricing, validation moves, or workflows.

## Usage

```bash
npm run radar -- \
  --input data/sample-international-radar.json \
  --playbook-dir ../../playbook \
  --project-id ai-ecommerce-image-optimizer \
  --render-index
```

## Automatic Sources

The `sources` array can fetch these channels directly:

| Type | Output bucket | Notes |
| --- | --- | --- |
| `reddit` | `communities` | Public subreddit listing or search JSON |
| `hacker-news` | `communities` | HN Algolia story search |
| `show-hn` | `communities` | HN Algolia `show_hn` search |
| `github` | `cases` | GitHub repository search API; pass `--github-token` or `GITHUB_TOKEN` for higher rate limits |
| `indie-hackers` | `cases` | Indie Hackers public stories HTML, best-effort parsing |
| `product-hunt` | `cases` | Product Hunt GraphQL when `apiToken`, `--product-hunt-token`, or `PRODUCT_HUNT_TOKEN` is present; otherwise public search HTML, best-effort parsing |

## Input Shape

```json
{
  "project": "Weekly International Opportunity Radar",
  "generatedAt": "2026-06-01T08:00:00.000Z",
  "sources": [
    { "type": "reddit", "community": "SaaS", "search": "zapier alternative", "limit": 25 },
    { "type": "hacker-news", "query": "manual workflow automation", "limit": 20 },
    { "type": "show-hn", "query": "invoice workflow", "limit": 20 },
    { "type": "github", "query": "invoice generator", "minStars": 50, "limit": 20 },
    { "type": "indie-hackers", "query": "invoice", "limit": 20 },
    { "type": "product-hunt", "query": "invoice", "featured": true, "limit": 20 }
  ],
  "communities": [
    {
      "id": "reddit:example",
      "source": "reddit",
      "community": "r/SaaS",
      "title": "Tool is too expensive",
      "excerpt": "We manually keep a spreadsheet and need an alternative.",
      "score": 42,
      "comments": 12,
      "url": "https://example.com/thread"
    }
  ],
  "cases": [
    {
      "id": "case:example",
      "source": "github",
      "title": "Open-source tool grew through GitHub and SEO",
      "targetUser": "freelancers",
      "pain": "repeatable workflow pain",
      "productShape": "template-backed SaaS",
      "firstAcquisitionChannel": "GitHub README and SEO",
      "pricing": "$9/mo",
      "revenue": "$5k MRR",
      "validationMove": "free tool to paid hosted workflow",
      "copyable": ["open-source lead magnet"],
      "notCopyable": ["repository age"]
    }
  ]
}
```

When `sources` is present, the CLI fetches the configured live channels, merges community posts into `communities`, and merges GitHub, Indie Hackers, and Product Hunt records into `cases`.
If a supported live channel fails because of network timeout, rate limiting, or blocking, the run continues with the other channels and records the failure under `sourceErrors` in the discover input/report.

For Product Hunt API mode, pass a source-level `apiToken`, CLI token, or environment variable:

```bash
PRODUCT_HUNT_TOKEN="..." npm run radar -- --input data/sample-live-sources.json

npm run radar -- --input data/sample-live-sources.json --product-hunt-token "$PRODUCT_HUNT_TOKEN"
```

Product Hunt API mode uses the supported `posts` filters: `featured`, `postedBefore`, `postedAfter`, `topic`, `order`, `twitterUrl`, `url`, `after`, `before`, `first`, and `last`.
The `query` field is only used by the public HTML fallback because the GraphQL `posts` field does not support keyword search.

## Output

The latest discover files are refreshed:

```text
playbook/stages/discover/input.json
playbook/stages/discover/report.json
playbook/stages/discover/handoff.json
playbook/stages/discover/report.md
```

Every run is preserved:

```text
playbook/stages/discover/runs/YYYY-MM-DDTHH-mm-ss-run-slug.json
```

Discovery output is not validation. Send the top candidate into `idea-validation` before building.
