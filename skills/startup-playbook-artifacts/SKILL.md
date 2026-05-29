---
name: startup-playbook-artifacts
description: Use when a founder or agent needs Startup Playbook outputs saved, exported, rendered, resumed, or turned into project-local playbook artifacts and static HTML.
---

# Startup Playbook Artifacts

Use this skill as the persistence and display layer for Startup Playbook work. Stage skills make the judgment; this skill writes durable artifacts that future Codex or Claude sessions can resume.

## Core Rule

Every conclusion must be traceable to `playbook/evidence.json` or explicitly marked as an assumption or validation gap.

## Workflow

1. Read `references/artifact-protocol.md` before creating or changing artifacts.
2. Create or update a project-local `playbook/` directory.
3. Write valid JSON for:
   - `playbook/playbook.json`
   - `playbook/evidence.json`
   - `playbook/stages/{stage}/input.json`
   - `playbook/stages/{stage}/report.json`
   - `playbook/stages/{stage}/handoff.json`
4. Write Markdown mirrors:
   - `playbook/decision-log.md`
   - `playbook/evidence.md`
   - `playbook/stages/{stage}/report.md`
5. Regenerate `playbook/index.html` as a self-contained static page. Do not require a server, framework, database, or browser file fetch.
6. Verify JSON parses and every `evidenceRefs` value resolves to an item in `playbook/evidence.json`.

## Template Use

Use files in `templates/` as starting points. Replace placeholder values with stage-specific data. If a required value is unknown, keep the key present and set it to `null`, `[]`, or `"unknown"`, then add the gap to `toValidate`.

Do not copy private customer details into committed artifacts. Summarize or redact sensitive evidence, and store only the minimum quote needed for traceability.

## Stage Ownership

- `startup-playbook-advisor`: orchestrates stage order and decides when to persist artifacts.
- Stage skills: produce analysis for `validate`, `business-model`, `build`, `grow`, or `operate`.
- `startup-playbook-artifacts`: owns the file protocol, evidence ledger, Markdown mirrors, and static HTML.

## Required Verification

Before saying artifacts are ready:

- Parse every generated JSON file.
- Confirm `playbook/index.html` contains rendered data, not unresolved template placeholders.
- Confirm `decision-log.md` was appended when a stage decision changed.
- Confirm the next agent can resume from only `playbook/playbook.json`, `playbook/evidence.json`, and the current stage `handoff.json`.
