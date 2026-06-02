export function buildCommunitySourceUrl(source) {
  if (source.type === "reddit") {
    const community = required(source.community, "reddit source requires community");
    const limit = clampLimit(source.limit, 25);
    if (source.search) {
      const params = new URLSearchParams({
        q: source.search,
        restrict_sr: "1",
        sort: source.sort ?? "relevance",
        limit: String(limit),
      });
      return `https://www.reddit.com/r/${encodeURIComponent(community)}/search.json?${params.toString()}`;
    }
    const listing = source.listing ?? "hot";
    const params = new URLSearchParams();
    if (listing === "top") params.set("t", source.time ?? "week");
    params.set("limit", String(limit));
    return `https://www.reddit.com/r/${encodeURIComponent(community)}/${listing}.json?${params.toString()}`;
  }

  if (source.type === "hacker-news") {
    const query = required(source.query ?? source.search, "hacker-news source requires query");
    const params = new URLSearchParams({
      query,
      tags: source.tags ?? "story",
      hitsPerPage: String(clampLimit(source.limit, 20)),
    });
    return `https://hn.algolia.com/api/v1/search?${params.toString()}`;
  }

  if (source.type === "show-hn") {
    const query = required(source.query ?? source.search, "show-hn source requires query");
    const params = new URLSearchParams({
      query,
      tags: "show_hn",
      hitsPerPage: String(clampLimit(source.limit, 20)),
    });
    return `https://hn.algolia.com/api/v1/search?${params.toString()}`;
  }

  if (source.type === "github") {
    const query = required(source.query ?? source.search, "github source requires query");
    const q = source.minStars ? `${query} stars:>=${Number(source.minStars)}` : query;
    const params = new URLSearchParams({
      q,
      sort: source.sort ?? "stars",
      order: source.order ?? "desc",
      per_page: String(clampLimit(source.limit, 20)),
    });
    return `https://api.github.com/search/repositories?${params.toString()}`;
  }

  if (source.type === "indie-hackers") {
    const query = required(source.query ?? source.search, "indie-hackers source requires query");
    const params = new URLSearchParams({ search: query });
    return `https://www.indiehackers.com/stories?${params.toString()}`;
  }

  if (source.type === "product-hunt") {
    const query = required(source.query ?? source.search, "product-hunt source requires query");
    if (source.apiToken) return "https://api.producthunt.com/v2/api/graphql";
    const params = new URLSearchParams({ q: query });
    return `https://www.producthunt.com/search?${params.toString()}`;
  }

  throw new Error(`Unsupported source type: ${source.type}`);
}

export async function fetchRadarSources(sources, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchRadarSources requires a fetch implementation.");
  }

  const communities = [];
  const cases = [];
  const errors = [];
  for (const source of sources ?? []) {
    if (!["reddit", "hacker-news", "show-hn", "github", "indie-hackers", "product-hunt"].includes(source.type)) {
      throw new Error(`Unsupported source type: ${source.type}`);
    }
    try {
      if (["reddit", "hacker-news"].includes(source.type)) {
        communities.push(...await fetchCommunitySources([source], { ...options, fetchImpl }));
      } else if (source.type === "show-hn") {
        communities.push(...await fetchShowHnSource(source, { ...options, fetchImpl }));
      } else if (source.type === "github") {
        cases.push(...await fetchGithubSource(source, { ...options, fetchImpl }));
      } else if (source.type === "indie-hackers") {
        cases.push(...await fetchIndieHackersSource(source, { ...options, fetchImpl }));
      } else if (source.type === "product-hunt") {
        cases.push(...await fetchProductHuntSource(source, { ...options, fetchImpl }));
      }
    } catch (error) {
      if (options.failFast) throw error;
      errors.push({
        type: source.type,
        message: error.message,
      });
    }
  }

  return {
    communities: dedupePosts(communities),
    cases: dedupeCases(cases),
    errors,
  };
}

export async function fetchCommunitySources(sources, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchCommunitySources requires a fetch implementation.");
  }

  const posts = [];
  for (const source of sources ?? []) {
    if (!["reddit", "hacker-news"].includes(source.type)) continue;
    const url = buildCommunitySourceUrl(source);
    const response = await fetchImpl(url, {
      headers: {
        "user-agent": options.userAgent ?? "startup-playbook-opportunity-radar/0.1",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source.type} source (${response.status ?? "unknown"}): ${url}`);
    }
    const json = await response.json();
    if (source.type === "reddit") {
      posts.push(...redditListingToPosts(json));
    } else if (source.type === "hacker-news") {
      posts.push(...hackerNewsHitsToPosts(json));
    }
    if (options.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, Number(options.delayMs)));
    }
  }

  return dedupePosts(posts);
}

async function fetchShowHnSource(source, options) {
  const response = await fetchJsonUrl(source, options);
  return hackerNewsHitsToPosts(response, "Show HN");
}

async function fetchGithubSource(source, options) {
  const response = await fetchJsonUrl(source, options);
  return (response.items ?? [])
    .filter((item) => item?.full_name)
    .map((item) => ({
      id: `github:${item.full_name}`,
      source: "github",
      title: item.full_name,
      url: item.html_url ?? null,
      targetUser: inferTargetUserFromGithub(item),
      pain: cleanText(item.description ?? "Public repository suggests a repeatable product workflow.", 220),
      productShape: `GitHub repository${item.language ? ` in ${item.language}` : ""}`,
      firstAcquisitionChannel: "GitHub search / open-source distribution",
      pricing: `stars: ${toNumber(item.stargazers_count)}`,
      revenue: null,
      validationMove: "Audit issues, README positioning, stars, forks, and adjacent search demand before copying the wedge.",
      copyable: [
        "open-source lead magnet",
        "README-driven positioning",
        ...(item.topics ?? []).slice(0, 3).map((topic) => `${topic} niche`),
      ],
      notCopyable: [
        "repository age",
        "existing maintainer trust",
      ],
    }));
}

async function fetchIndieHackersSource(source, options) {
  const html = await fetchTextUrl(source, options);
  return extractIndieHackersCases(html, source);
}

async function fetchProductHuntSource(source, options) {
  if (source.apiToken || options.productHuntToken) {
    const json = await fetchProductHuntGraphql(source, options);
    return productHuntGraphqlToCases(json);
  }
  const html = await fetchTextUrl(source, options);
  return extractProductHuntCases(html, source);
}

async function fetchJsonUrl(source, options) {
  const response = await options.fetchImpl(buildCommunitySourceUrl(source), {
    headers: defaultHeaders(options, source),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.type} source (${response.status ?? "unknown"}).`);
  }
  return response.json();
}

async function fetchTextUrl(source, options) {
  const response = await options.fetchImpl(buildCommunitySourceUrl(source), {
    headers: defaultHeaders(options, source),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.type} source (${response.status ?? "unknown"}).`);
  }
  return response.text();
}

async function fetchProductHuntGraphql(source, options) {
  const request = buildProductHuntGraphqlRequest(source);
  const query = `
    query OpportunityRadarProductHunt(${request.variableDefinitions.join(", ")}) {
      posts(${request.argumentList.join(", ")}) {
        edges {
          node {
            id
            name
            tagline
            url
            votesCount
            createdAt
          }
        }
      }
    }
  `;
  const response = await options.fetchImpl("https://api.producthunt.com/v2/api/graphql", {
    method: "POST",
    headers: {
      ...defaultHeaders(options, source),
      Authorization: `Bearer ${source.apiToken ?? options.productHuntToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: request.variables,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch product-hunt API source (${response.status ?? "unknown"}).`);
  }
  const json = await response.json();
  if (json?.errors?.length) {
    const message = json.errors[0]?.message ?? json.errors[0]?.error ?? "unknown error";
    throw new Error(`Product Hunt GraphQL error: ${message}`);
  }
  return json;
}

function buildProductHuntGraphqlRequest(source) {
  const variableDefinitions = ["$first: Int!"];
  const argumentList = ["first: $first"];
  const variables = {
    first: clampLimit(source.limit, 20),
  };
  const optionalArguments = [
    ["featured", "Boolean", (value) => value === true || value === "true"],
    ["postedBefore", "DateTime", String],
    ["postedAfter", "DateTime", String],
    ["topic", "String", String],
    ["order", "PostsOrder", String],
    ["twitterUrl", "String", String],
    ["url", "String", String],
    ["after", "String", String],
    ["before", "String", String],
  ];

  for (const [name, type, normalize] of optionalArguments) {
    if (source[name] == null || source[name] === "") continue;
    variableDefinitions.push(`$${name}: ${type}`);
    argumentList.push(`${name}: $${name}`);
    variables[name] = normalize(source[name]);
  }

  return {
    variableDefinitions,
    argumentList,
    variables,
  };
}

function redditListingToPosts(json) {
  return (json?.data?.children ?? [])
    .map((child) => child?.data)
    .filter((item) => item?.id && item?.title)
    .map((item) => ({
      id: `reddit:${item.id}`,
      source: "reddit",
      community: item.subreddit ?? "reddit",
      title: cleanText(item.title, 180),
      excerpt: cleanText(item.selftext ?? "", 360),
      score: toNumber(item.score),
      comments: toNumber(item.num_comments),
      createdAt: item.created_utc ? new Date(item.created_utc * 1000).toISOString() : null,
      url: normalizeRedditUrl(item.permalink),
    }));
}

function hackerNewsHitsToPosts(json, community = "Hacker News") {
  return (json?.hits ?? [])
    .filter((hit) => hit?.objectID && (hit.title || hit.story_title))
    .map((hit) => ({
      id: `hacker-news:${hit.objectID}`,
      source: "hacker-news",
      community,
      title: cleanText(hit.title ?? hit.story_title, 180),
      excerpt: cleanText(hit.story_text ?? hit.comment_text ?? "", 360),
      score: toNumber(hit.points),
      comments: toNumber(hit.num_comments),
      createdAt: hit.created_at ?? null,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    }));
}

function productHuntGraphqlToCases(json) {
  return (json?.data?.posts?.edges ?? [])
    .map((edge) => edge?.node)
    .filter((node) => node?.id && node?.name)
    .map((node) => ({
      id: `product-hunt:${node.id}`,
      source: "product-hunt",
      title: cleanText(node.name, 180),
      url: node.url ?? null,
      targetUser: "Product Hunt launch audience",
      pain: cleanText(node.tagline ?? "Product Hunt launch with public positioning.", 220),
      productShape: "Product Hunt launch",
      firstAcquisitionChannel: "Product Hunt",
      pricing: `upvotes: ${toNumber(node.votesCount)}`,
      revenue: null,
      validationMove: "Inspect comments, makers, website CTA, and launch positioning before adapting the wedge.",
      copyable: ["launch positioning", "tagline framing", "early adopter channel"],
      notCopyable: ["launch timing", "maker audience", "Product Hunt ranking"],
    }));
}

function extractIndieHackersCases(html) {
  const cases = [];
  const seen = new Set();
  const anchorPattern = /<a\b([^>]*class=["'][^"']*(?:database__story|slick-story)[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html)) !== null) {
    const href = extractAttribute(match[1], "href");
    const body = match[2];
    const id = normalizeIndieHackersId(href);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const title = cleanText(stripTags(extractClassText(body, "slick-story__title") || stripTags(body)), 180);
    const revenue = cleanText(extractClassText(body, "database__story-mrr") || "", 80);
    cases.push({
      id: `indie-hackers:${id}`,
      source: "indie-hackers",
      title,
      url: normalizeUrl(href, "https://www.indiehackers.com"),
      targetUser: "indie hackers / bootstrapped founders",
      pain: title,
      productShape: "public founder case",
      firstAcquisitionChannel: "Indie Hackers case surface",
      pricing: revenue || null,
      revenue: revenue || null,
      validationMove: "Extract the first validation move and acquisition wedge from the case before adapting it.",
      copyable: ["founder case pattern", "channel signal", "positioning angle"],
      notCopyable: ["founder timing", "existing audience", "case-specific market conditions"],
    });
  }
  return cases.filter((item) => item.title);
}

function extractProductHuntCases(html) {
  const cases = [];
  const seen = new Set();
  const anchorPattern = /<a\b([^>]*href=["']\/(?:products|posts)\/[^"']+["'][^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html)) !== null) {
    const href = extractAttribute(match[1], "href");
    const id = String(href ?? "").split("/").filter(Boolean).pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const text = stripTags(match[2]);
    const title = cleanText(text.split(/\s{2,}|\n/).find(Boolean) || id.replaceAll("-", " "), 180);
    cases.push({
      id: `product-hunt:${id}`,
      source: "product-hunt",
      title,
      url: normalizeUrl(href, "https://www.producthunt.com"),
      targetUser: "Product Hunt launch audience",
      pain: cleanText(text || title, 220),
      productShape: "Product Hunt launch",
      firstAcquisitionChannel: "Product Hunt",
      pricing: null,
      revenue: null,
      validationMove: "Inspect comments, launch assets, website CTA, and maker profile before adapting the wedge.",
      copyable: ["launch positioning", "category framing", "early adopter channel"],
      notCopyable: ["launch timing", "maker audience", "Product Hunt ranking"],
    });
  }
  return cases;
}

function defaultHeaders(options, source) {
  const headers = {
    "user-agent": options.userAgent ?? "startup-playbook-opportunity-radar/0.1",
  };
  const githubToken = source?.token ?? options.githubToken;
  if (source?.type === "github" && githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }
  return headers;
}

function inferTargetUserFromGithub(item) {
  const text = `${item.description ?? ""} ${(item.topics ?? []).join(" ")}`.toLowerCase();
  if (text.includes("freelance")) return "freelancers";
  if (text.includes("developer") || text.includes("api")) return "developers";
  if (text.includes("shopify") || text.includes("ecommerce")) return "ecommerce operators";
  return "GitHub users searching for this workflow";
}

function extractAttribute(html, name) {
  const match = new RegExp(`${name}=["']([^"']+)["']`, "i").exec(html ?? "");
  return match?.[1] ?? null;
}

function extractClassText(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`<[^>]*class=["'][^"']*${escaped}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i").exec(html ?? "");
  return match ? stripTags(match[1]) : "";
}

function stripTags(html) {
  return String(html ?? "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIndieHackersId(href) {
  if (!href) return null;
  const parts = String(href).split("?")[0].split("/").filter(Boolean);
  return parts.pop() ?? null;
}

function normalizeUrl(href, baseUrl) {
  if (!href) return null;
  if (String(href).startsWith("http")) return String(href);
  return `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
}

function normalizeRedditUrl(permalink) {
  if (!permalink) return null;
  if (String(permalink).startsWith("http")) return String(permalink);
  return `https://www.reddit.com${permalink}`;
}

function dedupePosts(posts) {
  const seen = new Set();
  const result = [];
  for (const post of posts) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    result.push(post);
  }
  return result;
}

function dedupeCases(cases) {
  const seen = new Set();
  const result = [];
  for (const item of cases) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function required(value, message) {
  if (!value) throw new Error(message);
  return String(value);
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clampLimit(value, fallback) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(100, Math.round(number)));
}
