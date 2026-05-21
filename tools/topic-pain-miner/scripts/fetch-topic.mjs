#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { fetchRedditSource } from "../src/reddit-source.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const name = token.slice(2);
    const value = argv[index + 1]?.startsWith("--") ? true : argv[index + 1] ?? true;
    if (value !== true) index += 1;
    args[name] = value;
  }
  return args;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function dedupePosts(posts) {
  const seen = new Set();
  const result = [];
  for (const post of posts) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    result.push(post);
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config) {
    throw new Error("Usage: node scripts/fetch-topic.mjs --config data/beauty-log.reddit.json [--output output/posts.json]");
  }

  const config = await readJson(args.config);
  const output = args.output ?? `output/${config.project?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "topic"}-posts.json`;
  const redditSources = (config.sources ?? []).filter((source) => source.type === "reddit");
  const posts = [];

  for (const source of redditSources) {
    const fetched = await fetchRedditSource(source, { userAgent: args["user-agent"] });
    posts.push(...fetched);
    await new Promise((resolve) => setTimeout(resolve, Number(args.delay ?? 750)));
  }

  const payload = {
    project: config.project ?? "Topic",
    generatedAt: new Date().toISOString(),
    sourceCount: redditSources.length,
    posts: dedupePosts(posts),
  };

  await writeJson(output, payload);
  console.log(`wrote ${payload.posts.length} posts to ${output}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
