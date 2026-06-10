/**
 * Reddit data source adapter.
 *
 * Supports two modes:
 *   1. OAuth2 (recommended): uses REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET
 *      to obtain an app-only token, then queries oauth.reddit.com.
 *   2. Fallback: uses old.reddit.com public JSON endpoints (may be rate-limited).
 *
 * Rate limit: ~1 request/second (enforced by http-client).
 *
 * Config:
 *   - communities: string[]  — subreddit names (e.g. ['SaaS', 'startups'])
 *   - search?: string        — search query within subreddit
 *   - listing?: 'hot'|'top'|'new'|'rising' (default 'hot')
 *   - time?: 'hour'|'day'|'week'|'month'|'year'|'all' (for 'top', default 'month')
 *   - limit?: number         — posts per community (default 25, max 100)
 */

import { cleanText, toNumber } from "../http-client.mjs";

const OAUTH_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const OAUTH_API_BASE = "https://oauth.reddit.com";
const FALLBACK_BASE = "https://old.reddit.com";

/** Cached OAuth token */
let cachedToken = null;
let tokenExpiresAt = 0;

export const redditAdapter = {
  name: "reddit",
  label: "Reddit",
  type: "community",
  requiresAuth: false,
  region: "global",

  async collect(config, http, credentials = {}) {
    const communities = config.communities ?? config.community
      ? [].concat(config.communities ?? config.community)
      : [];

    if (communities.length === 0) {
      throw new Error("Reddit adapter requires at least one community");
    }

    const limit = clampLimit(config.limit, 25);
    const listing = config.listing ?? "hot";
    const search = config.search ?? null;
    const time = config.time ?? "month";

    // Determine auth mode
    const clientId = credentials.REDDIT_CLIENT_ID ?? config.clientId;
    const clientSecret = credentials.REDDIT_CLIENT_SECRET ?? config.clientSecret;
    const hasOAuth = !!(clientId && clientSecret);

    let authHeaders = {};
    let apiBase = FALLBACK_BASE;

    if (hasOAuth) {
      const token = await getOAuthToken(http, clientId, clientSecret, credentials.REDDIT_USERNAME);
      authHeaders = { authorization: `Bearer ${token}` };
      apiBase = OAUTH_API_BASE;
    }

    const allPosts = [];

    for (const community of communities) {
      const url = buildUrl(apiBase, community.trim(), { search, listing, time, limit });
      try {
        const json = await http.getJson(url, { headers: authHeaders });
        allPosts.push(...parseRedditListing(json, community.trim()));
      } catch (error) {
        if (!hasOAuth && error.message?.includes("403")) {
          console.warn(
            `[reddit] r/${community} returned 403 — Reddit blocks unauthenticated API access from many networks. ` +
            `Set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET in .env for reliable access.`
          );
          continue;
        }
        throw error;
      }
    }

    return allPosts;
  },
};

/**
 * Get an OAuth2 app-only access token (client_credentials grant).
 * Tokens are cached until expiry.
 */
async function getOAuthToken(http, clientId, clientSecret, username) {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const userAgent = username
    ? `startup-playbook:collector:v0.1 (by /u/${username})`
    : "startup-playbook:collector:v0.1";

  const response = await http.request(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      authorization: `Basic ${basicAuth}`,
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": userAgent,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Reddit OAuth failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Expire 60s early to avoid edge cases
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

function buildUrl(apiBase, community, { search, listing, time, limit }) {
  const sub = encodeURIComponent(community);

  if (search) {
    const params = new URLSearchParams({
      q: search,
      restrict_sr: "1",
      sort: "relevance",
      limit: String(limit),
    });
    return `${apiBase}/r/${sub}/search.json?${params}`;
  }

  const params = new URLSearchParams({ limit: String(limit) });
  if (listing === "top") params.set("t", time);
  return `${apiBase}/r/${sub}/${listing}.json?${params}`;
}

function parseRedditListing(json, community) {
  const children = json?.data?.children ?? [];
  return children
    .map((child) => child?.data)
    .filter((item) => item?.id && item?.title)
    .map((item) => ({
      id: `reddit:${item.id}`,
      source: "reddit",
      community: item.subreddit ?? community,
      title: cleanText(item.title, 180),
      excerpt: cleanText(item.selftext ?? "", 360),
      score: toNumber(item.score),
      comments: toNumber(item.num_comments),
      createdAt: item.created_utc
        ? new Date(item.created_utc * 1000).toISOString()
        : null,
      url: item.permalink
        ? `https://www.reddit.com${item.permalink}`
        : null,
      flair: item.link_flair_text ?? null,
    }));
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(100, Math.round(num))) : fallback;
}
