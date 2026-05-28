import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzePain,
  buildAiAnalysisPrompt,
  buildDemandHeatmapSummaryPrompt,
  normalizeRedditPost,
  renderHeatmapHtml,
  renderPainReport,
} from "../src/pain-miner.mjs";
import { summarizeDemandWithOpenAI } from "../src/llm-summary.mjs";
import { buildRedditListingUrl, redditChildrenToPosts } from "../src/reddit-source.mjs";

const beautyLogThemes = [
  {
    id: "hair-color-uncertainty",
    label: "Hair color uncertainty",
    patterns: ["hair color", "blonde", "brown", "red", "best on me"],
    productMoves: ["Add before/after hair color comparison flow."],
  },
  {
    id: "undertone-makeup-confusion",
    label: "Undertone and makeup confusion",
    patterns: ["warm vs cool", "undertone", "olive", "lipstick", "foundation", "shade"],
    productMoves: ["Explain undertone-specific makeup choices."],
  },
  {
    id: "photo-quality-friction",
    label: "Photo quality friction",
    patterns: ["photo", "lighting", "no makeup", "drapes"],
    productMoves: ["Add guided capture checks before analysis."],
  },
];

const redditJson = {
  data: {
    children: [
      {
        data: {
          id: "a1",
          subreddit: "coloranalysis",
          link_flair_text: "Hair Color Advice",
          title: "Which hair color looks best on me?",
          selftext: "I keep switching between blonde and brown and cannot tell what suits my undertone.",
          score: 838,
          num_comments: 1847,
          created_utc: 1760000000,
          permalink: "/r/coloranalysis/comments/a1/hair_color/",
          author: "private-user",
          url: "https://i.redd.it/private-face.jpg",
        },
      },
      {
        data: {
          id: "a2",
          subreddit: "OliveMUA",
          link_flair_text: "Product Help",
          title: "Any similar drugstore shade for cool olive skin?",
          selftext: "Foundation always turns orange on me.",
          score: 475,
          num_comments: 107,
          created_utc: 1760000100,
          permalink: "https://www.reddit.com/r/OliveMUA/comments/a2/shade/",
        },
      },
      {
        data: {
          id: "a3",
          subreddit: "coloranalysis",
          link_flair_text: "Type Me! - IRL Drapes",
          title: "How to take the best photo for analysis?",
          selftext: "Do I need direct sun, overcast light, no makeup, or white paper?",
          score: 90,
          num_comments: 38,
          created_utc: 1760000200,
          permalink: "/r/coloranalysis/comments/a3/photo/",
        },
      },
    ],
  },
};

test("buildRedditListingUrl supports top, new, and subreddit search endpoints", () => {
  assert.equal(
    buildRedditListingUrl({ community: "coloranalysis", listing: "top", time: "month", limit: 25 }),
    "https://www.reddit.com/r/coloranalysis/top.json?t=month&limit=25",
  );
  assert.equal(
    buildRedditListingUrl({ community: "OliveMUA", listing: "new", limit: 10 }),
    "https://www.reddit.com/r/OliveMUA/new.json?limit=10",
  );
  assert.equal(
    buildRedditListingUrl({ community: "MakeupAddiction", search: "warm vs cool makeup", sort: "relevance", limit: 15 }),
    "https://www.reddit.com/r/MakeupAddiction/search.json?q=warm+vs+cool+makeup&restrict_sr=1&sort=relevance&limit=15",
  );
});

test("normalizeRedditPost keeps research fields and removes identity/media fields", () => {
  const post = normalizeRedditPost(redditJson.data.children[0].data);

  assert.deepEqual(Object.keys(post).sort(), [
    "comments",
    "community",
    "createdAt",
    "excerpt",
    "flair",
    "id",
    "score",
    "source",
    "title",
    "url",
  ]);
  assert.equal(post.source, "reddit");
  assert.equal(post.community, "coloranalysis");
  assert.equal(post.url, "https://www.reddit.com/r/coloranalysis/comments/a1/hair_color/");
  assert.match(post.excerpt, /cannot tell what suits my undertone/);
  assert.equal("author" in post, false);
});

test("redditChildrenToPosts normalizes and deduplicates posts", () => {
  const posts = redditChildrenToPosts({
    data: {
      children: [
        redditJson.data.children[0],
        redditJson.data.children[0],
        redditJson.data.children[1],
      ],
    },
  });

  assert.equal(posts.length, 2);
  assert.deepEqual(posts.map((post) => post.id), ["reddit:a1", "reddit:a2"]);
});

test("analyzePain builds heatmap themes and demand validation from repeated pain", () => {
  const posts = redditChildrenToPosts(redditJson);
  const analysis = analyzePain(posts, {
    project: "Beauty Log",
    themes: beautyLogThemes,
    thresholds: { minThemeCount: 2, minPurchaseSignals: 1 },
  });

  assert.equal(analysis.project, "Beauty Log");
  assert.equal(analysis.totalPosts, 3);
  assert.deepEqual(
    analysis.heatmap.map((theme) => theme.id),
    ["undertone-makeup-confusion", "hair-color-uncertainty", "photo-quality-friction"],
  );
  assert.equal(analysis.heatmap[0].count, 2);
  assert.equal(analysis.demand.gate, "validation-needed");
  assert.equal(analysis.demand.recurringPain, true);
  assert.equal(analysis.demand.targetUsersFound, true);
  assert.equal(analysis.demand.purchaseIntentFound, true);
});

test("renderPainReport and AI prompt preserve evidence without dumping raw corpus", () => {
  const analysis = analyzePain(redditChildrenToPosts(redditJson), {
    project: "Beauty Log",
    themes: beautyLogThemes,
  });
  const report = renderPainReport(analysis);
  const prompt = buildAiAnalysisPrompt(analysis);

  assert.match(report, /^# Topic Pain Mining Report: Beauty Log/m);
  assert.match(report, /Demand Reality Gate/);
  assert.match(report, /Hair color uncertainty/);
  assert.match(report, /Product iteration moves/);
  assert.match(prompt, /You are analyzing demand truth/);
  assert.match(prompt, /Do not invent evidence/);
  assert.doesNotMatch(report, /private-user/);
  assert.doesNotMatch(report, /private-face/);
});

test("renderHeatmapHtml builds a self-contained demand heatmap page", () => {
  const analysis = analyzePain(redditChildrenToPosts(redditJson), {
    project: "Beauty Log",
    themes: beautyLogThemes,
  });
  const html = renderHeatmapHtml(analysis, {
    title: "Color Diagnosis Reddit Heatmap",
    llmSummary: "Hair color and undertone confusion are the strongest clusters.",
  });

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Color Diagnosis Reddit Heatmap/);
  assert.match(html, /data-theme-id="undertone-makeup-confusion"/);
  assert.match(html, /Hair color and undertone confusion/);
  assert.match(html, /https:\/\/www\.reddit\.com\/r\/coloranalysis\/comments\/a1\/hair_color\//);
  assert.doesNotMatch(html, /private-user/);
  assert.doesNotMatch(html, /private-face/);
});

test("buildDemandHeatmapSummaryPrompt asks LLM for evidence-bounded heat distribution", () => {
  const analysis = analyzePain(redditChildrenToPosts(redditJson), {
    project: "Beauty Log",
    themes: beautyLogThemes,
  });
  const prompt = buildDemandHeatmapSummaryPrompt(analysis);

  assert.match(prompt, /demand heat distribution/);
  assert.match(prompt, /Use only the aggregated Reddit data provided/);
  assert.match(prompt, /Hair color uncertainty/);
  assert.match(prompt, /validation-needed/);
});

test("summarizeDemandWithOpenAI sends an evidence-bounded prompt and returns summary text", async () => {
  const analysis = analyzePain(redditChildrenToPosts(redditJson), {
    project: "Beauty Log",
    themes: beautyLogThemes,
  });
  const calls = [];
  const summary = await summarizeDemandWithOpenAI(analysis, {
    apiKey: "test-key",
    model: "test-model",
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        async json() {
          return { choices: [{ message: { content: "LLM heatmap summary" } }] };
        },
      };
    },
  });

  assert.equal(summary, "LLM heatmap summary");
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/chat\/completions$/);
  assert.equal(calls[0].init.headers.Authorization, "Bearer test-key");
  assert.match(calls[0].init.body, /demand heat distribution/);
});
