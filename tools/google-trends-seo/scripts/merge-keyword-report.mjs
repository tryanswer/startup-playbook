#!/usr/bin/env node
import fs from "node:fs";

import {
  parseArgs,
  readCsvFile,
  timestamp,
  toNumber,
  writeCsvFile,
  writeJsonFile,
} from "../src/seo-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const keywordsPath = args.keywords ?? "output/keywords-everywhere.csv";
  const trendsPath = args.trends ?? "output/google-trends-timeseries.csv";
  const outputBase = args.out ?? `output/keyword-report-${timestamp()}`;

  assertReadable(keywordsPath, "Keywords Everywhere CSV");
  assertReadable(trendsPath, "Google Trends timeseries CSV");

  const keywordRows = readCsvFile(keywordsPath);
  const trendRows = readCsvFile(trendsPath);
  const trendSummary = summarizeTrends(trendRows);

  const mergedRows = keywordRows.map((row) => {
    const key = rowKey(row);
    const trend = trendSummary.get(key) ?? {};
    return {
      ...row,
      trend_avg: trend.average ?? "",
      trend_latest: trend.latest ?? "",
      trend_max: trend.max ?? "",
      seo_score: scoreKeyword(row, trend),
    };
  }).sort((a, b) => Number(b.seo_score) - Number(a.seo_score));

  writeCsvFile(`${outputBase}.csv`, mergedRows);
  writeJsonFile(`${outputBase}.json`, mergedRows);
  fs.writeFileSync(`${outputBase}.md`, buildMarkdownReport(mergedRows, {
    title: args.title ?? "Keyword Opportunity Report",
  }), "utf8");

  console.log(`Wrote merged CSV to ${outputBase}.csv`);
  console.log(`Wrote merged JSON to ${outputBase}.json`);
  console.log(`Wrote markdown summary to ${outputBase}.md`);
}

function summarizeTrends(rows) {
  const grouped = new Map();
  for (const row of rows) {
    const key = rowKey(row);
    const values = grouped.get(key) ?? [];
    const value = Number(row.value);
    if (Number.isFinite(value)) values.push({ date: row.date, value });
    grouped.set(key, values);
  }

  const summary = new Map();
  for (const [key, values] of grouped.entries()) {
    if (values.length === 0) continue;
    const sum = values.reduce((total, item) => total + item.value, 0);
    summary.set(key, {
      average: Math.round((sum / values.length) * 10) / 10,
      latest: values.at(-1)?.value ?? "",
      max: Math.max(...values.map((item) => item.value)),
    });
  }
  return summary;
}

function scoreKeyword(row, trend) {
  const volume = Number(toNumber(row.search_volume)) || 0;
  const cpc = Number(toNumber(row.cpc)) || 0;
  const priority = Number(row.priority || 3);
  const trendLatest = Number(trend.latest ?? 0);
  const trendMax = Number(trend.max ?? 0);
  const volumeScore = Math.log10(volume + 1) * 30;
  const cpcScore = Math.min(cpc, 5) * 8;
  const trendScore = trendLatest * 0.35 + trendMax * 0.15;
  const priorityPenalty = (priority - 1) * 8;
  return Math.round((volumeScore + cpcScore + trendScore - priorityPenalty) * 10) / 10;
}

function rowKey(row) {
  return `${row.country ?? ""}\u0000${row.language ?? ""}\u0000${String(row.keyword ?? "").toLowerCase()}`;
}

function buildMarkdownReport(rows, options = {}) {
  const topRows = rows.slice(0, 25);
  const lines = [
    `# ${options.title}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Top Opportunities",
    "",
    "| Rank | Keyword | Country | Intent | Volume | CPC | Competition | Trend Latest | Score |",
    "| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ];

  topRows.forEach((row, index) => {
    lines.push(`| ${index + 1} | ${escapeMarkdown(row.keyword)} | ${row.country} | ${row.intent} | ${row.search_volume || "-"} | ${row.cpc || "-"} | ${row.competition || "-"} | ${row.trend_latest || "-"} | ${row.seo_score} |`);
  });

  lines.push("", "## Notes", "");
  lines.push("- `seo_score` is a planning score, not a paid-media bidding model.");
  lines.push("- Use high-volume head terms for landing pages and high-intent question terms for FAQ, ASO subtitles, and article sections.");
  lines.push("- Compare keywords inside the same language and country before making final content decisions.");
  lines.push("");
  return lines.join("\n");
}

function escapeMarkdown(value) {
  return String(value ?? "").replaceAll("|", "\\|");
}

function assertReadable(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/merge-keyword-report.mjs --keywords <ke.csv> --trends <trends.csv> [options]

Options:
  --keywords <path>       Keywords Everywhere CSV.
  --trends <path>         Google Trends timeseries CSV.
  --title <text>          Markdown report title. Default: Keyword Opportunity Report
  --out <path-base>       Output base path without extension. Default: output/keyword-report-<timestamp>
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
