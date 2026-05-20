#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  extractStoryCards,
  isCloudflareChallenge,
  parseArgs,
  writeCsvFile,
  writeJsonFile,
} from "../src/miner-utils.mjs";

const DEFAULT_STORIES_URL = "https://www.indiehackers.com/stories";
const USER_AGENT = "startup-playbook-research-bot/0.1 (+personal research; respectful rate limits)";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const storiesUrl = args.url ?? DEFAULT_STORIES_URL;
  const limit = Number(args.limit ?? 100);
  await checkRobots(storiesUrl, args);

  const html = await fetchText(storiesUrl);
  if (isCloudflareChallenge(html)) {
    throw new Error(`Cloudflare challenge returned for ${storiesUrl}. Use a browser/manual export instead of bypassing it.`);
  }

  const cards = extractStoryCards(html, storiesUrl).slice(0, Number.isFinite(limit) ? limit : 100);
  const outBase = args.out ?? "output/indie-hackers-stories";
  writeJsonFile(`${outBase}.json`, cards);
  writeCsvFile(`${outBase}.csv`, cards, ["source", "title", "author", "revenue", "url"]);
  writeUrlList(`${outBase}-urls.txt`, cards.map((card) => card.url));

  console.log(`Discovered ${cards.length} Indie Hackers case URLs.`);
  console.log(`Wrote ${outBase}.json`);
  console.log(`Wrote ${outBase}.csv`);
  console.log(`Wrote ${outBase}-urls.txt`);
}

async function checkRobots(targetUrl, args) {
  if (args["skip-robots-check"]) return;

  const robotsUrl = new URL("/robots.txt", targetUrl).toString();
  try {
    const text = await fetchText(robotsUrl);
    if (isCloudflareChallenge(text)) {
      if (args["allow-unknown-robots"]) {
        console.warn(`Warning: robots.txt returned a challenge page. Continuing because --allow-unknown-robots was set.`);
        return;
      }
      throw new Error(`robots.txt could not be verified for ${new URL(targetUrl).origin}. Re-run only if you have permission, with --allow-unknown-robots.`);
    }
  } catch (error) {
    if (args["allow-unknown-robots"]) {
      console.warn(`Warning: robots.txt check failed: ${error.message}`);
      return;
    }
    throw error;
  }
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

function writeUrlList(filePath, urls) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${urls.join("\n")}\n`, "utf8");
}

function printHelp() {
  console.log(`Usage:
  npm run discover:indie-hackers -- [options]

Options:
  --url <url>                 Stories database URL. Default: ${DEFAULT_STORIES_URL}
  --limit <n>                 Max URLs to emit. Default: 100
  --out <path-base>           Output base without extension. Default: output/indie-hackers-stories
  --allow-unknown-robots      Continue if robots.txt cannot be verified.
  --skip-robots-check         Skip robots check when using a manually saved HTML source.
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
