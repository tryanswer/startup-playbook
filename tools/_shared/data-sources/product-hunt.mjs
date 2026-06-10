/**
 * Product Hunt data source adapter.
 *
 * Uses the Product Hunt GraphQL API v2.
 * Auth: requires PRODUCT_HUNT_TOKEN (OAuth Bearer token).
 *
 * Config:
 *   - query?: string       — search topic/keyword (used as topic filter)
 *   - limit?: number       — max results (default 20, max 50)
 *   - featured?: boolean   — only featured posts
 *   - order?: string       — 'RANKING' | 'NEWEST' | 'VOTES'
 *   - postedAfter?: string — ISO date string
 */

import { cleanText, toNumber } from "../http-client.mjs";

const PH_GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql";

export const productHuntAdapter = {
  name: "product-hunt",
  label: "Product Hunt",
  type: "case",
  requiresAuth: true,
  region: "global",

  async collect(config, http, credentials = {}) {
    const token = credentials.PRODUCT_HUNT_TOKEN ?? config.token;
    if (!token) throw new Error("Product Hunt adapter requires PRODUCT_HUNT_TOKEN");

    const limit = clampLimit(config.limit, 20);

    const variables = { first: limit };
    if (config.featured) variables.featured = true;
    if (config.order) variables.order = config.order;
    if (config.topic) variables.topic = config.topic ?? config.query;
    if (config.postedAfter) variables.postedAfter = config.postedAfter;

    const query = `
      query CollectPosts($first: Int!, $featured: Boolean, $order: PostsOrder, $topic: String, $postedAfter: DateTime) {
        posts(first: $first, featured: $featured, order: $order, topic: $topic, postedAfter: $postedAfter) {
          edges {
            node {
              id
              name
              tagline
              description
              url
              website
              votesCount
              commentsCount
              createdAt
              topics { edges { node { name } } }
              thumbnail { url }
            }
          }
        }
      }
    `;

    const json = await http.postJson(PH_GRAPHQL_URL, { query, variables }, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (json?.errors?.length) {
      throw new Error(`Product Hunt GraphQL error: ${json.errors[0]?.message ?? "unknown"}`);
    }

    return parsePosts(json);
  },
};

function parsePosts(json) {
  const edges = json?.data?.posts?.edges ?? [];
  return edges
    .map((edge) => edge?.node)
    .filter((node) => node?.id && node?.name)
    .map((node) => {
      const topics = (node.topics?.edges ?? [])
        .map((e) => e?.node?.name)
        .filter(Boolean);

      return {
        id: `ph:${node.id}`,
        source: "product-hunt",
        title: cleanText(node.name, 180),
        url: node.website ?? node.url ?? null,
        targetUser: "Product Hunt early adopters",
        pain: cleanText(node.tagline ?? "", 220),
        productShape: cleanText(node.description ?? node.tagline ?? "", 300),
        pricing: `upvotes: ${toNumber(node.votesCount)}`,
        revenue: null,
        comments: toNumber(node.commentsCount),
        createdAt: node.createdAt ?? null,
        tags: topics.slice(0, 8),
        thumbnail: node.thumbnail?.url ?? null,
      };
    });
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(50, Math.round(num))) : fallback;
}
