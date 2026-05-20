#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  cleanHtmlText,
  extractArticleText,
  extractCaseSignals,
  isCloudflareChallenge,
  parseArgs,
  readUrlList,
  slugify,
  writeJsonlFile,
} from "../src/miner-utils.mjs";

const USER_AGENT = "startup-playbook-research-bot/0.1 (+personal research; respectful rate limits)";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const input = args.input ?? "output/indie-hackers-stories-urls.txt";
  const outDir = args.out ?? "output/cases";
  const delayMs = Number(args["delay-ms"] ?? 3000);
  const limit = Number(args.limit ?? Number.POSITIVE_INFINITY);
  const urls = readUrlList(input).map((line) => line.replace(/^url$/, "")).filter(Boolean).slice(0, limit);
  const cases = [];

  fs.mkdirSync(path.join(outDir, "html"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "text"), { recursive: true });

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    if (index > 0) await sleep(delayMs);
    const html = await fetchText(url);
    if (isCloudflareChallenge(html)) {
      console.warn(`Skipping Cloudflare challenge page: ${url}`);
      continue;
    }

    const slug = slugify(url);
    const text = extractArticleText(html) || cleanHtmlText(html);
    const title = extractTitle(html) || url;
    const caseItem = {
      source: new URL(url).hostname,
      url,
      title,
      text,
    };
    const signals = extractCaseSignals(caseItem);
    cases.push({ ...caseItem, textLength: text.length, signals });

    fs.writeFileSync(path.join(outDir, "html", `${slug}.html`), html, "utf8");
    fs.writeFileSync(path.join(outDir, "text", `${slug}.txt`), text, "utf8");
    console.log(`Fetched ${index + 1}/${urls.length}: ${title}`);
  }

  writeJsonlFile(path.join(outDir, "cases.jsonl"), cases.map(({ text, ...item }) => item));
  console.log(`Wrote ${path.join(outDir, "cases.jsonl")}`);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

function extractTitle(html) {
  return cleanHtmlText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHelp() {
  console.log(`Usage:
  npm run fetch -- --input output/indie-hackers-stories-urls.txt [options]

Options:
  --input <path>       URL list. Default: output/indie-hackers-stories-urls.txt
  --out <dir>          Output directory. Default: output/cases
  --limit <n>          Max URLs to fetch.
  --delay-ms <n>       Delay between requests. Default: 3000
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
