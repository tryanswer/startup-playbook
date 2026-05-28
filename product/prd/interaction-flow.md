# Interaction Flow

## Top-Level Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] Startup Playbook          [Ideas] [Products] [Agent ×3] │
└─────────────────────────────────────────────────────────────────┘
```

Three core views:

| View | What it holds | Lifecycle |
|---|---|---|
| **Ideas** | Ideas in Validate → Build stages | Incubating |
| **Products** | Launched products in Grow / Operate | Running |
| **Agent Tabs** | Independent web agent terminals (multi-tab) | Always available |

An idea **graduates** to Products once it completes the Build stage and launches.

---

## Flow 1: New Idea → Validation

### Step 1: Create Idea

```
┌──────────────────────────────────────────┐
│  What's your idea?                       │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ An AI-powered skin analysis app   │  │
│  │ that recommends personalized      │  │
│  │ skincare routines for women 25-35 │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Optional:                               │
│  Keywords: [skin care, ai beauty]        │
│  Target subreddits: [SkincareAddiction]  │
│  Geo: [US ▾]                             │
│                                          │
│            [Start Validation →]          │
└──────────────────────────────────────────┘
```

### Step 2: Auto Validation (Live Progress)

```
┌──────────────────────────────────────────┐
│  AI Skin Analysis App                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│  ✅ Reddit Pain Mining    34 posts       │
│  🔄 Trends & Demand      checking...    │
│  ○  Competitor Scan                      │
│  ○  Generate Report                      │
│                                          │
│  [Open Agent ↗] to ask follow-ups       │
└──────────────────────────────────────────┘
```

### Step 3: Decision Gate

```
┌──────────────────────────────────────────┐
│  CONTINUE  Score: 67/100                 │
│                                          │
│  Evidence:                               │
│  ✅ Pain rate 43% across 34 posts        │
│  ✅ 7 buyer-intent search queries        │
│  ⚠️  Mature market, 5+ competitors       │
│                                          │
│  [Kill ✕] [Pivot ↺] [Continue →]        │
│                                          │
│  [Open Agent ↗] "help me find a niche"  │
└──────────────────────────────────────────┘
```

Each decision gate follows the same pattern across all stages:

- Show evidence (auto-collected data + agent insights).
- Present concrete options (not vague "what do you think?").
- Offer an Agent shortcut for deeper exploration before deciding.

---

## Flow 2: Idea Pipeline (Ideas View)

```
┌──────────────────────────────────────────────────────────────────┐
│  My Ideas                                                 [+ New] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ● AI Skin Analysis App                                          │
│    Validate ✅ → Business Model ✅ → Build 🔄 → Grow ○ → Operate ○ │
│    Next: finish payment integration                              │
│    [Open] [Agent ↗]                                              │
│                                                                  │
│  ● Invoice Tool for Freelancers                                  │
│    Validate ✅ → Business Model 🔄 → Build ○ → Grow ○ → Operate ○ │
│    Next: choose pricing model                                    │
│    [Open] [Agent ↗]                                              │
│                                                                  │
│  ● Recipe Meal Planner                                           │
│    Validate ❌ (killed — score 22)                                │
│    [Archive] [Revisit]                                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Clicking **Open** on an idea enters the **Stage View** (see overview.md for full wireframe).

---

## Flow 3: Product Management (Products View)

Ideas **graduate** to Products after completing Build and launching. Products live in the Grow ↔ Operate cycle.

### Product List

```
┌──────────────────────────────────────────────────────────────────┐
│  My Products                                                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🟢 SkinGlow AI          $2.1K MRR    ▲12% this week            │
│     Grow ✅ → Operate 🔄                                        │
│     Next: review weekly report                                   │
│     [Open] [Agent ↗]                                            │
│                                                                  │
│  🟡 InvoicePal           $0 MRR       launched 3 days ago       │
│     Grow 🔄 → Operate ○                                        │
│     Next: Product Hunt launch tomorrow                           │
│     [Open] [Agent ↗]                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Product Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  SkinGlow AI                                                     │
├──────────────┬───────────────────────────────────────────────────┤
│  This Week   │  Quick Actions                                    │
│  ─────────   │  ┌─────────────────────────────────────────────┐ │
│  MRR: $2.1K  │  │ [📊 Weekly Report]  [📝 Content Calendar]  │ │
│  Users: 847  │  │ [🔍 Retention Tree] [📈 Channel Analysis]  │ │
│  D7: 34%     │  │ [🤖 Agent ↗]                               │ │
│  Churn: 5%   │  └─────────────────────────────────────────────┘ │
│              │                                                   │
│  History     │  Recent Agent Sessions                            │
│  ─────────   │  • "分析 Reddit 渠道 ROI" — 2h ago              │
│  📄 Week 12  │  • "写下周 newsletter" — yesterday              │
│  📄 Week 11  │  • "诊断注册转化下降" — 3 days ago              │
│  📄 Week 10  │                                                   │
└──────────────┴───────────────────────────────────────────────────┘
```

### Product Lifecycle

Products are not static. They cycle between Grow and Operate:

```
Grow ──→ Operate ──→ Grow ──→ Operate ──→ ...
 │          │
 │    weekly report says         content calendar
 │    "SEO traffic dropping"     exhausted, need
 │    → back to Grow             new channel
 │    with new strategy          → run Grow again
```

Products can also **return to Build** if a major feature or pivot is needed:

```
Operate → data shows users want feature X → Build (new feature) → Grow → Operate
```

---

## Flow 4: Agent Multi-Tab

Agent Tabs are **independent terminals** that can be opened from anywhere. They support multi-tab parallel sessions.

### Tab Bar

```
┌─────────────────────────────────────────────────────────────────┐
│  [Ideas] [Products] [Agent: SkinGlow ×] [Agent: Invoice ×] [+] │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Terminal

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent: SkinGlow AI · Context: Operate stage + all artifacts    │
│  Model: Claude 4.7 Opus ▾  │  Skills: [retention] [analytics]  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  > 这周 D7 留存从 38% 降到 34%，帮我诊断一下                      │
│                                                                  │
│  Based on your analytics data and the retention decision tree:   │
│                                                                  │
│  1. D7 34% is still above the 15% concern threshold, but the    │
│     4-point drop in one week warrants investigation.             │
│                                                                  │
│  2. Checking your event data...                                  │
│     - first_value_delivered dropped from 72% to 61%             │
│     - The drop correlates with the UI change you deployed on    │
│       Tuesday (commit 3a7f2b1)                                  │
│                                                                  │
│  3. Recommendation: Revert the onboarding flow change or A/B    │
│     test it. Want me to set up the experiment?                   │
│                                                                  │
│  > 好，帮我设计 A/B 测试方案                                      │
│  > _                                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Three Ways to Open an Agent Tab

| Method | Scenario | Auto-Loaded Context |
|---|---|---|
| **From a Stage** | Need deeper analysis within a stage | Stage skills + all prior artifacts |
| **From a Product** | Running product needs attention | Operate skills + full artifact chain + recent metrics |
| **New independent tab** | Free exploration, cross-project questions | User chooses which project to bind (or none) |

### Agent Tab Features

| Feature | Description |
|---|---|
| **Multi-tab** | Multiple tabs open in parallel, each with isolated context |
| **Context isolation** | Each tab has its own project binding and artifact scope — no cross-talk |
| **Model switching** | Switch between Claude / GPT / custom per tab |
| **Skill loading** | Manually add/remove skills beyond the stage defaults |
| **Session persistence** | Close a tab, reopen later, conversation and context restored |
| **Decision export** | Extract key decisions from a conversation into an ADR artifact |
| **Context package export** | One-click export of project context for use in Claude Code / Codex / Cursor |

---

## State Transition Diagram

```
                    ┌──────────────────────────┐
                    │         Ideas View        │
                    │  (incubating)             │
                    │                          │
   new idea ──────→ │  Validate → BizModel →   │
                    │  Build                    │
                    └──────────┬───────────────┘
                               │ launch
                    ┌──────────▼───────────────┐
                    │       Products View       │
                    │  (running)                │
                    │                          │
                    │  Grow ↔ Operate (cycle)   │
                    │  metrics + weekly report  │
                    │          │                │
                    │          ├─→ Build (major │
                    │          │   feature/pivot)│
                    │          │       │        │
                    │          ←───────┘        │
                    └──────────────────────────┘

   Agent Tabs: can be opened from any view, any stage, any time
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| **Kill at Validate** | Idea archived. All artifacts kept. Can "Revisit" to re-validate with different keywords. |
| **Pivot at any stage** | Stay in same stage, modify parameters, re-run auto tasks. Previous run's artifacts versioned. |
| **Back from Build to BizModel** | Allowed. Artifacts from Build are preserved. BizModel re-runs with new context. |
| **Product needs major rebuild** | Product returns to Build stage. Pipeline shows: Grow ← Build 🔄. |
| **User abandons an idea** | After 30 days of inactivity, prompt "Archive or continue?". No auto-deletion. |
| **Multiple ideas using same keywords** | Each idea is independent. Agent warns if validation data overlaps with another idea. |
