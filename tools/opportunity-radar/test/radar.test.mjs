import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeOpportunityRadar,
  detectPainSignals,
  scoreOpportunity,
} from "../src/radar.mjs";
import {
  buildDiscoverArtifacts,
  buildRunFileName,
} from "../src/artifacts.mjs";
import {
  buildCommunitySourceUrl,
  fetchCommunitySources,
  fetchRadarSources,
} from "../src/sources.mjs";

const communityPosts = [
  {
    id: "reddit:ops-1",
    source: "reddit",
    community: "r/SaaS",
    title: "Zapier is getting too expensive for our client onboarding automations",
    excerpt: "We keep a spreadsheet of failed multi-step automations because the tools are pricey and brittle. Is there a cheaper alternative?",
    score: 91,
    comments: 38,
    createdAt: "2026-05-31T10:00:00.000Z",
    url: "https://www.reddit.com/r/SaaS/comments/ops1/zapier_expensive/",
  },
  {
    id: "hn:ops-2",
    source: "hacker-news",
    community: "Ask HN",
    title: "Ask HN: What do you use instead of Zapier for onboarding workflows?",
    excerpt: "The current setup breaks when one API changes and we manually reconcile the spreadsheet every Friday.",
    score: 144,
    comments: 72,
    createdAt: "2026-05-31T11:00:00.000Z",
    url: "https://news.ycombinator.com/item?id=1",
  },
  {
    id: "ih:ops-3",
    source: "indie-hackers",
    community: "Indie Hackers",
    title: "How are you handling failed automation runs for small B2B clients?",
    excerpt: "I would pay for a lightweight audit trail before buying a full enterprise iPaaS.",
    score: 24,
    comments: 11,
    createdAt: "2026-05-31T12:00:00.000Z",
    url: "https://www.indiehackers.com/post/sample",
  },
];

const publicCases = [
  {
    id: "case:github-invoice",
    source: "github",
    title: "Open-source invoice generator grew to $5k MRR through GitHub and SEO",
    url: "https://github.com/example/invoice-generator",
    targetUser: "freelancers",
    pain: "creating compliant invoices quickly",
    productShape: "template-backed SaaS",
    firstAcquisitionChannel: "GitHub README and long-tail SEO",
    pricing: "$9/mo",
    revenue: "$5k MRR",
    validationMove: "free GitHub tool to paid hosted workflow",
    copyable: ["open-source lead magnet", "SEO pages for invoice formats", "simple subscription"],
    notCopyable: ["repository age"],
  },
  {
    id: "case:celebrity-audience",
    source: "founder-blog",
    title: "Creator with a huge audience sold a generic habit tracker",
    url: "https://example.com/habit-tracker",
    targetUser: "creator audience",
    pain: "tracking habits",
    productShape: "consumer app",
    firstAcquisitionChannel: "existing audience",
    pricing: "$4.99/mo",
    revenue: "$40k MRR",
    validationMove: "newsletter launch",
    copyable: ["simple app packaging"],
    notCopyable: ["large existing audience", "personal brand"],
  },
];

test("detectPainSignals identifies repeated community opportunity signals", () => {
  const signals = detectPainSignals(communityPosts[0]);

  assert.deepEqual(
    signals.map((signal) => signal.type),
    ["pricing-pain", "alternative-seeking", "manual-workflow"],
  );
});

test("analyzeOpportunityRadar produces pain-led and case-led candidates", () => {
  const analysis = analyzeOpportunityRadar({
    project: "Weekly International Opportunity Radar",
    generatedAt: "2026-06-01T08:00:00.000Z",
    communities: communityPosts,
    cases: publicCases,
  });

  assert.equal(analysis.project, "Weekly International Opportunity Radar");
  assert.equal(analysis.generatedAt, "2026-06-01T08:00:00.000Z");
  assert.equal(analysis.signalSummary.communityItems, 3);
  assert.equal(analysis.signalSummary.caseItems, 2);
  assert.equal(analysis.candidates.length, 2);
  assert.deepEqual(analysis.candidates.map((candidate) => candidate.type), ["pain-led", "case-led"]);

  const painCandidate = analysis.candidates[0];
  assert.equal(painCandidate.targetUser, "small B2B operators using automation workflows");
  assert.match(painCandidate.painfulSituation, /failed multi-step automations/i);
  assert.equal(painCandidate.firstReachableChannel, "reddit:r/SaaS");
  assert.ok(painCandidate.scores.painHeat > painCandidate.scores.caseProof);
  assert.ok(painCandidate.score >= 70);

  const caseCandidate = analysis.candidates[1];
  assert.equal(caseCandidate.sourceCaseIds[0], "case:github-invoice");
  assert.match(caseCandidate.copyable.join(" "), /open-source lead magnet/i);
  assert.match(caseCandidate.whatNotToCopy.join(" "), /repository age/i);
});

test("scoreOpportunity penalizes pure clone and moat-dependent case opportunities", () => {
  const fastCopyable = scoreOpportunity({
    type: "case-led",
    evidenceCount: 3,
    sourceCount: 2,
    signalTypes: ["revenue-signal", "pricing-signal", "github-distribution"],
    copyableCount: 3,
    nonCopyableCount: 1,
    cloneRisk: "medium",
    moatDependency: "low",
  });
  const audienceDependent = scoreOpportunity({
    type: "case-led",
    evidenceCount: 1,
    sourceCount: 1,
    signalTypes: ["revenue-signal"],
    copyableCount: 1,
    nonCopyableCount: 3,
    cloneRisk: "high",
    moatDependency: "high",
  });

  assert.ok(fastCopyable.total > audienceDependent.total);
  assert.ok(audienceDependent.cloneRiskPenalty > fastCopyable.cloneRiskPenalty);
  assert.ok(audienceDependent.moatDependencyPenalty > fastCopyable.moatDependencyPenalty);
});

test("buildRunFileName preserves every mining run with collision-safe names", () => {
  const first = buildRunFileName({
    generatedAt: "2026-06-01T08:09:10.000Z",
    slug: "Weekly International Opportunity Radar",
    existingNames: new Set(),
  });
  const second = buildRunFileName({
    generatedAt: "2026-06-01T08:09:10.000Z",
    slug: "Weekly International Opportunity Radar",
    existingNames: new Set([first]),
  });

  assert.equal(first, "2026-06-01T08-09-10-weekly-international-opportunity-radar.json");
  assert.equal(second, "2026-06-01T08-09-10-weekly-international-opportunity-radar-2.json");
});

test("buildDiscoverArtifacts maps radar output into stage report and validation handoff", () => {
  const analysis = analyzeOpportunityRadar({
    project: "Weekly International Opportunity Radar",
    generatedAt: "2026-06-01T08:00:00.000Z",
    communities: communityPosts,
    cases: publicCases,
  });
  const artifacts = buildDiscoverArtifacts(analysis, {
    projectId: "ai-ecommerce-image-optimizer",
    runFileName: "2026-06-01T08-00-00-weekly-international-opportunity-radar.json",
    generatedAt: "2026-06-01T08:00:00.000Z",
    sourceErrors: [
      {
        type: "reddit",
        message: "fetch failed",
      },
    ],
  });

  assert.equal(artifacts.input.stage, "discover");
  assert.deepEqual(artifacts.input.inputs.sourceErrors, [
    {
      type: "reddit",
      message: "fetch failed",
    },
  ]);
  assert.equal(artifacts.report.stage, "discover");
  assert.deepEqual(artifacts.report.analysis.radarRun.sourceErrors, [
    {
      type: "reddit",
      message: "fetch failed",
    },
  ]);
  assert.equal(artifacts.report.analysis.radarRun.runPath, "stages/discover/runs/2026-06-01T08-00-00-weekly-international-opportunity-radar.json");
  assert.equal(artifacts.report.analysis.opportunityBacklog.length, 2);
  assert.equal(artifacts.handoff.fromStage, "discover");
  assert.equal(artifacts.handoff.toStage, "validate");
  assert.equal(artifacts.handoff.summary.candidateId, analysis.candidates[0].id);
  assert.match(artifacts.markdown, /# Opportunity Discovery Report/);
});

test("fetchCommunitySources collects Reddit and Hacker News posts with a fake fetcher", async () => {
  const calls = [];
  const posts = await fetchCommunitySources([
    { type: "reddit", community: "SaaS", search: "zapier alternative", limit: 2 },
    { type: "hacker-news", query: "zapier alternative", limit: 1 },
  ], {
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.includes("reddit.com")) {
        return {
          ok: true,
          async json() {
            return {
              data: {
                children: [
                  {
                    data: {
                      id: "abc",
                      subreddit: "SaaS",
                      title: "Zapier alternative for client onboarding?",
                      selftext: "Manual spreadsheet cleanup is getting painful.",
                      score: 42,
                      num_comments: 9,
                      created_utc: 1780000000,
                      permalink: "/r/SaaS/comments/abc/zapier/",
                    },
                  },
                ],
              },
            };
          },
        };
      }
      return {
        ok: true,
        async json() {
          return {
            hits: [
              {
                objectID: "hn1",
                title: "Ask HN: Zapier alternative?",
                story_text: "The API sync breaks every week.",
                points: 80,
                num_comments: 20,
                created_at: "2026-06-01T08:00:00.000Z",
                url: null,
              },
            ],
          };
        },
      };
    },
  });

  assert.equal(calls[0], "https://www.reddit.com/r/SaaS/search.json?q=zapier+alternative&restrict_sr=1&sort=relevance&limit=2");
  assert.equal(calls[1], "https://hn.algolia.com/api/v1/search?query=zapier+alternative&tags=story&hitsPerPage=1");
  assert.deepEqual(posts.map((post) => post.id), ["reddit:abc", "hacker-news:hn1"]);
  assert.deepEqual(posts.map((post) => post.source), ["reddit", "hacker-news"]);
  assert.match(posts[0].excerpt, /Manual spreadsheet/);
  assert.match(posts[1].url, /news\.ycombinator\.com/);
});

test("buildCommunitySourceUrl supports reddit listings and hacker news search", () => {
  assert.equal(
    buildCommunitySourceUrl({ type: "reddit", community: "SideProject", listing: "top", time: "week", limit: 10 }),
    "https://www.reddit.com/r/SideProject/top.json?t=week&limit=10",
  );
  assert.equal(
    buildCommunitySourceUrl({ type: "hacker-news", query: "manual workflow", limit: 5 }),
    "https://hn.algolia.com/api/v1/search?query=manual+workflow&tags=story&hitsPerPage=5",
  );
});

test("fetchRadarSources collects GitHub, Indie Hackers, Product Hunt, and Show HN sources", async () => {
  const calls = [];
  const fetched = await fetchRadarSources([
    { type: "github", query: "invoice generator", minStars: 50, limit: 2 },
    { type: "indie-hackers", query: "invoice", limit: 2 },
    { type: "product-hunt", query: "invoice", limit: 2 },
    { type: "show-hn", query: "invoice", limit: 1 },
  ], {
    fetchImpl: async (url, init = {}) => {
      calls.push({
        url,
        method: init.method ?? "GET",
        authorization: init.headers?.Authorization ?? null,
        body: init.body ?? null,
      });
      if (url.includes("api.github.com")) {
        return okJson({
          items: [
            {
              full_name: "acme/invoice-generator",
              html_url: "https://github.com/acme/invoice-generator",
              description: "Open-source invoice generator for freelancers",
              stargazers_count: 640,
              topics: ["invoice", "freelance", "saas"],
              language: "TypeScript",
              created_at: "2025-01-01T00:00:00.000Z",
              updated_at: "2026-05-01T00:00:00.000Z",
            },
          ],
        });
      }
      if (url.includes("indiehackers.com")) {
        return okText(`
          <a class="slick-story database__story" href="/post/abc123">
            <span class="slick-story__title">Bootstrapping invoice automation to $8k/mo</span>
            <span class="database__story-mrr">$8k/mo</span>
          </a>
        `);
      }
      if (url.includes("producthunt.com/search")) {
        return okText(`
          <a href="/products/invoice-ai"><div>Invoice AI</div><div>Automate invoices for freelancers</div><div>238 upvotes</div></a>
        `);
      }
      if (url.includes("hn.algolia.com")) {
        return okJson({
          hits: [
            {
              objectID: "show1",
              title: "Show HN: Invoice workflow for freelancers",
              story_text: "I built this after manually fixing invoices every week.",
              points: 120,
              num_comments: 31,
              created_at: "2026-06-01T08:00:00.000Z",
            },
          ],
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    },
    githubToken: "gh-token",
  });

  assert.equal(calls[0].url, "https://api.github.com/search/repositories?q=invoice+generator+stars%3A%3E%3D50&sort=stars&order=desc&per_page=2");
  assert.equal(calls[0].authorization, "Bearer gh-token");
  assert.equal(calls[1].url, "https://www.indiehackers.com/stories?search=invoice");
  assert.equal(calls[2].url, "https://www.producthunt.com/search?q=invoice");
  assert.equal(calls[3].url, "https://hn.algolia.com/api/v1/search?query=invoice&tags=show_hn&hitsPerPage=1");

  assert.deepEqual(fetched.cases.map((item) => item.id), [
    "github:acme/invoice-generator",
    "indie-hackers:abc123",
    "product-hunt:invoice-ai",
  ]);
  assert.equal(fetched.communities[0].id, "hacker-news:show1");
  assert.equal(fetched.communities[0].community, "Show HN");
  assert.match(fetched.cases[0].firstAcquisitionChannel, /GitHub/);
  assert.match(fetched.cases[1].revenue, /\$8k\/mo/);
  assert.match(fetched.cases[2].productShape, /Product Hunt launch/);
});

test("fetchRadarSources uses Product Hunt GraphQL when an API token is provided", async () => {
  const calls = [];
  const fetched = await fetchRadarSources([
    { type: "product-hunt", query: "invoice", limit: 1, apiToken: "ph-token" },
  ], {
    fetchImpl: async (url, init = {}) => {
      calls.push({ url, method: init.method, authorization: init.headers?.Authorization, body: init.body });
      return okJson({
        data: {
          posts: {
            edges: [
              {
                node: {
                  id: "post-1",
                  name: "Invoice AI",
                  tagline: "Automate invoices for freelancers",
                  url: "https://www.producthunt.com/posts/invoice-ai",
                  votesCount: 238,
                  createdAt: "2026-05-20T00:00:00.000Z",
                },
              },
            ],
          },
        },
      });
    },
  });

  assert.equal(calls[0].url, "https://api.producthunt.com/v2/api/graphql");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].authorization, "Bearer ph-token");
  assert.match(calls[0].body, /posts/);
  assert.doesNotMatch(calls[0].body, /search/);
  assert.equal(JSON.parse(calls[0].body).variables.query, undefined);
  assert.equal(fetched.cases[0].id, "product-hunt:post-1");
  assert.equal(fetched.cases[0].pricing, "upvotes: 238");
});

test("fetchRadarSources uses Product Hunt GraphQL when a global API token is provided", async () => {
  const calls = [];
  const fetched = await fetchRadarSources([
    { type: "product-hunt", query: "invoice", limit: 1 },
  ], {
    productHuntToken: "global-ph-token",
    fetchImpl: async (url, init = {}) => {
      calls.push({ url, method: init.method, authorization: init.headers?.Authorization, body: init.body });
      return okJson({
        data: {
          posts: {
            edges: [
              {
                node: {
                  id: "post-2",
                  name: "Invoice Flow",
                  tagline: "Invoice workflows without spreadsheets",
                  url: "https://www.producthunt.com/posts/invoice-flow",
                  votesCount: 99,
                },
              },
            ],
          },
        },
      });
    },
  });

  assert.equal(calls[0].url, "https://api.producthunt.com/v2/api/graphql");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].authorization, "Bearer global-ph-token");
  assert.doesNotMatch(calls[0].body, /search/);
  assert.equal(JSON.parse(calls[0].body).variables.query, undefined);
  assert.equal(fetched.cases[0].id, "product-hunt:post-2");
});

test("fetchRadarSources records Product Hunt GraphQL errors instead of silently returning zero cases", async () => {
  const fetched = await fetchRadarSources([
    { type: "product-hunt", query: "invoice", limit: 1, apiToken: "ph-token" },
    { type: "github", query: "invoice generator", limit: 1 },
  ], {
    fetchImpl: async (url) => {
      if (url.includes("producthunt.com")) {
        return okJson({
          errors: [
            { message: "Field 'posts' doesn't accept argument 'search'" },
          ],
        });
      }
      return okJson({
        items: [
          {
            full_name: "acme/invoice-generator",
            html_url: "https://github.com/acme/invoice-generator",
            description: "Open-source invoice generator for freelancers",
            stargazers_count: 640,
            topics: ["invoice"],
            language: "TypeScript",
          },
        ],
      });
    },
  });

  assert.equal(fetched.cases[0].id, "github:acme/invoice-generator");
  assert.deepEqual(fetched.errors, [
    {
      type: "product-hunt",
      message: "Product Hunt GraphQL error: Field 'posts' doesn't accept argument 'search'",
    },
  ]);
});

test("fetchRadarSources records failed sources and continues by default", async () => {
  const calls = [];
  const fetched = await fetchRadarSources([
    { type: "product-hunt", query: "invoice", limit: 1 },
    { type: "github", query: "invoice generator", limit: 1 },
  ], {
    fetchImpl: async (url) => {
      calls.push(url);
      if (url.includes("producthunt.com")) {
        return {
          ok: false,
          status: 403,
          async json() {
            return {};
          },
          async text() {
            return "";
          },
        };
      }
      return okJson({
        items: [
          {
            full_name: "acme/invoice-generator",
            html_url: "https://github.com/acme/invoice-generator",
            description: "Open-source invoice generator for freelancers",
            stargazers_count: 640,
            topics: ["invoice"],
            language: "TypeScript",
          },
        ],
      });
    },
  });

  assert.equal(calls.length, 2);
  assert.equal(fetched.cases[0].id, "github:acme/invoice-generator");
  assert.deepEqual(fetched.errors, [
    {
      type: "product-hunt",
      message: "Failed to fetch product-hunt source (403).",
    },
  ]);
});

test("fetchRadarSources fails fast for unsupported source types", async () => {
  await assert.rejects(
    fetchRadarSources([
      { type: "unknown-source", query: "invoice" },
    ], {
      fetchImpl: async () => okJson({}),
    }),
    /Unsupported source type: unknown-source/,
  );
});

function okJson(payload) {
  return {
    ok: true,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  };
}

function okText(payload) {
  return {
    ok: true,
    async json() {
      return JSON.parse(payload);
    },
    async text() {
      return payload;
    },
  };
}
