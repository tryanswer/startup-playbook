#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  chunk,
  extractCookieHeader,
  groupBy,
  parseArgs,
  parseJsonishGooglePayload,
  readCsvFile,
  reexecWithProxyIfNeeded,
  selectKeywordRows,
  timestamp,
  writeCsvFile,
  writeJsonFile,
} from "../src/seo-utils.mjs";

const DEFAULT_INPUT = "data/color-diagnosis-keywords.csv";
const DEFAULT_TIME = "today 12-m";
const DEFAULT_HL = "en-US";
const TRENDS_BASE = "https://trends.google.com/trends/api";
const USER_AGENT = "Mozilla/5.0";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  reexecWithProxyIfNeeded(args, new URL(import.meta.url).pathname);
  if (args.help) {
    printHelp();
    return;
  }

  const input = args.input ?? DEFAULT_INPUT;
  const outputBase = args.out ?? `output/google-trends-${timestamp()}`;
  const time = String(args.time ?? DEFAULT_TIME);
  const hl = String(args.hl ?? DEFAULT_HL);
  const batchSize = Math.min(Number(args["batch-size"] ?? 5), 5);
  const delayMs = Number(args["delay-ms"] ?? 1000);
  const retries = Number(args.retries ?? 2);
  const retryDelayMs = Number(args["retry-delay-ms"] ?? 10000);
  const transport = resolveTransport(args);
  const curlState = transport === "curl" ? createCurlState(args) : null;
  const includeRelated = !args["no-related"];
  const requestOptions = { retries, retryDelayMs };
  const rows = selectKeywordRows(readCsvFile(input), args);
  if (rows.length === 0) {
    throw new Error("No keywords matched the provided filters.");
  }

  const cookie = await fetchTrendsCookie(hl, transport, curlState);
  const grouped = groupBy(rows, (row) => `${row.country || ""}:${row.language || ""}:${row.group || ""}`);
  const timelineRows = [];
  const relatedRows = [];
  const rawPayloads = [];

  for (const [key, seedRows] of grouped.entries()) {
    const [country] = key.split(":");
    for (const batchRows of chunk(seedRows, batchSize)) {
      await sleep(delayMs);
      const keywords = batchRows.map((row) => row.keyword);
      let explore;
      try {
        explore = await fetchExplore({ keywords, country, time, hl, cookie, transport, curlState, requestOptions });
      } catch (error) {
        console.warn(`Skipping ${country} ${keywords.join(", ")}: ${error.message}`);
        continue;
      }
      rawPayloads.push({ type: "explore", country, keywords, payload: explore });

      const timeseriesWidget = explore.widgets?.find((widget) => widget.id === "TIMESERIES");
      if (timeseriesWidget) {
        await sleep(delayMs);
        try {
          const timeseries = await fetchWidget("widgetdata/multiline", timeseriesWidget, hl, cookie, transport, curlState, requestOptions);
          rawPayloads.push({ type: "timeseries", country, keywords, payload: timeseries });
          timelineRows.push(...toTimelineRows(timeseries, batchRows, country));
        } catch (error) {
          console.warn(`Skipping timeseries for ${country} ${keywords.join(", ")}: ${error.message}`);
        }
      }

      const relatedWidget = includeRelated ? explore.widgets?.find((widget) => widget.id === "RELATED_QUERIES") : null;
      if (relatedWidget) {
        await sleep(delayMs);
        try {
          const related = await fetchWidget("widgetdata/relatedsearches", relatedWidget, hl, cookie, transport, curlState, requestOptions);
          rawPayloads.push({ type: "related", country, keywords, payload: related });
          relatedRows.push(...toRelatedRows(related, batchRows, country));
        } catch (error) {
          console.warn(`Skipping related queries for ${country} ${keywords.join(", ")}: ${error.message}`);
        }
      }
    }
  }

  writeCsvFile(`${outputBase}-timeseries.csv`, timelineRows, [
    "group",
    "market",
    "country",
    "language",
    "keyword",
    "date",
    "value",
    "is_partial",
  ]);
  writeCsvFile(`${outputBase}-related.csv`, relatedRows, [
    "group",
    "market",
    "country",
    "language",
    "keyword",
    "query",
    "value",
    "link",
    "query_type",
  ]);
  writeJsonFile(`${outputBase}.raw.json`, {
    generated_at: new Date().toISOString(),
    input,
    time,
    hl,
    rawPayloads,
  });

  console.log(`Wrote ${timelineRows.length} trend timeline rows to ${outputBase}-timeseries.csv`);
  console.log(`Wrote ${relatedRows.length} related query rows to ${outputBase}-related.csv`);
  console.log(`Wrote raw Google Trends payloads to ${outputBase}.raw.json`);
}

async function fetchTrendsCookie(hl, transport, curlState) {
  if (transport === "curl") {
    fetchCurlText(`https://trends.google.com/trends/?hl=${encodeURIComponent(hl)}`, curlState);
    return "";
  }

  const response = await fetch(`https://trends.google.com/trends/?hl=${encodeURIComponent(hl)}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  const headers = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : response.headers.get("set-cookie");
  return extractCookieHeader(headers);
}

async function fetchExplore({ keywords, country, time, hl, cookie, transport, curlState, requestOptions }) {
  const req = {
    comparisonItem: keywords.map((keyword) => ({
      keyword,
      geo: country.toUpperCase(),
      time,
    })),
    category: 0,
    property: "",
  };
  const url = `${TRENDS_BASE}/explore?hl=${encodeURIComponent(hl)}&tz=-480&req=${encodeURIComponent(JSON.stringify(req))}`;
  return fetchTrendsJson(url, cookie, transport, curlState, requestOptions);
}

async function fetchWidget(path, widget, hl, cookie, transport, curlState, requestOptions) {
  const url = `${TRENDS_BASE}/${path}?hl=${encodeURIComponent(hl)}&tz=-480&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${encodeURIComponent(widget.token)}`;
  return fetchTrendsJson(url, cookie, transport, curlState, requestOptions);
}

async function fetchTrendsJson(url, cookie, transport, curlState, options = {}) {
  const retries = Math.max(0, Number(options.retries ?? 0));
  const retryDelayMs = Math.max(0, Number(options.retryDelayMs ?? 0));
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchTrendsJsonOnce(url, cookie, transport, curlState);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
      }
    }
  }
  throw lastError;
}

async function fetchTrendsJsonOnce(url, cookie, transport, curlState) {
  if (transport === "curl") {
    return parseJsonishGooglePayload(fetchCurlText(url, curlState));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Google Trends request failed (${response.status}): ${text.slice(0, 300)}`);
    }
    return parseJsonishGooglePayload(text);
  } finally {
    clearTimeout(timeout);
  }
}

function fetchCurlText(url, curlState) {
  const args = [
    "-sS",
    "-L",
    "--compressed",
    "--connect-timeout",
    "20",
    "--max-time",
    "60",
    "-A",
    USER_AGENT,
    "-b",
    curlState.cookieJar,
    "-c",
    curlState.cookieJar,
  ];
  if (curlState.proxy) {
    args.push("-x", curlState.proxy);
  }
  args.push("-w", "\n__HTTP_STATUS__:%{http_code}");
  args.push(url);

  const output = execFileSync("curl", args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const marker = "\n__HTTP_STATUS__:";
  const markerIndex = output.lastIndexOf(marker);
  const body = markerIndex >= 0 ? output.slice(0, markerIndex) : output;
  const status = markerIndex >= 0 ? Number(output.slice(markerIndex + marker.length).trim()) : 200;
  if (status < 200 || status >= 300) {
    throw new Error(`Google Trends curl request failed (${status}) for ${new URL(url).pathname}: ${body.slice(0, 300)}`);
  }
  return body;
}

function createCurlState(args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "beauty-log-trends-"));
  return {
    cookieJar: path.join(dir, "cookies.txt"),
    proxy: args.proxy || process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY || "",
  };
}

function resolveTransport(args) {
  if (args.transport) return String(args.transport);
  if (args.proxy || process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY) {
    return "curl";
  }
  return "fetch";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function toTimelineRows(payload, seedRows, country) {
  const timeline = payload.default?.timelineData ?? [];
  const rows = [];
  for (const point of timeline) {
    seedRows.forEach((seedRow, index) => {
      rows.push({
        group: seedRow.group,
        market: seedRow.market,
        country,
        language: seedRow.language,
        keyword: seedRow.keyword,
        date: point.formattedTime ?? point.time ?? "",
        value: point.value?.[index] ?? "",
        is_partial: point.isPartial ? "true" : "false",
      });
    });
  }
  return rows;
}

function toRelatedRows(payload, seedRows, country) {
  const rankedLists = payload.default?.rankedList ?? [];
  const rows = [];
  rankedLists.forEach((list, keywordIndex) => {
    const seedRow = seedRows[keywordIndex];
    if (!seedRow) return;
    for (const query of list.rankedKeyword ?? []) {
      rows.push({
        group: seedRow.group,
        market: seedRow.market,
        country,
        language: seedRow.language,
        keyword: seedRow.keyword,
        query: query.query ?? "",
        value: query.value ?? "",
        link: query.link ?? "",
        query_type: list.rankedKeyword?.[0]?.link ? "top_or_rising" : "",
      });
    }
  });
  return rows;
}

function printHelp() {
  console.log(`Usage:
  node scripts/google-trends.mjs [options]

Options:
  --input <path>          Keyword seed CSV. Default: data/color-diagnosis-keywords.csv
  --out <path-base>       Output base path without extension. Default: output/google-trends-<timestamp>
  --country us,jp         Filter countries.
  --market global,jp      Filter markets.
  --group core,hair       Filter keyword groups.
  --language en,ja        Filter languages.
  --intent diagnosis      Filter intents.
  --limit 20              Limit selected rows.
  --batch-size 5          Google Trends supports max 5 compared terms.
  --time "today 12-m"     Google Trends time window.
  --hl en-US              Google Trends locale.
  --proxy <url>           HTTP proxy, for example http://127.0.0.1:26001.
  --delay-ms 1000         Delay between Google Trends requests.
  --retries 2             Retry failed Google Trends requests.
  --retry-delay-ms 10000  Base retry delay; later retries use multiples of this value.
  --transport fetch|curl  Request transport. Default: curl when proxy is detected, otherwise fetch.
  --no-related            Skip related query requests; useful when Google limits widget endpoints.
`);
}

main().catch((error) => {
  if (error.name === "AbortError") {
    console.error("Google Trends request timed out. Retry on a network that can reach trends.google.com.");
  } else if (error.message === "fetch failed") {
    console.error("Google Trends request failed before a response was received. Retry on a network that can reach trends.google.com.");
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});
