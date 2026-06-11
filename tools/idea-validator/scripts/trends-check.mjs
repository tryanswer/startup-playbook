#!/usr/bin/env node

/**
 * Trends Check — query Google autocomplete for demand signals.
 *
 * Delegates data collection to the unified _shared/data-sources/google-autocomplete
 * adapter, then runs local classification and demand assessment.
 *
 * Usage:
 *   node scripts/trends-check.mjs --keywords "ai skin care,skin analysis app"
 *   node scripts/trends-check.mjs --keywords "invoice tool freelancer" --geo US
 *
 * Output: JSON file with trend direction, related queries, and autocomplete suggestions.
 */

import { parseArgs } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectFromSources } from '../../_shared/data-sources/index.mjs';
import { loadCredentials } from '../../_shared/credentials.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'output');

const { values: args } = parseArgs({
  options: {
    keywords: { type: 'string' },
    geo: { type: 'string', default: '' },
    output: { type: 'string', default: '' },
  },
});

if (!args.keywords) {
  console.error('Usage: node scripts/trends-check.mjs --keywords "keyword1,keyword2"');
  process.exit(1);
}

const keywords = args.keywords.split(',').map(k => k.trim());
const geo = args.geo;

/**
 * Fetch autocomplete suggestions for a keyword using the unified adapter.
 * Returns raw suggestion strings like the original fetchGoogleTrendsRelated().
 */
async function fetchGoogleTrendsRelated(keyword) {
  await loadCredentials();

  const { items } = await collectFromSources([{
    type: 'google-autocomplete',
    query: keyword,
  }], { credentials: {} });

  // The adapter returns items with title = suggestion text
  return [...new Set(items.map(item => item.title))];
}

function classifySuggestions(suggestions, keyword) {
  const categories = {
    problemAware: [],     // "how to", "why", "help", "fix"
    solutionAware: [],    // "best", "top", "tool", "app", "software"
    buyerIntent: [],      // "pricing", "cost", "buy", "subscribe", "vs", "alternative", "review"
    informational: [],    // everything else
  };

  const problemPatterns = /^(how|why|what|can i|help|fix|solve|struggle|problem)/i;
  const solutionPatterns = /(best|top|tool|app|software|platform|service|recommend)/i;
  const buyerPatterns = /(pric|cost|buy|subscri|vs |versus|alternative|review|worth|cheap|free|paid|plan)/i;

  for (const suggestion of suggestions) {
    const normalized = suggestion.toLowerCase();
    if (buyerPatterns.test(normalized)) {
      categories.buyerIntent.push(suggestion);
    } else if (solutionPatterns.test(normalized)) {
      categories.solutionAware.push(suggestion);
    } else if (problemPatterns.test(normalized)) {
      categories.problemAware.push(suggestion);
    } else {
      categories.informational.push(suggestion);
    }
  }

  return categories;
}

function assessDemandSignal(categories) {
  const totalSignals = Object.values(categories).flat().length;
  if (totalSignals === 0) return { level: 'none', score: 0, reason: 'No autocomplete suggestions found' };

  const buyerCount = categories.buyerIntent.length;
  const solutionCount = categories.solutionAware.length;
  const problemCount = categories.problemAware.length;
  const commercialSignals = buyerCount + solutionCount;

  const score = Math.min(100, Math.round(
    (buyerCount * 15) + (solutionCount * 10) + (problemCount * 5) + (totalSignals * 2)
  ));

  let level, reason;
  if (buyerCount >= 5 && solutionCount >= 3) {
    level = 'strong';
    reason = `${buyerCount} buyer-intent queries + ${solutionCount} solution-aware queries indicate active market`;
  } else if (commercialSignals >= 5) {
    level = 'moderate';
    reason = `${commercialSignals} commercial signals suggest existing demand, but may need niche validation`;
  } else if (problemCount >= 3) {
    level = 'early';
    reason = `${problemCount} problem-aware queries but few commercial signals — demand exists, market is immature`;
  } else {
    level = 'weak';
    reason = `Only ${totalSignals} total suggestions with ${commercialSignals} commercial signals — limited evidence`;
  }

  return { level, score, reason, totalSignals, buyerCount, solutionCount, problemCount };
}

async function main() {
  console.log(`\n📊 Trends & Demand Check: ${keywords.join(', ')}\n`);

  const results = {};

  for (const keyword of keywords) {
    console.log(`  Checking: "${keyword}"...`);
    const suggestions = await fetchGoogleTrendsRelated(keyword);
    const categories = classifySuggestions(suggestions, keyword);
    const signal = assessDemandSignal(categories);

    results[keyword] = {
      totalSuggestions: suggestions.length,
      categories,
      demandSignal: signal,
    };

    console.log(`    ${suggestions.length} suggestions, demand: ${signal.level} (score: ${signal.score})`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Overall assessment
  const scores = Object.values(results).map(r => r.demandSignal.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const allBuyerQueries = Object.values(results).flatMap(r => r.categories.buyerIntent);

  const output = {
    keywords,
    geo: geo || 'global',
    fetchedAt: new Date().toISOString(),
    summary: {
      averageDemandScore: avgScore,
      totalBuyerIntentQueries: allBuyerQueries.length,
      overallSignal: avgScore >= 60 ? 'strong' : avgScore >= 35 ? 'moderate' : avgScore >= 15 ? 'early' : 'weak',
    },
    perKeyword: results,
    allBuyerIntentQueries: [...new Set(allBuyerQueries)],
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  const slug = keywords[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const outputPath = args.output || join(OUTPUT_DIR, `trends-${slug}.json`);
  await writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n  Overall demand signal: ${output.summary.overallSignal} (score: ${avgScore})`);
  console.log(`  Buyer intent queries: ${allBuyerQueries.length}`);
  console.log(`  Output: ${outputPath}\n`);

  return output;
}

const result = await main();
export default result;
