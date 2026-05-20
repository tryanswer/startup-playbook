#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  cleanHtmlText,
  extractArticleText,
  extractCaseSignals,
  isCloudflareChallenge,
  parseArgs,
  readJsonlFile,
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
  const timeoutMs = Number(args.timeout ?? 45000);
  const limit = Number(args.limit ?? Number.POSITIVE_INFINITY);
  const urls = readUrlList(input).map((line) => line.replace(/^url$/, "")).filter(Boolean).slice(0, limit);
  const jsonlPath = path.join(outDir, "cases.jsonl");
  const force = Boolean(args.force);
  const cases = force ? [] : readExistingJsonl(jsonlPath);
  const existingUrls = new Set(cases.map((item) => item.url).filter(Boolean));

  fs.mkdirSync(path.join(outDir, "html"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "text"), { recursive: true });

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    if (!force && existingUrls.has(url)) {
      console.log(`Skipped existing ${index + 1}/${urls.length}: ${url}`);
      continue;
    }
    if (index > 0) await sleep(delayMs);
    try {
      const html = await fetchText(url, { timeoutMs });
      if (isCloudflareChallenge(html)) {
        throw new Error("Cloudflare challenge page");
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
      const row = { ...caseItem, status: "fetched", textLength: text.length, signals };
      delete row.text;
      cases.push(row);
      existingUrls.add(url);

      fs.writeFileSync(path.join(outDir, "html", `${slug}.html`), html, "utf8");
      fs.writeFileSync(path.join(outDir, "text", `${slug}.txt`), text, "utf8");
      writeJsonlFile(jsonlPath, cases);
      console.log(`Fetched ${index + 1}/${urls.length}: ${title}`);
    } catch (error) {
      const row = {
        source: safeHostname(url),
        url,
        title: url,
        status: "failed",
        error: error.message,
        textLength: 0,
        signals: extractCaseSignals({ title: url, text: "" }),
      };
      cases.push(row);
      existingUrls.add(url);
      writeJsonlFile(jsonlPath, cases);
      console.warn(`Failed ${index + 1}/${urls.length}: ${url} (${error.message})`);
    }
  }

  writeJsonlFile(jsonlPath, cases);
  console.log(`Wrote ${jsonlPath}`);
}

async function fetchText(url, { timeoutMs }) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
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

function readExistingJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return readJsonlFile(filePath);
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function printHelp() {
  console.log(`Usage:
  npm run fetch -- --input output/indie-hackers-stories-urls.txt [options]

Options:
  --input <path>       URL list. Default: output/indie-hackers-stories-urls.txt
  --out <dir>          Output directory. Default: output/cases
  --limit <n>          Max URLs to fetch.
  --delay-ms <n>       Delay between requests. Default: 3000
  --timeout <n>        Per-request timeout. Default: 45000
  --force              Ignore existing cases.jsonl and refetch.
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
