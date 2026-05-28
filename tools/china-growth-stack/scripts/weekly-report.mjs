#!/usr/bin/env node

/**
 * Generate a weekly growth report for China market.
 * Combines Baidu Tongji (百度统计) overview and search keyword data.
 *
 * Usage:
 *   node scripts/weekly-report.mjs --config ../config.json [--output output/weekly-report.md]
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    siteId: null,
    accessToken: null,
    output: resolve(currentDir, '../output/weekly-report.md'),
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site-id' && args[i + 1]) options.siteId = args[++i];
    else if (args[i] === '--token' && args[i + 1]) options.accessToken = args[++i];
    else if (args[i] === '--output' && args[i + 1]) options.output = resolve(args[++i]);
    else if (args[i] === '--config' && args[i + 1]) {
      const configPath = resolve(args[++i]);
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (config.baiduSiteId) options.siteId = config.baiduSiteId;
        if (config.baiduAccessToken) options.accessToken = config.baiduAccessToken;
      }
    }
  }
  return options;
}

function formatDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

function formatDateReadable(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function fetchBaiduTongji(siteId, accessToken, startDate, endDate, metrics, method) {
  const apiUrl = 'https://openapi.baidu.com/rest/2.0/tongji/report/getData';
  const params = new URLSearchParams({
    access_token: accessToken,
    site_id: siteId,
    method,
    start_date: startDate,
    end_date: endDate,
    metrics,
    max_results: '30',
  });

  const response = await fetch(`${apiUrl}?${params}`);
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  const data = await response.json();
  if (data.error_code) {
    throw new Error(`${data.error_msg} (${data.error_code})`);
  }
  return data;
}

function changeIndicator(current, previous) {
  if (previous === 0) return current > 0 ? ' 🟢 ↑' : ' —';
  const pct = ((current - previous) / previous * 100).toFixed(0);
  if (pct > 5) return ` 🟢 +${pct}%`;
  if (pct < -5) return ` 🔴 ${pct}%`;
  return ` ⚪ ${pct}%`;
}

async function main() {
  const options = parseArgs();

  if (!options.siteId || !options.accessToken) {
    console.error(`Usage:
  node scripts/weekly-report.mjs --config ../config.json
  node scripts/weekly-report.mjs --site-id SITE_ID --token ACCESS_TOKEN

Config file format (config.json):
  {
    "baiduSiteId": "your-site-id",
    "baiduAccessToken": "your-access-token"
  }
`);
    process.exit(1);
  }

  const currentStart = formatDate(7);
  const currentEnd = formatDate(1);
  const previousStart = formatDate(14);
  const previousEnd = formatDate(8);
  const weekLabel = `${formatDateReadable(7)} → ${formatDateReadable(1)}`;

  console.log(`\n📊 Generating weekly report (${weekLabel})...\n`);

  const lines = [
    '# Weekly Growth Report\n',
    `- **Period**: ${weekLabel}`,
    `- **Generated at**: ${new Date().toISOString()}`,
    '',
  ];

  // Overview - current week
  try {
    const overviewCurrent = await fetchBaiduTongji(
      options.siteId, options.accessToken, currentStart, currentEnd,
      'pv_count,visitor_count,ip_count,bounce_ratio,avg_visit_time,avg_visit_pages',
      'overview/getTimeTrendRpt'
    );
    const overviewPrevious = await fetchBaiduTongji(
      options.siteId, options.accessToken, previousStart, previousEnd,
      'pv_count,visitor_count,ip_count,bounce_ratio,avg_visit_time,avg_visit_pages',
      'overview/getTimeTrendRpt'
    );

    // Sum up daily data
    const sumMetrics = (data) => {
      if (!data?.result?.items?.[1]) return [0, 0, 0, 0, 0, 0];
      const rows = data.result.items[1];
      const sums = [0, 0, 0, 0, 0, 0];
      for (const row of rows) {
        for (let i = 0; i < 6; i++) sums[i] += (parseFloat(row[i]) || 0);
      }
      // Average for ratio and time metrics
      if (rows.length > 0) {
        sums[3] = sums[3] / rows.length; // bounce ratio
        sums[4] = sums[4] / rows.length; // avg visit time
        sums[5] = sums[5] / rows.length; // avg pages
      }
      return sums;
    };

    const current = sumMetrics(overviewCurrent);
    const previous = sumMetrics(overviewPrevious);

    lines.push('## Overview\n');
    lines.push('| Metric | This Week | WoW Change |');
    lines.push('|---|---|---|');
    lines.push(`| Page Views (PV) | ${current[0]} | ${changeIndicator(current[0], previous[0])} |`);
    lines.push(`| Unique Visitors (UV) | ${current[1]} | ${changeIndicator(current[1], previous[1])} |`);
    lines.push(`| IP Count | ${current[2]} | ${changeIndicator(current[2], previous[2])} |`);
    lines.push(`| Bounce Rate | ${current[3].toFixed(1)}% | ${changeIndicator(current[3], previous[3])} |`);
    lines.push(`| Avg Visit Duration | ${current[4].toFixed(0)}s | ${changeIndicator(current[4], previous[4])} |`);
    lines.push(`| Avg Pages per Visit | ${current[5].toFixed(1)} | ${changeIndicator(current[5], previous[5])} |`);
    lines.push('');
  } catch (error) {
    lines.push(`## Overview\n\n⚠️ Fetch failed: ${error.message}\n`);
  }

  // Search keywords
  try {
    const searchData = await fetchBaiduTongji(
      options.siteId, options.accessToken, currentStart, currentEnd,
      'pv_count,visitor_count,bounce_ratio', 'source/searchword/a'
    );

    if (searchData?.result?.items?.[1]) {
      const rows = searchData.result.items[1];
      lines.push('## Top 20 Search Keywords\n');
      lines.push('| Keyword | PV | UV | Bounce Rate |');
      lines.push('|---|---|---|---|');
      for (const row of rows.slice(0, 20)) {
        lines.push(`| ${row[0]?.name || '—'} | ${row[1] || 0} | ${row[2] || 0} | ${row[3] ? row[3] + '%' : '—'} |`);
      }
      lines.push('');
    }
  } catch (error) {
    lines.push(`## Search Keywords\n\n⚠️ Fetch failed: ${error.message}\n`);
  }

  // Traffic sources
  try {
    const sourceData = await fetchBaiduTongji(
      options.siteId, options.accessToken, currentStart, currentEnd,
      'pv_count,visitor_count', 'source/all/a'
    );

    if (sourceData?.result?.items?.[1]) {
      const rows = sourceData.result.items[1];
      lines.push('## Traffic Sources\n');
      lines.push('| Source | PV | UV |');
      lines.push('|---|---|---|');
      for (const row of rows.slice(0, 15)) {
        lines.push(`| ${row[0]?.name || '—'} | ${row[1] || 0} | ${row[2] || 0} |`);
      }
      lines.push('');
    }
  } catch (error) {
    lines.push(`## Traffic Sources\n\n⚠️ Fetch failed: ${error.message}\n`);
  }

  // Top pages
  try {
    const pageData = await fetchBaiduTongji(
      options.siteId, options.accessToken, currentStart, currentEnd,
      'pv_count,visitor_count,bounce_ratio,avg_visit_time', 'visit/toppage/a'
    );

    if (pageData?.result?.items?.[1]) {
      const rows = pageData.result.items[1];
      lines.push('## Top Pages\n');
      lines.push('| Page | PV | UV | Bounce Rate |');
      lines.push('|---|---|---|---|');
      for (const row of rows.slice(0, 15)) {
        const pageName = row[0]?.name || '—';
        const shortName = pageName.length > 60 ? pageName.slice(0, 57) + '...' : pageName;
        lines.push(`| ${shortName} | ${row[1] || 0} | ${row[2] || 0} | ${row[3] ? row[3] + '%' : '—'} |`);
      }
      lines.push('');
    }
  } catch (error) {
    lines.push(`## Top Pages\n\n⚠️ Fetch failed: ${error.message}\n`);
  }

  // Decision section
  lines.push('## Weekly Decisions\n');
  lines.push('_Fill in based on the above data:_\n');
  lines.push('1. **Biggest growth signal this week**: ');
  lines.push('2. **Biggest churn point this week**: ');
  lines.push('3. **Channel with lowest acquisition cost**: ');
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
