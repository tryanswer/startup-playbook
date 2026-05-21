# Topic Pain Miner

Mine public topic discussions into a demand-validation heatmap for early startup decisions.

The first source adapter supports Reddit public JSON endpoints. The tool stores research fields only: title, short excerpt, flair, score, comment count, community, timestamp, and permalink. It does not store usernames, avatars, images, private messages, or face photos.

The fetch script runs Node with `--use-env-proxy`, so local `HTTP_PROXY`, `HTTPS_PROXY`, and `ALL_PROXY` settings are respected when Reddit requires a proxy from your network.

## Beauty Log Example

```bash
npm run fetch -- --config data/beauty-log.reddit.json --output output/beauty-log-posts.json
npm run analyze -- --config data/beauty-log.reddit.json --input output/beauty-log-posts.json --output output/beauty-log-pain-report.md
```

## Generic Use

1. Copy `data/beauty-log.reddit.json`.
2. Replace `project`, `sources`, and `themes`.
3. Run fetch and analyze.
4. Use the report's demand gate before committing product work.

Config shape:

```json
{
  "project": "Example Product",
  "sources": [
    { "type": "reddit", "community": "example", "listing": "top", "time": "month", "limit": 25 },
    { "type": "reddit", "community": "example", "search": "urgent pain", "sort": "relevance", "limit": 25 }
  ],
  "themes": [
    {
      "id": "urgent-pain",
      "label": "Urgent pain",
      "patterns": ["urgent pain", "help", "stuck"],
      "productMoves": ["Turn this pain into the next validation experiment."]
    }
  ]
}
```

## Output

- `*-posts.json`: sanitized public post sample.
- `*-analysis.json`: deterministic heatmap data.
- `*-pain-report.md`: founder-readable demand report and AI deep-analysis prompt.

## Demand Gate

The report checks three questions:

1. Is the pain repeated across the corpus?
2. Are reachable target users present in identifiable communities?
3. Is there purchase intent or alternative-seeking language?

Small samples stay in `validation-needed` even when all three signals are positive.
`continue` means continue to the next validation or product iteration step; it is not proof of paid demand by itself.

## Boundaries

- Use public pages and public JSON only.
- Respect platform rules and rate limits.
- Do not scrape, store, or reuse user photos.
- Do not automate posting, commenting, voting, account creation, or private-message outreach.
