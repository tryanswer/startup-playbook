/**
 * GitHub data source adapter.
 *
 * Uses the GitHub REST API (search/repositories).
 * Auth: optional GITHUB_TOKEN for higher rate limits (60 → 5000 req/hr).
 *
 * Config:
 *   - query: string           — search keywords
 *   - minStars?: number       — minimum star count filter
 *   - language?: string       — filter by language (e.g. 'python')
 *   - sort?: 'stars'|'forks'|'updated'|'help-wanted-issues' (default 'stars')
 *   - order?: 'asc'|'desc'   (default 'desc')
 *   - limit?: number          — results (default 20, max 100)
 */

import { cleanText, toNumber } from "../http-client.mjs";

const GITHUB_API = "https://api.github.com";

export const githubAdapter = {
  name: "github",
  label: "GitHub",
  type: "case",
  requiresAuth: false,
  region: "global",

  async collect(config, http, credentials = {}) {
    const query = config.query ?? config.search;
    if (!query) throw new Error("GitHub adapter requires a query");

    const limit = clampLimit(config.limit, 20);
    const sort = config.sort ?? "stars";
    const order = config.order ?? "desc";

    let queryString = query;
    if (config.minStars) queryString += ` stars:>=${Number(config.minStars)}`;
    if (config.language) queryString += ` language:${config.language}`;

    const params = new URLSearchParams({
      q: queryString,
      sort,
      order,
      per_page: String(limit),
    });

    const token = credentials.GITHUB_TOKEN ?? config.token;
    const headers = {};
    if (token) headers.authorization = `Bearer ${token}`;
    headers.accept = "application/vnd.github+json";

    const url = `${GITHUB_API}/search/repositories?${params}`;
    const json = await http.getJson(url, { headers });

    return parseRepos(json);
  },
};

function parseRepos(json) {
  return (json?.items ?? [])
    .filter((repo) => repo?.full_name)
    .map((repo) => ({
      id: `github:${repo.full_name}`,
      source: "github",
      title: repo.full_name,
      url: repo.html_url ?? null,
      targetUser: inferTargetUser(repo),
      pain: cleanText(repo.description ?? "", 220),
      productShape: `GitHub repo${repo.language ? ` (${repo.language})` : ""}`,
      pricing: `stars: ${toNumber(repo.stargazers_count)}, forks: ${toNumber(repo.forks_count)}`,
      revenue: null,
      tags: (repo.topics ?? []).slice(0, 8),
      createdAt: repo.created_at ?? null,
    }));
}

function inferTargetUser(repo) {
  const text = `${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
  if (text.includes("developer") || text.includes("api")) return "developers";
  if (text.includes("freelance")) return "freelancers";
  if (text.includes("ecommerce") || text.includes("shopify")) return "ecommerce operators";
  if (text.includes("data") || text.includes("ml")) return "data/ML practitioners";
  return "GitHub users";
}

function clampLimit(value, fallback) {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? Math.max(1, Math.min(100, Math.round(num))) : fallback;
}
