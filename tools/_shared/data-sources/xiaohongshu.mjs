/**
 * 小红书 (Xiaohongshu / RED) data source adapter.
 *
 * Uses Playwright for browser-based scraping since Xiaohongshu has
 * aggressive anti-bot measures. Falls back to mobile web API if available.
 *
 * Auth: no API key needed, but requires Playwright installed.
 *
 * Config:
 *   - query: string           — search keywords
 *   - limit?: number          — max results (default 20)
 *   - sort?: 'general'|'hot'|'new' (default 'general')
 *   - noteType?: 'all'|'video'|'image' (default 'all')
 *
 * Dependencies: playwright (npm install playwright)
 *
 * Note: Due to anti-bot measures, this adapter may fail in some environments.
 * It gracefully returns an empty array on failure to allow other sources to proceed.
 */

import { cleanText, toNumber } from "../http-client.mjs";

const XHS_BASE = "https://www.xiaohongshu.com";

export const xiaohongshuAdapter = {
  name: "xiaohongshu",
  label: "小红书 (RED)",
  type: "community",
  requiresAuth: false,
  region: "china",

  async collect(config) {
    const query = config.query ?? config.search;
    if (!query) throw new Error("Xiaohongshu adapter requires a query");

    const limit = clampLimit(config.limit, 20);
    const sort = config.sort ?? "general";

    // Try Playwright-based scraping
    try {
      return await scrapeWithPlaywright(query, limit, sort);
    } catch (playwrightError) {
      console.warn(
        `[xiaohongshu] Playwright scraping failed: ${playwrightError.message}`
      );

      // Fallback: try mobile web endpoint
      try {
        return await fetchMobileApi(config, limit);
      } catch (fallbackError) {
        console.warn(
          `[xiaohongshu] Mobile API fallback also failed: ${fallbackError.message}`
        );
        return [];
      }
    }
  },
};

async function scrapeWithPlaywright(query, limit, sort) {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    throw new Error(
      "playwright package not installed. Run: npm install playwright && npx playwright install chromium"
    );
  }

  const chromium = playwright.chromium ?? playwright.default?.chromium;
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      viewport: { width: 390, height: 844 },
      locale: "zh-CN",
    });

    const page = await context.newPage();

    // Navigate to search page
    const sortParam = sort === "hot" ? "&sort=hot" : sort === "new" ? "&sort=time_descending" : "";
    const searchUrl = `${XHS_BASE}/search_result?keyword=${encodeURIComponent(query)}${sortParam}`;
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 20_000 });

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Extract note cards from the page
    const notes = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="note-item"], [class*="search-note"], a[href*="/explore/"]');
      const results = [];

      for (const card of cards) {
        const linkElement = card.closest("a") ?? card.querySelector("a");
        const href = linkElement?.getAttribute("href") ?? "";
        const noteIdMatch = href.match(/\/(?:explore|discovery\/item)\/([a-f0-9]+)/);
        if (!noteIdMatch) continue;

        const titleElement = card.querySelector('[class*="title"], [class*="desc"], .note-text');
        const likeElement = card.querySelector('[class*="like"], [class*="count"]');
        const authorElement = card.querySelector('[class*="author"], [class*="name"]');

        results.push({
          noteId: noteIdMatch[1],
          title: titleElement?.textContent?.trim() ?? "",
          likes: likeElement?.textContent?.trim() ?? "0",
          author: authorElement?.textContent?.trim() ?? "",
          href,
        });
      }

      return results;
    });

    await browser.close();

    return notes
      .slice(0, limit)
      .filter((note) => note.noteId && note.title)
      .map((note) => ({
        id: `xhs:${note.noteId}`,
        source: "xiaohongshu",
        community: "小红书",
        title: cleanText(note.title, 180),
        excerpt: "",
        score: parseLikeCount(note.likes),
        comments: 0,
        createdAt: null,
        url: `${XHS_BASE}/explore/${note.noteId}`,
        author: note.author,
        tags: [],
      }));
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function fetchMobileApi(config, limit) {
  // Mobile web API as fallback (may not always work)
  const query = config.query ?? config.search;
  const url = `${XHS_BASE}/fe_api/burdock/weixin/v2/search/notes?keyword=${encodeURIComponent(query)}&page=1&page_size=${limit}`;

  const response = await globalThis.fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      accept: "application/json",
      referer: `${XHS_BASE}/`,
    },
  });

  if (!response.ok) {
    throw new Error(`Xiaohongshu mobile API returned ${response.status}`);
  }

  const json = await response.json();
  const notes = json?.data?.notes ?? json?.data?.items ?? [];

  return notes
    .filter((note) => note?.id || note?.note_id)
    .slice(0, limit)
    .map((note) => ({
      id: `xhs:${note.id ?? note.note_id}`,
      source: "xiaohongshu",
      community: "小红书",
      title: cleanText(note.title ?? note.display_title ?? "", 180),
      excerpt: cleanText(note.desc ?? note.note_card?.desc ?? "", 360),
      score: toNumber(note.likes ?? note.liked_count),
      comments: toNumber(note.comments ?? note.comment_count),
      createdAt: null,
      url: `${XHS_BASE}/explore/${note.id ?? note.note_id}`,
      author: note.user?.nickname ?? null,
      tags: (note.tag_list ?? []).map((t) => t.name).slice(0, 5),
    }));
}

/**
 * Parse display like counts (e.g. "1.2万", "523", "2k").
 */
function parseLikeCount(text) {
  if (!text) return 0;
  const cleaned = String(text).trim().toLowerCase();
  if (cleaned.includes("万") || cleaned.includes("w")) {
    return Math.round(parseFloat(cleaned) * 10000) || 0;
  }
  if (cleaned.includes("k")) {
    return Math.round(parseFloat(cleaned) * 1000) || 0;
  }
  return toNumber(cleaned.replace(/[^\d.]/g, ""));
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(50, Math.round(num))) : fallback;
}
