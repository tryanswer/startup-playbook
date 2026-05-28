export function validateIndieHackersUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid URL: ${value}`);
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname !== "www.indiehackers.com" && hostname !== "indiehackers.com") {
    throw new Error("Expected an Indie Hackers URL.");
  }
  if (!url.pathname.startsWith("/post/")) {
    throw new Error("Expected an Indie Hackers post URL.");
  }
  return url;
}

export function extractCommentIdFromUrl(value) {
  const url = validateIndieHackersUrl(value);
  return url.searchParams.get("commentId");
}

export function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Snapshot must be an object.");
  }
  if (snapshot.source !== "indiehackers") {
    throw new Error("Snapshot source must be indiehackers.");
  }
  validateIndieHackersUrl(snapshot.url);
  if (!snapshot.capturedAt || Number.isNaN(Date.parse(snapshot.capturedAt))) {
    throw new Error("Snapshot capturedAt must be an ISO timestamp.");
  }
  if (!Array.isArray(snapshot.comments) || snapshot.comments.length === 0) {
    throw new Error("No comments found in snapshot.");
  }

  return {
    source: "indiehackers",
    url: snapshot.url,
    capturedAt: snapshot.capturedAt,
    comments: snapshot.comments.map(normalizeComment),
  };
}

export function normalizeComment(comment) {
  if (!comment || typeof comment !== "object") {
    throw new Error("Comment must be an object.");
  }
  for (const key of ["id", "author", "text", "permalink"]) {
    if (!comment[key] || typeof comment[key] !== "string") {
      throw new Error(`Comment is missing string field: ${key}`);
    }
  }
  validateIndieHackersUrl(comment.permalink);

  return {
    id: comment.id,
    author: comment.author,
    text: compactText(comment.text),
    permalink: comment.permalink,
    replyCount: Number(comment.replyCount ?? 0),
    hasOwnReply: Boolean(comment.hasOwnReply),
  };
}

export function compactText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}
