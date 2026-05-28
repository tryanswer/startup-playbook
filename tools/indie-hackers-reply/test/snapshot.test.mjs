import assert from "node:assert/strict";
import test from "node:test";

import { extractCommentIdFromUrl, normalizeSnapshot, validateIndieHackersUrl } from "../src/snapshot.mjs";

test("validateIndieHackersUrl accepts Indie Hackers post URLs", () => {
  const url = validateIndieHackersUrl("https://www.indiehackers.com/post/example?commentId=-abc");

  assert.equal(url.hostname, "www.indiehackers.com");
  assert.equal(url.pathname, "/post/example");
});

test("validateIndieHackersUrl rejects non-Indie-Hackers URLs", () => {
  assert.throws(() => validateIndieHackersUrl("https://example.com/post/x"), /Indie Hackers/);
});

test("extractCommentIdFromUrl returns the focused comment id", () => {
  assert.equal(
    extractCommentIdFromUrl("https://www.indiehackers.com/post/example?commentId=-abc123"),
    "-abc123",
  );
});

test("normalizeSnapshot validates required fields and normalizes comments", () => {
  const snapshot = normalizeSnapshot({
    source: "indiehackers",
    url: "https://www.indiehackers.com/post/example",
    capturedAt: "2026-05-28T15:00:00.000Z",
    comments: [
      {
        id: "-abc",
        author: "maker",
        text: "This is useful.",
        permalink: "https://www.indiehackers.com/post/example?commentId=-abc",
        replyCount: 0,
        hasOwnReply: false
      }
    ]
  });

  assert.equal(snapshot.comments.length, 1);
  assert.equal(snapshot.comments[0].author, "maker");
});

test("normalizeSnapshot rejects snapshots without comments", () => {
  assert.throws(
    () => normalizeSnapshot({
      source: "indiehackers",
      url: "https://www.indiehackers.com/post/example",
      capturedAt: "2026-05-28T15:00:00.000Z",
      comments: []
    }),
    /No comments/,
  );
});
