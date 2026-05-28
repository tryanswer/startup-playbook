import { compactText, normalizeSnapshot } from "./snapshot.mjs";

const pitchPhrases = [
  "book a call",
  "limited offer",
  "sign up",
  "try my product",
];

export function createDrafts(rawSnapshot) {
  const snapshot = normalizeSnapshot(rawSnapshot);
  return snapshot.comments
    .filter((comment) => !comment.hasOwnReply)
    .map((comment) => {
      const draft = buildDraft(comment);
      return {
        commentId: comment.id,
        author: comment.author,
        permalink: comment.permalink,
        draft,
        intent: classifyIntent(comment.text),
        risk: draft.includes("?") ? "contains one light follow-up question" : "no direct ask",
      };
    });
}

export function renderReviewMarkdown(rawSnapshot, drafts) {
  const snapshot = normalizeSnapshot(rawSnapshot);
  const draftById = new Map(drafts.map((draft) => [draft.commentId, draft]));
  const sections = snapshot.comments.map((comment, index) => {
    const draft = draftById.get(comment.id);
    return [
      `## ${index + 1}. ${comment.author}`,
      "",
      `Permalink: ${comment.permalink}`,
      "",
      "Comment:",
      "",
      blockquote(comment.text),
      "",
      "Draft:",
      "",
      draft ? blockquote(draft.draft) : "> Already replied or skipped.",
      "",
      `Status: ${draft ? "drafted, not posted" : "skipped"}`,
    ].join("\n");
  });

  return [
    "# Indie Hackers Reply Review",
    "",
    `Source: ${snapshot.url}`,
    `Captured: ${snapshot.capturedAt}`,
    "",
    "Public posting still requires explicit user confirmation before running `post --confirmed`.",
    "",
    ...sections,
    "",
  ].join("\n");
}

function buildDraft(comment) {
  const text = compactText(comment.text);
  const lower = text.toLowerCase();
  let draft;

  if (lower.includes("data quality") || lower.includes("invariant") || lower.includes("position")) {
    draft = [
      "This framing is useful. I agree that generic data quality is too broad, and business invariant monitoring is closer to the problem I’m trying to describe.",
      "",
      "I’m trying to keep the validation evidence-driven for now: real examples of silent business-state drift, how teams catch it today, and whether the pain is frequent enough to deserve its own workflow.",
    ].join("\n");
  } else if (lower.includes("refund") || lower.includes("reconciliation") || lower.includes("settlement") || lower.includes("payment")) {
    draft = [
      "That matches the direction I’m trying to test. The pain feels much sharper when it shows up as refunds, settlement, reconciliation, or access states drifting quietly.",
      "",
      "I’m still trying to separate one-off incidents from recurring operational pain. Have you seen this happen in a real system, or is it mainly a risk you watch for while building?",
    ].join("\n");
  } else if (lower.includes("shipping fast") || lower.includes("validation problem") || lower.includes("business actually works")) {
    draft = [
      "That’s a concise way to put it. Shipping faster is improving, but knowing whether the business still works is a different layer of confidence.",
      "",
      "I’m still testing whether teams feel this pain often enough to want a dedicated workflow, or whether most people just handle it with SQL, dashboards, and manual checks after something looks wrong.",
    ].join("\n");
  } else {
    draft = [
      "Thanks, this helps sharpen the problem.",
      "",
      "I’m trying to keep the discussion grounded in real incidents and current workarounds rather than polishing the product idea too early.",
    ].join("\n");
  }

  return removePitchPhrases(limitQuestions(draft));
}

function classifyIntent(text) {
  const lower = text.toLowerCase();
  if (lower.includes("data quality") || lower.includes("invariant") || lower.includes("position")) {
    return "acknowledge framing, keep evidence-driven";
  }
  if (lower.includes("refund") || lower.includes("payment") || lower.includes("reconciliation")) {
    return "acknowledge operational pain, invite one concrete story";
  }
  return "acknowledge, clarify validation focus";
}

function limitQuestions(text) {
  const parts = text.split("?");
  if (parts.length <= 2) return text;
  return `${parts[0]}?${parts.slice(1).join(".").replace(/\s+/g, " ")}`;
}

function removePitchPhrases(text) {
  let result = text;
  for (const phrase of pitchPhrases) {
    result = result.replace(new RegExp(escapeRegExp(phrase), "ig"), "");
  }
  return result.replace(/[ \t]+\n/g, "\n").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function blockquote(text) {
  return compactText(text)
    .split(/\n+/)
    .map((line) => `> ${line}`)
    .join("\n");
}
