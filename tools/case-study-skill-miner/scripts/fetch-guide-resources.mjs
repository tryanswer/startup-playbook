#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  cleanHtmlText,
  extractArticleText,
  extractGuideResourceSignals,
  isCloudflareChallenge,
  parseArgs,
  readJsonlFile,
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

  const input = args.input ?? "output/starting-up-guide.json";
  const outDir = args.out ?? "output/guide-resources";
  const delayMs = Number(args["delay-ms"] ?? 3000);
  const timeoutMs = Number(args.timeout ?? 45000);
  const limit = Number(args.limit ?? Number.POSITIVE_INFINITY);
  const force = Boolean(args.force);
  const guide = JSON.parse(fs.readFileSync(input, "utf8"));
  const resources = flattenGuideResources(guide).slice(0, limit);
  const jsonlPath = path.join(outDir, "guide-resources.jsonl");
  const rows = force ? [] : readExistingJsonl(jsonlPath);
  const existingUrls = new Set(rows.map((item) => item.url).filter(Boolean));

  fs.mkdirSync(path.join(outDir, "html"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "text"), { recursive: true });

  for (let index = 0; index < resources.length; index += 1) {
    const resource = resources[index];
    if (!force && existingUrls.has(resource.url)) {
      console.log(`Skipped existing ${index + 1}/${resources.length}: ${resource.url}`);
      continue;
    }
    if (index > 0) await sleep(delayMs);

    try {
      const { body, contentType, finalUrl } = await fetchText(resource.url, { timeoutMs });
      if (isCloudflareChallenge(body)) {
        throw new Error("Cloudflare challenge page");
      }
      if (!/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType || "text/html")) {
        throw new Error(`unsupported content-type: ${contentType || "unknown"}`);
      }

      const slug = slugify(`${resource.section}-${resource.title}-${resource.url}`);
      const text = extractArticleText(body) || cleanHtmlText(body);
      const title = extractTitle(body) || resource.title;
      const row = {
        section: resource.section,
        title,
        listedTitle: resource.title,
        author: resource.author,
        url: resource.url,
        finalUrl,
        source: safeHostname(finalUrl || resource.url),
        status: "fetched",
        contentType,
        textLength: text.length,
        signals: extractGuideResourceSignals({ ...resource, title, text }),
      };

      rows.push(row);
      existingUrls.add(resource.url);
      fs.writeFileSync(path.join(outDir, "html", `${slug}.html`), body, "utf8");
      fs.writeFileSync(path.join(outDir, "text", `${slug}.txt`), text, "utf8");
      writeJsonlFile(jsonlPath, rows);
      console.log(`Fetched ${index + 1}/${resources.length}: ${title}`);
    } catch (error) {
      const row = {
        section: resource.section,
        title: resource.title,
        listedTitle: resource.title,
        author: resource.author,
        url: resource.url,
        source: safeHostname(resource.url),
        status: "failed",
        error: error.message,
        textLength: 0,
        signals: extractGuideResourceSignals(resource),
      };
      rows.push(row);
      existingUrls.add(resource.url);
      writeJsonlFile(jsonlPath, rows);
      console.warn(`Failed ${index + 1}/${resources.length}: ${resource.url} (${error.message})`);
    }
  }

  writeJsonlFile(jsonlPath, rows);
  console.log(`Wrote ${jsonlPath}`);
}

function flattenGuideResources(guide) {
  return (guide.sections ?? []).flatMap((section) => (section.resources ?? []).map((resource) => ({
    section: section.name,
    title: resource.title,
    author: resource.author,
    url: resource.url,
  })));
}

async function fetchText(url, { timeoutMs }) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": USER_AGENT,
      "accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return {
    body: await response.text(),
    contentType: response.headers.get("content-type") ?? "",
    finalUrl: response.url,
  };
}

function extractTitle(html) {
  return cleanHtmlText(String(html ?? "").match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHelp() {
  console.log(`Usage:
  npm run fetch:starting-up-resources -- --input output/starting-up-guide.json [options]

Options:
  --input <path>       Rendered guide JSON. Default: output/starting-up-guide.json
  --out <dir>          Output directory. Default: output/guide-resources
  --limit <n>          Max resources to fetch.
  --delay-ms <n>       Delay between requests. Default: 3000
  --timeout <n>        Per-request timeout. Default: 45000
  --force              Ignore existing guide-resources.jsonl and refetch.
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
