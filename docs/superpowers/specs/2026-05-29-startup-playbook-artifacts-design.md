# Startup Playbook Artifacts Skill Design

## Summary

Startup Playbook 1.0 should not depend on the current `product/app` web product. The primary workflow is:

1. The founder works in Codex CLI or Claude Code CLI inside a product repo.
2. Startup Playbook skills guide validation, business model, build, growth, and operations decisions.
3. A dedicated artifact skill writes those decisions into a local `playbook/` directory.
4. `playbook/index.html` gives the founder a static, readable project dashboard.

The product UI can remain as a future prototype, but it is not the 1.0 delivery surface.

## Problem

The existing product direction grew into a platform: Next.js app, local state, bridge server, web terminal, stage runner, artifact APIs, and future auth/database concerns. That is too much for the current validated workflow.

The actual user behavior is simpler:

- The founder already uses Codex or Claude Code as the working interface.
- The agent already has the right context through repository files and skills.
- The missing piece is a durable, structured output that can be resumed, reviewed, reused, and shown.

Without a standard artifact contract, each session produces useful prose but weak continuity. Decisions, evidence, assumptions, and next steps are easy to lose.

## Goals

- Create a new skill named `startup-playbook-artifacts`.
- Make Codex / Claude write consistent `playbook/` artifacts in any startup project.
- Make the artifacts useful without a server, database, login, build process, or web terminal.
- Preserve enough context for future agent sessions to resume work.
- Give founders a visual page for stage status, evidence, decisions, risks, and next actions.

## Non-Goals

- Do not build or maintain a SaaS dashboard for 1.0.
- Do not require Next.js, Supabase, Vercel, WebSocket bridge, or embedded terminal.
- Do not automate all startup stages from a UI.
- Do not make the artifact skill responsible for market research, validation judgment, or growth strategy. Existing stage skills do that.
- Do not delete `product/` as part of the first implementation. Mark it as future/prototype after the artifact workflow is in place.

## Proposed Skill

Path:

```text
skills/startup-playbook-artifacts/SKILL.md
```

Trigger:

Use when a founder wants Startup Playbook outputs saved as project-local artifacts, static HTML reports, stage summaries, decision logs, evidence records, or resumable context for Codex / Claude.

Responsibilities:

- Create or update a project-local `playbook/` directory.
- Write machine-readable JSON for project and stage state.
- Write human-readable Markdown for evidence and decisions.
- Generate or refresh a self-contained `index.html`.
- Keep every conclusion traceable to evidence or explicitly marked as an assumption.
- Keep the artifact shape stable so other skills can write into it.

The skill is an output and persistence layer. It should be used by `startup-playbook-advisor` and stage-specific skills after they finish analysis.

## Artifact Directory

Each startup project should get this directory:

```text
playbook/
  index.html
  playbook.json
  decision-log.md
  evidence.md
  README.md
  stages/
    validate/
      report.json
      report.md
    business-model/
      report.json
      report.md
    build/
      report.json
      report.md
    grow/
      report.json
      report.md
    operate/
      report.json
      report.md
```

Optional later directories:

```text
playbook/
  assets/
  snapshots/
  interviews/
  adr/
```

## Data Model

### `playbook/playbook.json`

```json
{
  "version": "1.0",
  "project": {
    "id": "silent-business-state-drift",
    "name": "Silent Business State Drift Monitor",
    "oneLine": "Catch silent business-state drift before finance or ops finds it manually.",
    "targetUser": "Finance/payment ops and engineering teams in transaction-heavy systems",
    "createdAt": "2026-05-29T00:00:00.000Z",
    "updatedAt": "2026-05-29T00:00:00.000Z"
  },
  "currentStage": "validate",
  "stageOrder": ["validate", "business-model", "build", "grow", "operate"],
  "stages": {
    "validate": {
      "status": "waiting_decision",
      "decision": "continue",
      "score": 72,
      "updatedAt": "2026-05-29T00:00:00.000Z",
      "reportPath": "stages/validate/report.json"
    }
  },
  "latestDecision": {
    "stage": "validate",
    "decision": "continue",
    "reasoning": "Multiple commenters gave concrete recurring examples of silent drift and manual checks."
  }
}
```

### Stage `report.json`

```json
{
  "version": "1.0",
  "stage": "validate",
  "status": "waiting_decision",
  "score": 72,
  "decision": "continue",
  "reasoning": "Multiple concrete cases show recurring operational pain and manual workaround cost.",
  "known": [
    "Indie Hackers post reached homepage visibility and received concrete comments from founders/operators.",
    "One commenter described refund_pending plus active_premium state drift discovered weeks later during Stripe payout reconciliation."
  ],
  "assumed": [
    "Finance/payment ops may feel the pain before engineering sees a clean ticket."
  ],
  "toValidate": [
    "Who owns budget for prevention: engineering, finance ops, or operations?"
  ],
  "evidence": [
    {
      "type": "comment",
      "source": "Indie Hackers",
      "link": "https://www.indiehackers.com/post/...",
      "quote": "Everything looks green until finance or support spots the mismatch.",
      "strength": "strong",
      "notes": "Concrete current-workaround signal."
    }
  ],
  "concerns": [
    "False positives may make operations teams ignore alerts.",
    "The first user and buyer may be different roles."
  ],
  "nextSteps": [
    "Collect five sanitized drift cases.",
    "Extract hand-written invariant candidates from past incidents.",
    "Test whether finance/payment ops or engineering gives sharper buying signals."
  ],
  "generatedAt": "2026-05-29T00:00:00.000Z"
}
```

## Markdown Outputs

### `decision-log.md`

Append-only decision history. Each entry must include:

- timestamp
- stage
- decision: continue / pivot / kill / pause
- reasoning
- evidence used
- assumptions
- what would change the decision

### `evidence.md`

Evidence table grouped by source. Each evidence item must include:

- source and link
- short quote or summary
- evidence strength: weak / medium / strong / strongest
- related stage
- interpretation
- limits or caveats

### Stage `report.md`

Founder-readable narrative for that stage:

- snapshot
- gate decision
- known / assumed / to validate
- evidence table
- risks and stop conditions
- next 7 days

## Static HTML

`playbook/index.html` should be self-contained and open directly in a browser. It should not require a build step.

Content sections:

- project summary
- stage pipeline
- current decision
- evidence strength
- known / assumed / to validate
- latest risks and stop conditions
- next actions
- links to Markdown and JSON files

The HTML can be regenerated every time a stage report changes. It should read from embedded data or be fully rendered from the current JSON files. The first implementation can write fully rendered HTML to avoid browser file-fetch restrictions.

## Integration With Existing Skills

`startup-playbook-advisor` should call this skill when the user asks to save, export, render, document, or persist a startup decision.

Stage skills should produce their normal analysis first, then use the artifact skill to persist it:

| Stage | Primary skill | Artifact path |
| --- | --- | --- |
| Validate | `idea-validation` / `reddit-demand-validation` | `playbook/stages/validate/report.json` |
| Business Model | `business-model-design` | `playbook/stages/business-model/report.json` |
| Build | `product-development-loop` | `playbook/stages/build/report.json` |
| Grow | `seo-aso-growth-research` | `playbook/stages/grow/report.json` |
| Operate | operations review skills/manual analysis | `playbook/stages/operate/report.json` |

## Product Directory Policy

For 1.0, `product/` is not required.

Recommended follow-up after the artifact skill exists:

- Update `product/README.md` to mark it as future product prototype.
- Update repository README to make `playbook/` artifact generation the recommended 1.0 workflow.
- Keep `product/app/ARTIFACT-SPEC.md` as historical input or migrate its useful schema into the new skill.
- Do not delete `product/` until the new artifact workflow is working and committed.

## Error Handling

The artifact skill should:

- create missing directories;
- update existing files without deleting unrelated founder notes;
- refuse to overwrite a non-playbook directory with conflicting files;
- keep `decision-log.md` append-only unless the user explicitly asks to edit history;
- mark missing evidence as `assumed` or `toValidate`, not as fact;
- use ISO timestamps for all generated records.

## Verification

Minimum implementation checks:

- A sample project can generate `playbook/index.html`.
- `playbook.json` is valid JSON.
- Each generated stage `report.json` is valid JSON and includes required fields.
- `decision-log.md` appends a new entry on stage decision.
- `index.html` opens directly from disk and shows the latest stage status.
- Existing tool tests still pass where relevant.

## Open Questions

1. Should the first implementation include a deterministic renderer script, or should the skill instruct the agent to write HTML directly?
2. Should the artifact schema live only in the skill, or also in a reusable `templates/` directory?
3. Should generated `playbook/` directories be committed in target product repos by default, or treated as local working artifacts unless the user chooses to commit?

## Recommendation

Start with a new `startup-playbook-artifacts` skill plus small templates. Avoid scripts unless direct HTML generation becomes inconsistent. The goal is to test the artifact workflow with the least platform surface area.
