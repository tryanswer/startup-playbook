#!/usr/bin/env node
import fs from "node:fs";

import {
  parseArgs,
  readCsvFile,
  scoreTrendSummary,
  summarizeTrendRows,
  timestamp,
  trendRowKey,
  writeCsvFile,
  writeJsonFile,
} from "../src/seo-utils.mjs";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const trendsPath = args.trends ?? "output/google-trends-timeseries.csv";
  const relatedPath = args.related ?? "";
  const seedsPath = args.seeds ?? "data/color-diagnosis-keywords.csv";
  const outputBase = args.out ?? `output/trends-report-${timestamp()}`;

  assertReadable(trendsPath, "Google Trends timeseries CSV");
  assertReadable(seedsPath, "Keyword seed CSV");

  const trendRows = readCsvFile(trendsPath);
  const seedRows = readCsvFile(seedsPath);
  const relatedRows = relatedPath && fs.existsSync(relatedPath) ? readCsvFile(relatedPath) : [];
  const seedIndex = new Map(seedRows.map((row) => [trendRowKey(row), row]));
  const relatedIndex = buildRelatedIndex(relatedRows);

  const summaries = [...summarizeTrendRows(trendRows).entries()].map(([key, summary]) => {
    const seed = seedIndex.get(key) ?? {};
    return {
      ...summary,
      intent: seed.intent ?? "",
      priority: seed.priority ?? "",
      notes: seed.notes ?? "",
      trend_score: scoreTrendSummary({ ...summary, priority: seed.priority }),
      top_related_queries: (relatedIndex.get(key) ?? []).slice(0, 5).map((row) => row.query).join(" | "),
    };
  }).sort((a, b) => Number(b.trend_score) - Number(a.trend_score));

  writeCsvFile(`${outputBase}.csv`, summaries, [
    "group",
    "market",
    "country",
    "language",
    "keyword",
    "intent",
    "priority",
    "average",
    "latest",
    "max",
    "min",
    "momentum4",
    "samples",
    "trend_score",
    "top_related_queries",
    "notes",
  ]);
  writeJsonFile(`${outputBase}.json`, summaries);
  fs.writeFileSync(`${outputBase}.md`, buildMarkdownReport(summaries, {
    title: args.title ?? "Google Trends Keyword Report",
  }), "utf8");

  console.log(`Wrote Google Trends-only CSV to ${outputBase}.csv`);
  console.log(`Wrote Google Trends-only JSON to ${outputBase}.json`);
  console.log(`Wrote Google Trends-only markdown to ${outputBase}.md`);
}

function buildRelatedIndex(rows) {
  const index = new Map();
  for (const row of rows) {
    const key = trendRowKey(row);
    const values = index.get(key) ?? [];
    if (row.query) values.push(row);
    index.set(key, values);
  }
  return index;
}

function buildMarkdownReport(rows, options = {}) {
  const lines = [
    `# ${options.title}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This report uses Google Trends relative interest only. It does not include absolute search volume, CPC, or paid competition.",
    "",
    "## Top Trend Opportunities",
    "",
    "| Rank | Keyword | Country | Intent | Avg | Latest | Max | 4w Momentum | Score |",
    "| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |",
  ];

  rows.slice(0, 30).forEach((row, index) => {
    lines.push(`| ${index + 1} | ${escapeMarkdown(row.keyword)} | ${row.country} | ${row.intent || "-"} | ${row.average} | ${row.latest} | ${row.max} | ${row.momentum4 || 0} | ${row.trend_score} |`);
  });

  const byCountry = groupTop(rows, "country", 5);
  lines.push("", "## Top By Country", "");
  for (const [country, items] of byCountry.entries()) {
    lines.push(`### ${country.toUpperCase()}`, "");
    for (const item of items) {
      lines.push(`- ${item.keyword}: latest ${item.latest}, avg ${item.average}, momentum ${item.momentum4 || 0}`);
    }
    lines.push("");
  }

  lines.push("## Related Query Signals", "");
  rows
    .filter((row) => row.top_related_queries)
    .slice(0, 20)
    .forEach((row) => {
      lines.push(`- ${row.keyword} (${row.country}): ${row.top_related_queries}`);
    });
  lines.push("", "## Reading Notes", "");
  lines.push("- Google Trends values are normalized from 0 to 100 inside each comparison context.");
  lines.push("- Compare keywords within the same language and country before deciding landing-page priorities.");
  lines.push("- Use `latest`, `average`, and `momentum4` as directional signals, not absolute demand.");
  lines.push("");

  return lines.join("\n");
}

function groupTop(rows, key, limit) {
  const grouped = new Map();
  for (const row of rows) {
    const group = row[key] || "unknown";
    const values = grouped.get(group) ?? [];
    values.push(row);
    grouped.set(group, values);
  }
  for (const [group, values] of grouped.entries()) {
    grouped.set(group, values.slice(0, limit));
  }
  return grouped;
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
  node scripts/trends-report.mjs --trends <timeseries.csv> [options]

Options:
  --trends <path>         Google Trends timeseries CSV.
  --related <path>        Google Trends related queries CSV.
  --seeds <path>          Keyword seed CSV. Default: data/color-diagnosis-keywords.csv
  --title <text>          Markdown report title. Default: Google Trends Keyword Report
  --out <path-base>       Output base path without extension. Default: output/trends-report-<timestamp>
`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
