#!/usr/bin/env node

/**
 * Check system dependencies for the China Growth Stack.
 * Verifies Node.js version and optional API credentials.
 *
 * Usage: node scripts/check-deps.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

function checkCommand(command) {
  try {
    const output = execSync(command, { stdio: 'pipe', timeout: 10000 }).toString().trim();
    return { ok: true, output };
  } catch {
    return { ok: false, output: '' };
  }
}

function parseVersion(versionString) {
  const match = versionString.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

async function main() {
  console.log('\n🔍 Checking China Growth Stack dependencies...\n');

  // Node.js
  process.stdout.write('  node: ');
  const nodeResult = checkCommand('node --version');
  if (nodeResult.ok) {
    const version = parseVersion(nodeResult.output);
    const major = parseInt(version?.split('.')[0] || '0', 10);
    if (major >= 20) {
      console.log(`✅ ${version}`);
    } else {
      console.log(`❌ ${version} (need >= 20). Install: https://nodejs.org or nvm install 20`);
    }
  } else {
    console.log('❌ not found');
  }

  // Config file
  process.stdout.write('  config.json: ');
  const configPath = resolve(currentDir, '../config.json');
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    console.log('✅');
    if (config.baiduSiteId) console.log(`    Baidu Analytics (百度统计) Site ID: ${config.baiduSiteId}`);
    if (config.baiduAccessToken) console.log('    Baidu Analytics (百度统计) Access Token: ✅ configured');
    if (config.baiduSearchSiteUrl) console.log(`    Baidu Search Resource Platform (百度搜索资源平台) Site: ${config.baiduSearchSiteUrl}`);
    if (config.umengAppKey) console.log(`    Umeng+ (友盟+) AppKey: ${config.umengAppKey}`);
  } else {
    console.log('⚠  not found (optional)');
    console.log(`    Create ${configPath} with:`);
    console.log(`    {`);
    console.log(`      "baiduSiteId": "your-baidu-tongji-site-id",`);
    console.log(`      "baiduAccessToken": "your-baidu-tongji-access-token",`);
    console.log(`      "baiduSearchSiteUrl": "https://yourapp.com",`);
    console.log(`      "umengAppKey": "your-umeng-appkey"`);
    console.log(`    }`);
  }

  // API connectivity
  process.stdout.write('  Baidu Analytics (百度统计) API: ');
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (config.baiduAccessToken) {
      const apiResult = checkCommand(
        `curl -s -o /dev/null -w "%{http_code}" "https://openapi.baidu.com/rest/2.0/tongji/config/getSiteList?access_token=${config.baiduAccessToken}"`
      );
      if (apiResult.ok && apiResult.output === '200') {
        console.log('✅ connected');
      } else {
        console.log('❌ auth failed. Refresh token at: https://tongji.baidu.com/api/manual/Chapter2/openapi.html');
      }
    } else {
      console.log('⚠  no access token configured');
    }
  } else {
    console.log('⚠  skipped (no config.json)');
  }

  console.log('\n📋 Setup guide:');
  console.log('  Baidu Analytics (百度统计): https://tongji.baidu.com → Management → API');
  console.log('  Umeng+ (友盟+):    https://www.umeng.com → App Management → AppKey');
  console.log('  Baidu Search (百度搜索): https://ziyuan.baidu.com → Site Management');
  console.log('');
}

main();
