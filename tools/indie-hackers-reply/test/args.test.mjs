import assert from "node:assert/strict";
import test from "node:test";

import { assertCommandSafety, parseArgs, usage } from "../src/args.mjs";

test("parseArgs parses snapshot command with URL and profile directory", () => {
  const args = parseArgs([
    "snapshot",
    "--url",
    "https://www.indiehackers.com/post/example",
    "--profile-dir",
    ".browser",
  ]);

  assert.equal(args.command, "snapshot");
  assert.equal(args.url, "https://www.indiehackers.com/post/example");
  assert.equal(args.profileDir, ".browser");
});

test("parseArgs parses draft command with input", () => {
  const args = parseArgs(["draft", "--input", "output/snapshot.json"]);

  assert.equal(args.command, "draft");
  assert.equal(args.input, "output/snapshot.json");
});

test("parseArgs parses fill command with comment id and reply file", () => {
  const args = parseArgs([
    "fill",
    "--url",
    "https://www.indiehackers.com/post/example",
    "--comment-id",
    "-comment123",
    "--reply-file",
    "output/reply.txt",
  ]);

  assert.equal(args.command, "fill");
  assert.equal(args.commentId, "-comment123");
  assert.equal(args.replyFile, "output/reply.txt");
});

test("assertCommandSafety rejects post without explicit confirmation flag", () => {
  const args = parseArgs([
    "post",
    "--url",
    "https://www.indiehackers.com/post/example",
    "--comment-id",
    "-comment123",
    "--reply-file",
    "output/reply.txt",
  ]);

  assert.throws(() => assertCommandSafety(args), /--confirmed/);
});

test("assertCommandSafety accepts post with explicit confirmation flag", () => {
  const args = parseArgs([
    "post",
    "--url",
    "https://www.indiehackers.com/post/example",
    "--comment-id",
    "-comment123",
    "--reply-file",
    "output/reply.txt",
    "--confirmed",
  ]);

  assert.doesNotThrow(() => assertCommandSafety(args));
});

test("usage documents public posting confirmation", () => {
  assert.match(usage(), /--confirmed/);
  assert.match(usage(), /public comment/i);
});

test("parseArgs accepts top-level help flags", () => {
  assert.equal(parseArgs(["--help"]).command, "help");
  assert.equal(parseArgs(["-h"]).command, "help");
});
