#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { analyzePain, renderPainReport } from "../src/pain-miner.mjs";

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

async function writeText(filePath, text) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error("Usage: node scripts/analyze-topic.mjs --input output/posts.json [--config data/beauty-log.reddit.json] [--output output/report.md]");
  }

  const input = await readJson(args.input);
  const config = args.config ? await readJson(args.config) : {};
  const output = args.output ?? args.report ?? args.input.replace(/\.json$/i, "-pain-report.md");
  const analysisOutput = args["analysis-output"] ?? args.input.replace(/\.json$/i, "-analysis.json");
  const analysis = analyzePain(input.posts ?? input, {
    project: config.project ?? input.project,
    themes: config.themes,
    thresholds: config.thresholds,
  });

  await writeText(output, renderPainReport(analysis));
  await writeText(analysisOutput, `${JSON.stringify(analysis, null, 2)}\n`);
  console.log(`wrote report to ${output}`);
  console.log(`wrote analysis to ${analysisOutput}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
