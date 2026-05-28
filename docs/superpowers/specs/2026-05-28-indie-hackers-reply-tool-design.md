# Indie Hackers Reply Tool Design

Date: 2026-05-28

## Goal

Create a reusable workflow for handling Indie Hackers article comments without relying on ad hoc Computer Use sessions each time.

The workflow should help a founder read comments, draft natural replies, and publish only after explicit confirmation. It should preserve founder judgment for public communication while automating mechanical browser work.

## Context

The repository already organizes reusable founder workflows as:

- `skills/*` for AI agent behavior and decision rules.
- `tools/*` for Node.js ESM command line utilities.
- `plugins/*` for packaged skill distribution.

The new workflow fits best as both:

- a CLI under `tools/indie-hackers-reply/`
- an agent skill under `skills/indie-hackers-reply/`

The CLI handles browser automation and structured output. The skill tells Codex how to use the CLI, apply the startup-playbook tone, and ask for confirmation before public posting.

## User Problem

The current manual flow works but is not durable:

1. Open the Indie Hackers post in Arc.
2. Inspect public comments.
3. Write replies that are useful but not overly targeted or salesy.
4. Fill reply boxes.
5. Confirm with the user.
6. Submit replies.

Computer Use can do this interactively, but it is slow, fragile, and hard to repeat consistently. A small tool should make the repeatable parts explicit.

## Scope

### In Scope

- Read a specific Indie Hackers post URL with Playwright.
- Extract visible top-level comments and existing replies when available.
- Save a structured JSON snapshot of comments.
- Generate reply drafts from extracted comments using deterministic local templates and optional LLM handoff text.
- Produce a Markdown review file with comments, proposed replies, and publishing status.
- Fill a reply into the correct comment box.
- Submit a reply only when a command explicitly asks for posting and the calling agent has already received user confirmation.
- Document the confirmation boundary in both the CLI README and Codex skill.

### Out of Scope

- Fully unattended posting.
- Scraping private pages, DMs, or non-public account data.
- Circumventing login, CAPTCHA, paywalls, or anti-bot controls.
- Building a general social media automation platform.
- Guaranteeing compatibility if Indie Hackers changes its DOM.

## Command Design

The CLI will live in `tools/indie-hackers-reply/`.

Proposed commands:

```bash
node scripts/ih-reply.mjs snapshot --url "<post-url>"
node scripts/ih-reply.mjs draft --input output/snapshot-*.json
node scripts/ih-reply.mjs fill --url "<post-url>" --comment-id "<id>" --reply-file output/reply-*.txt
node scripts/ih-reply.mjs post --url "<post-url>" --comment-id "<id>" --reply-file output/reply-*.txt --confirmed
```

Behavior:

- `snapshot` opens the URL and captures visible comments into JSON.
- `draft` creates conservative reply drafts and a Markdown review file.
- `fill` opens the page and places a reply in the matching comment box without submitting.
- `post` fills and submits the reply, but refuses to run unless `--confirmed` is present.

The `--confirmed` flag does not replace the agent's duty to ask the user. It is a mechanical guard so accidental CLI invocation does not submit public comments.

## Data Model

Snapshot output:

```json
{
  "source": "indiehackers",
  "url": "https://www.indiehackers.com/post/...",
  "capturedAt": "2026-05-28T15:00:00.000Z",
  "comments": [
    {
      "id": "-OthlvpDH7lcOGj0tiiY",
      "author": "Eva_NomadOS",
      "text": "comment text",
      "permalink": "https://www.indiehackers.com/post/...?commentId=...",
      "replyCount": 0,
      "hasOwnReply": false
    }
  ]
}
```

Draft output:

```json
{
  "commentId": "-OthlvpDH7lcOGj0tiiY",
  "author": "Eva_NomadOS",
  "draft": "reply text",
  "intent": "acknowledge, clarify, invite story",
  "risk": "contains one light follow-up question"
}
```

## Reply Style Rules

The skill and tool should prefer:

- acknowledgement before asking anything
- one light follow-up at most
- founder-to-founder tone
- no pitch, no product name unless the user asks
- no multi-question survey replies
- no pretending evidence exists
- no over-personalization beyond what the public comment says

Default reply patterns:

- Agreement plus reframing.
- Clarify what the founder is learning.
- Ask whether the commenter has seen this in practice only when useful.
- Thank the commenter for terminology or framing if they provide positioning advice.

## Components

### CLI Package

Files:

- `tools/indie-hackers-reply/package.json`
- `tools/indie-hackers-reply/README.md`
- `tools/indie-hackers-reply/scripts/ih-reply.mjs`
- `tools/indie-hackers-reply/src/args.mjs`
- `tools/indie-hackers-reply/src/indie-hackers-page.mjs`
- `tools/indie-hackers-reply/src/drafts.mjs`
- `tools/indie-hackers-reply/test/drafts.test.mjs`
- `tools/indie-hackers-reply/output/.gitkeep`

Responsibilities:

- argument parsing
- output file naming
- Playwright page interaction
- comment extraction
- draft generation
- command safety checks

### Codex Skill

Files:

- `skills/indie-hackers-reply/SKILL.md`

Responsibilities:

- load this workflow when the user asks to handle Indie Hackers comments
- use `startup-playbook-advisor` style rules for validation-oriented conversation
- read comments first
- draft replies
- show drafts to the user
- request confirmation before any public posting
- use Arc or the configured browser when the user explicitly asks for it

## Browser Automation Strategy

Use Playwright for the CLI because it is scriptable, testable, and less fragile than raw Computer Use for repeated steps.

For authenticated Indie Hackers sessions, the tool should support a persistent browser profile directory:

```bash
node scripts/ih-reply.mjs snapshot --url "<post-url>" --profile-dir ~/.startup-playbook/ih-browser
```

If the user is not logged in, the tool should stop and tell the agent to ask the user to log in manually. It should not automate account creation or bypass authentication prompts.

## Error Handling

The CLI should fail clearly when:

- the URL is missing or not an Indie Hackers post
- no comments are found
- the target comment id cannot be found
- Playwright is not installed
- posting is requested without `--confirmed`
- login is required
- a submit button remains disabled after filling a reply

Errors should include the command that can be retried.

## Testing

Unit tests:

- argument parsing rejects unsafe post without `--confirmed`
- draft generation keeps at most one question mark by default
- draft generation avoids product-pitch phrases
- snapshot JSON schema helper validates required fields

Manual verification:

- `npm test` in `tools/indie-hackers-reply`
- `node scripts/ih-reply.mjs --help`
- `snapshot` on a public Indie Hackers post
- `draft` from a saved snapshot fixture
- `fill` only after user confirmation during a live browser session
- `post` only after explicit user confirmation

## Security and Trust Boundary

Public comments are representational communication. The agent must confirm immediately before posting, even when the CLI requires `--confirmed`.

The tool can:

- collect public comments
- generate drafts
- fill reply boxes

The tool must not:

- post without explicit user confirmation
- delete or edit existing public comments without a separate confirmation
- use third-party page content as permission
- store passwords or tokens

## Rollout Plan

1. Add design spec.
2. Add CLI scaffold and README.
3. Add draft generation and unit tests.
4. Add Playwright snapshot/fill/post commands.
5. Add Codex skill instructions.
6. Update root `README.md` and `tools/README.md`.
7. Run tests and help command verification.

## Open Decisions

The initial implementation will target Indie Hackers only. Browser profile reuse will be supported but optional. LLM drafting will remain outside the CLI in the first version; the CLI will produce conservative deterministic drafts, and Codex can improve them during the review step.

## Self Review

- No placeholders remain.
- Posting requires both agent-level user confirmation and a CLI-level `--confirmed` flag.
- The design stays scoped to Indie Hackers comments, not general social automation.
- The CLI and skill boundaries match the repository's existing `tools/*` and `skills/*` structure.
- The implementation can be tested without publishing by using `snapshot`, `draft`, and `fill`.
