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
   - `playbook/stages/discover/runs/*.json` when the stage is `discover`
4. Write Markdown mirrors:
   - `playbook/decision-log.md`
   - `playbook/evidence.md`
   - `playbook/stages/{stage}/report.md`
5. Regenerate `playbook/index.html` as a self-contained static page. Do not require a server, framework, database, or browser file fetch.
6. Verify JSON parses and every `evidenceRefs` value resolves to an item in `playbook/evidence.json`.

## Template Use

Use files in `templates/` as source templates. Replace placeholder values with stage-specific data. If a required value is unknown, keep the key present and set it to `null`, `[]`, or `"unknown"`, then add the gap to `toValidate`.

## HTML Template Contract

`playbook/index.html` must be built from `templates/index.html`. Do not hand-write, summarize, redesign, simplify, or replace the HTML page with a custom report layout.

For HTML generation:

1. Start by copying `templates/index.html` into `playbook/index.html`.
2. Build the embedded dashboard data from `playbook/playbook.json`, `playbook/evidence.json`, and every available `playbook/stages/{stage}/report.json`.
3. Replace only the JSON inside `<script type="application/json" id="playbook-data">...</script>`.
4. Preserve the template shell, CSS, Chart.js bundle, stage tabs, render functions, language toggle, chart containers, and artifact navigation.
5. Do not replace the template with static cards, tables, or a one-stage prose report.

If the current stage has data not represented by the template, add it to the embedded data object using existing template fields first. Only edit template structure when the user explicitly asks for a template redesign.

For the `discover` stage, the latest `input/report/handoff` files may be refreshed, but every mining run must also be preserved under `playbook/stages/discover/runs/` with a timestamped filename. Do not overwrite historical idea records.

After writing `playbook/index.html`, verify the required template markers remain present: `class="stage-rail"`, `data-stage-tab`, `id="stage-panel"`, `function switchStage`, `const stageChartInstances`, and `id="playbook-data"`.

Do not copy private customer details into committed artifacts. Summarize or redact sensitive evidence, and store only the minimum quote needed for traceability.

## Stage Ownership

- `startup-playbook-advisor`: orchestrates stage order and decides when to persist artifacts.
- Stage skills: produce analysis for `validate`, `business-model`, `build`, `grow`, or `operate`.
- `startup-playbook-artifacts`: owns the file protocol, evidence ledger, Markdown mirrors, and static HTML.

## Required Verification

Before saying artifacts are ready:

- Parse every generated JSON file.
- Confirm `playbook/index.html` contains rendered data, not unresolved template placeholders.
- Confirm `playbook/index.html` still contains the required template markers from the HTML Template Contract.
- Confirm `decision-log.md` was appended when a stage decision changed.
- Confirm the next agent can resume from only `playbook/playbook.json`, `playbook/evidence.json`, and the current stage `handoff.json`.
