# Indie Hackers Reply Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Indie Hackers comment workflow that captures comments, drafts natural founder replies, and only posts after explicit confirmation.

**Architecture:** Add a standalone Node.js ESM CLI under `tools/indie-hackers-reply/`, with pure modules for argument parsing, snapshot validation, and reply drafting, plus a Playwright-backed page module that is loaded only for browser commands. Add a Codex skill that tells the agent how to use the CLI and preserve the public-posting confirmation boundary.

**Tech Stack:** Node.js >=20, `node --test`, optional `playwright`, Markdown docs, Codex skill files.

---

## File Structure

- Create `tools/indie-hackers-reply/package.json`: tool metadata, scripts, optional Playwright dependency.
- Create `tools/indie-hackers-reply/README.md`: usage, confirmation policy, commands, limitations.
- Create `tools/indie-hackers-reply/scripts/ih-reply.mjs`: CLI entrypoint and command dispatch.
- Create `tools/indie-hackers-reply/src/args.mjs`: parse arguments, validate commands, require `--confirmed` for `post`.
- Create `tools/indie-hackers-reply/src/files.mjs`: JSON/text output helpers and safe output names.
- Create `tools/indie-hackers-reply/src/drafts.mjs`: deterministic conservative reply drafts and review Markdown.
- Create `tools/indie-hackers-reply/src/snapshot.mjs`: validate and normalize snapshot schema.
- Create `tools/indie-hackers-reply/src/indie-hackers-page.mjs`: Playwright page operations for snapshot, fill, and post.
- Create `tools/indie-hackers-reply/test/*.test.mjs`: unit coverage for args, drafts, and snapshot schema.
- Create `tools/indie-hackers-reply/output/.gitkeep`: keep output directory.
- Create `skills/indie-hackers-reply/SKILL.md`: agent workflow and safety rules.
- Modify `README.md`: list new skill and tool.
- Modify `tools/README.md`: list new CLI tool.

## Tasks

### Task 1: CLI Contract Tests

**Files:**
- Create: `tools/indie-hackers-reply/test/args.test.mjs`
- Create: `tools/indie-hackers-reply/src/args.mjs`
- Create: `tools/indie-hackers-reply/package.json`

- [ ] Write tests proving `parseArgs` accepts `snapshot`, `draft`, `fill`, and rejects `post` without `--confirmed`.
- [ ] Run `npm test` in `tools/indie-hackers-reply` and confirm tests fail because modules are missing.
- [ ] Implement `parseArgs`, `usage`, and `assertCommandSafety`.
- [ ] Re-run `npm test` and confirm the args tests pass.

### Task 2: Snapshot and Draft Tests

**Files:**
- Create: `tools/indie-hackers-reply/test/drafts.test.mjs`
- Create: `tools/indie-hackers-reply/test/snapshot.test.mjs`
- Create: `tools/indie-hackers-reply/src/drafts.mjs`
- Create: `tools/indie-hackers-reply/src/snapshot.mjs`

- [ ] Write tests for snapshot validation requiring `source`, `url`, `capturedAt`, and `comments`.
- [ ] Write tests proving generated drafts contain at most one question mark and avoid pitch phrases.
- [ ] Run tests and confirm they fail before implementation.
- [ ] Implement deterministic draft generation and review Markdown rendering.
- [ ] Re-run tests and confirm they pass.

### Task 3: CLI Entry Point and File IO

**Files:**
- Create: `tools/indie-hackers-reply/scripts/ih-reply.mjs`
- Create: `tools/indie-hackers-reply/src/files.mjs`
- Create: `tools/indie-hackers-reply/output/.gitkeep`

- [ ] Add `--help` output and command dispatch for `snapshot`, `draft`, `fill`, and `post`.
- [ ] Implement `draft` using saved snapshot JSON.
- [ ] Verify `node scripts/ih-reply.mjs --help`.
- [ ] Verify `node scripts/ih-reply.mjs draft --input <fixture>` writes JSON, Markdown, and per-comment text files.

### Task 4: Playwright Page Automation

**Files:**
- Create: `tools/indie-hackers-reply/src/indie-hackers-page.mjs`
- Modify: `tools/indie-hackers-reply/scripts/ih-reply.mjs`

- [ ] Implement lazy Playwright import so unit tests do not require browser installation.
- [ ] Implement `snapshotPostComments` with a persistent profile option.
- [ ] Implement `fillReply` to open a comment permalink, click reply if needed, and fill the reply textarea.
- [ ] Implement `postReply` to call `fillReply`, click submit, and wait for the reply text to appear.
- [ ] Fail with clear errors for missing Playwright, invalid URL, missing comment id, disabled submit, and likely login requirement.

### Task 5: Skill and Docs

**Files:**
- Create: `skills/indie-hackers-reply/SKILL.md`
- Modify: `README.md`
- Modify: `tools/README.md`
- Create: `tools/indie-hackers-reply/README.md`

- [ ] Document the exact workflow: snapshot, draft, user review, fill, confirm, post.
- [ ] Document that public posting requires explicit user confirmation even if `--confirmed` is passed.
- [ ] Add the tool and skill to repository indexes.

### Task 6: Verification

**Commands:**

```bash
cd tools/indie-hackers-reply
npm test
node scripts/ih-reply.mjs --help
node scripts/ih-reply.mjs draft --input test/fixtures/sample-snapshot.json
```

- [ ] Confirm all unit tests pass.
- [ ] Confirm help output prints usage and commands.
- [ ] Confirm draft command writes files under `output/`.
- [ ] Do not run live `post` without a fresh user confirmation.

## Self Review

- The plan covers every in-scope spec item except a live post, which intentionally requires separate confirmation.
- Browser automation is isolated from pure logic, so tests can run without Playwright browsers.
- The tool refuses unsafe posting through both CLI validation and skill instructions.
- The implementation follows the repository's existing Node ESM tool pattern.
