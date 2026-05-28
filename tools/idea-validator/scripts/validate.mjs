#!/usr/bin/env node

/**
 * Idea Validator — automated end-to-end idea validation.
 *
 * Orchestrates Reddit pain mining, trends/demand check, and competitor scan,
 * then generates an HTML decision report with kill/pivot/continue recommendation.
 *
 * Usage:
 *   node scripts/validate.mjs --idea "AI skin analysis app for women 25-35"
 *   node scripts/validate.mjs --idea "invoice tool for freelancers" --keywords "freelance invoice,invoice generator" --subreddits "freelance,smallbusiness"
 *   node scripts/validate.mjs --idea "AI writing assistant" --skip-reddit
 *
 * Environment:
 *   HTTP_PROXY / HTTPS_PROXY — set if Reddit requires a proxy from your network
 */

import { parseArgs } from 'node:util';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;
const OUTPUT_DIR = join(__dirname, '..', 'output');

const { values: args } = parseArgs({
  options: {
    idea: { type: 'string' },
    keywords: { type: 'string', default: '' },
    subreddits: { type: 'string', default: '' },
    geo: { type: 'string', default: '' },
    limit: { type: 'string', default: '100' },
    'skip-reddit': { type: 'boolean', default: false },
    'skip-trends': { type: 'boolean', default: false },
    'skip-competitors': { type: 'boolean', default: false },
    output: { type: 'string', default: '' },
  },
});

if (!args.idea) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    IDEA VALIDATOR                           ║
║  Automated startup idea validation with evidence scoring    ║
╚══════════════════════════════════════════════════════════════╝

Usage:
  node scripts/validate.mjs --idea "your idea description"

Options:
  --idea          Required. The idea to validate (2-3 sentences)
  --keywords      Override search keywords (comma-separated). Default: extracted from idea
  --subreddits    Target subreddits (comma-separated). Default: auto-search all
  --geo           Geographic focus for trends (e.g., US, GB, DE). Default: global
  --limit         Reddit post limit per search. Default: 100
  --skip-reddit   Skip Reddit pain mining
  --skip-trends   Skip Google Trends / autocomplete check
  --skip-competitors  Skip competitor scan
  --output        Custom output path for the HTML report

Examples:
  node scripts/validate.mjs --idea "AI skin analysis app for women 25-35"
  node scripts/validate.mjs --idea "invoice tool for freelancers" --subreddits "freelance,smallbusiness"
  node scripts/validate.mjs --idea "AI writing assistant" --keywords "ai writer,ai copywriting" --geo US
`);
  process.exit(1);
}

function extractKeywords(idea) {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'for', 'and', 'but', 'or',
    'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each',
    'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
    'just', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
    'about', 'between', 'through', 'during', 'before', 'after',
    'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'that', 'this', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
    'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
    'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when',
    'where', 'why', 'how', 'with', 'into',
  ]);

  const words = idea.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Build keyword combinations
  const ideaLower = idea.toLowerCase();
  const keywords = [ideaLower.replace(/[^a-z0-9\s]/g, '').trim()];

  // Add 2-3 word combinations from significant terms
  if (words.length >= 2) {
    keywords.push(words.slice(0, 3).join(' '));
    if (words.length >= 4) {
      keywords.push(words.slice(0, 2).join(' '));
    }
  }

  return [...new Set(keywords)].slice(0, 3);
}

async function runScript(scriptName, scriptArgs) {
  const scriptPath = join(SCRIPTS_DIR, scriptName);
  const nodeArgs = scriptName.includes('reddit') || scriptName.includes('trends') || scriptName.includes('competitor')
    ? ['--use-env-proxy', scriptPath, ...scriptArgs]
    : [scriptPath, ...scriptArgs];

  try {
    const { stdout, stderr } = await execFileAsync('node', nodeArgs, {
      cwd: join(__dirname, '..'),
      timeout: 120_000,
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    return true;
  } catch (error) {
    console.warn(`  ⚠️ ${scriptName} failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const idea = args.idea;
  const keywords = args.keywords
    ? args.keywords.split(',').map(k => k.trim())
    : extractKeywords(idea);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    IDEA VALIDATOR                           ║
╚══════════════════════════════════════════════════════════════╝

  Idea: ${idea}
  Keywords: ${keywords.join(', ')}
  ${args.subreddits ? `Subreddits: ${args.subreddits}` : 'Subreddits: auto-search'}
  ${args.geo ? `Geo: ${args.geo}` : 'Geo: global'}
`);

  await mkdir(OUTPUT_DIR, { recursive: true });

  const steps = [];

  // Step 1: Reddit Pain Mining
  if (!args['skip-reddit']) {
    console.log('━━━ Step 1/3: Reddit Pain Mining ━━━');
    const redditArgs = ['--keywords', keywords[0]];
    if (args.subreddits) redditArgs.push('--subreddits', args.subreddits);
    if (args.limit) redditArgs.push('--limit', args.limit);
    steps.push({ name: 'Reddit', success: await runScript('reddit-pain.mjs', redditArgs) });
  } else {
    console.log('━━━ Step 1/3: Reddit Pain Mining (skipped) ━━━\n');
  }

  // Step 2: Trends & Demand Check
  if (!args['skip-trends']) {
    console.log('━━━ Step 2/3: Trends & Demand Check ━━━');
    const trendsArgs = ['--keywords', keywords.join(',')];
    if (args.geo) trendsArgs.push('--geo', args.geo);
    steps.push({ name: 'Trends', success: await runScript('trends-check.mjs', trendsArgs) });
  } else {
    console.log('━━━ Step 2/3: Trends & Demand Check (skipped) ━━━\n');
  }

  // Step 3: Competitor Scan
  if (!args['skip-competitors']) {
    console.log('━━━ Step 3/3: Competitor Scan ━━━');
    const competitorArgs = ['--keywords', keywords[0]];
    steps.push({ name: 'Competitors', success: await runScript('competitor-scan.mjs', competitorArgs) });
  } else {
    console.log('━━━ Step 3/3: Competitor Scan (skipped) ━━━\n');
  }

  // Step 4: Generate Report
  console.log('━━━ Generating Decision Report ━━━');
  const reportArgs = ['--idea', idea, '--data-dir', OUTPUT_DIR];
  if (args.output) reportArgs.push('--output', args.output);
  await runScript('generate-report.mjs', reportArgs);

  // Summary
  const successCount = steps.filter(s => s.success).length;
  const failCount = steps.filter(s => !s.success).length;

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Validation Complete                                        ║
║  ${successCount} data sources succeeded, ${failCount} failed                          ║
║  Report: output/report-*.html                               ║
╚══════════════════════════════════════════════════════════════╝
`);
}

await main();
