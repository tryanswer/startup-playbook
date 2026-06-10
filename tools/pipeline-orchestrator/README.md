# Pipeline Orchestrator

End-to-end pipeline orchestrator for the Startup Playbook. Automatically routes between stages, transforms data via bridges, and pauses at human decision points.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Human-in-the-Loop                       │
│  Only 3 pause points: discover, validate, business-model │
└──────────────────────┬──────────────────────────────────┘
                       │ --confirm to proceed
┌──────────────────────▼──────────────────────────────────┐
│              Stage Router (stage-router.mjs)             │
│  • Reads playbook.json → determines current stage        │
│  • Reads report.json → gets decision (continue/pivot/kill)│
│  • Resolves next stage via decision + nextStageAction     │
│  • Updates manifest on transition                        │
└──────────────────────┬──────────────────────────────────┘
                       │ calls
┌──────────────────────▼──────────────────────────────────┐
│            Stage Bridges (stage-bridges.mjs)             │
│  • discover → validate                                   │
│  • validate → business-model                             │
│  • business-model → build                                │
│  • build → grow                                          │
│  • grow → operate                                        │
│  • operate → validate (loop-back)                        │
└─────────────────────────────────────────────────────────┘
```

## Commands

```bash
# Show pipeline status
node scripts/run-pipeline.mjs status

# Inspect current stage and next action
node scripts/run-pipeline.mjs inspect
node scripts/run-pipeline.mjs inspect --json

# Advance one stage (pauses at human decision points)
node scripts/run-pipeline.mjs advance --dry-run    # preview
node scripts/run-pipeline.mjs advance --confirm     # execute

# Run pipeline to a target stage
node scripts/run-pipeline.mjs run --to build
node scripts/run-pipeline.mjs run --to operate --confirm

# Audit API credentials
node scripts/run-pipeline.mjs credentials
```

## Human Decision Points

The pipeline automatically pauses at 3 stages where founder judgment is required:

| Stage | Decision | What the founder does |
|-------|----------|----------------------|
| **discover** | Pick candidate | Choose which opportunity to validate from the ranked list |
| **validate** | kill / pivot / continue | Review evidence and decide whether the idea is worth building |
| **business-model** | Confirm pricing | Review AI-recommended pricing model and confirm or adjust |

All other transitions (build → grow → operate) proceed automatically.

## Stage Bridges

Bridges transform `handoff.json` from one stage into `input.json` for the next:

```
discover/handoff.json  →  bridge  →  validate/input.json
validate/handoff.json  →  bridge  →  business-model/input.json
business-model/handoff.json → bridge → build/input.json
build/handoff.json     →  bridge  →  grow/input.json
grow/handoff.json      →  bridge  →  operate/input.json
operate/handoff.json   →  bridge  →  validate/input.json  (loop-back)
```

## Shared Modules

- `tools/_shared/credentials.mjs` — Unified API credential management (.env files)
- `tools/_shared/playbook-io.mjs` — Read/write playbook artifacts (manifest, reports, handoffs)

## Credential Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

Or place credentials in `~/.startup-playbook/.env` for user-level defaults.

## Testing

```bash
node --test tools/pipeline-orchestrator/test-orchestrator.mjs
```
