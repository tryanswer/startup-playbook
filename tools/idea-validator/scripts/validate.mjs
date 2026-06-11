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
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

import { collectFromSources } from '../../_shared/data-sources/index.mjs';
import { loadCredentials, getCredential } from '../../_shared/credentials.mjs';

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

/**
 * Run a single data collection step using the unified _shared/data-sources/ framework.
 * Returns { name, success, data? }
 */
async function runCollectionStep(stepName, sourceConfigs, credentials) {
  try {
    const { items, errors } = await collectFromSources(sourceConfigs, {
      credentials,
      onProgress: (source, status, count) => {
        if (status === 'done') console.log(`    ✅ ${source}: ${count} items`);
        else if (status === 'error') console.log(`    ❌ ${source}: failed`);
      },
    });
    if (errors.length > 0) {
      for (const error of errors) {
        console.warn(`    ⚠️ ${error.source}: ${error.error}`);
      }
    }
    return { name: stepName, success: true, items };
  } catch (error) {
    console.warn(`  ⚠️ ${stepName} failed: ${error.message}`);
    return { name: stepName, success: false, items: [] };
  }
}

/**
 * Run generate-report.mjs as a subprocess (it has its own HTML template logic).
 */
async function runReportGenerator(idea, dataDir, outputPath) {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);

  const scriptPath = join(SCRIPTS_DIR, 'generate-report.mjs');
  const reportArgs = ['--idea', idea, '--data-dir', dataDir];
  if (outputPath) reportArgs.push('--output', outputPath);

  try {
    const { stdout, stderr } = await execFileAsync('node', [scriptPath, ...reportArgs], {
      cwd: join(__dirname, '..'),
      timeout: 60_000,
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    return true;
  } catch (error) {
    console.warn(`  ⚠️ Report generation failed: ${error.message}`);
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
║  Powered by unified _shared/data-sources/ framework         ║
╚══════════════════════════════════════════════════════════════╝

  Idea: ${idea}
  Keywords: ${keywords.join(', ')}
  ${args.subreddits ? `Subreddits: ${args.subreddits}` : 'Subreddits: auto-search'}
  ${args.geo ? `Geo: ${args.geo}` : 'Geo: global'}
`);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await loadCredentials();

  const credentials = {};
  for (const key of ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET', 'REDDIT_USERNAME']) {
    const value = getCredential(key);
    if (value) credentials[key] = value;
  }

  const steps = [];
  const slug = keywords[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  // Step 1: Reddit Pain Mining
  if (!args['skip-reddit']) {
    console.log('━━━ Step 1/3: Reddit Pain Mining ━━━');
    const subreddits = args.subreddits ? args.subreddits.split(',').map(s => s.trim()) : undefined;
    const result = await runCollectionStep('Reddit', [{
      type: 'reddit',
      query: keywords[0],
      communities: subreddits,
      limit: parseInt(args.limit, 10),
    }], credentials);

    if (result.success && result.items.length > 0) {
      // Write in idea-validator format for generate-report.mjs compatibility
      const posts = result.items.map(item => ({
        title: item.title ?? '', selftext: (item.excerpt ?? '').slice(0, 500),
        subreddit: item.community ?? 'reddit', score: item.score ?? 0,
        numComments: item.comments ?? 0, permalink: item.url ?? '',
        created: item.createdAt ?? new Date().toISOString(), flair: null,
      }));

      // Import analysis functions from reddit-pain.mjs logic inline
      const painKeywords = [
        'frustrated', 'annoying', 'hate', 'wish', 'struggle', 'problem',
        'difficult', 'expensive', 'broken', 'terrible', 'worst', 'help me',
        'looking for', 'alternative', 'recommendation', 'any suggestions',
        'how do i', 'how to', "can't find", "doesn't work", 'paid',
        'subscription', 'worth it', 'free alternative', 'budget',
      ];
      const painPosts = posts.filter(p => {
        const text = `${p.title} ${p.selftext}`.toLowerCase();
        return painKeywords.some(kw => text.includes(kw));
      });
      const painRate = posts.length > 0 ? Math.round((painPosts.length / posts.length) * 100) : 0;

      const paymentKeywords = [
        'paid', 'subscription', 'price', 'pricing', 'worth paying',
        'free trial', 'premium', 'pro plan', 'upgrade', 'buy',
        'purchase', 'cost', 'budget', 'invest', 'money',
        'would pay', 'shut up and take my money', 'take my money',
      ];
      const paymentPosts = posts.filter(p => {
        const text = `${p.title} ${p.selftext}`.toLowerCase();
        return paymentKeywords.some(kw => text.includes(kw));
      });
      const paymentRate = posts.length > 0 ? Math.round((paymentPosts.length / posts.length) * 100) : 0;

      const redditData = {
        query: keywords[0], subreddits: subreddits ?? ['all'],
        fetchedAt: new Date().toISOString(),
        summary: { totalPosts: posts.length, painRate, paymentSignalRate: paymentRate },
        painAnalysis: { totalPosts: posts.length, painPosts: painPosts.length, painRate, themes: [], topQuotes: [] },
        paymentAnalysis: { postsWithPaymentSignal: paymentPosts.length, paymentRate, samples: [] },
        rawPosts: posts,
      };
      await writeFile(join(OUTPUT_DIR, `reddit-${slug}.json`), JSON.stringify(redditData, null, 2));
      console.log(`    Pain rate: ${painRate}%, Payment signal: ${paymentRate}%`);
    }
    steps.push(result);
  } else {
    console.log('━━━ Step 1/3: Reddit Pain Mining (skipped) ━━━\n');
  }

  // Step 2: Trends & Demand Check
  if (!args['skip-trends']) {
    console.log('━━━ Step 2/3: Trends & Demand Check ━━━');
    const trendsConfigs = keywords.map(kw => ({ type: 'google-autocomplete', query: kw }));
    const result = await runCollectionStep('Trends', trendsConfigs, {});

    if (result.success && result.items.length > 0) {
      const suggestions = result.items.map(item => item.title);
      const buyerPatterns = /(pric|cost|buy|subscri|vs |versus|alternative|review|worth|cheap|free|paid|plan)/i;
      const solutionPatterns = /(best|top|tool|app|software|platform|service|recommend)/i;
      const buyerIntent = suggestions.filter(s => buyerPatterns.test(s));
      const score = Math.min(100, Math.round(buyerIntent.length * 15 + suggestions.length * 2));
      const overallSignal = score >= 60 ? 'strong' : score >= 35 ? 'moderate' : score >= 15 ? 'early' : 'weak';

      const trendsData = {
        keywords, geo: args.geo || 'global', fetchedAt: new Date().toISOString(),
        summary: { averageDemandScore: score, totalBuyerIntentQueries: buyerIntent.length, overallSignal },
        perKeyword: {}, allBuyerIntentQueries: buyerIntent,
      };
      await writeFile(join(OUTPUT_DIR, `trends-${slug}.json`), JSON.stringify(trendsData, null, 2));
      console.log(`    Demand signal: ${overallSignal} (score: ${score})`);
    }
    steps.push(result);
  } else {
    console.log('━━━ Step 2/3: Trends & Demand Check (skipped) ━━━\n');
  }

  // Step 3: Competitor Scan
  if (!args['skip-competitors']) {
    console.log('━━━ Step 3/3: Competitor Scan ━━━');
    const competitorQueries = [
      `${keywords[0]} app`, `${keywords[0]} tool`, `${keywords[0]} alternative`,
      `${keywords[0]} vs`, `${keywords[0]} pricing`, `best ${keywords[0]}`,
    ];
    const competitorConfigs = competitorQueries.map(q => ({ type: 'google-autocomplete', query: q }));
    const result = await runCollectionStep('Competitors', competitorConfigs, {});

    if (result.success) {
      const suggestions = result.items.map(item => ({ query: '', suggestion: item.title }));
      const competitorPattern = /\b(vs|versus|or|alternative to|compared to|better than)\s+(.+)/i;
      const competitors = [...new Set(
        suggestions.map(s => s.suggestion.match(competitorPattern)?.[2]?.trim()).filter(Boolean)
      )];
      const maturity = competitors.length >= 5 ? 'mature' : competitors.length >= 2 ? 'growing' : competitors.length >= 1 ? 'early' : 'nascent';

      const competitorData = {
        query: keywords[0], fetchedAt: new Date().toISOString(),
        summary: { competitorCount: competitors.length, marketMaturity: maturity, totalSuggestions: suggestions.length },
        competitors, marketAssessment: { maturity, competitorCount: competitors.length },
        allSuggestions: suggestions,
      };
      await writeFile(join(OUTPUT_DIR, `competitors-${slug}.json`), JSON.stringify(competitorData, null, 2));
      console.log(`    Competitors: ${competitors.length}, Maturity: ${maturity}`);
    }
    steps.push(result);
  } else {
    console.log('━━━ Step 3/3: Competitor Scan (skipped) ━━━\n');
  }

  // Step 4: Generate Report
  console.log('\n━━━ Generating Decision Report ━━━');
  await runReportGenerator(idea, OUTPUT_DIR, args.output || null);

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
