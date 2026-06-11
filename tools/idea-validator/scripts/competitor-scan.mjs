#!/usr/bin/env node

/**
 * Competitor Scan — find existing solutions via Google autocomplete.
 *
 * Delegates data collection to the unified _shared/data-sources/google-autocomplete
 * adapter, then runs local competitor extraction and market maturity assessment.
 *
 * Usage:
 *   node scripts/competitor-scan.mjs --keywords "ai skin analysis"
 *
 * Output: JSON file with competitor signals, pricing patterns, and market maturity.
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
    output: { type: 'string', default: '' },
  },
});

if (!args.keywords) {
  console.error('Usage: node scripts/competitor-scan.mjs --keywords "your search terms"');
  process.exit(1);
}

const keywords = args.keywords;

/**
 * Scan competitor signals using the unified google-autocomplete adapter.
 * Queries multiple variations (app, tool, alternative, vs, etc.)
 * and returns { query, suggestion } pairs.
 */
async function scanCompetitorSignals(keyword) {
  await loadCredentials();

  const queries = [
    `${keyword} app`,
    `${keyword} tool`,
    `${keyword} software`,
    `${keyword} alternative`,
    `${keyword} vs`,
    `${keyword} pricing`,
    `${keyword} review`,
    `${keyword} free`,
    `best ${keyword}`,
    `top ${keyword}`,
  ];

  const allSuggestions = [];
  for (const queryString of queries) {
    const { items } = await collectFromSources([{
      type: 'google-autocomplete',
      query: queryString,
    }], { credentials: {} });

    allSuggestions.push(...items.map(item => ({
      query: queryString,
      suggestion: item.title,
    })));
  }

  return allSuggestions;
}

function extractCompetitorNames(suggestions) {
  const competitorPatterns = /\b(vs|versus|or|alternative to|compared to|better than)\s+(.+)/i;
  const competitors = new Set();

  for (const { suggestion } of suggestions) {
    const match = suggestion.match(competitorPatterns);
    if (match) {
      competitors.add(match[2].trim());
    }
  }

  // Also extract brand names from "X app", "X tool", "X pricing" patterns
  const brandPattern = /^(.+?)\s+(app|tool|software|pricing|review|alternative|free|pro|premium)$/i;
  for (const { suggestion } of suggestions) {
    const match = suggestion.match(brandPattern);
    if (match && match[1].split(' ').length <= 3) {
      competitors.add(match[1].trim());
    }
  }

  return [...competitors];
}

function assessMarketMaturity(suggestions, competitors) {
  const hasPricingQueries = suggestions.some(s => /pricing|cost|plan|subscribe/i.test(s.suggestion));
  const hasAlternativeQueries = suggestions.some(s => /alternative|vs|compared/i.test(s.suggestion));
  const hasReviewQueries = suggestions.some(s => /review|worth|honest/i.test(s.suggestion));
  const hasFreeQueries = suggestions.some(s => /free|open.?source/i.test(s.suggestion));

  let maturity, implication;

  if (competitors.length >= 5 && hasPricingQueries && hasAlternativeQueries) {
    maturity = 'mature';
    implication = 'Established market with known players. Must differentiate on niche, price, or UX. Validation is easier (demand proven) but competition is real.';
  } else if (competitors.length >= 2 && (hasPricingQueries || hasReviewQueries)) {
    maturity = 'growing';
    implication = 'Market exists with some players. Good timing — demand is validated but not saturated. Focus on underserved segment.';
  } else if (competitors.length >= 1 || hasAlternativeQueries) {
    maturity = 'early';
    implication = 'Few competitors. Market may be emerging or niche. Higher risk but also higher potential. Validate demand carefully.';
  } else {
    maturity = 'nascent';
    implication = 'No clear competitors found. Either the market does not exist yet, or the search terms are too niche. Validate demand before building.';
  }

  return {
    maturity,
    implication,
    competitorCount: competitors.length,
    signals: {
      hasPricingQueries,
      hasAlternativeQueries,
      hasReviewQueries,
      hasFreeQueries,
    },
  };
}

async function main() {
  console.log(`\n🏢 Competitor Scan: "${keywords}"\n`);

  const suggestions = await scanCompetitorSignals(keywords);
  const competitors = extractCompetitorNames(suggestions);
  const marketAssessment = assessMarketMaturity(suggestions, competitors);

  console.log(`  Found ${suggestions.length} suggestions, ${competitors.length} potential competitors`);
  console.log(`  Market maturity: ${marketAssessment.maturity}`);

  const result = {
    query: keywords,
    fetchedAt: new Date().toISOString(),
    summary: {
      competitorCount: competitors.length,
      marketMaturity: marketAssessment.maturity,
      totalSuggestions: suggestions.length,
    },
    competitors,
    marketAssessment,
    allSuggestions: suggestions,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  const slug = keywords.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const outputPath = args.output || join(OUTPUT_DIR, `competitors-${slug}.json`);
  await writeFile(outputPath, JSON.stringify(result, null, 2));

  console.log(`  Output: ${outputPath}\n`);
  return result;
}

const result = await main();
export default result;
