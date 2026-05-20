# Case Study Skill Miner

Turns founder case studies into reusable startup playbook skills. The goal is not to republish full articles; the goal is to preserve evidence, extract repeatable patterns, and generate concise guidance for future startup agents.

## Pipeline

1. Discover case URLs and metadata.
2. Fetch a small, respectful sample for personal research.
3. Extract text and startup signals.
4. Synthesize repeated patterns into `skills/founder-case-patterns/SKILL.md`.
5. Save a readable pattern report under `case-studies/<source>/`.

For JavaScript-rendered guide hubs such as Indie Hackers Starting Up, render the visible guide index first, then synthesize the index into a stage-based skill.

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
