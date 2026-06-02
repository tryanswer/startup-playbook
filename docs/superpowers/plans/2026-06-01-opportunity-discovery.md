# Opportunity Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `discover` stage and opportunity radar that mines public international community and case signals into preserved idea records connected to the existing Startup Playbook HTML dashboard.

**Architecture:** `tools/opportunity-radar` analyzes normalized inputs, writes latest discover artifacts, and appends immutable run snapshots under `playbook/stages/discover/runs/`. `scripts/render-playbook-index.mjs` builds embedded dashboard JSON from file artifacts and injects it into the existing HTML template without replacing the template shell.

**Tech Stack:** Node.js ESM, `node:test`, file-based JSON artifacts, existing Startup Playbook HTML template.

---

## File Structure

- Create `tools/opportunity-radar/package.json`: package metadata and test/run commands.
- Create `tools/opportunity-radar/README.md`: usage, input schema, output contract.
- Create `tools/opportunity-radar/src/radar.mjs`: normalize posts/cases, detect pain and case signals, score/rank opportunities.
- Create `tools/opportunity-radar/src/artifacts.mjs`: build discover input/report/handoff/Markdown/run snapshots.
- Create `tools/opportunity-radar/scripts/run-radar.mjs`: CLI for input analysis and artifact writing.
- Create `tools/opportunity-radar/test/radar.test.mjs`: TDD coverage for pain-led candidates, case-led candidates, scoring, and unique run paths.
- Create `scripts/render-playbook-index.mjs`: shared static HTML renderer.
- Create `scripts/test/render-playbook-index.test.mjs`: renderer coverage for discover stage and template marker preservation.
- Modify `skills/startup-playbook-artifacts/references/artifact-protocol.md`: add `discover` stage contract.
- Modify `skills/startup-playbook-artifacts/templates/playbook.json`: add `discover` to stage order.
- Modify `skills/startup-playbook-artifacts/templates/index.html`: add discover tab, i18n labels, overview stage order from data, and discover charts.
- Modify `skills/startup-playbook-artifacts/SKILL.md`: mention discover stage preservation and runs.
- Modify `skills/startup-playbook-advisor/SKILL.md`: map `discover` to `opportunity-discovery`.
- Create `skills/opportunity-discovery/SKILL.md`: agent workflow for the new stage.
- Create `playbooks/00-opportunity-discovery/README.md`: manual/operator playbook for idea discovery.
- Update `scripts/validate-startup-artifacts.mjs`: validate discover protocol/template tokens and stage skill.
- Add `playbook/stages/discover/...`: sample latest artifacts and one preserved run.
- Update `playbook/playbook.json`: stage order starts with `discover`.
- Regenerate `playbook/index.html` with the template renderer.

## Task 1: Failing Tests

- [ ] Write `tools/opportunity-radar/test/radar.test.mjs`.
- [ ] Run `cd tools/opportunity-radar && npm test`.
- [ ] Expected result: fail because `src/radar.mjs` and `src/artifacts.mjs` do not exist yet.
- [ ] Write `scripts/test/render-playbook-index.test.mjs`.
- [ ] Run `node --test scripts/test/render-playbook-index.test.mjs`.
- [ ] Expected result: fail because `scripts/render-playbook-index.mjs` does not exist yet.

## Task 2: Radar Core

- [ ] Implement `analyzeOpportunityRadar(input, options)` in `tools/opportunity-radar/src/radar.mjs`.
- [ ] Implement pain signal detection for complaint, alternative seeking, pricing pain, manual workflow, repeated question, integration friction, migration friction, and purchase intent.
- [ ] Implement case signal extraction for user segment, product shape, acquisition channel, pricing/revenue signal, copyable pattern, non-copyable dependency, and clone risk.
- [ ] Implement scoring fields: `painHeat`, `caseProof`, `reachableChannel`, `soloFounderFeasibility`, `speedToValidation`, `cloneRisk`, `moatDependency`, and final `score`.
- [ ] Run `cd tools/opportunity-radar && npm test`.
- [ ] Expected result: radar tests pass.

## Task 3: Artifact Persistence

- [ ] Implement run id and run path helpers that include timestamp plus slug and never reuse a path already present in the target directory.
- [ ] Implement `buildDiscoverArtifacts(analysis, options)` in `src/artifacts.mjs`.
- [ ] Implement Markdown report rendering.
- [ ] Implement `writeDiscoverArtifacts(...)` that writes canonical latest artifacts and appends a historical run JSON.
- [ ] Run `cd tools/opportunity-radar && npm test`.
- [ ] Expected result: artifact persistence tests pass.

## Task 4: HTML Renderer

- [ ] Implement `buildPlaybookDashboardData(playbookDir)` in `scripts/render-playbook-index.mjs`.
- [ ] Implement `renderPlaybookIndex({ playbookDir, templatePath, outputPath })` that replaces only the `#playbook-data` JSON block.
- [ ] Preserve required template markers in rendered HTML.
- [ ] Run `node --test scripts/test/render-playbook-index.test.mjs`.
- [ ] Expected result: renderer tests pass.

## Task 5: Discover Template Integration

- [ ] Update the HTML template to include `discover` tab and six-stage responsive rail.
- [ ] Add discover-specific charts for candidate type mix, top scores, source coverage, and top candidate cards.
- [ ] Make overview stage order derive from `data.stageOrder` when present.
- [ ] Update i18n labels for English and Chinese.
- [ ] Run `node --test scripts/test/render-playbook-index.test.mjs`.
- [ ] Expected result: generated HTML contains `data-stage-tab="discover"` and all required template markers.

## Task 6: Protocol, Skills, And Docs

- [ ] Add discover stage requirements and interface matrix rows to `artifact-protocol.md`.
- [ ] Add `skills/opportunity-discovery/SKILL.md`.
- [ ] Add `playbooks/00-opportunity-discovery/README.md`.
- [ ] Update README tables to include the new stage, skill, and tool.
- [ ] Sync `skills/startup-playbook-artifacts` into `plugins/startup-playbook-advisor/skills/startup-playbook-artifacts`.
- [ ] Run `node scripts/validate-startup-artifacts.mjs`.
- [ ] Expected result: startup artifact validation passes.

## Task 7: Sample Run And Final Verification

- [ ] Add sample opportunity input data or use inline fixture data with the radar CLI.
- [ ] Run `node tools/opportunity-radar/scripts/run-radar.mjs --input <fixture> --playbook-dir playbook --render-index`.
- [ ] Confirm `playbook/stages/discover/runs/` contains a timestamped run file.
- [ ] Confirm latest `playbook/stages/discover/report.json` references the preserved run path.
- [ ] Run `node scripts/render-playbook-index.mjs --playbook-dir playbook`.
- [ ] Run `node scripts/validate-startup-artifacts.mjs`.
- [ ] Run `cd tools/opportunity-radar && npm test`.
- [ ] Run `node --test scripts/test/render-playbook-index.test.mjs`.
- [ ] Confirm `git diff --stat` only shows intended files plus untouched existing IDE metadata remains untracked.
