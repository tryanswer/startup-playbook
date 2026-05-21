import { normalizeRedditPost } from "./pain-miner.mjs";

const REDDIT_BASE_URL = "https://www.reddit.com";

export function buildRedditListingUrl(source) {
  const community = String(source.community ?? "").trim();
  if (!community) {
    throw new Error("Reddit source requires community");
  }

  const limit = Number(source.limit ?? 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Reddit source limit must be an integer from 1 to 100");
  }

  if (source.search) {
    const params = new URLSearchParams({
      q: source.search,
      restrict_sr: "1",
      sort: source.sort ?? "relevance",
      limit: String(limit),
    });
    return `${REDDIT_BASE_URL}/r/${encodeURIComponent(community)}/search.json?${params.toString()}`;
  }

  const listing = source.listing ?? "top";
  if (!["top", "new", "hot", "rising"].includes(listing)) {
    throw new Error(`Unsupported Reddit listing: ${listing}`);
  }

  const params = new URLSearchParams();
  if (listing === "top") {
    params.set("t", source.time ?? "month");
  }
  params.set("limit", String(limit));

  return `${REDDIT_BASE_URL}/r/${encodeURIComponent(community)}/${listing}.json?${params.toString()}`;
}

export function redditChildrenToPosts(payload) {
  const children = payload?.data?.children;
  if (!Array.isArray(children)) {
    return [];
  }

  const posts = [];
  const seen = new Set();
  for (const child of children) {
    const post = normalizeRedditPost(child?.data);
    if (!post || seen.has(post.id)) continue;
    seen.add(post.id);
    posts.push(post);
  }
  return posts;
}

export async function fetchRedditSource(source, options = {}) {
  const url = buildRedditListingUrl(source);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("No fetch implementation available");
  }

  const response = await fetchImpl(url, {
    headers: {
      "user-agent": options.userAgent ?? "startup-playbook-topic-pain-miner/0.1",
      accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Reddit request failed ${response.status}: ${url}`);
  }

  return redditChildrenToPosts(await response.json());
}
