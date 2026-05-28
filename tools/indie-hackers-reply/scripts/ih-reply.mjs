#!/usr/bin/env node
import path from "node:path";

import { assertCommandSafety, assertRequiredArgs, parseArgs, usage } from "../src/args.mjs";
import { createDrafts, renderReviewMarkdown } from "../src/drafts.mjs";
import { readJson, readText, timestampSlug, writeDraftOutputs, writeJson } from "../src/files.mjs";
import { normalizeSnapshot, validateIndieHackersUrl } from "../src/snapshot.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help" || process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage());
    return;
  }

  assertRequiredArgs(args);
  assertCommandSafety(args);

  if (args.command === "snapshot") {
    validateIndieHackersUrl(args.url);
    const { snapshotPostComments } = await import("../src/indie-hackers-page.mjs");
    const snapshot = normalizeSnapshot(await snapshotPostComments(args));
    const output = path.join(args.outDir, `snapshot-${timestampSlug()}.json`);
    await writeJson(output, snapshot);
    console.log(`wrote ${snapshot.comments.length} comments to ${output}`);
    return;
  }

  if (args.command === "draft") {
    const snapshot = normalizeSnapshot(await readJson(args.input));
    const drafts = createDrafts(snapshot);
    const markdown = renderReviewMarkdown(snapshot, drafts);
    const outputs = await writeDraftOutputs({
      snapshot,
      drafts,
      markdown,
      outDir: args.outDir,
    });
    console.log(`wrote ${drafts.length} drafts to ${outputs.draftJsonPath}`);
    console.log(`wrote review to ${outputs.reviewPath}`);
    for (const reply of outputs.replyFiles) {
      console.log(`wrote reply ${reply.commentId} to ${reply.path}`);
    }
    return;
  }

  if (args.command === "fill") {
    validateIndieHackersUrl(args.url);
    const { fillReply } = await import("../src/indie-hackers-page.mjs");
    const reply = await readText(args.replyFile);
    const result = await fillReply({ ...args, reply });
    console.log(`filled reply for ${result.commentId}; not posted`);
    return;
  }

  if (args.command === "post") {
    validateIndieHackersUrl(args.url);
    const { postReply } = await import("../src/indie-hackers-page.mjs");
    const reply = await readText(args.replyFile);
    const result = await postReply({ ...args, reply });
    console.log(`posted reply for ${result.commentId}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
