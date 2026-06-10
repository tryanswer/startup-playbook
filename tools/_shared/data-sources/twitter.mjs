/**
 * Twitter/X data source adapter.
 *
 * Uses the Twitter API v2 (recent search endpoint).
 * Auth: requires TWITTER_BEARER_TOKEN.
 *
 * Config:
 *   - query: string           — search query (supports Twitter search operators)
 *   - limit?: number          — max results (default 20, max 100)
 *   - sort?: 'recency'|'relevancy' (default 'recency')
 *   - tweetFields?: string[]  — additional fields to request
 *
 * Twitter search operators reference:
 *   - "keyword" — exact match
 *   - from:username — tweets from user
 *   - -is:retweet — exclude retweets
 *   - has:links — only tweets with links
 *   - lang:en — language filter
 */

import { cleanText, toNumber } from "../http-client.mjs";

const TWITTER_API_BASE = "https://api.twitter.com/2";

export const twitterAdapter = {
  name: "twitter",
  label: "Twitter / X",
  type: "community",
  requiresAuth: true,
  region: "global",

  async collect(config, http, credentials = {}) {
    const token = credentials.TWITTER_BEARER_TOKEN ?? config.token;
    if (!token) throw new Error("Twitter adapter requires TWITTER_BEARER_TOKEN");

    const query = config.query ?? config.search;
    if (!query) throw new Error("Twitter adapter requires a query");

    const limit = clampLimit(config.limit, 20);
    const sortOrder = config.sort === "relevancy" ? "relevancy" : "recency";

    const tweetFields = (config.tweetFields ?? [
      "created_at",
      "public_metrics",
      "author_id",
      "conversation_id",
      "lang",
    ]).join(",");

    const params = new URLSearchParams({
      query,
      max_results: String(limit),
      sort_order: sortOrder,
      "tweet.fields": tweetFields,
    });

    const url = `${TWITTER_API_BASE}/tweets/search/recent?${params}`;
    const json = await http.getJson(url, {
      headers: { authorization: `Bearer ${token}` },
    });

    return parseTweets(json);
  },
};

function parseTweets(json) {
  const tweets = json?.data ?? [];

  return tweets
    .filter((tweet) => tweet?.id && tweet?.text)
    .map((tweet) => {
      const metrics = tweet.public_metrics ?? {};
      return {
        id: `twitter:${tweet.id}`,
        source: "twitter",
        community: "Twitter / X",
        title: cleanText(tweet.text, 180),
        excerpt: cleanText(tweet.text, 360),
        score: toNumber(metrics.like_count) + toNumber(metrics.retweet_count),
        comments: toNumber(metrics.reply_count),
        createdAt: tweet.created_at ?? null,
        url: `https://x.com/i/status/${tweet.id}`,
        authorId: tweet.author_id ?? null,
        lang: tweet.lang ?? null,
        metrics: {
          likes: toNumber(metrics.like_count),
          retweets: toNumber(metrics.retweet_count),
          replies: toNumber(metrics.reply_count),
          quotes: toNumber(metrics.quote_count),
          impressions: toNumber(metrics.impression_count),
        },
      };
    });
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  // Twitter API v2 requires min 10, max 100
  return Number.isFinite(num) ? Math.max(10, Math.min(100, Math.round(num))) : fallback;
}
