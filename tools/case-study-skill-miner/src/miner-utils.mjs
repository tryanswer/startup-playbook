import fs from "node:fs";
import path from "node:path";

const CHANNEL_KEYWORDS = [
  ["reddit", /\breddit\b/i],
  ["product-hunt", /\bproduct\s*hunt\b/i],
  ["seo", /\bseo\b|search engine|google search|organic search/i],
  ["content", /\bcontent\b|blog|newsletter|youtube|podcast/i],
  ["twitter", /\btwitter\b|\bx\.com\b/i],
  ["cold-email", /cold email|cold outreach|outbound/i],
  ["community", /\bcommunity\b|discord|forum|slack/i],
  ["marketplace", /marketplace|app store|chrome web store|shopify app/i],
  ["paid-ads", /paid ads|google ads|facebook ads|meta ads|adwords/i],
];

const VALIDATION_KEYWORDS = [
  ["community-pain", /pain|problem|complain|complaint|struggle|reddit|forum|community/i],
  ["customer-interviews", /customer interview|user interview|talked to customers|interviewed/i],
  ["preorders", /preorder|pre-order|paid upfront|deposit|waitlist/i],
  ["manual-service", /concierge|manual|spreadsheet|service|agency|consulting/i],
  ["launch-test", /launched|launch|product hunt|beta|early access/i],
];

const PRICING_KEYWORDS = [
  ["subscription", /subscription|monthly|\/mo|per month|mrr|arr/i],
  ["price-point", /\$\s?\d[\d,.]*(?:\.\d+)?(?:\s?(?:k|m))?(?:\/mo|\/month| per month)?/i],
  ["one-time", /one-time|lifetime deal|paid once|license/i],
  ["services", /consulting|agency|done-for-you|service package/i],
];

const BUSINESS_MODEL_KEYWORDS = [
  ["saas", /\bsaas\b|software|app|subscription/i],
  ["agency", /agency|consulting|service business|done-for-you/i],
  ["marketplace", /marketplace/i],
  ["newsletter", /newsletter|sponsorship/i],
  ["course", /course|cohort|education|workshop/i],
  ["template", /template|boilerplate|starter kit/i],
];

export function extractStoryCards(html, baseUrl) {
  const cards = [];
  const seen = new Set();
  const anchorPattern = /<a\b(?=[^>]*database__story)([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html)) !== null) {
    const attrs = match[1];
    const body = match[2];
    const href = extractAttribute(attrs, "href");
    if (!href) continue;

    const url = normalizeUrl(href, baseUrl);
    if (!url || seen.has(url)) continue;
    seen.add(url);

    cards.push({
      url,
      source: "indie-hackers",
      title: extractFirstText(body, ["slick-story__title", "story__title", "title"]),
      author: extractFirstText(body, ["slick-story__author", "story__author", "author"]),
      revenue: extractFirstText(body, ["database__story-mrr", "story__mrr", "mrr"]),
    });
  }

  return cards.filter((card) => card.title || card.url);
}

export function cleanHtmlText(html) {
  const withoutHidden = String(html ?? "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "");

  return decodeHtmlEntities(withoutHidden)
    .replace(/<\/(h[1-6]|p|div|section|article|li|blockquote|br|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractArticleText(html) {
  const source = String(html ?? "");
  const candidates = [
    ...matchingBlocks(source, "article"),
    ...matchingBlocks(source, "main"),
    ...classBlocks(source, ["simple-post", "post-content", "article-content", "ssi-content", "content", "post"]),
    source,
  ].map((candidate) => normalizeArticleLines(candidate).join("\n").trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return candidates[0] ?? "";
}

function normalizeArticleLines(html) {
  const lines = cleanHtmlText(html)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !isNavigationLine(line));
  return trimAfterMarkers(lines, [
    /^Indie Hackers Newsletter:/i,
    /^About the Author$/i,
    /^Support This Post$/i,
    /^Post Comment$/i,
    /^Comments?$/i,
  ]);
}

export function isCloudflareChallenge(html) {
  const text = String(html ?? "");
  return /Just a moment\.\.\./i.test(text) || /_cf_chl_opt|challenge-platform|cf-browser-verification/i.test(text);
}

export function extractCaseSignals(caseItem) {
  const corpus = `${caseItem.title ?? ""}\n${caseItem.text ?? ""}`;
  return {
    channels: matchLabels(corpus, CHANNEL_KEYWORDS),
    validation: matchLabels(corpus, VALIDATION_KEYWORDS),
    pricing: matchLabels(corpus, PRICING_KEYWORDS),
    businessModels: matchLabels(corpus, BUSINESS_MODEL_KEYWORDS),
    revenueMentions: unique(corpus.match(/\$\s?\d[\d,.]*(?:\.\d+)?\s?(?:k|m|K|M)?(?:\s?(?:MRR|ARR|\/mo|\/month|per month|monthly|\/yr|\/year))?/g) ?? []),
  };
}

export function synthesizeSkillMarkdown(cases, options = {}) {
  const skillName = options.skillName ?? "founder-case-patterns";
  const analyzedCases = cases.map((item) => ({
    ...item,
    signals: item.signals ?? extractCaseSignals(item),
  }));

  const channelCounts = countSignals(analyzedCases, "channels");
  const validationCounts = countSignals(analyzedCases, "validation");
  const pricingCounts = countSignals(analyzedCases, "pricing");
  const modelCounts = countSignals(analyzedCases, "businessModels");
  const confidence = confidenceForSampleSize(analyzedCases.length);
  const evidenceRows = analyzedCases
    .slice(0, 12)
    .map((item) => `| ${escapeMarkdown(item.title ?? "Untitled")} | ${escapeMarkdown(item.signals.revenueMentions?.[0] ?? item.revenue ?? "")} | ${escapeMarkdown(topSignals(item.signals).join(", "))} | ${item.url ?? ""} |`);

  return [
    "---",
    `name: ${skillName}`,
    "description: Use when applying founder case-study lessons to a new startup idea, product direction, GTM plan, pricing, validation, or bootstrap strategy.",
    "---",
    "",
    "# Founder Case Patterns",
    "",
    "Use this skill to turn startup case-study evidence into decisions for a new product. Treat cases as pattern evidence, not recipes to copy blindly.",
    "",
    "## Evidence Rules",
    "",
    "- Prefer repeated patterns across cases over one impressive story.",
    "- Preserve source URLs and revenue claims separately from conclusions.",
    "- Do not store or republish full copyrighted articles in the skill.",
    "- Convert each lesson into a conditional rule: when this context appears, try this move.",
    "",
    "## Evidence Strength",
    "",
    `- Sample size: ${analyzedCases.length} cases`,
    `- Confidence: ${confidence}`,
    "- Upgrade weak patterns only after adding more source-linked cases.",
    "",
    "## Strongest Patterns",
    "",
    "### Acquisition",
    ...formatCounts(channelCounts),
    "",
    "### Validation",
    ...formatCounts(validationCounts),
    "",
    "### Pricing",
    ...formatCounts(pricingCounts),
    "",
    "### Business Models",
    ...formatCounts(modelCounts),
    "",
    "## How To Apply",
    "",
    "1. Match the new idea to the closest case pattern by user, pain, channel, price, and speed to value.",
    "2. Choose one validation move that can be executed in days, not weeks.",
    "3. Choose one acquisition channel already proven for similar buyers.",
    "4. Set a paid or high-intent threshold before building more product.",
    "5. Record whether the result confirms, weakens, or contradicts the case pattern.",
    "",
    "## Case Evidence Index",
    "",
    "| Case | Revenue signal | Pattern signals | Source |",
    "| --- | --- | --- | --- |",
    ...(evidenceRows.length ? evidenceRows : ["| No cases yet |  |  |  |"]),
    "",
  ].join("\n");
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const [key, inlineValue] = token.slice(2).split(/=(.*)/s, 2);
    const value = inlineValue ?? (argv[index + 1]?.startsWith("--") ? true : argv[index + 1] ?? true);
    if (inlineValue === undefined && value !== true) index += 1;
    args[key] = value;
  }
  return args;
}

export function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function readJsonlFile(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function writeJsonlFile(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
}

export function writeCsvFile(filePath, rows, headers) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buildCsv(rows, headers), "utf8");
}

export function readUrlList(filePath) {
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

export function slugify(value) {
  return String(value ?? "case")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "case";
}

function extractAttribute(attrs, name) {
  const pattern = new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = attrs.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function extractFirstText(html, classNames) {
  for (const className of classNames) {
    const pattern = new RegExp(`<[^>]*class\\s*=\\s*(?:"[^"]*${escapeRegex(className)}[^"]*"|'[^']*${escapeRegex(className)}[^']*'|[^\\s>]*${escapeRegex(className)}[^\\s>]*)[^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i");
    const match = html.match(pattern);
    if (match) return cleanHtmlText(match[1]);
  }
  return "";
}

function matchingBlocks(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi");
  return [...html.matchAll(pattern)].map((match) => match[0]);
}

function classBlocks(html, classNames) {
  const blocks = [];
  for (const className of classNames) {
    const pattern = new RegExp(`<([a-z0-9-]+)\\b[^>]*class\\s*=\\s*(?:"[^"]*${escapeRegex(className)}[^"]*"|'[^']*${escapeRegex(className)}[^']*'|[^\\s>]*${escapeRegex(className)}[^\\s>]*)[^>]*>[\\s\\S]*?<\\/\\1>`, "gi");
    blocks.push(...[...html.matchAll(pattern)].map((match) => match[0]));
  }
  return blocks;
}

function isNavigationLine(line) {
  if (/^Home\s+Starting Up\s+Case Studies DB\s+Products/i.test(line)) return true;
  return [
    /^Home$/i,
    /^Starting Up$/i,
    /^Case Studies DB$/i,
    /^Products$/i,
    /^Products DB$/i,
    /^Ideas DB$/i,
    /^Vibe Coding Tools$/i,
    /^Subscribe to IH\+$/i,
    /^Join$/i,
    /^Contents$/i,
  ].some((pattern) => pattern.test(line));
}

function trimAfterMarkers(lines, markers) {
  const index = lines.findIndex((line) => markers.some((pattern) => pattern.test(line)));
  return index >= 0 ? lines.slice(0, index) : lines;
}

function normalizeUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function matchLabels(text, pairs) {
  return pairs.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function unique(values) {
  return [...new Set(values.map((value) => value.replace(/\s+/g, " ").trim()).filter(Boolean))];
}

function countSignals(cases, key) {
  const counts = new Map();
  for (const item of cases) {
    for (const signal of item.signals?.[key] ?? []) {
      counts.set(signal, (counts.get(signal) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function formatCounts(counts) {
  if (!counts.length) return ["- No repeated signals yet."];
  return counts.map(([label, count]) => `- ${label}: ${count}`);
}

function confidenceForSampleSize(size) {
  if (size >= 20) return "strong";
  if (size >= 5) return "moderate";
  return "weak";
}

function topSignals(signals) {
  return [
    ...(signals.channels ?? []),
    ...(signals.validation ?? []),
    ...(signals.pricing ?? []),
    ...(signals.businessModels ?? []),
  ].slice(0, 6);
}

function buildCsv(rows, headers = inferHeaders(rows)) {
  return `${[
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n")}\n`;
}

function inferHeaders(rows) {
  const headers = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!headers.includes(key)) headers.push(key);
    }
  }
  return headers;
}

function escapeCsv(value) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeMarkdown(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
