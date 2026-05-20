import assert from "node:assert/strict";
import test from "node:test";

import {
  cleanHtmlText,
  extractArticleText,
  extractCaseSignals,
  extractStoryCards,
  isCloudflareChallenge,
  synthesizeSkillMarkdown,
} from "../src/miner-utils.mjs";

const storiesHtml = `
<section class="stories__database">
  <a href="/post/abc123" class="slick-story database__story">
    <span class="slick-story__author">Jane Founder</span>
    <h4 class="slick-story__title">Bootstrapping a niche SaaS to $20k/mo with SEO</h4>
    <footer><span class="database__story-mrr">$20k/mo</span></footer>
  </a>
  <a href="https://www.indiehackers.com/post/xyz789" class="slick-story database__story">
    <span class="slick-story__author">Alex Maker</span>
    <h4 class="slick-story__title">Validating with Reddit before writing code</h4>
    <footer><span class="database__story-mrr">$4k/mo</span></footer>
  </a>
</section>`;

test("extractStoryCards returns normalized Indie Hackers case metadata", () => {
  const cards = extractStoryCards(storiesHtml, "https://www.indiehackers.com/stories");

  assert.deepEqual(cards, [
    {
      url: "https://www.indiehackers.com/post/abc123",
      source: "indie-hackers",
      title: "Bootstrapping a niche SaaS to $20k/mo with SEO",
      author: "Jane Founder",
      revenue: "$20k/mo",
    },
    {
      url: "https://www.indiehackers.com/post/xyz789",
      source: "indie-hackers",
      title: "Validating with Reddit before writing code",
      author: "Alex Maker",
      revenue: "$4k/mo",
    },
  ]);
});

test("cleanHtmlText removes scripts, styles, tags, and decodes common entities", () => {
  const text = cleanHtmlText("<h1>Build &amp; sell</h1><script>bad()</script><p>Users&nbsp;paid $29/mo.</p>");

  assert.equal(text, "Build & sell\nUsers paid $29/mo.");
});

test("extractArticleText keeps founder story body and removes page chrome", () => {
  const text = extractArticleText(`
    <body>
      <nav>Home Starting Up Case Studies DB Products Join</nav>
      <article>
        <h1>From simple theme to $65k/mo ecosystem</h1>
        <p>We started on a marketplace and validated demand before moving direct.</p>
        <p>Distribution mattered as much as product.</p>
      </article>
      <div class="ih-newsletter-cta">Indie Hackers Newsletter: Subscribe to get the latest stories.</div>
      <section>About the Author</section>
      <section>Post Comment</section>
    </body>
  `);

  assert.match(text, /validated demand/);
  assert.match(text, /Distribution mattered/);
  assert.doesNotMatch(text, /Home Starting Up/);
  assert.doesNotMatch(text, /Newsletter/);
  assert.doesNotMatch(text, /Post Comment/);
});

test("isCloudflareChallenge detects challenge pages", () => {
  assert.equal(isCloudflareChallenge("<title>Just a moment...</title><script>window._cf_chl_opt={}</script>"), true);
  assert.equal(isCloudflareChallenge("<title>Real article</title><article>Founder story</article>"), false);
});

test("extractCaseSignals finds repeatable startup patterns", () => {
  const signals = extractCaseSignals({
    title: "From Reddit validation to $10k MRR",
    text: "We validated the pain on Reddit, launched on Product Hunt, used SEO content, and charged $19/mo after customer interviews.",
  });

  assert.deepEqual(signals.channels, ["reddit", "product-hunt", "seo", "content"]);
  assert.deepEqual(signals.validation, ["community-pain", "customer-interviews", "launch-test"]);
  assert.deepEqual(signals.pricing, ["subscription", "price-point"]);
  assert.deepEqual(signals.revenueMentions, ["$10k MRR", "$19/mo"]);
});

test("synthesizeSkillMarkdown converts cases into a concise reusable skill", () => {
  const markdown = synthesizeSkillMarkdown([
    {
      title: "Bootstrapping a niche SaaS to $20k/mo with SEO",
      url: "https://example.com/a",
      signals: {
        channels: ["seo", "content"],
        validation: ["customer-interviews"],
        pricing: ["subscription"],
        businessModels: ["saas"],
        revenueMentions: ["$20k/mo"],
      },
    },
    {
      title: "Validating with Reddit before writing code",
      url: "https://example.com/b",
      signals: {
        channels: ["reddit"],
        validation: ["community-pain"],
        pricing: [],
        businessModels: [],
        revenueMentions: ["$4k/mo"],
      },
    },
  ], { skillName: "founder-case-patterns" });

  assert.match(markdown, /^---\nname: founder-case-patterns\n/m);
  assert.match(markdown, /Use when applying founder case-study lessons/);
  assert.match(markdown, /## Evidence Strength/);
  assert.match(markdown, /Sample size: 2 cases/);
  assert.match(markdown, /Confidence: weak/);
  assert.match(markdown, /## Strongest Patterns/);
  assert.match(markdown, /seo/);
  assert.match(markdown, /community-pain/);
  assert.doesNotMatch(markdown, /Full Article/i);
});
