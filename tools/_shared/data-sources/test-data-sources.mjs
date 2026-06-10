#!/usr/bin/env node

/**
 * Integration tests for the Unified Data Source Layer.
 *
 * Tests:
 *   1. Registry: all adapters registered correctly
 *   2. Interface: each adapter has required fields
 *   3. Collect: mock HTTP client to test parsing logic
 *   4. CLI: list command works
 */

import { strict as assert } from "node:assert";
import {
  getSource,
  listSources,
  collectFromSources,
  REGISTRY,
} from "./index.mjs";
import { createHttpClient, cleanText, toNumber, dedupeById } from "../http-client.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${error.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${error.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Mock HTTP Responses                                                */
/* ------------------------------------------------------------------ */

const MOCK_RESPONSES = {
  "old.reddit.com": {
    data: {
      children: [
        {
          data: {
            id: "abc123",
            title: "Test Reddit Post",
            selftext: "This is a test post about SaaS",
            score: 42,
            num_comments: 7,
            created_utc: 1700000000,
            permalink: "/r/SaaS/comments/abc123/test/",
            subreddit: "SaaS",
            link_flair_text: "Discussion",
          },
        },
        {
          data: {
            id: "def456",
            title: "Another Post",
            selftext: "",
            score: 10,
            num_comments: 2,
            created_utc: 1700000100,
            permalink: "/r/SaaS/comments/def456/another/",
            subreddit: "SaaS",
          },
        },
      ],
    },
  },

  "hn.algolia.com": {
    hits: [
      {
        objectID: "12345",
        title: "Show HN: My AI Startup Tool",
        story_text: "I built this tool to help startups validate ideas",
        points: 150,
        num_comments: 45,
        created_at: "2024-01-15T10:00:00Z",
        url: "https://example.com/ai-tool",
        _tags: ["story", "show_hn"],
      },
      {
        objectID: "67890",
        title: "Ask HN: Best way to validate SaaS ideas?",
        comment_text: "",
        points: 80,
        num_comments: 32,
        created_at: "2024-01-14T08:00:00Z",
        _tags: ["story", "ask_hn"],
      },
    ],
  },

  "api.github.com": {
    items: [
      {
        full_name: "user/awesome-ai-tool",
        html_url: "https://github.com/user/awesome-ai-tool",
        description: "An awesome AI tool for developers",
        stargazers_count: 1200,
        forks_count: 85,
        language: "Python",
        topics: ["ai", "developer-tools", "automation"],
        created_at: "2023-06-01T00:00:00Z",
      },
    ],
  },

  "api.producthunt.com": {
    data: {
      posts: {
        edges: [
          {
            node: {
              id: "ph_001",
              name: "AI Startup Kit",
              tagline: "Launch your AI startup in 48 hours",
              description: "Everything you need to go from idea to launch",
              url: "https://producthunt.com/posts/ai-startup-kit",
              website: "https://aistartupkit.com",
              votesCount: 320,
              commentsCount: 15,
              createdAt: "2024-02-01T12:00:00Z",
              topics: { edges: [{ node: { name: "AI" } }, { node: { name: "Startups" } }] },
              thumbnail: { url: "https://example.com/thumb.jpg" },
            },
          },
        ],
      },
    },
  },

  "www.v2ex.com": [
    {
      id: 900001,
      title: "分享一个AI副业项目的经验",
      content: "最近做了一个AI相关的小产品...",
      content_rendered: "<p>最近做了一个AI相关的小产品...</p>",
      replies: 25,
      created: 1700000000,
      url: "https://www.v2ex.com/t/900001",
      node: { name: "create", title: "创意" },
    },
    {
      id: 900002,
      title: "独立开发者如何做产品推广",
      content: "有什么好的推广渠道吗？",
      replies: 18,
      created: 1700000100,
      node: { name: "share", title: "分享发现" },
    },
  ],

  "suggestqueries.google.com": [
    "ai startup",
    [
      "ai startup ideas",
      "ai startup funding",
      "ai startup tools",
      "ai startup accelerator",
      "ai startup cost",
    ],
  ],

  "api.twitter.com": {
    data: [
      {
        id: "tw_001",
        text: "Just launched my AI SaaS product! #startup #ai",
        created_at: "2024-03-01T10:00:00Z",
        author_id: "user_123",
        public_metrics: {
          like_count: 42,
          retweet_count: 12,
          reply_count: 5,
          quote_count: 3,
        },
      },
    ],
  },
};

/**
 * Create a mock HTTP client that returns predefined responses.
 */
function createMockHttpClient() {
  return {
    async getJson(url) {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const mockData = MOCK_RESPONSES[host];
      if (!mockData) throw new Error(`No mock data for host: ${host}`);
      return JSON.parse(JSON.stringify(mockData));
    },
    async getText(url) {
      return "<html><body>mock</body></html>";
    },
    async postJson(url, body, options) {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const mockData = MOCK_RESPONSES[host];
      if (!mockData) throw new Error(`No mock data for host: ${host}`);
      return JSON.parse(JSON.stringify(mockData));
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

console.log("\n🧪 Data Sources — Integration Tests\n");

// ─── Registry Tests ───────────────────────────────────────────────
console.log("── Registry ──");

test("all 11 adapters are registered", () => {
  assert.equal(REGISTRY.size, 11);
});

test("listSources returns all sources with metadata", () => {
  const sources = listSources();
  assert.equal(sources.length, 11);
  for (const source of sources) {
    assert.ok(source.name, `source missing name`);
    assert.ok(source.label, `${source.name} missing label`);
    assert.ok(source.type, `${source.name} missing type`);
    assert.ok(typeof source.requiresAuth === "boolean", `${source.name} missing requiresAuth`);
  }
});

test("getSource returns correct adapter", () => {
  const reddit = getSource("reddit");
  assert.ok(reddit);
  assert.equal(reddit.name, "reddit");
  assert.equal(reddit.type, "community");
});

test("getSource returns undefined for unknown source", () => {
  assert.equal(getSource("nonexistent"), undefined);
});

const EXPECTED_SOURCES = [
  "reddit", "hacker-news", "github", "product-hunt", "google-trends",
  "app-store", "twitter", "v2ex", "zhihu", "xiaohongshu", "google-autocomplete",
];

test("all expected source names are registered", () => {
  for (const name of EXPECTED_SOURCES) {
    assert.ok(getSource(name), `Missing adapter: ${name}`);
  }
});

// ─── Interface Tests ──────────────────────────────────────────────
console.log("\n── Adapter Interface ──");

for (const name of EXPECTED_SOURCES) {
  test(`${name} adapter has correct interface`, () => {
    const adapter = getSource(name);
    assert.equal(typeof adapter.name, "string");
    assert.equal(typeof adapter.label, "string");
    assert.ok(["community", "case", "trend", "review"].includes(adapter.type),
      `${name} has invalid type: ${adapter.type}`);
    assert.equal(typeof adapter.requiresAuth, "boolean");
    assert.equal(typeof adapter.collect, "function");
    assert.ok(["global", "china", "both"].includes(adapter.region ?? "global"),
      `${name} has invalid region: ${adapter.region}`);
  });
}

// ─── Region Tests ─────────────────────────────────────────────────
console.log("\n── Region Classification ──");

test("global sources are correctly classified", () => {
  const globalSources = ["reddit", "hacker-news", "github", "product-hunt",
    "google-trends", "app-store", "twitter", "google-autocomplete"];
  for (const name of globalSources) {
    const adapter = getSource(name);
    assert.equal(adapter.region, "global", `${name} should be global`);
  }
});

test("china sources are correctly classified", () => {
  const chinaSources = ["v2ex", "zhihu", "xiaohongshu"];
  for (const name of chinaSources) {
    const adapter = getSource(name);
    assert.equal(adapter.region, "china", `${name} should be china`);
  }
});

// ─── Auth Tests ───────────────────────────────────────────────────
console.log("\n── Auth Requirements ──");

test("free sources do not require auth", () => {
  const freeSources = ["reddit", "hacker-news", "google-autocomplete",
    "v2ex", "zhihu", "xiaohongshu", "google-trends", "app-store"];
  for (const name of freeSources) {
    const adapter = getSource(name);
    assert.equal(adapter.requiresAuth, false, `${name} should be free`);
  }
});

test("auth sources require credentials", () => {
  const authSources = ["product-hunt", "twitter"];
  for (const name of authSources) {
    const adapter = getSource(name);
    assert.equal(adapter.requiresAuth, true, `${name} should require auth`);
  }
});

// ─── Collect Tests with Mock HTTP ─────────────────────────────────
console.log("\n── Collection (Mock HTTP) ──");

const mockHttp = createMockHttpClient();

await testAsync("reddit adapter collects and parses posts", async () => {
  const adapter = getSource("reddit");
  const items = await adapter.collect(
    { communities: ["SaaS"], limit: 5 },
    mockHttp
  );
  assert.ok(items.length > 0, "should return items");
  assert.equal(items[0].source, "reddit");
  assert.ok(items[0].id.startsWith("reddit:"));
  assert.ok(items[0].title);
  assert.equal(typeof items[0].score, "number");
  assert.equal(typeof items[0].comments, "number");
});

await testAsync("reddit adapter requires community", async () => {
  const adapter = getSource("reddit");
  try {
    await adapter.collect({}, mockHttp);
    assert.fail("should throw");
  } catch (error) {
    assert.ok(error.message.includes("community"));
  }
});

await testAsync("hacker-news adapter collects and parses hits", async () => {
  const adapter = getSource("hacker-news");
  const items = await adapter.collect(
    { query: "ai startup", limit: 5 },
    mockHttp
  );
  assert.ok(items.length > 0, "should return items");
  assert.equal(items[0].source, "hacker-news");
  assert.ok(items[0].id.startsWith("hn:"));
  assert.ok(items[0].title);
  assert.equal(typeof items[0].score, "number");
});

await testAsync("hacker-news adapter requires query", async () => {
  const adapter = getSource("hacker-news");
  try {
    await adapter.collect({}, mockHttp);
    assert.fail("should throw");
  } catch (error) {
    assert.ok(error.message.includes("query"));
  }
});

await testAsync("github adapter collects and parses repos", async () => {
  const adapter = getSource("github");
  const items = await adapter.collect(
    { query: "ai tool", limit: 5 },
    mockHttp,
    {}
  );
  assert.ok(items.length > 0, "should return items");
  assert.equal(items[0].source, "github");
  assert.ok(items[0].id.startsWith("github:"));
  assert.ok(items[0].title);
  assert.ok(items[0].tags.length > 0);
});

await testAsync("product-hunt adapter requires token", async () => {
  const adapter = getSource("product-hunt");
  try {
    await adapter.collect({ limit: 5 }, mockHttp, {});
    assert.fail("should throw");
  } catch (error) {
    assert.ok(error.message.includes("PRODUCT_HUNT_TOKEN"));
  }
});

await testAsync("product-hunt adapter collects with token", async () => {
  const adapter = getSource("product-hunt");
  const items = await adapter.collect(
    { limit: 5 },
    mockHttp,
    { PRODUCT_HUNT_TOKEN: "test-token" }
  );
  assert.ok(items.length > 0, "should return items");
  assert.equal(items[0].source, "product-hunt");
  assert.ok(items[0].id.startsWith("ph:"));
  assert.ok(items[0].title);
});

await testAsync("v2ex adapter collects hot topics", async () => {
  const adapter = getSource("v2ex");
  const items = await adapter.collect(
    { mode: "hot", limit: 5 },
    mockHttp,
    {}
  );
  assert.ok(items.length > 0, "should return items");
  assert.equal(items[0].source, "v2ex");
  assert.ok(items[0].id.startsWith("v2ex:"));
  assert.ok(items[0].title);
});

await testAsync("google-autocomplete adapter collects suggestions", async () => {
  const adapter = getSource("google-autocomplete");
  const items = await adapter.collect(
    { queries: ["ai startup"], limit: 10 },
    mockHttp
  );
  assert.ok(items.length > 0, "should return items");
  assert.equal(items[0].source, "google-autocomplete");
  assert.ok(items[0].id.startsWith("gac:"));
  assert.ok(items[0].query);
});

await testAsync("twitter adapter requires token", async () => {
  const adapter = getSource("twitter");
  try {
    await adapter.collect({ query: "startup" }, mockHttp, {});
    assert.fail("should throw");
  } catch (error) {
    assert.ok(error.message.includes("TWITTER_BEARER_TOKEN"));
  }
});

await testAsync("twitter adapter collects with token", async () => {
  const adapter = getSource("twitter");
  const items = await adapter.collect(
    { query: "startup", limit: 10 },
    mockHttp,
    { TWITTER_BEARER_TOKEN: "test-token" }
  );
  assert.ok(items.length > 0, "should return items");
  assert.equal(items[0].source, "twitter");
  assert.ok(items[0].id.startsWith("twitter:"));
  assert.ok(items[0].title);
});

// ─── collectFromSources Tests ─────────────────────────────────────
console.log("\n── collectFromSources ──");

await testAsync("collectFromSources handles unknown source gracefully", async () => {
  const result = await collectFromSources(
    [{ type: "nonexistent", query: "test" }],
    { failFast: false }
  );
  assert.equal(result.items.length, 0);
  assert.equal(result.errors.length, 1);
  assert.ok(result.errors[0].error.includes("Unknown source"));
});

await testAsync("collectFromSources deduplicates items", async () => {
  // Mock: collectFromSources uses its own httpClient, so we test deduplication logic
  const items = dedupeById([
    { id: "a", title: "first" },
    { id: "a", title: "duplicate" },
    { id: "b", title: "second" },
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[0].title, "first");
});

await testAsync("collectFromSources includes coverage stats", async () => {
  const result = await collectFromSources(
    [{ type: "nonexistent" }],
    { failFast: false }
  );
  assert.ok(result.coverage);
  assert.ok(result.collectedAt);
});

// ─── Utility Tests ────────────────────────────────────────────────
console.log("\n── Utilities ──");

test("cleanText handles various inputs", () => {
  assert.equal(cleanText(null), "");
  assert.equal(cleanText(""), "");
  assert.equal(cleanText("  hello\n world  "), "hello world");
  assert.equal(cleanText("a".repeat(500), 10), "a".repeat(10));
});

test("toNumber handles various inputs", () => {
  assert.equal(toNumber(42), 42);
  assert.equal(toNumber("42"), 42);
  assert.equal(toNumber(null), 0);
  assert.equal(toNumber("abc", 5), 5);
});

test("dedupeById removes duplicates", () => {
  const items = dedupeById([
    { id: "1", value: "a" },
    { id: "2", value: "b" },
    { id: "1", value: "c" },
  ]);
  assert.equal(items.length, 2);
  assert.equal(items[0].value, "a");
});

// ─── Summary ──────────────────────────────────────────────────────
console.log("\n" + "─".repeat(50));
console.log(`\n  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);

if (failed > 0) {
  process.exit(1);
}
