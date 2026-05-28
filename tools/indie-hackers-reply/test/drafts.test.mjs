import assert from "node:assert/strict";
import test from "node:test";

import { createDrafts, renderReviewMarkdown } from "../src/drafts.mjs";

const snapshot = {
  source: "indiehackers",
  url: "https://www.indiehackers.com/post/example",
  capturedAt: "2026-05-28T15:00:00.000Z",
  comments: [
    {
      id: "-one",
      author: "founder_a",
      text: "The validation problem is real. Shipping fast is solved, knowing if the business actually works is not.",
      permalink: "https://www.indiehackers.com/post/example?commentId=-one",
      replyCount: 0,
      hasOwnReply: false
    },
    {
      id: "-two",
      author: "ops_builder",
      text: "Refunds and reconciliation are the sharpest use case. Generic data quality is too broad.",
      permalink: "https://www.indiehackers.com/post/example?commentId=-two",
      replyCount: 1,
      hasOwnReply: false
    }
  ]
};

test("createDrafts creates one conservative draft per unreplied comment", () => {
  const drafts = createDrafts(snapshot);

  assert.equal(drafts.length, 2);
  assert.equal(drafts[0].commentId, "-one");
  assert.match(drafts[0].draft, /shipping fast/i);
  assert.match(drafts[0].intent, /acknowledge/);
});

test("createDrafts keeps drafts low pressure with at most one question", () => {
  const drafts = createDrafts(snapshot);

  for (const draft of drafts) {
    const questionMarks = (draft.draft.match(/\?/g) ?? []).length;
    assert.ok(questionMarks <= 1, draft.draft);
  }
});

test("createDrafts avoids pitch and sales phrases", () => {
  const drafts = createDrafts(snapshot);
  const text = drafts.map((draft) => draft.draft).join("\n").toLowerCase();

  assert.doesNotMatch(text, /try my product/);
  assert.doesNotMatch(text, /book a call/);
  assert.doesNotMatch(text, /sign up/);
  assert.doesNotMatch(text, /limited offer/);
});

test("renderReviewMarkdown includes comments, drafts, and safety status", () => {
  const drafts = createDrafts(snapshot);
  const markdown = renderReviewMarkdown(snapshot, drafts);

  assert.match(markdown, /^# Indie Hackers Reply Review/m);
  assert.match(markdown, /founder_a/);
  assert.match(markdown, /Public posting still requires explicit user confirmation/);
  assert.match(markdown, /commentId=-one/);
});
