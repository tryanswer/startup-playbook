/**
 * 知乎 (Zhihu) data source adapter.
 *
 * Uses web scraping with Cheerio for HTML parsing.
 * No auth required, but rate limits apply (~1 req/2s recommended).
 *
 * Config:
 *   - query: string           — search keywords
 *   - type?: 'content'|'topic'|'people' (default 'content')
 *   - limit?: number          — max results (default 20)
 *   - mode?: 'search'|'hot'   — fetch search results or hot questions (default 'search')
 *
 * Note: Zhihu may block requests. If blocked, adapter returns empty array
 * instead of throwing, allowing other sources to continue.
 */

import { cleanText, toNumber } from "../http-client.mjs";

const ZHIHU_BASE = "https://www.zhihu.com";

export const zhihuAdapter = {
  name: "zhihu",
  label: "知乎 (Zhihu)",
  type: "community",
  requiresAuth: false,
  region: "china",

  async collect(config, http) {
    const mode = config.mode ?? "search";
    const limit = clampLimit(config.limit, 20);

    if (mode === "hot") {
      return fetchHotQuestions(http, limit);
    }

    const query = config.query ?? config.search;
    if (!query) throw new Error("Zhihu adapter requires a query in search mode");

    return fetchSearchResults(http, query, config.type ?? "content", limit);
  },
};

async function fetchHotQuestions(http, limit) {
  const url = `${ZHIHU_BASE}/api/v3/feed/topstory/hot-lists/total?limit=${limit}`;

  try {
    const json = await http.getJson(url, {
      headers: zhihuHeaders(),
    });

    return (json?.data ?? [])
      .filter((item) => item?.target)
      .map((item) => {
        const target = item.target;
        return {
          id: `zhihu:hot:${target.id}`,
          source: "zhihu",
          community: "知乎热榜",
          title: cleanText(target.title ?? "", 180),
          excerpt: cleanText(target.excerpt ?? "", 360),
          score: toNumber(item.detail_text?.replace(/[^\d]/g, "")),
          comments: toNumber(target.answer_count),
          createdAt: target.created
            ? new Date(target.created * 1000).toISOString()
            : null,
          url: `${ZHIHU_BASE}/question/${target.id}`,
          tags: [],
        };
      });
  } catch (error) {
    // Zhihu may block; return empty to allow other sources to proceed
    console.warn(`[zhihu] Hot questions fetch failed: ${error.message}`);
    return [];
  }
}

async function fetchSearchResults(http, query, type, limit) {
  // Zhihu search API
  const params = new URLSearchParams({
    q: query,
    t: type,
    correction: "1",
    offset: "0",
    limit: String(limit),
  });

  const url = `${ZHIHU_BASE}/api/v4/search_v3?${params}`;

  try {
    const html = await http.getText(url, {
      headers: zhihuHeaders(),
    });

    // Try JSON parse first (API may return JSON)
    try {
      const json = JSON.parse(html);
      return parseSearchJson(json);
    } catch {
      // Fall back to HTML parsing if response is HTML
      return parseSearchHtml(html, query);
    }
  } catch (error) {
    console.warn(`[zhihu] Search failed: ${error.message}`);
    return [];
  }
}

function parseSearchJson(json) {
  return (json?.data ?? [])
    .filter((item) => item?.object)
    .map((item) => {
      const obj = item.object;
      const isQuestion = obj.type === "question";
      const isAnswer = obj.type === "answer";
      const isArticle = obj.type === "article";

      const questionId = isQuestion
        ? obj.id
        : (isAnswer ? obj.question?.id : null);

      return {
        id: `zhihu:${obj.type}:${obj.id}`,
        source: "zhihu",
        community: "知乎",
        title: cleanText(
          isQuestion ? obj.title
          : isAnswer ? (obj.question?.title ?? obj.excerpt)
          : (obj.title ?? ""),
          180
        ),
        excerpt: cleanText(obj.excerpt ?? obj.content ?? "", 360),
        score: toNumber(obj.voteup_count ?? obj.vote_count),
        comments: toNumber(obj.comment_count ?? obj.answer_count),
        createdAt: obj.created_time
          ? new Date(obj.created_time * 1000).toISOString()
          : null,
        url: isArticle
          ? `${ZHIHU_BASE}/p/${obj.id}`
          : questionId
            ? `${ZHIHU_BASE}/question/${questionId}`
            : null,
        tags: [],
      };
    })
    .filter((item) => item.title);
}

function parseSearchHtml(html, query) {
  // Simplified HTML parsing fallback
  const results = [];
  const titlePattern = /class="[^"]*ContentItem-title[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = titlePattern.exec(html)) !== null) {
    const href = match[1];
    const title = cleanText(stripHtml(match[2]), 180);
    if (!title) continue;

    const id = href.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
    results.push({
      id: `zhihu:search:${id}`,
      source: "zhihu",
      community: "知乎",
      title,
      excerpt: "",
      score: 0,
      comments: 0,
      createdAt: null,
      url: href.startsWith("http") ? href : `${ZHIHU_BASE}${href}`,
      tags: [],
    });
  }

  return results;
}

function zhihuHeaders() {
  return {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    referer: "https://www.zhihu.com/",
  };
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(50, Math.round(num))) : fallback;
}
