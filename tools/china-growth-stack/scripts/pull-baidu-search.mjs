#!/usr/bin/env node

/**
 * Pull Baidu Search Resource Platform (百度搜索资源平台) data.
 * Uses the Baidu Tongji API to export search keyword and traffic data.
 *
 * Usage:
 *   node scripts/pull-baidu-search.mjs --config ../config.json --days 7 [--output output/baidu-search.md]
 *   node scripts/pull-baidu-search.mjs --site-id YOUR_SITE_ID --token YOUR_ACCESS_TOKEN
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { siteId: null, accessToken: null, days: 7, output: null, limit: 50 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--site-id' && args[i + 1]) options.siteId = args[++i];
    else if (args[i] === '--token' && args[i + 1]) options.accessToken = args[++i];
    else if (args[i] === '--days' && args[i + 1]) options.days = parseInt(args[++i], 10);
    else if (args[i] === '--output' && args[i + 1]) options.output = resolve(args[++i]);
    else if (args[i] === '--limit' && args[i + 1]) options.limit = parseInt(args[++i], 10);
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
    max_results: '50',
  });

  const response = await fetch(`${apiUrl}?${params}`);
  if (!response.ok) {
    throw new Error(`Baidu Tongji API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  if (data.error_code) {
    throw new Error(`Baidu Tongji API error: ${data.error_msg} (code: ${data.error_code})`);
  }
  return data;
}

function generateReport(searchData, sourceData, siteId, startDateReadable, endDateReadable) {
  const lines = [
    '# 百度搜索数据报告\n',
    `- **站点**: ${siteId}`,
    `- **周期**: ${startDateReadable} → ${endDateReadable}`,
    `- **生成时间**: ${new Date().toISOString()}`,
    '',
  ];

  // Search keywords
  if (searchData?.result?.items) {
    const headers = searchData.result.items[0] || [];
    const rows = searchData.result.items[1] || [];

    lines.push('## 搜索关键词\n');
    lines.push('| 关键词 | 浏览量(PV) | 访客数(UV) | 跳出率 | 平均访问时长 |');
    lines.push('|---|---|---|---|---|');

    for (const row of rows.slice(0, 30)) {
      const keyword = row[0]?.name || '—';
      const pv = row[1] || 0;
      const uv = row[2] || 0;
      const bounceRate = row[3] ? `${row[3]}%` : '—';
      const avgDuration = row[4] || '—';
      lines.push(`| ${keyword} | ${pv} | ${uv} | ${bounceRate} | ${avgDuration} |`);
    }
    lines.push('');
  } else {
    lines.push('## 搜索关键词\n\n> 无数据或 API 返回异常。\n');
  }

  // Traffic sources
  if (sourceData?.result?.items) {
    const rows = sourceData.result.items[1] || [];

    lines.push('## 流量来源\n');
    lines.push('| 来源 | 浏览量(PV) | 访客数(UV) | 跳出率 |');
    lines.push('|---|---|---|---|');

    for (const row of rows.slice(0, 20)) {
      const source = row[0]?.name || '—';
      const pv = row[1] || 0;
      const uv = row[2] || 0;
      const bounceRate = row[3] ? `${row[3]}%` : '—';
      lines.push(`| ${source} | ${pv} | ${uv} | ${bounceRate} |`);
    }
    lines.push('');
  }

  // Action items
  lines.push('## 本周行动建议\n');
  lines.push('1. **高 PV 高跳出率的词** → 落地页和搜索意图不匹配，需要优化页面内容');
  lines.push('2. **有 UV 但没有转化事件的词** → 流量质量不够或 CTA 不清晰');
  lines.push('3. **新出现的关键词** → 可能的新需求，值得创建对应内容');
  lines.push('4. **消失的关键词** → 检查是否被竞品超过或页面被降权');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const options = parseArgs();

  if (!options.siteId || !options.accessToken) {
    console.error(`Usage:
  node scripts/pull-baidu-search.mjs --config ../config.json [--days 7] [--output output/baidu-search.md]
  node scripts/pull-baidu-search.mjs --site-id SITE_ID --token ACCESS_TOKEN

Config file format (config.json):
  {
    "baiduSiteId": "your-site-id",
    "baiduAccessToken": "your-access-token"
  }

获取 Access Token: https://tongji.baidu.com/api/manual/Chapter2/openapi.html
`);
    process.exit(1);
  }

  const startDate = formatDate(options.days);
  const endDate = formatDate(1);
  const startDateReadable = formatDateReadable(options.days);
  const endDateReadable = formatDateReadable(1);

  console.log(`\n🔍 拉取百度搜索数据 (最近 ${options.days} 天)...\n`);

  let searchData = null;
  let sourceData = null;

  try {
    searchData = await fetchBaiduTongji(
      options.siteId, options.accessToken, startDate, endDate,
      'pv_count,visitor_count,bounce_ratio,avg_visit_time', 'source/searchword/a'
    );
  } catch (error) {
    console.warn(`⚠  搜索关键词数据获取失败: ${error.message}`);
  }

  try {
    sourceData = await fetchBaiduTongji(
      options.siteId, options.accessToken, startDate, endDate,
      'pv_count,visitor_count,bounce_ratio', 'source/all/a'
    );
  } catch (error) {
    console.warn(`⚠  流量来源数据获取失败: ${error.message}`);
  }

  const report = generateReport(searchData, sourceData, options.siteId, startDateReadable, endDateReadable);

  if (options.output) {
    mkdirSync(dirname(options.output), { recursive: true });
    writeFileSync(options.output, report, 'utf-8');
    console.log(`✅ 报告已保存 → ${options.output}\n`);
  } else {
    console.log(report);
  }
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
});
