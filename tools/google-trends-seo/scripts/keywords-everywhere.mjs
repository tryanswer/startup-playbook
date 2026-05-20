#!/usr/bin/env node
import {
  chunk,
  groupBy,
  parseArgs,
  readCsvFile,
  reexecWithProxyIfNeeded,
  selectKeywordRows,
  timestamp,
  toNumber,
  writeCsvFile,
  writeJsonFile,
} from "../src/seo-utils.mjs";

const API_BASE = "https://api.keywordseverywhere.com/v1";
const DEFAULT_INPUT = "data/color-diagnosis-keywords.csv";
const DEFAULT_BATCH_SIZE = 50;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  reexecWithProxyIfNeeded(args, new URL(import.meta.url).pathname);
  if (args.help) {
    printHelp();
    return;
  }

  const input = args.input ?? DEFAULT_INPUT;
  const outputBase = args.out ?? `output/keywords-everywhere-${timestamp()}`;
  const dryRun = Boolean(args["dry-run"]);
  const batchSize = Number(args["batch-size"] ?? DEFAULT_BATCH_SIZE);
  const currency = String(args.currency ?? "usd").toLowerCase();
  const dataSource = String(args["data-source"] ?? "gkp");
  const apiKey = process.env.KEYWORDS_EVERYWHERE_API_KEY;

  const rows = selectKeywordRows(readCsvFile(input), args);
  if (rows.length === 0) {
    throw new Error("No keywords matched the provided filters.");
  }

  const grouped = groupBy(rows, (row) => row.country || "us");
  const plannedCredits = rows.length;

  if (dryRun) {
    printPlan(grouped, plannedCredits, batchSize);
    return;
  }

  if (!apiKey) {
    throw new Error("Missing KEYWORDS_EVERYWHERE_API_KEY. Export it in your shell before running this script.");
  }

  const credits = await fetchCredits(apiKey);
  if (credits < plannedCredits) {
    throw new Error(`Insufficient Keywords Everywhere credits: have ${credits}, need ${plannedCredits}.`);
  }

  const resultRows = [];
  const rawResponses = [];

  for (const [country, countryRows] of grouped.entries()) {
    for (const batchRows of chunk(countryRows, batchSize)) {
      const keywords = batchRows.map((row) => row.keyword);
      const response = await fetchKeywordData(apiKey, {
        country,
        currency,
        dataSource,
        keywords,
      });
      rawResponses.push({ country, keywords, response });

      const apiRows = normalizeApiRows(response);
      for (const seedRow of batchRows) {
        const apiRow = apiRows.get(seedRow.keyword.toLowerCase()) ?? {};
        resultRows.push({
          group: seedRow.group,
          market: seedRow.market,
          country: seedRow.country,
          language: seedRow.language,
          keyword: seedRow.keyword,
          intent: seedRow.intent,
          priority: seedRow.priority,
          search_volume: toNumber(apiRow.vol ?? apiRow.volume ?? apiRow.search_volume),
          cpc: toNumber(apiRow.cpc),
          competition: toNumber(apiRow.competition ?? apiRow.comp),
          trend_12m: serializeTrend(apiRow.trend ?? apiRow.trend_12m),
          api_country: country,
          data_source: dataSource,
        });
      }
    }
  }

  writeCsvFile(`${outputBase}.csv`, resultRows, [
    "group",
    "market",
    "country",
    "language",
    "keyword",
    "intent",
    "priority",
    "search_volume",
    "cpc",
    "competition",
    "trend_12m",
    "api_country",
    "data_source",
  ]);
  writeJsonFile(`${outputBase}.raw.json`, {
    generated_at: new Date().toISOString(),
    input,
    planned_credits: plannedCredits,
    rawResponses,
  });

  console.log(`Wrote ${resultRows.length} rows to ${outputBase}.csv`);
  console.log(`Wrote raw API payloads to ${outputBase}.raw.json`);
}

async function fetchCredits(apiKey) {
  const response = await fetch(`${API_BASE}/account/credits`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to fetch credits: ${JSON.stringify(payload)}`);
  }
  return Number(Array.isArray(payload) ? payload[0] : payload.credits ?? 0);
}

async function fetchKeywordData(apiKey, { country, currency, dataSource, keywords }) {
  const body = new URLSearchParams();
  for (const keyword of keywords) {
    body.append("kw[]", keyword);
  }
  body.set("country", country);
  body.set("currency", currency);
  body.set("dataSource", dataSource);

  const response = await fetch(`${API_BASE}/get_keyword_data`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Keyword data request failed for ${country}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function normalizeApiRows(response) {
  const rows = Array.isArray(response?.data) ? response.data : [];
  const map = new Map();
  for (const row of rows) {
    const keyword = String(row.keyword ?? row.kw ?? "").toLowerCase();
    if (keyword) {
      map.set(keyword, row);
    }
  }
  return map;
}

function serializeTrend(value) {
  if (!value) return "";
  return Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value);
}

function printPlan(grouped, plannedCredits, batchSize) {
  console.log(`Planned keyword credits: ${plannedCredits}`);
  console.log(`Batch size: ${batchSize}`);
  for (const [country, rows] of grouped.entries()) {
    console.log(`- ${country}: ${rows.length} keywords`);
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/keywords-everywhere.mjs [options]

Options:
  --input <path>          Keyword seed CSV. Default: data/color-diagnosis-keywords.csv
  --out <path-base>       Output base path without extension. Default: output/keywords-everywhere-<timestamp>
  --country us,jp         Filter countries.
  --market global,jp      Filter markets.
  --group core,hair       Filter keyword groups.
  --language en,ja        Filter languages.
  --intent diagnosis      Filter intents.
  --limit 20              Limit selected rows.
  --batch-size 50         Keywords per API request.
  --currency usd          Keywords Everywhere currency.
  --data-source gkp       Keywords Everywhere data source.
  --proxy <url>           HTTP proxy, for example http://127.0.0.1:26001.
  --dry-run               Print planned credits without calling the API.
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
