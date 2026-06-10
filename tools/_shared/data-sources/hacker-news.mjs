/**
 * Hacker News data source adapter.
 *
 * Uses the Algolia HN Search API (free, no auth).
 * Docs: https://hn.algolia.com/api
 *
 * Config:
 *   - query: string           — search keywords
 *   - tags?: string           — filter tag: 'story' | 'show_hn' | 'ask_hn' | 'comment' (default 'story')
 *   - limit?: number          — results per request (default 20, max 100)
 *   - sort?: 'relevance'|'date' (default 'relevance')
 *   - numericFilters?: string — e.g. 'points>50,num_comments>10'
 */

import { cleanText, toNumber } from "../http-client.mjs";

const HN_API_BASE = "https://hn.algolia.com/api/v1";

export const hackerNewsAdapter = {
  name: "hacker-news",
  label: "Hacker News",
  type: "community",
  requiresAuth: false,
  region: "global",

  async collect(config, http) {
    const query = config.query ?? config.search;
    if (!query) throw new Error("Hacker News adapter requires a query");

    const tags = config.tags ?? "story";
    const limit = clampLimit(config.limit, 20);
    const sortByDate = config.sort === "date";

    const endpoint = sortByDate ? "search_by_date" : "search";
    const params = new URLSearchParams({
      query,
      tags,
      hitsPerPage: String(limit),
    });

    if (config.numericFilters) {
      params.set("numericFilters", config.numericFilters);
    }

    const url = `${HN_API_BASE}/${endpoint}?${params}`;
    const json = await http.getJson(url);

    return parseHits(json, tags);
  },
};

function parseHits(json, community) {
  const hits = json?.hits ?? [];
  return hits
    .filter((hit) => hit?.objectID && (hit.title || hit.story_title))
    .map((hit) => ({
      id: `hn:${hit.objectID}`,
      source: "hacker-news",
      community: community === "show_hn" ? "Show HN" : "Hacker News",
      title: cleanText(hit.title ?? hit.story_title, 180),
      excerpt: cleanText(hit.story_text ?? hit.comment_text ?? "", 360),
      score: toNumber(hit.points),
      comments: toNumber(hit.num_comments),
      createdAt: hit.created_at ?? null,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      tags: hit._tags ?? [],
    }));
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(100, Math.round(num))) : fallback;
}
