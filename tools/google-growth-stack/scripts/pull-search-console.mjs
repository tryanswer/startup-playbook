#!/usr/bin/env node

/**
 * Pull Google Search Console data and export to Markdown or JSON.
 * Requires gcloud auth and a verified Search Console property.
 *
 * Usage:
 *   node scripts/pull-search-console.mjs --site https://yourapp.com --days 7 [--output output/search-console.md]
 *   node scripts/pull-search-console.mjs --config ../config.json
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const currentDir = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { days: 7, output: null, site: null, limit: 50 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site' && args[i + 1]) options.site = args[++i];
    else if (args[i] === '--days' && args[i + 1]) options.days = parseInt(args[++i], 10);
    else if (args[i] === '--output' && args[i + 1]) options.output = resolve(args[++i]);
    else if (args[i] === '--limit' && args[i + 1]) options.limit = parseInt(args[++i], 10);
    else if (args[i] === '--config' && args[i + 1]) {
      const configPath = resolve(args[++i]);
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (config.searchConsoleSiteUrl) options.site = config.searchConsoleSiteUrl;
      }
    }
  }
  return options;
}

function getAccessToken() {
  try {
    return execSync('gcloud auth application-default print-access-token', { stdio: 'pipe' }).toString().trim();
  } catch {
    console.error('❌ gcloud auth not configured. Run: gcloud auth application-default login');
    console.error('   Or run: npm run check-deps');
    process.exit(1);
  }
}

function formatDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function fetchSearchAnalytics(siteUrl, accessToken, startDate, endDate, rowLimit) {
  const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['query', 'page', 'country'],
      rowLimit,
      dataState: 'final',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search Console API error (${response.status}): ${error}`);
  }

  return response.json();
}

function generateMarkdownReport(data, siteUrl, startDate, endDate) {
  const lines = [
    '# Search Console Report\n',
    `- **Site**: ${siteUrl}`,
    `- **Period**: ${startDate} → ${endDate}`,
    `- **Generated**: ${new Date().toISOString()}`,
    '',
  ];

  if (!data.rows || data.rows.length === 0) {
    lines.push('> No data available for this period.\n');
    return lines.join('\n');
  }

  // Aggregate by query
  const queryMap = new Map();
  for (const row of data.rows) {
    const query = row.keys[0];
    if (!queryMap.has(query)) {
      queryMap.set(query, { clicks: 0, impressions: 0, ctr: 0, position: 0, count: 0 });
    }
    const entry = queryMap.get(query);
    entry.clicks += row.clicks;
    entry.impressions += row.impressions;
    entry.count++;
    entry.position += row.position;
  }

  const querySorted = [...queryMap.entries()]
    .map(([query, stats]) => ({
      query,
      clicks: stats.clicks,
      impressions: stats.impressions,
      ctr: stats.impressions > 0 ? (stats.clicks / stats.impressions * 100).toFixed(1) : '0.0',
      position: (stats.position / stats.count).toFixed(1),
    }))
    .sort((a, b) => b.impressions - a.impressions);

  // Top queries
  lines.push('## Top Queries\n');
  lines.push('| Query | Clicks | Impressions | CTR | Avg Position | Opportunity |');
  lines.push('|---|---|---|---|---|---|');
  for (const row of querySorted.slice(0, 30)) {
    const opportunity = identifyOpportunity(row);
    lines.push(`| ${row.query} | ${row.clicks} | ${row.impressions} | ${row.ctr}% | ${row.position} | ${opportunity} |`);
  }
  lines.push('');

  // High-impression low-CTR opportunities
  const lowCtrHighImpression = querySorted.filter(
    (row) => row.impressions >= 10 && parseFloat(row.ctr) < 2.0
  );
  if (lowCtrHighImpression.length > 0) {
    lines.push('## 🔴 High Impressions, Low CTR (optimize title/description)\n');
    lines.push('| Query | Impressions | CTR | Position |');
    lines.push('|---|---|---|---|');
    for (const row of lowCtrHighImpression.slice(0, 15)) {
      lines.push(`| ${row.query} | ${row.impressions} | ${row.ctr}% | ${row.position} |`);
    }
    lines.push('');
  }

  // Position 5-15 opportunities
  const positionOpportunities = querySorted.filter(
    (row) => parseFloat(row.position) >= 5 && parseFloat(row.position) <= 15 && row.impressions >= 5
  );
  if (positionOpportunities.length > 0) {
    lines.push('## 🟡 Position 5-15 (easiest to push to page 1)\n');
    lines.push('| Query | Position | Clicks | Impressions |');
    lines.push('|---|---|---|---|');
    for (const row of positionOpportunities.slice(0, 15)) {
      lines.push(`| ${row.query} | ${row.position} | ${row.clicks} | ${row.impressions} |`);
    }
    lines.push('');
  }

  // Aggregate by country
  const countryMap = new Map();
  for (const row of data.rows) {
    const country = row.keys[2];
    if (!countryMap.has(country)) {
      countryMap.set(country, { clicks: 0, impressions: 0 });
    }
    const entry = countryMap.get(country);
    entry.clicks += row.clicks;
    entry.impressions += row.impressions;
  }

  const countrySorted = [...countryMap.entries()]
    .sort((a, b) => b[1].impressions - a[1].impressions)
    .slice(0, 10);

  lines.push('## By Country\n');
  lines.push('| Country | Clicks | Impressions |');
  lines.push('|---|---|---|');
  for (const [country, stats] of countrySorted) {
    lines.push(`| ${country} | ${stats.clicks} | ${stats.impressions} |`);
  }
  lines.push('');

  return lines.join('\n');
}

function identifyOpportunity(row) {
  const position = parseFloat(row.position);
  const ctr = parseFloat(row.ctr);

  if (position <= 3 && ctr > 5) return '✅ Strong';
  if (position <= 3 && ctr <= 5) return '⚠️ Good rank, low CTR — improve snippet';
  if (position > 3 && position <= 10) return '🟡 Page 1, optimize to top 3';
  if (position > 10 && position <= 20) return '🔵 Page 2, needs content boost';
  return '—';
}

async function main() {
  const options = parseArgs();

  if (!options.site) {
    console.error('Usage: node scripts/pull-search-console.mjs --site https://yourapp.com [--days 7] [--output output/search-console.md]');
    console.error('   Or: node scripts/pull-search-console.mjs --config ../config.json');
    process.exit(1);
  }

  console.log(`\n🔍 Pulling Search Console data for ${options.site} (last ${options.days} days)...\n`);

  const accessToken = getAccessToken();
  const endDate = formatDate(1); // yesterday (today's data is incomplete)
  const startDate = formatDate(options.days);

  const data = await fetchSearchAnalytics(options.site, accessToken, startDate, endDate, options.limit);
  const report = generateMarkdownReport(data, options.site, startDate, endDate);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, report, 'utf-8');
    console.log(`✅ Report saved → ${options.output}\n`);
  } else {
    console.log(report);
  }
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
});
