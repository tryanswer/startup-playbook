#!/usr/bin/env node
import { createRequire } from "node:module";

import {
  extractGuideSections,
  parseArgs,
  writeCsvFile,
  writeJsonFile,
  writeTextFile,
} from "../src/miner-utils.mjs";

const DEFAULT_URL = "https://www.indiehackers.com/starting-up";
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USER_AGENT = "startup-playbook-research-bot/0.1 (+personal research; respectful rate limits)";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const { chromium } = loadPlaywright();
  const url = args.url ?? DEFAULT_URL;
  const outBase = args.out ?? "output/starting-up-guide";
  const chromePath = args["chrome-path"] ?? process.env.PLAYWRIGHT_CHROME_PATH ?? DEFAULT_CHROME_PATH;
  const browser = await chromium.launch({
    headless: true,
    ...(chromePath ? { executablePath: chromePath } : {}),
  });

  try {
    const page = await browser.newPage({ userAgent: USER_AGENT });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: Number(args.timeout ?? 45000) });
    await page.waitForFunction(() => document.body?.innerText?.includes("Guide to Starting Up"), null, {
      timeout: Number(args["guide-timeout"] ?? 30000),
    });
    await page.waitForTimeout(Number(args["wait-ms"] ?? 1000));
    const title = await page.title();
    const text = await page.locator("body").innerText({ timeout: 10000 });
    const links = await page.$$eval("a[href]", (anchors) => anchors
      .map((anchor) => ({ text: (anchor.innerText || "").trim(), href: anchor.href }))
      .filter((item) => item.text || item.href));
    const sections = extractGuideSections(text, links);

    writeTextFile(`${outBase}.txt`, text);
    writeJsonFile(`${outBase}.json`, { sourceUrl: url, title, sections, links });
    writeCsvFile(`${outBase}-resources.csv`, sections.flatMap((section) => section.resources.map((resource) => ({
      section: section.name,
      title: resource.title,
      author: resource.author,
      url: resource.url,
    }))), ["section", "title", "author", "url"]);

    console.log(`Rendered ${url}`);
    console.log(`Extracted ${sections.length} sections and ${sections.reduce((total, section) => total + section.resources.length, 0)} resources.`);
    console.log(`Wrote ${outBase}.json`);
    console.log(`Wrote ${outBase}.txt`);
    console.log(`Wrote ${outBase}-resources.csv`);
  } finally {
    await browser.close();
  }
}

function loadPlaywright() {
  try {
    const require = createRequire(import.meta.url);
    return require("playwright");
  } catch (error) {
    throw new Error(`Playwright is required for rendering JS guide pages. Run "npm install" in this tool directory, or use "NODE_PATH=/path/to/node_modules node scripts/render-starting-up.mjs". Original error: ${error.message}`);
  }
}

function printHelp() {
  console.log(`Usage:
  npm run render:starting-up -- [options]

Options:
  --url <url>             Guide URL. Default: ${DEFAULT_URL}
  --out <path-base>       Output base without extension. Default: output/starting-up-guide
  --chrome-path <path>    Browser executable path. Default: ${DEFAULT_CHROME_PATH}
  --wait-ms <n>           Extra wait after DOMContentLoaded. Default: 3000
  --guide-timeout <n>     Timeout while waiting for Guide to Starting Up text. Default: 30000
  --timeout <n>           Navigation timeout. Default: 45000
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
