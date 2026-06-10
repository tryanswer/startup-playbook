#!/usr/bin/env node

/**
 * Unit tests for the pipeline orchestrator.
 * Uses Node.js built-in test runner (node:test).
 *
 * Run: node --test tools/pipeline-orchestrator/test-orchestrator.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveNextStage, STAGE_ORDER } from "../_shared/playbook-io.mjs";
import {
  bridge_discover_validate,
  bridge_validate_businessModel,
  bridge_businessModel_build,
  bridge_build_grow,
  bridge_grow_operate,
  bridge_operate_validate,
  getBridge,
  executeBridge,
  BRIDGE_MAP,
} from "./stage-bridges.mjs";

/* ================================================================== */
/*  resolveNextStage                                                   */
/* ================================================================== */

describe("resolveNextStage", () => {
  it("advances to next stage on 'continue' decision", () => {
    const result = resolveNextStage("discover", "continue", null);
    assert.equal(result.nextStage, "validate");
    assert.equal(result.action, "advance");
  });

  it("advances through all stages in order", () => {
    const expectedOrder = [
      ["discover", "validate"],
      ["validate", "business-model"],
      ["business-model", "build"],
      ["build", "grow"],
      ["grow", "operate"],
    ];
    for (const [from, to] of expectedOrder) {
      const result = resolveNextStage(from, "continue", null);
      assert.equal(result.nextStage, to, `${from} should advance to ${to}`);
    }
  });

  it("returns null for last stage advance", () => {
    const result = resolveNextStage("operate", "continue", null);
    assert.equal(result.nextStage, null);
  });

  it("goes back to validate on 'pivot'", () => {
    const result = resolveNextStage("build", "pivot", null);
    assert.equal(result.nextStage, "validate");
    assert.equal(result.action, "back");
  });

  it("returns null on 'kill'", () => {
    const result = resolveNextStage("validate", "kill", null);
    assert.equal(result.nextStage, null);
    assert.equal(result.action, "kill");
  });

  it("stays on current stage for 'pause'", () => {
    const result = resolveNextStage("build", "pause", null);
    assert.equal(result.nextStage, "build");
    assert.equal(result.action, "pause");
  });

  it("stays on current stage for 'adjust'", () => {
    const result = resolveNextStage("grow", "adjust", null);
    assert.equal(result.nextStage, "grow");
    assert.equal(result.action, "stay");
  });

  it("respects explicit nextStageAction='advance'", () => {
    const result = resolveNextStage("validate", "continue", "advance");
    assert.equal(result.nextStage, "business-model");
    assert.equal(result.action, "advance");
  });

  it("respects explicit nextStageAction='stay'", () => {
    const result = resolveNextStage("validate", "continue", "stay");
    assert.equal(result.nextStage, "validate");
    assert.equal(result.action, "stay");
  });

  it("respects explicit nextStageAction='back-to-discover'", () => {
    const result = resolveNextStage("build", "continue", "back-to-discover");
    assert.equal(result.nextStage, "discover");
    assert.equal(result.action, "back");
  });
});

/* ================================================================== */
/*  Stage Bridges                                                      */
/* ================================================================== */

describe("Stage Bridges", () => {
  describe("discover → validate", () => {
    it("transforms handoff into validate input", () => {
      const handoff = {
        projectId: "test-project",
        summary: {
          candidateId: "c-001",
          targetUserCandidate: "Amazon sellers with 10-200 SKUs",
          painfulSituation: "Manual product photo editing takes 2h per SKU",
          promiseCandidate: "AI-powered batch image optimization",
          suggestedKeywords: ["product photo ai", "ecommerce image editor"],
          suggestedSubreddits: ["r/FulfillmentByAmazon", "r/ecommerce"],
        },
      };

      const input = bridge_discover_validate(handoff);
      assert.equal(input.artifactType, "stage-input");
      assert.equal(input.fromStage, "discover");
      assert.equal(input.toStage, "validate");
      assert.equal(input.targetUser, "Amazon sellers with 10-200 SKUs");
      assert.equal(input.candidateId, "c-001");
      assert.deepEqual(input.suggestedKeywords, ["product photo ai", "ecommerce image editor"]);
      assert.ok(input.ideaSummary);
    });

    it("handles missing fields gracefully", () => {
      const input = bridge_discover_validate({});
      assert.equal(input.targetUser, null);
      assert.equal(input.painfulSituation, null);
      assert.deepEqual(input.suggestedKeywords, []);
    });
  });

  describe("validate → business-model", () => {
    it("transforms handoff into business-model input", () => {
      const handoff = {
        projectId: "test-project",
        summary: {
          narrowedSegment: "Cross-border Amazon sellers, 10-200 SKUs",
          strongestRawLanguage: ["waste hours on photos", "need bulk editing"],
          paidIntentGaps: ["no compliance check tools available"],
          validationScore: 72,
        },
      };

      const input = bridge_validate_businessModel(handoff);
      assert.equal(input.fromStage, "validate");
      assert.equal(input.toStage, "business-model");
      assert.equal(input.narrowedSegment, "Cross-border Amazon sellers, 10-200 SKUs");
      assert.equal(input.validationScore, 72);
    });
  });

  describe("business-model → build", () => {
    it("transforms handoff into build input", () => {
      const handoff = {
        projectId: "test-project",
        summary: {
          modelType: "SaaS-subscription",
          pricingHypothesis: "$29/mo for 100 images",
          pricingTiers: [{ name: "Starter", price: 29 }, { name: "Pro", price: 79 }],
          mustNotBuild: ["social media features", "CRM"],
        },
      };

      const input = bridge_businessModel_build(handoff);
      assert.equal(input.modelType, "SaaS-subscription");
      assert.equal(input.pricingTiers.length, 2);
      assert.deepEqual(input.mustNotBuild, ["social media features", "CRM"]);
    });
  });

  describe("build → grow", () => {
    it("transforms handoff into grow input", () => {
      const handoff = {
        projectId: "test-project",
        summary: {
          deployedUrl: "https://app.example.com",
          analyticsEvents: ["sign_up", "image_processed", "purchase"],
          launchChannel: "Product Hunt",
        },
      };

      const input = bridge_build_grow(handoff);
      assert.equal(input.deployedUrl, "https://app.example.com");
      assert.equal(input.analyticsEvents.length, 3);
      assert.equal(input.launchChannel, "Product Hunt");
    });
  });

  describe("grow → operate", () => {
    it("transforms handoff into operate input", () => {
      const handoff = {
        projectId: "test-project",
        summary: {
          activeChannels: ["SEO", "Reddit", "Product Hunt"],
          utmConvention: "utm_source=reddit&utm_medium=organic",
        },
      };

      const input = bridge_grow_operate(handoff);
      assert.deepEqual(input.activeChannels, ["SEO", "Reddit", "Product Hunt"]);
      assert.ok(input.utmConvention);
    });
  });

  describe("operate → validate (loop-back)", () => {
    it("transforms handoff for re-validation", () => {
      const handoff = {
        projectId: "test-project",
        summary: {
          keyMetrics: { mrr: 500, churn: 0.15 },
          biggestBlocker: "D7 retention below 25%",
          pivotReason: "Core value not landing with current segment",
        },
      };

      const input = bridge_operate_validate(handoff);
      assert.equal(input.fromStage, "operate");
      assert.equal(input.toStage, "validate");
      assert.equal(input.biggestBlocker, "D7 retention below 25%");
      assert.ok(input.pivotReason);
    });
  });
});

/* ================================================================== */
/*  Bridge Registry                                                    */
/* ================================================================== */

describe("Bridge Registry", () => {
  it("has bridges for all consecutive stage pairs", () => {
    for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
      const from = STAGE_ORDER[i];
      const to = STAGE_ORDER[i + 1];
      const bridge = getBridge(from, to);
      assert.ok(bridge, `Missing bridge: ${from} → ${to}`);
    }
  });

  it("has a loop-back bridge operate → validate", () => {
    assert.ok(getBridge("operate", "validate"));
  });

  it("returns null for undefined bridges", () => {
    assert.equal(getBridge("validate", "operate"), null);
    assert.equal(getBridge("build", "discover"), null);
  });

  it("executeBridge throws for undefined bridges", async () => {
    await assert.rejects(
      () => executeBridge("validate", "operate", {}),
      { message: /No bridge defined/ }
    );
  });
});

/* ================================================================== */
/*  STAGE_ORDER                                                        */
/* ================================================================== */

describe("STAGE_ORDER", () => {
  it("contains 6 stages in correct order", () => {
    assert.deepEqual(STAGE_ORDER, [
      "discover", "validate", "business-model", "build", "grow", "operate",
    ]);
  });
});
