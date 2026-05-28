# Startup Playbook — Artifact Output Specification

## Overview

CLI (Codex + startup-playbook) is the **executor**. UI is the **display layer**.  
CLI writes standardized JSON artifacts → UI reads and renders them.

---

## Directory Convention

```
product/app/.playbook-output/
  └── {projectId}/
      ├── validate/
      │   └── report.json
      ├── business-model/
      │   └── report.json
      ├── build/
      │   └── report.json
      ├── grow/
      │   └── report.json
      └── operate/
          └── report.json
```

- **projectId**: matches the project ID in UI's localStorage (e.g. `1779971153207-c897d1`)
- **stageId**: one of `validate`, `business-model`, `build`, `grow`, `operate`
- Each stage has exactly one `report.json` — overwritten on re-run
- `.playbook-output/` is gitignored

---

## Base Schema (all stages)

Every `report.json` must conform to this base structure:

```jsonc
{
  // Required fields
  "stage": "validate",                    // StageId
  "score": 65,                            // 0-100, overall confidence
  "decision": "continue",                 // "continue" | "pivot" | "kill"
  "reasoning": "Strong pain signals...",  // One sentence, decision rationale
  "evidence": [                           // Positive signals (1-5 items)
    "Active Reddit discussions with 40%+ frustration rate",
    "Growing search demand (score 72)"
  ],
  "concerns": [                           // Risk factors (1-5 items)
    "Crowded market with 8+ competitors",
    "Low willingness-to-pay signals"
  ],
  "generatedAt": "2026-05-28T20:50:00Z", // ISO 8601

  // Optional fields
  "analysis": { ... },                    // Stage-specific analysis (see below)
  "suggestedNextSteps": [ ... ],          // 2-4 actionable items
  "html": "<html>...</html>"              // Pre-rendered HTML report (optional)
}
```

### Scoring Guide

| Score   | Decision   | Meaning                              |
|---------|------------|--------------------------------------|
| 60-100  | `continue` | Strong signals. Proceed to next stage. |
| 35-59   | `pivot`    | Mixed signals. Narrow scope or re-validate. |
| 0-34    | `kill`     | Insufficient evidence. Abandon or restart. |

---

## Stage-Specific Schemas

### 1. Validate (`validate/report.json`)

```jsonc
{
  "stage": "validate",
  "score": 65,
  "decision": "continue",
  "reasoning": "Strong pain signals in target subreddits with moderate search demand.",
  "evidence": ["..."],
  "concerns": ["..."],
  "analysis": {
    "pain": "40% of r/skincare posts contain frustration keywords. Users complain about information overload and conflicting product recommendations.",
    "demand": "Search volume for 'AI skin analysis' growing 25% YoY. 'Personalized skincare routine' has 12K monthly searches.",
    "market": "8 competitors identified. Most are B2B (dermatology clinics). B2C gap exists for indie/consumer segment."
  },
  "suggestedNextSteps": [
    "Interview 5-10 potential users from r/skincare",
    "Build a landing page to test signup conversion",
    "Narrow niche: focus on acne-prone skin for women 25-30"
  ],
  "generatedAt": "2026-05-28T20:50:00Z"
}
```

### 2. Business Model (`business-model/report.json`)

```jsonc
{
  "stage": "business-model",
  "score": 55,
  "decision": "pivot",
  "reasoning": "Freemium model viable but CAC/LTV ratio needs improvement.",
  "evidence": ["..."],
  "concerns": ["..."],
  "analysis": {
    "model": "Freemium with premium tier at $9.99/mo. Free tier: 1 scan/week. Premium: unlimited scans + ingredient analysis.",
    "pricing": "Competitive analysis shows $5-15/mo range. $9.99 is mid-market positioning.",
    "revenue": "At 10K MAU with 5% conversion: $4,995 MRR. Break-even requires 2K paying users.",
    "cac": "Estimated CAC $8-15 via social media. LTV at 6-month retention: $42. LTV/CAC ratio: 2.8-5.2x."
  },
  "suggestedNextSteps": [
    "Test pricing with a fake-door experiment",
    "Validate willingness-to-pay with survey (Van Westendorp)",
    "Model unit economics at 1K, 5K, 20K user milestones"
  ],
  "generatedAt": "2026-05-28T21:00:00Z"
}
```

### 3. Build (`build/report.json`)

```jsonc
{
  "stage": "build",
  "score": 70,
  "decision": "continue",
  "reasoning": "MVP scope defined, tech stack selected, 2-week sprint plan ready.",
  "evidence": ["..."],
  "concerns": ["..."],
  "analysis": {
    "scope": "MVP: photo upload → AI analysis → routine recommendation. 3 screens. No login for v1.",
    "stack": "Next.js + Vercel. GPT-4o-mini for skin analysis. Stripe for payments.",
    "timeline": "Week 1: core flow + AI integration. Week 2: payment + landing page.",
    "risks": "AI accuracy needs validation with dermatologist review before launch."
  },
  "suggestedNextSteps": [
    "Set up project scaffold with Next.js",
    "Integrate AI skin analysis API",
    "Deploy to Vercel with staging environment"
  ],
  "generatedAt": "2026-05-28T21:10:00Z"
}
```

### 4. Grow (`grow/report.json`)

```jsonc
{
  "stage": "grow",
  "score": 50,
  "decision": "pivot",
  "reasoning": "SEO baseline established but distribution strategy needs sharper focus.",
  "evidence": ["..."],
  "concerns": ["..."],
  "analysis": {
    "seo": "Target 15 long-tail keywords. Domain authority starting at 0. Content plan: 2 posts/week.",
    "distribution": "Primary: TikTok/Instagram skin transformation content. Secondary: Reddit r/skincare value posts.",
    "growth_model": "Viral coefficient target: 1.2. Each user shares results → 0.3 new signups expected.",
    "channels": "Ranked: 1) Short-form video (TikTok) 2) Reddit community 3) SEO blog 4) Influencer micro-partnerships"
  },
  "suggestedNextSteps": [
    "Create 10 TikTok videos showing before/after skin analysis",
    "Write 5 SEO-optimized blog posts for target keywords",
    "Set up attribution tracking for each channel"
  ],
  "generatedAt": "2026-05-28T21:20:00Z"
}
```

### 5. Operate (`operate/report.json`)

```jsonc
{
  "stage": "operate",
  "score": 60,
  "decision": "continue",
  "reasoning": "Core metrics defined. Weekly review cadence established.",
  "evidence": ["..."],
  "concerns": ["..."],
  "analysis": {
    "metrics": "North Star: Weekly Active Scans. Supporting: Signup→Scan rate, Scan→Premium rate, D7 retention.",
    "retention": "Current D7 retention: 35%. Target: 50%. Biggest drop-off: after first scan result.",
    "operations": "Weekly review: Monday AM. Monthly deep-dive: first Friday. Quarterly strategy review.",
    "alerts": "Alert thresholds: DAU drop >20%, Error rate >2%, Payment failure >5%."
  },
  "suggestedNextSteps": [
    "Set up analytics dashboard (Mixpanel/PostHog)",
    "Configure alert thresholds in monitoring",
    "Schedule first weekly review meeting"
  ],
  "generatedAt": "2026-05-28T21:30:00Z"
}
```

---

## How CLI Should Write Artifacts

In startup-playbook skills, after analysis is complete:

```bash
# Create output directory
mkdir -p product/app/.playbook-output/{projectId}/{stageId}

# Write report
cat > product/app/.playbook-output/{projectId}/{stageId}/report.json << 'EOF'
{ ... }
EOF
```

Or in a skill's output instruction:

```
After completing analysis, write the result as a JSON file to:
  product/app/.playbook-output/{projectId}/{stageId}/report.json

The JSON must conform to the StageArtifactOutput schema.
```

---

## UI Reads Artifacts

```
GET /api/artifacts?projectId={id}&stageId={stage}
→ { data: { artifact: StageArtifactOutput | null } }
```

- Returns `null` if no artifact exists yet
- UI has a refresh button (↻) to reload from disk
- Decision Gate renders when artifact is loaded

---

## .gitignore

Add to `product/app/.gitignore`:
```
.playbook-output/
```
