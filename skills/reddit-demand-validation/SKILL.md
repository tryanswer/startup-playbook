---
name: reddit-demand-validation
description: Use when validating startup or feature demand from Reddit, forums, or public community posts before building, especially to judge whether pain is real, frequent, reachable, or has buying intent.
---

# Reddit Demand Validation

Use this skill before building a product, feature, landing page, or growth campaign from community chatter. Treat Reddit and forum posts as demand evidence, not market proof.

## Core Rule

Do not equate attention with demand. Upvotes, comments, and viral posts show salience. Demand needs repeated pain, a reachable user segment, and buying or alternative-seeking behavior.

## Required Evidence Buckets

- `known`: public post links, titles, short excerpts, communities, dates, flairs, scores, and comments.
- `assumed`: inferred user segment, urgency, willingness to pay, and product fit.
- `to validate`: payment intent, repeat frequency outside one community, and whether the user will switch from current workaround.

## Workflow

1. Narrow the topic to one user group, situation, and painful decision.
2. Use `tools/topic-pain-miner` when this repository is available. For visual review, generate both Markdown and HTML heatmap outputs.
3. Collect public posts only. Do not scrape private messages, user profiles, photos, or identity fields.
4. Cluster posts by pain theme and preserve short user-language evidence with source links.
5. Apply the three demand gates:
   - Is the pain repeated, not a one-off viral thread?
   - Are target users reachable in named communities or search surfaces?
   - Is there buying, workaround, recommendation, tool-switching, or alternative-seeking language?
6. Decide `kill`, `pivot`, `validation-needed`, or `continue`. Treat `continue` as permission for the next validation or product iteration step, not proof that users will pay.
7. Convert the strongest pain into the next smallest experiment: landing page, paid audit, concierge service, waitlist, manual analysis, or interview script.

## Tool Commands

```bash
cd tools/topic-pain-miner
npm run fetch -- --config data/beauty-log.reddit.json --output output/beauty-log-posts.json
npm run analyze -- --config data/beauty-log.reddit.json --input output/beauty-log-posts.json --output output/beauty-log-pain-report.md
```

For color diagnosis or Beauty Log research, produce a complete evidence package:

```bash
cd tools/topic-pain-miner
npm run fetch -- --config data/beauty-log.reddit.json --output output/beauty-log-posts.json
npm run analyze:beauty-log
```

When `OPENAI_API_KEY` is available and the user asks for an LLM summary, run:

```bash
npm run analyze -- \
  --config data/beauty-log.reddit.json \
  --input output/beauty-log-posts.json \
  --output output/beauty-log-pain-report.md \
  --html-output output/beauty-log-heatmap.html \
  --llm \
  --llm-output output/beauty-log-llm-summary.md
```

For a new idea, copy the config and change `project`, `sources`, `themes`, and `thresholds`.

## HTML And LLM Output

- Use `--html-output` to generate a self-contained heatmap page with demand gate, pain cluster bars, evidence links, product moves, and community coverage.
- Use `--llm-prompt-output` when no API key is available or when the user wants to paste the prompt into another model manually.
- Use `--llm` only when the environment has `OPENAI_API_KEY`; optional overrides are `--llm-model` and `--llm-base-url`.
- Treat LLM output as synthesis of the heatmap, not new evidence. If the LLM says something not grounded in the aggregated posts, remove or label it as an assumption.

## Demand Interpretation

| Signal | Strong | Weak |
| --- | --- | --- |
| Frequency | Same pain appears across many posts or communities | One viral post |
| Specificity | User asks for a concrete decision or fix | Generic interest or entertainment |
| Reachability | Clear subreddit/forum/search surface | Vague audience |
| Buying intent | Mentions products, budget, alternatives, paid help, switching | Likes, comments, compliments |
| Urgency | User faces regret, loss, deadline, or repeated failed workaround | Casual curiosity |

## Required Output

- Topic and narrowed segment.
- Demand gate decision.
- Pain heatmap with counts and source-linked evidence.
- HTML heatmap page path when generated.
- LLM summary or LLM prompt path when requested.
- What is known, assumed, and still unvalidated.
- Product iteration implications.
- Landing-page or concierge validation angle.
- Stop conditions for killing or pivoting.

## Safety Boundaries

- Use public content and low request frequency.
- Store links, short excerpts, and derived labels instead of full raw threads.
- Do not store or reuse photos, faces, usernames, avatars, or private data.
- Do not automate posting, commenting, voting, account creation, or direct outreach.
