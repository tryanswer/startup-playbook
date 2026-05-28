#!/usr/bin/env node

/**
 * Generate a weekly growth report combining GA4 and Search Console data.
 * Outputs a Markdown file matching the weekly review protocol.
 *
 * Usage:
 *   node scripts/weekly-report.mjs --config ../config.json [--output output/weekly-report.md]
 *   node scripts/weekly-report.mjs --ga4-property properties/123456789 --site https://yourapp.com
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const currentDir = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ga4Property: null,
    site: null,
    output: resolve(currentDir, '../output/weekly-report.md'),
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ga4-property' && args[i + 1]) options.ga4Property = args[++i];
    else if (args[i] === '--site' && args[i + 1]) options.site = args[++i];
    else if (args[i] === '--output' && args[i + 1]) options.output = resolve(args[++i]);
    else if (args[i] === '--config' && args[i + 1]) {
      const configPath = resolve(args[++i]);
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (config.ga4PropertyId) options.ga4Property = config.ga4PropertyId;
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
    process.exit(1);
  }
}

function formatDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function fetchGA4Report(propertyId, accessToken, startDate, endDate) {
  const apiUrl = `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [
        { startDate, endDate, name: 'current' },
        { startDate: formatDate(14), endDate: formatDate(8), name: 'previous' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'eventCount' },
      ],
      dimensions: [{ name: 'dateRange' }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GA4 API error (${response.status}): ${errorText}`);
  }
  return response.json();
}

async function fetchGA4Events(propertyId, accessToken, startDate, endDate) {
  const apiUrl = `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'eventCount' }],
      dimensions: [{ name: 'eventName' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    }),
  });

  if (!response.ok) return null;
  return response.json();
}

async function fetchSearchConsole(siteUrl, accessToken, startDate, endDate) {
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
      dimensions: ['query'],
      rowLimit: 20,
    }),
  });

  if (!response.ok) return null;
  return response.json();
}

function extractMetricValue(report, dateRangeName, metricIndex) {
  if (!report?.rows) return 0;
  const row = report.rows.find((r) => r.dimensionValues?.[0]?.value === dateRangeName);
  return row ? parseFloat(row.metricValues[metricIndex].value) : 0;
}

function changeIndicator(current, previous) {
  if (previous === 0) return current > 0 ? ' 🟢 ↑' : ' —';
  const changePercent = ((current - previous) / previous * 100).toFixed(0);
  if (changePercent > 5) return ` 🟢 +${changePercent}%`;
  if (changePercent < -5) return ` 🔴 ${changePercent}%`;
  return ` ⚪ ${changePercent}%`;
}

async function main() {
  const options = parseArgs();

  if (!options.ga4Property && !options.site) {
    console.error(`Usage:
  node scripts/weekly-report.mjs --config ../config.json
  node scripts/weekly-report.mjs --ga4-property properties/123456789 --site https://yourapp.com

Config file format (config.json):
  {
    "ga4PropertyId": "properties/123456789",
    "searchConsoleSiteUrl": "https://yourapp.com"
  }
`);
    process.exit(1);
  }

  const accessToken = getAccessToken();
  const endDate = formatDate(1);
  const startDate = formatDate(7);
  const weekLabel = `${startDate} → ${endDate}`;

  console.log(`\n📊 Generating weekly report (${weekLabel})...\n`);

  const lines = [
    '# Weekly Growth Report\n',
    `- **Period**: ${weekLabel}`,
    `- **Generated**: ${new Date().toISOString()}`,
    '',
  ];

  // GA4 section
  if (options.ga4Property) {
    try {
      const ga4Report = await fetchGA4Report(options.ga4Property, accessToken, startDate, endDate);

      const currentUsers = extractMetricValue(ga4Report, 'current', 0);
      const previousUsers = extractMetricValue(ga4Report, 'previous', 0);
      const currentNewUsers = extractMetricValue(ga4Report, 'current', 1);
      const previousNewUsers = extractMetricValue(ga4Report, 'previous', 1);
      const currentSessions = extractMetricValue(ga4Report, 'current', 2);
      const previousSessions = extractMetricValue(ga4Report, 'previous', 2);
      const currentEngagement = extractMetricValue(ga4Report, 'current', 3);

      lines.push('## GA4 Overview\n');
      lines.push('| Metric | This Week | vs Last Week |');
      lines.push('|---|---|---|');
      lines.push(`| Active Users | ${currentUsers} | ${changeIndicator(currentUsers, previousUsers)} |`);
      lines.push(`| New Users | ${currentNewUsers} | ${changeIndicator(currentNewUsers, previousNewUsers)} |`);
      lines.push(`| Sessions | ${currentSessions} | ${changeIndicator(currentSessions, previousSessions)} |`);
      lines.push(`| Engagement Rate | ${(currentEngagement * 100).toFixed(1)}% | — |`);
      lines.push('');

      // Events breakdown
      const eventsReport = await fetchGA4Events(options.ga4Property, accessToken, startDate, endDate);
      if (eventsReport?.rows) {
        lines.push('## Key Events\n');
        lines.push('| Event | Count |');
        lines.push('|---|---|');
        for (const row of eventsReport.rows) {
          const eventName = row.dimensionValues[0].value;
          const eventCount = row.metricValues[0].value;
          lines.push(`| ${eventName} | ${eventCount} |`);
        }
        lines.push('');
      }
    } catch (error) {
      lines.push(`## GA4\n\n⚠️ Could not fetch GA4 data: ${error.message}\n`);
    }
  }

  // Search Console section
  if (options.site) {
    try {
      const searchData = await fetchSearchConsole(options.site, accessToken, startDate, endDate);
      if (searchData?.rows) {
        let totalClicks = 0;
        let totalImpressions = 0;

        lines.push('## Search Console\n');
        lines.push('| Query | Clicks | Impressions | CTR | Position |');
        lines.push('|---|---|---|---|---|');
        for (const row of searchData.rows) {
          const query = row.keys[0];
          const ctr = (row.ctr * 100).toFixed(1);
          const position = row.position.toFixed(1);
          lines.push(`| ${query} | ${row.clicks} | ${row.impressions} | ${ctr}% | ${position} |`);
          totalClicks += row.clicks;
          totalImpressions += row.impressions;
        }
        lines.push('');
        lines.push(`**Total**: ${totalClicks} clicks / ${totalImpressions} impressions / ${totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(1) : 0}% CTR`);
        lines.push('');
      }
    } catch (error) {
      lines.push(`## Search Console\n\n⚠️ Could not fetch Search Console data: ${error.message}\n`);
    }
  }

  // Decision section
  lines.push('## Weekly Decision\n');
  lines.push('_Fill in after reviewing the data above:_\n');
  lines.push('1. **Biggest growth signal this week**: ');
  lines.push('2. **Biggest drop-off or blocker**: ');
  lines.push('3. **Lowest cost-per-outcome channel**: ');
  lines.push('4. **Activation rate change**: ');
  lines.push('5. **One thing to do next week**: ');
  lines.push('');
  lines.push('| Decision | Channel/Feature | Reason |');
  lines.push('|---|---|---|');
  lines.push('| Continue | | |');
  lines.push('| Adjust | | |');
  lines.push('| Stop | | |');
  lines.push('');

  const report = lines.join('\n');

  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, report, 'utf-8');
  console.log(`✅ Weekly report saved → ${options.output}\n`);
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
});
