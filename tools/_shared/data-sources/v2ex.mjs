/**
 * V2EX data source adapter.
 *
 * Uses the V2EX public API (free, no auth required for basic endpoints).
 * Auth: optional V2EX_TOKEN for higher rate limits.
 *
 * Config:
 *   - node?: string           — V2EX node name (e.g. 'create', 'programmer', 'share')
 *   - query?: string          — search topic (uses hot/latest topics if not specified)
 *   - mode?: 'hot'|'latest'|'node' (default auto-detect based on config)
 *   - limit?: number          — max results (default 20)
 */

import { cleanText, toNumber } from "../http-client.mjs";

const V2EX_API = "https://www.v2ex.com/api/v2";
const V2EX_API_V1 = "https://www.v2ex.com/api";

export const v2exAdapter = {
  name: "v2ex",
  label: "V2EX",
  type: "community",
  requiresAuth: false,
  region: "china",

  async collect(config, http, credentials = {}) {
    const token = credentials.V2EX_TOKEN ?? config.token;
    const headers = {};
    if (token) headers.authorization = `Bearer ${token}`;

    const node = config.node;
    const limit = clampLimit(config.limit, 20);

    let topics;

    if (node) {
      // Fetch topics from specific node
      topics = await fetchNodeTopics(http, node, headers);
    } else if (config.mode === "latest") {
      topics = await fetchLatestTopics(http, headers);
    } else {
      // Default: hot topics
      topics = await fetchHotTopics(http, headers);
    }

    return topics.slice(0, limit).map(parseV2exTopic);
  },
};

async function fetchHotTopics(http, headers) {
  const url = `${V2EX_API_V1}/topics/hot.json`;
  return http.getJson(url, { headers });
}

async function fetchLatestTopics(http, headers) {
  const url = `${V2EX_API_V1}/topics/latest.json`;
  return http.getJson(url, { headers });
}

async function fetchNodeTopics(http, node, headers) {
  const params = new URLSearchParams({ node_name: node });
  const url = `${V2EX_API_V1}/topics/show.json?${params}`;
  return http.getJson(url, { headers });
}

function parseV2exTopic(topic) {
  return {
    id: `v2ex:${topic.id}`,
    source: "v2ex",
    community: topic.node?.title ?? topic.node?.name ?? "V2EX",
    title: cleanText(topic.title ?? "", 180),
    excerpt: cleanText(topic.content_rendered
      ? stripHtml(topic.content_rendered)
      : (topic.content ?? ""), 360),
    score: 0, // V2EX doesn't expose vote counts publicly
    comments: toNumber(topic.replies),
    createdAt: topic.created
      ? new Date(topic.created * 1000).toISOString()
      : null,
    url: topic.url ?? `https://www.v2ex.com/t/${topic.id}`,
    tags: topic.node?.name ? [topic.node.name] : [],
  };
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(100, Math.round(num))) : fallback;
}
