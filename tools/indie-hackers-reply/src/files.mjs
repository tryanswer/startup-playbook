import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return filePath;
}

export async function readText(filePath) {
  return readFile(filePath, "utf8");
}

export async function writeText(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data.endsWith("\n") ? data : `${data}\n`, "utf8");
  return filePath;
}

export function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function safeSlug(value) {
  return String(value ?? "item")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}

export async function writeDraftOutputs({ snapshot, drafts, markdown, outDir }) {
  const stamp = timestampSlug();
  const draftJsonPath = path.join(outDir, `drafts-${stamp}.json`);
  const reviewPath = path.join(outDir, `review-${stamp}.md`);
  const replyFiles = [];

  await writeJson(draftJsonPath, {
    source: snapshot.source,
    url: snapshot.url,
    generatedAt: new Date().toISOString(),
    drafts,
  });
  await writeText(reviewPath, markdown);

  for (const draft of drafts) {
    const filePath = path.join(outDir, `reply-${safeSlug(draft.author)}-${safeSlug(draft.commentId)}.txt`);
    await writeText(filePath, draft.draft);
    replyFiles.push({ commentId: draft.commentId, path: filePath });
  }

  return { draftJsonPath, reviewPath, replyFiles };
}
