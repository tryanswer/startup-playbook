/**
 * Data source bridge for Opportunity Radar.
 *
 * Delegates all data collection to the unified _shared/data-sources/ framework,
 * then splits results into communities (Post format) and cases (Case format)
 * to maintain backward compatibility with radar.mjs.
 *
 * This replaced 502 lines of independent fetch logic with a thin adapter layer.
 */

import { collectFromSources } from "../../_shared/data-sources/index.mjs";
import { loadCredentials, getCredential } from "../../_shared/credentials.mjs";

/* ------------------------------------------------------------------ */
/*  Source type classification                                         */
/* ------------------------------------------------------------------ */

/** Sources that produce community posts (pain signals) */
const COMMUNITY_SOURCES = new Set(["reddit", "hacker-news"]);

/** Sources that produce case studies (supply signals) */
const CASE_SOURCES = new Set(["github", "product-hunt"]);

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetch data from radar source configs using the unified data-sources framework.
 *
 * Converts radar-style source configs to _shared/data-sources/ format,
 * collects data, then splits results into communities + cases buckets.
 *
 * @param {Array} sources — radar source config objects
 * @param {Object} [options]
 * @param {boolean} [options.failFast=false]
 * @param {string} [options.githubToken]
 * @param {string} [options.productHuntToken]
 * @returns {{ communities: Post[], cases: Case[], errors: Error[] }}
 */
export async function fetchRadarSources(sources, options = {}) {
  if (!sources?.length) return { communities: [], cases: [], errors: [] };

  await loadCredentials();

  // Build credentials map from options + env
  const credentials = {
    ...buildCredentialsMap(),
    ...(options.githubToken ? { GITHUB_TOKEN: options.githubToken } : {}),
    ...(options.productHuntToken ? { PRODUCT_HUNT_TOKEN: options.productHuntToken } : {}),
  };

  // Convert radar source configs to unified format
  const unifiedConfigs = sources
    .map((source) => convertSourceConfig(source))
    .filter(Boolean);

  const result = await collectFromSources(unifiedConfigs, {
    failFast: options.failFast ?? false,
    credentials,
    onProgress: options.onProgress,
  });

  // Split items into communities (posts) and cases
  const communities = [];
  const cases = [];

  for (const item of result.items) {
    if (COMMUNITY_SOURCES.has(item.source)) {
      communities.push(item);
    } else if (CASE_SOURCES.has(item.source)) {
      cases.push(enrichCaseItem(item));
    } else {
      // Default: items with community field go to communities, others to cases
      if (item.community) communities.push(item);
      else cases.push(enrichCaseItem(item));
    }
  }

  return {
    communities,
    cases,
    errors: result.errors,
  };
}

/**
 * Legacy compatibility: build a community source URL.
 * Kept for test compatibility — new code should not use this directly.
 */
export function buildCommunitySourceUrl(source) {
  if (source.type === "reddit") {
    const community = source.community;
    if (!community) throw new Error("reddit source requires community");
    const limit = clampLimit(source.limit, 25);
    if (source.search) {
      const params = new URLSearchParams({
        q: source.search, restrict_sr: "1",
        sort: source.sort ?? "relevance", limit: String(limit),
      });
      return `https://www.reddit.com/r/${encodeURIComponent(community)}/search.json?${params.toString()}`;
    }
    const listing = source.listing ?? "hot";
    const params = new URLSearchParams();
    if (listing === "top") params.set("t", source.time ?? "week");
    params.set("limit", String(limit));
    return `https://www.reddit.com/r/${encodeURIComponent(community)}/${listing}.json?${params.toString()}`;
  }
  if (source.type === "hacker-news" || source.type === "show-hn") {
    const query = source.query ?? source.search;
    if (!query) throw new Error(`${source.type} source requires query`);
    const tags = source.type === "show-hn" ? "show_hn" : (source.tags ?? "story");
    const params = new URLSearchParams({
      query, tags, hitsPerPage: String(clampLimit(source.limit, 20)),
    });
    return `https://hn.algolia.com/api/v1/search?${params.toString()}`;
  }
  if (source.type === "github") {
    const query = source.query ?? source.search;
    if (!query) throw new Error("github source requires query");
    const queryString = source.minStars ? `${query} stars:>=${Number(source.minStars)}` : query;
    const params = new URLSearchParams({
      q: queryString, sort: source.sort ?? "stars",
      order: source.order ?? "desc", per_page: String(clampLimit(source.limit, 20)),
    });
    return `https://api.github.com/search/repositories?${params.toString()}`;
  }
  throw new Error(`Unsupported source type for URL building: ${source.type}`);
}

/* ------------------------------------------------------------------ */
/*  Config Conversion                                                  */
/* ------------------------------------------------------------------ */

/**
 * Convert a radar-style source config to a unified _shared/data-sources/ config.
 */
function convertSourceConfig(source) {
  const type = source.type;
  const query = source.query ?? source.search;

  if (type === "reddit") {
    return {
      type: "reddit",
      query: source.search ?? query,
      communities: source.community ? [source.community] : ["SaaS", "startups"],
      limit: source.limit ?? 25,
    };
  }

  if (type === "hacker-news" || type === "show-hn") {
    return {
      type: "hacker-news",
      query: query,
      limit: source.limit ?? 20,
      // show-hn is handled by the HN adapter's tags field
      tags: type === "show-hn" ? "show_hn" : (source.tags ?? "story"),
    };
  }

  if (type === "github") {
    return {
      type: "github",
      query: query,
      limit: source.limit ?? 20,
      minStars: source.minStars,
      sort: source.sort ?? "stars",
    };
  }

  if (type === "product-hunt") {
    return {
      type: "product-hunt",
      query: query,
      limit: source.limit ?? 20,
      featured: source.featured,
      topic: source.topic,
      order: source.order,
    };
  }

  if (type === "indie-hackers") {
    // Indie Hackers is not in _shared/ registry — skip with warning
    console.warn(`[radar] Source "${type}" not available in unified registry, skipping.`);
    return null;
  }

  console.warn(`[radar] Unknown source type "${type}", skipping.`);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Case Enrichment                                                    */
/* ------------------------------------------------------------------ */

/**
 * Enrich a _shared/ item with radar-specific case fields if missing.
 * The _shared/ GitHub adapter already produces most fields; this fills gaps.
 */
function enrichCaseItem(item) {
  return {
    id: item.id,
    source: item.source,
    title: item.title ?? "",
    url: item.url ?? null,
    targetUser: item.targetUser ?? inferTargetUser(item),
    pain: item.pain ?? item.description ?? item.excerpt ?? "",
    productShape: item.productShape ?? `${item.source} item`,
    firstAcquisitionChannel: item.firstAcquisitionChannel ?? `${item.source} discovery`,
    pricing: item.pricing ?? null,
    revenue: item.revenue ?? null,
    validationMove: item.validationMove ?? "Inspect positioning, traction signals, and adjacent demand before adapting.",
    copyable: item.copyable ?? ["positioning angle", "channel strategy"],
    notCopyable: item.notCopyable ?? ["existing traction", "timing"],
    // Preserve any extra fields from the adapter
    ...(item.tags ? { tags: item.tags } : {}),
    ...(item.score != null ? { score: item.score } : {}),
    ...(item.comments != null ? { comments: item.comments } : {}),
  };
}

function inferTargetUser(item) {
  const text = `${item.title ?? ""} ${item.pain ?? ""} ${item.description ?? ""}`.toLowerCase();
  if (text.includes("freelance")) return "freelancers";
  if (text.includes("developer") || text.includes("api")) return "developers";
  if (text.includes("shopify") || text.includes("ecommerce")) return "ecommerce operators";
  return `${item.source} users`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildCredentialsMap() {
  const keys = [
    "GITHUB_TOKEN", "PRODUCT_HUNT_TOKEN", "TWITTER_BEARER_TOKEN",
    "REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME",
  ];
  const map = {};
  for (const key of keys) {
    const value = getCredential(key);
    if (value) map[key] = value;
  }
  return map;
}

function clampLimit(value, fallback) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(100, Math.round(number)));
}
