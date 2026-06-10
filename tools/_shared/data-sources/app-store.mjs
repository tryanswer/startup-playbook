/**
 * App Store data source adapter.
 *
 * Uses the `app-store-scraper` npm package (~1.5k stars, stable).
 * No auth required, free to use.
 *
 * Config:
 *   - query: string           — search term
 *   - country?: string        — country code, e.g. 'us', 'cn' (default 'us')
 *   - num?: number            — max results (default 20, max 200)
 *   - category?: number       — App Store category ID
 *   - collection?: string     — e.g. 'TOP_FREE', 'TOP_PAID', 'NEW_FREE'
 */

import { cleanText, toNumber } from "../http-client.mjs";

export const appStoreAdapter = {
  name: "app-store",
  label: "App Store",
  type: "review",
  requiresAuth: false,
  region: "global",

  async collect(config, http) {
    let store;
    try {
      store = await import("app-store-scraper");
      store = store.default ?? store;
    } catch {
      throw new Error(
        "app-store-scraper package not installed. Run: npm install app-store-scraper"
      );
    }

    const query = config.query ?? config.search;
    if (!query && !config.collection) {
      throw new Error("App Store adapter requires a query or collection");
    }

    const country = config.country ?? "us";
    const num = clampLimit(config.num ?? config.limit, 20, 200);

    // Search mode
    if (query) {
      const apps = await store.search({
        term: query,
        country,
        num,
      });
      return parseApps(apps);
    }

    // Collection mode (e.g. top free, top paid)
    const collectionMap = {
      TOP_FREE: store.collection?.TOP_FREE ?? 1,
      TOP_PAID: store.collection?.TOP_PAID ?? 2,
      NEW_FREE: store.collection?.NEW_FREE ?? 3,
      NEW_PAID: store.collection?.NEW_PAID ?? 4,
    };

    const collectionId = collectionMap[config.collection] ?? config.collection;
    const apps = await store.list({
      collection: collectionId,
      country,
      num,
      category: config.category,
    });

    return parseApps(apps);
  },
};

function parseApps(apps) {
  return (apps ?? [])
    .filter((app) => app?.appId || app?.id)
    .map((app) => ({
      id: `appstore:${app.appId ?? app.id}`,
      source: "app-store",
      title: cleanText(app.title ?? app.appId ?? "", 180),
      url: app.url ?? null,
      targetUser: cleanText(app.developer ?? "", 120),
      pain: cleanText(app.description ?? app.summary ?? "", 300),
      productShape: `iOS app — ${cleanText(app.primaryGenre ?? app.genre ?? "", 60)}`,
      pricing: app.free === false ? `$${app.price ?? "paid"}` : "free",
      revenue: null,
      score: toNumber(app.score, 0),
      reviews: toNumber(app.reviews, 0),
      ratings: toNumber(app.ratings, 0),
      version: app.version ?? null,
      icon: app.icon ?? null,
      createdAt: app.released ?? app.updated ?? null,
      tags: (app.genres ?? []).slice(0, 5),
    }));
}

function clampLimit(value, fallback, max = 100) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(max, Math.round(num))) : fallback;
}
