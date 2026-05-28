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

  console.log(`\n📊 生成周报 (${weekLabel})...\n`);

  const lines = [
    '# 每周增长报告\n',
    `- **周期**: ${weekLabel}`,
    `- **生成时间**: ${new Date().toISOString()}`,
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

    lines.push('## 概览\n');
    lines.push('| 指标 | 本周 | 环比 |');
    lines.push('|---|---|---|');
    lines.push(`| 浏览量 (PV) | ${current[0]} | ${changeIndicator(current[0], previous[0])} |`);
    lines.push(`| 访客数 (UV) | ${current[1]} | ${changeIndicator(current[1], previous[1])} |`);
    lines.push(`| IP 数 | ${current[2]} | ${changeIndicator(current[2], previous[2])} |`);
    lines.push(`| 跳出率 | ${current[3].toFixed(1)}% | ${changeIndicator(current[3], previous[3])} |`);
    lines.push(`| 平均访问时长 | ${current[4].toFixed(0)}s | ${changeIndicator(current[4], previous[4])} |`);
    lines.push(`| 平均访问页数 | ${current[5].toFixed(1)} | ${changeIndicator(current[5], previous[5])} |`);
    lines.push('');
  } catch (error) {
    lines.push(`## 概览\n\n⚠️ 获取失败: ${error.message}\n`);
  }

  // Search keywords
  try {
    const searchData = await fetchBaiduTongji(
      options.siteId, options.accessToken, currentStart, currentEnd,
      'pv_count,visitor_count,bounce_ratio', 'source/searchword/a'
    );

    if (searchData?.result?.items?.[1]) {
      const rows = searchData.result.items[1];
      lines.push('## 搜索关键词 Top 20\n');
      lines.push('| 关键词 | PV | UV | 跳出率 |');
      lines.push('|---|---|---|---|');
      for (const row of rows.slice(0, 20)) {
        lines.push(`| ${row[0]?.name || '—'} | ${row[1] || 0} | ${row[2] || 0} | ${row[3] ? row[3] + '%' : '—'} |`);
      }
      lines.push('');
    }
  } catch (error) {
    lines.push(`## 搜索关键词\n\n⚠️ 获取失败: ${error.message}\n`);
  }

  // Traffic sources
  try {
    const sourceData = await fetchBaiduTongji(
      options.siteId, options.accessToken, currentStart, currentEnd,
      'pv_count,visitor_count', 'source/all/a'
    );

    if (sourceData?.result?.items?.[1]) {
      const rows = sourceData.result.items[1];
      lines.push('## 流量来源\n');
      lines.push('| 来源 | PV | UV |');
      lines.push('|---|---|---|');
      for (const row of rows.slice(0, 15)) {
        lines.push(`| ${row[0]?.name || '—'} | ${row[1] || 0} | ${row[2] || 0} |`);
      }
      lines.push('');
    }
  } catch (error) {
    lines.push(`## 流量来源\n\n⚠️ 获取失败: ${error.message}\n`);
  }

  // Top pages
  try {
    const pageData = await fetchBaiduTongji(
      options.siteId, options.accessToken, currentStart, currentEnd,
      'pv_count,visitor_count,bounce_ratio,avg_visit_time', 'visit/toppage/a'
    );

    if (pageData?.result?.items?.[1]) {
      const rows = pageData.result.items[1];
      lines.push('## 热门页面\n');
      lines.push('| 页面 | PV | UV | 跳出率 |');
      lines.push('|---|---|---|---|');
      for (const row of rows.slice(0, 15)) {
        const pageName = row[0]?.name || '—';
        const shortName = pageName.length > 60 ? pageName.slice(0, 57) + '...' : pageName;
        lines.push(`| ${shortName} | ${row[1] || 0} | ${row[2] || 0} | ${row[3] ? row[3] + '%' : '—'} |`);
      }
      lines.push('');
    }
  } catch (error) {
    lines.push(`## 热门页面\n\n⚠️ 获取失败: ${error.message}\n`);
  }

  // Decision section
  lines.push('## 周决策\n');
  lines.push('_根据以上数据填写:_\n');
  lines.push('1. **本周最大的增长信号**: ');
  lines.push('2. **本周最大的流失点**: ');
  lines.push('3. **获客成本最低的渠道**: ');
  lines.push('4. **激活率变化**: ');
  lines.push('5. **下周只做一件事**: ');
  lines.push('');
  lines.push('| 决策 | 渠道/功能 | 原因 |');
  lines.push('|---|---|---|');
  lines.push('| 继续 | | |');
  lines.push('| 调整 | | |');
  lines.push('| 停止 | | |');
  lines.push('');

  const report = lines.join('\n');
  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, report, 'utf-8');
  console.log(`✅ 周报已保存 → ${options.output}\n`);
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
});
