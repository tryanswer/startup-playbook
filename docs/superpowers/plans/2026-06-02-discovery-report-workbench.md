# Discovery Report Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the generated discovery HTML report into a richer Chinese research workbench for source health, opportunity ranking, evidence, public cases, and a seven-day validation plan.

**Architecture:** Keep the existing single-file dashboard template and Chart.js shell. Derive richer Discover-stage view data inside `scripts/render-playbook-index.mjs` from the existing `analysis` object, then render it in `skills/startup-playbook-artifacts/templates/index.html`; sync the same template into the plugin copy.

**Tech Stack:** Node.js ESM, `node:test`, static HTML/CSS/JavaScript, Chart.js.

---

### Task 1: Renderer Contract

**Files:**
- Modify: `scripts/test/render-playbook-index.test.mjs`
- Modify: `scripts/render-playbook-index.mjs`

- [ ] **Step 1: Write the failing test**

Add discover fixture data for `sourceCoverage`, `sourceErrors`, candidate evidence, `communitySignals`, and `caseSignals`. Assert that `buildPlaybookDashboardData()` exposes `runSummary`, `sourceErrors`, `evidenceMatrix`, `caseLibrary`, and a 7-day `validationPlan`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/test/render-playbook-index.test.mjs`

Expected: FAIL because the new fields are not present.

- [ ] **Step 3: Write minimal implementation**

Add pure helper functions in `scripts/render-playbook-index.mjs`:

```js
function buildDiscoverRunSummary(analysis, stage) { /* derive counts and generatedAt */ }
function buildDiscoverEvidenceMatrix(candidates, communitySignals) { /* flatten evidence */ }
function buildDiscoverCaseLibrary(caseSignals) { /* group GitHub and Product Hunt cases */ }
function buildDiscoverValidationPlan(stage) { /* seven concrete validation days */ }
```

Wire those helpers into the `discover` branch of `normalizeStage()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/test/render-playbook-index.test.mjs`

Expected: PASS.

### Task 2: HTML Workbench

**Files:**
- Modify: `scripts/test/render-playbook-index.test.mjs`
- Modify: `skills/startup-playbook-artifacts/templates/index.html`

- [ ] **Step 1: Extend render assertion**

Assert the generated HTML contains the new workbench markers and case text:

```js
assert.match(html, /discover-workbench/);
assert.match(html, /public-case-library/);
assert.match(html, /Mina Meeting Assistant/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/test/render-playbook-index.test.mjs`

Expected: FAIL because the template has not rendered these sections.

- [ ] **Step 3: Implement template sections**

Add CSS and helper functions for:

```js
sourceHealthCards(stage)
opportunityRankTable(stage)
evidenceMatrixCards(stage)
caseLibraryCards(stage)
validationPlanRows(stage)
```

Append them inside `chartsDiscover(stage)` after the existing top-candidate detail.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/test/render-playbook-index.test.mjs`

Expected: PASS.

### Task 3: Regenerate And Verify

**Files:**
- Modify: `playbook/index.html`
- Modify: `plugins/startup-playbook-advisor/skills/startup-playbook-artifacts/templates/index.html`

- [ ] **Step 1: Sync plugin template**

Run: `rsync -a --delete skills/startup-playbook-artifacts/ plugins/startup-playbook-advisor/skills/startup-playbook-artifacts/`

- [ ] **Step 2: Regenerate report**

Run: `node scripts/render-playbook-index.mjs --playbook-dir playbook`

- [ ] **Step 3: Verify commands**

Run:

```bash
node --test scripts/test/render-playbook-index.test.mjs
npm test --prefix tools/opportunity-radar
node scripts/validate-startup-artifacts.mjs
node scripts/validate-startup-advisor.mjs
node --check scripts/render-playbook-index.mjs
git diff --check
```

- [ ] **Step 4: Browser check**

Open `playbook/index.html` with Playwright, check Chinese default text, no console errors, no horizontal overflow on desktop/mobile, and visible sections for public cases and the 7-day validation plan.
