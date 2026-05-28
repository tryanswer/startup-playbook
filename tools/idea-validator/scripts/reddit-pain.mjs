#!/usr/bin/env node

/**
 * Reddit Pain Miner — fetch and analyze Reddit posts for pain point evidence.
 *
 * Usage:
 *   node scripts/reddit-pain.mjs --keywords "skin care routine" --subreddits "SkincareAddiction,30PlusSkinCare"
 *   node scripts/reddit-pain.mjs --keywords "invoice freelancer" --limit 50
 *
 * Output: JSON file with extracted pain points, quotes, and frequency analysis.
 */

import { parseArgs } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'output');

const { values: args } = parseArgs({
  options: {
    keywords: { type: 'string' },
    subreddits: { type: 'string', default: '' },
    limit: { type: 'string', default: '100' },
    output: { type: 'string', default: '' },
  },
});

if (!args.keywords) {
  console.error('Usage: node scripts/reddit-pain.mjs --keywords "your search terms"');
  process.exit(1);
}

const keywords = args.keywords;
const subreddits = args.subreddits ? args.subreddits.split(',').map(s => s.trim()) : [];
const limit = parseInt(args.limit, 10);

async function fetchRedditSearch(query, subreddit, fetchLimit) {
  const baseUrl = subreddit
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : 'https://www.reddit.com/search.json';

  const params = new URLSearchParams({
    q: query,
    sort: 'relevance',
    t: 'year',
    limit: String(Math.min(fetchLimit, 100)),
    restrict_sr: subreddit ? 'true' : 'false',
  });

  const url = `${baseUrl}?${params}`;
  console.log(`  Fetching: ${url}`);

  const response = await fetch(url, {
    headers: { 'User-Agent': 'startup-playbook-idea-validator/0.1' },
  });

  if (!response.ok) {
    console.warn(`  Warning: Reddit returned ${response.status} for ${subreddit || 'all'}`);
    return [];
  }

  const data = await response.json();
  const posts = (data?.data?.children || []).map(child => {
    const post = child.data;
    return {
      title: post.title,
      selftext: (post.selftext || '').slice(0, 500),
      subreddit: post.subreddit,
      score: post.score,
      numComments: post.num_comments,
      permalink: `https://reddit.com${post.permalink}`,
      created: new Date(post.created_utc * 1000).toISOString(),
      flair: post.link_flair_text || null,
    };
  });

  return posts;
}

function extractPainSignals(posts) {
  const painKeywords = [
    'frustrated', 'annoying', 'hate', 'wish', 'struggle', 'problem',
    'difficult', 'expensive', 'broken', 'terrible', 'worst', 'help me',
    'looking for', 'alternative', 'recommendation', 'any suggestions',
    'how do i', 'how to', 'can\'t find', 'doesn\'t work', 'paid',
    'subscription', 'worth it', 'free alternative', 'budget',
  ];

  const painPosts = posts.filter(post => {
    const text = `${post.title} ${post.selftext}`.toLowerCase();
    return painKeywords.some(keyword => text.includes(keyword));
  });

  const painThemes = {};
  for (const post of painPosts) {
    const text = `${post.title} ${post.selftext}`.toLowerCase();
    for (const keyword of painKeywords) {
      if (text.includes(keyword)) {
        painThemes[keyword] = (painThemes[keyword] || 0) + 1;
      }
    }
  }

  const sortedThemes = Object.entries(painThemes)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([theme, count]) => ({ theme, count, percentage: Math.round((count / posts.length) * 100) }));

  return {
    totalPosts: posts.length,
    painPosts: painPosts.length,
    painRate: posts.length > 0 ? Math.round((painPosts.length / posts.length) * 100) : 0,
    themes: sortedThemes,
    topQuotes: painPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(post => ({
        quote: post.title,
        detail: post.selftext.slice(0, 200),
        subreddit: post.subreddit,
        score: post.score,
        comments: post.numComments,
        link: post.permalink,
      })),
  };
}

function detectPaymentSignals(posts) {
  const paymentKeywords = [
    'paid', 'subscription', 'price', 'pricing', 'worth paying',
    'free trial', 'premium', 'pro plan', 'upgrade', 'buy',
    'purchase', 'cost', 'budget', 'invest', 'money',
    'would pay', 'shut up and take my money', 'take my money',
  ];

  const paymentPosts = posts.filter(post => {
    const text = `${post.title} ${post.selftext}`.toLowerCase();
    return paymentKeywords.some(keyword => text.includes(keyword));
  });

  return {
    postsWithPaymentSignal: paymentPosts.length,
    paymentRate: posts.length > 0 ? Math.round((paymentPosts.length / posts.length) * 100) : 0,
    samples: paymentPosts.slice(0, 10).map(post => ({
      quote: post.title,
      subreddit: post.subreddit,
      score: post.score,
      link: post.permalink,
    })),
  };
}

async function main() {
  console.log(`\n🔍 Reddit Pain Mining: "${keywords}"\n`);

  let allPosts = [];

  if (subreddits.length > 0) {
    for (const sub of subreddits) {
      const posts = await fetchRedditSearch(keywords, sub, limit);
      allPosts.push(...posts);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } else {
    allPosts = await fetchRedditSearch(keywords, '', limit);
  }

  const uniquePosts = [...new Map(allPosts.map(post => [post.permalink, post])).values()];
  console.log(`\n  Found ${uniquePosts.length} unique posts\n`);

  const painAnalysis = extractPainSignals(uniquePosts);
  const paymentAnalysis = detectPaymentSignals(uniquePosts);

  const result = {
    query: keywords,
    subreddits: subreddits.length > 0 ? subreddits : ['all'],
    fetchedAt: new Date().toISOString(),
    summary: {
      totalPosts: uniquePosts.length,
      painRate: painAnalysis.painRate,
      paymentSignalRate: paymentAnalysis.paymentRate,
    },
    painAnalysis,
    paymentAnalysis,
    rawPosts: uniquePosts,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  const slug = keywords.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const outputPath = args.output || join(OUTPUT_DIR, `reddit-${slug}.json`);
  await writeFile(outputPath, JSON.stringify(result, null, 2));

  console.log(`  Pain rate: ${painAnalysis.painRate}%`);
  console.log(`  Payment signal rate: ${paymentAnalysis.paymentRate}%`);
  console.log(`  Top pain themes: ${painAnalysis.themes.slice(0, 5).map(t => t.theme).join(', ')}`);
  console.log(`\n  Output: ${outputPath}\n`);

  return result;
}

const result = await main();
export default result;
