# Indie Hackers Reply

Capture Indie Hackers comments, draft founder-style replies, and publish only after explicit confirmation.

This tool is for public validation conversations. It automates the mechanical parts of reading comments, preparing replies, and filling reply boxes. It does not remove the founder judgment step before posting.

## Quick Start

```bash
cd tools/indie-hackers-reply
npm install

node scripts/ih-reply.mjs snapshot --url "https://www.indiehackers.com/post/..."
node scripts/ih-reply.mjs draft --input output/snapshot-*.json
```

Review the generated Markdown file and per-comment reply text files in `output/`.

## Commands

```bash
# Capture visible public comments
node scripts/ih-reply.mjs snapshot \
  --url "https://www.indiehackers.com/post/..." \
  --profile-dir ~/.startup-playbook/ih-browser

# Generate conservative reply drafts from a saved snapshot
node scripts/ih-reply.mjs draft \
  --input output/snapshot-2026-05-28T15-00-00-000Z.json

# Fill a reply box without submitting
node scripts/ih-reply.mjs fill \
  --url "https://www.indiehackers.com/post/..." \
  --comment-id "-commentId" \
  --reply-file output/reply-author-commentid.txt \
  --profile-dir ~/.startup-playbook/ih-browser

# Publish after explicit user confirmation
node scripts/ih-reply.mjs post \
  --url "https://www.indiehackers.com/post/..." \
  --comment-id "-commentId" \
  --reply-file output/reply-author-commentid.txt \
  --profile-dir ~/.startup-playbook/ih-browser \
  --confirmed
```

## Authentication

Use `--profile-dir` for a persistent Playwright browser profile. On first use, Indie Hackers may require login. Log in manually in the opened browser. The tool does not create accounts, solve CAPTCHAs, store passwords, or bypass authentication.

## Confirmation Boundary

Public comments are representational communication.

The tool can:

- read public comments
- generate reply drafts
- fill reply boxes

The tool must not:

- post without `--confirmed`
- be used by an agent to post without asking the user immediately before publishing
- delete or edit comments without a separate explicit confirmation

The `--confirmed` flag is a mechanical guard. It does not replace user approval.

## Draft Style

Generated drafts are intentionally conservative:

- acknowledge before asking
- at most one light follow-up question
- no pitch
- no product name by default
- no multi-question survey replies
- no invented demand evidence

Codex can refine the drafts during review, but the same safety rules apply.

## Limitations

- Indie Hackers may change its DOM, which can break browser automation.
- Snapshot extraction is best-effort and works on visible comments.
- Browser commands require the optional `playwright` dependency installed in this tool directory.
- Live posting should only be run after a fresh user confirmation.
