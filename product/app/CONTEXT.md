# Context — Startup Playbook App

## Domain Glossary

| Term | Definition |
|---|---|
| **Idea** | A startup concept submitted by the user. Exists in the Ideas view during incubation (Validate → Build stages). |
| **Product** | An idea that has completed the Build stage and launched. Lives in the Products view (Grow ↔ Operate cycle). |
| **Project** | The data entity representing either an Idea or Product. Has a `lifecycle` field: `'idea'` or `'product'`. |
| **Stage** | One of five sequential phases: `validate`, `business-model`, `build`, `grow`, `operate`. Each stage has auto tasks, artifacts, a terminal session, and a decision gate. |
| **Auto Task** | A task that runs automatically when a stage starts (e.g., Reddit pain mining, competitor scan). Can be re-triggered from the terminal. |
| **Artifact** | A file produced by a stage (HTML report, JSON data, config). Artifacts from one stage feed the next stage's context. |
| **Decision Gate** | The checkpoint at the end of each stage where the user chooses: continue, pivot, kill, pause, or back. |
| **Validation Score** | 0-100 score computed from Reddit pain rate (40pts), search demand (25pts), and market maturity (20pts). Thresholds: ≥60 continue, 35-59 pivot, <35 kill. |
| **Bridge** | Local WebSocket server that connects the web terminal to CLI tools (codex, claude) running on the user's machine. |
| **Agent Tab** | An independent web terminal session. Multiple tabs can be open simultaneously, each with isolated context. |
| **Context Layer** | The product's core architectural concept: it acts as a Context Provider for AI tools, not an Agent Host. Provides project state, artifacts, and skills to whichever agent is active. |
| **Graduation** | When an idea completes the Build stage and transitions to the Products view. The `lifecycle` field changes from `'idea'` to `'product'`. |
| **Stage View** | The UI for working within a single stage: left panel (tasks + artifacts + decision gate) and right panel (report viewer or agent terminal). |
| **Pipeline View** | The horizontal stage progression indicator showing status of all five stages for a project. |

## Architecture Decisions

### ADR-001: localStorage for State (Prototype)

All project state is stored in `localStorage`. No server database. This is intentional for the prototype to eliminate auth and deployment complexity. Will migrate to Supabase in V0.2+.

### ADR-002: Context Provider, Not Agent Host

The product does not replace Claude Code, Codex, or Cursor. It provides structured startup context (CONTEXT.md, AGENTS.md, artifacts) that makes these tools more effective. Heavy development happens in the user's local tool; the product syncs progress back.

### ADR-003: PTY via script(1), Not node-pty

The Bridge Server uses `script -q /dev/null` to wrap CLI commands in a pseudo-TTY on macOS, instead of the `node-pty` native addon. This avoids native compilation issues and keeps the bridge zero-dependency beyond `ws`.

### ADR-004: Single Stage UI Pattern

All five stages share the same Stage View component, configured differently per stage. This minimizes UI surface area and ensures consistency. The only difference between stages is: which auto tasks run, which skills load, and which artifacts are produced.
