#!/usr/bin/env node

/**
 * Build UTM-tagged URLs following the project's UTM attribution spec.
 * Validates naming conventions and outputs ready-to-use links.
 *
 * Usage:
 *   node scripts/build-utm.mjs --base https://yourapp.com --source reddit --medium community --campaign launch_may
 *   node scripts/build-utm.mjs --batch data/utm-batch.json --output output/utm-urls.md
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

const VALID_MEDIUMS = ['cpc', 'organic', 'social', 'email', 'referral', 'community', 'affiliate', 'direct'];

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      options[args[i].slice(2)] = args[++i];
    }
  }
  return options;
}

function validateUtmParams(params) {
  const errors = [];

  if (!params.source) errors.push('utm_source is required');
  if (!params.medium) errors.push('utm_medium is required');
  if (!params.campaign) errors.push('utm_campaign is required');

  if (params.source && params.source !== params.source.toLowerCase()) {
    errors.push(`utm_source must be lowercase: "${params.source}" → "${params.source.toLowerCase()}"`);
  }
  if (params.medium && params.medium !== params.medium.toLowerCase()) {
    errors.push(`utm_medium must be lowercase: "${params.medium}" → "${params.medium.toLowerCase()}"`);
  }
  if (params.medium && !VALID_MEDIUMS.includes(params.medium.toLowerCase())) {
    errors.push(`utm_medium "${params.medium}" is not standard. Use one of: ${VALID_MEDIUMS.join(', ')}`);
  }
  if (params.campaign && /\s/.test(params.campaign)) {
    errors.push(`utm_campaign should use underscores, not spaces: "${params.campaign}"`);
  }

  return errors;
}

function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl);
  if (params.source) url.searchParams.set('utm_source', params.source.toLowerCase());
  if (params.medium) url.searchParams.set('utm_medium', params.medium.toLowerCase());
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign.toLowerCase());
  if (params.content) url.searchParams.set('utm_content', params.content.toLowerCase());
  if (params.term) url.searchParams.set('utm_term', params.term.toLowerCase());
  return url.toString();
}

function processSingle(options) {
  const params = {
    source: options.source,
    medium: options.medium,
    campaign: options.campaign,
    content: options.content,
    term: options.term,
  };

  const errors = validateUtmParams(params);
  if (errors.length > 0) {
    console.error('\n❌ UTM validation errors:');
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  const url = buildUrl(options.base, params);
  console.log(`\n✅ UTM URL:\n\n${url}\n`);
}

function processBatch(batchFile, outputPath) {
  const raw = readFileSync(batchFile, 'utf-8');
  const entries = JSON.parse(raw);

  const lines = ['# UTM URLs\n', `Generated: ${new Date().toISOString()}\n`];
  let errorCount = 0;

  for (const entry of entries) {
    const errors = validateUtmParams(entry);
    if (errors.length > 0) {
      lines.push(`## ❌ ${entry.label || entry.source}\n`);
      errors.forEach((e) => lines.push(`- ${e}`));
      lines.push('');
      errorCount++;
      continue;
    }

    const url = buildUrl(entry.base, entry);
    lines.push(`## ${entry.label || entry.campaign}`);
    lines.push(`- **Source**: ${entry.source}`);
    lines.push(`- **Medium**: ${entry.medium}`);
    lines.push(`- **Campaign**: ${entry.campaign}`);
    if (entry.content) lines.push(`- **Content**: ${entry.content}`);
    if (entry.term) lines.push(`- **Term**: ${entry.term}`);
    lines.push(`- **URL**: \`${url}\``);
    lines.push('');
  }

  const output = lines.join('\n');

  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output, 'utf-8');
    console.log(`\n✅ Generated ${entries.length - errorCount} URLs (${errorCount} errors) → ${outputPath}\n`);
  } else {
    console.log(output);
  }
}

function main() {
  const options = parseArgs();

  if (options.batch) {
    processBatch(resolve(options.batch), options.output ? resolve(options.output) : null);
  } else if (options.base) {
    processSingle(options);
  } else {
    console.log(`
Usage:
  Single URL:
    node scripts/build-utm.mjs --base https://yourapp.com --source reddit --medium community --campaign launch_may [--content reply_v1] [--term keyword]

  Batch from JSON:
    node scripts/build-utm.mjs --batch data/utm-batch.json [--output output/utm-urls.md]

  Batch JSON format:
    [
      { "label": "Reddit launch", "base": "https://yourapp.com", "source": "reddit", "medium": "community", "campaign": "launch_may", "content": "reply_v1" }
    ]
`);
  }
}

main();
