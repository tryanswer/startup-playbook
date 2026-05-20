# Case Study Skill Miner

Turns founder case studies into reusable startup playbook skills. The goal is not to republish full articles; the goal is to preserve evidence, extract repeatable patterns, and generate concise guidance for future startup agents.

## Pipeline

1. Discover case URLs and metadata.
2. Fetch either a small sample or a full public index with resumable, low-concurrency requests.
3. Extract text and startup signals.
4. Synthesize repeated patterns into `skills/founder-case-patterns/SKILL.md`.
5. Save a readable pattern report under `case-studies/<source>/`.

For JavaScript-rendered guide hubs such as Indie Hackers Starting Up, render the visible guide index first, fetch the linked public resources, then synthesize the guide into a stage-based skill.

## Guardrails

- Respect robots.txt and site terms.
- Do not bypass login, paywalls, Cloudflare, or anti-abuse systems.
- Keep full HTML/text in ignored local `output/`.
- Commit only metadata, pattern summaries, generated skills, and source links.
- Use delay and limits by default.

## Commands

```bash
npm test
```

Discover Indie Hackers stories:

```bash
npm run discover:indie-hackers -- \
  --allow-unknown-robots \
  --limit 50 \
  --out output/indie-hackers-stories
```

Fetch a small sample:

```bash
npm run fetch -- \
  --input output/indie-hackers-stories-urls.txt \
  --limit 5 \
  --delay-ms 3000 \
  --out output/cases
```

Run the full public Indie Hackers stories index:

```bash
npm run discover:indie-hackers -- \
  --allow-unknown-robots \
  --limit 10000 \
  --out output/indie-hackers-stories-full

npm run fetch -- \
  --input output/indie-hackers-stories-full-urls.txt \
  --out output/cases-full \
  --delay-ms 1000 \
  --timeout 30000 \
  --force

npm run synthesize -- \
  --input output/cases-full/cases.jsonl \
  --skill-out ../../skills/founder-case-patterns/SKILL.md \
  --report-out ../../case-studies/indie-hackers/patterns.md
```

Synthesize a skill and report:

```bash
npm run synthesize -- \
  --input output/cases/cases.jsonl \
  --skill-out ../../skills/founder-case-patterns/SKILL.md \
  --report-out ../../case-studies/indie-hackers/patterns.md
```

Render and synthesize the Indie Hackers Starting Up guide:

```bash
npm install
npm run render:starting-up -- \
  --chrome-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --out output/starting-up-guide
npm run synthesize:starting-up -- \
  --input output/starting-up-guide.json \
  --skill-out ../../skills/indie-hackers-starting-up/SKILL.md \
  --report-out ../../case-studies/indie-hackers/starting-up-guide.md
```

Fetch and learn the linked Starting Up resources:

```bash
npm run fetch:starting-up-resources -- \
  --input output/starting-up-guide.json \
  --out output/guide-resources-full \
  --delay-ms 1000 \
  --timeout 30000 \
  --force

npm run synthesize:starting-up-resources -- \
  --guide-input output/starting-up-guide.json \
  --resources-input output/guide-resources-full/guide-resources.jsonl \
  --skill-out ../../skills/indie-hackers-starting-up/SKILL.md \
  --report-out ../../case-studies/indie-hackers/starting-up-guide.md
```

## Current Indie Hackers Coverage

- Stories database snapshot: 499 public case URLs discovered, 498 fetched/readable, 1 historical URL returned 404.
- Starting Up guide snapshot: 80 indexed resources, 78 fetched/readable, 2 Twitter/X resources blocked by fetch.
- Full HTML/text stays in ignored `output/`; committed artifacts are source-linked summaries and skills.

## Output Contract

The synthesized skill should contain:

- repeated acquisition channels;
- repeated validation moves;
- repeated pricing and business model signals;
- source-linked evidence rows;
- conditional application rules for future products.

Guide-hub skills should contain:

- staged startup sequence;
- source resource map;
- practical operating rules;
- pointers into the other startup-playbook skills.
