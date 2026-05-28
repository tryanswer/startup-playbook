# Product Overview

## One-Liner

An AI-powered startup incubation platform — a **state machine + context layer + decision orchestrator** that turns an idea into a validated, built, and growing product, with a web agent terminal at every stage for human-AI collaboration.

## Problem

Solo founders and indie hackers face two failure modes:

1. **Build before validating** — spend months coding, launch to silence.
2. **Know the methodology but cannot execute it** — read playbooks, watch courses, but the gap between "knowing" and "doing" is too wide.

Existing tools solve pieces (landing page builders, analytics dashboards, AI coding agents) but nothing **orchestrates the full journey** from idea to revenue with evidence-based decision gates. More critically, these tools have no shared memory — context is lost every time you switch between stages, tools, or sessions.

## What the Product Layer Carries

Playbooks are knowledge. Tools are scripts. Skills are agent instructions. These are all **parts**. The product is the layer that wires them into a **startup state machine**:

### 1. State & Memory

```
Without the product layer:
  User reads docs → runs scripts locally → results scattered in files → context lost between stages

With the product layer:
  The full lifecycle of an idea is tracked
  Every decision, data point, and artifact is persisted
  Agent entering any stage auto-loads the complete history
```

An idea may take 3-6 months from birth to revenue. The user will pause, switch, and backtrack. The product layer ensures that **at any moment of resumption, the agent knows the full story of this idea**.

### 2. Decision Orchestration

```
The real value chain:

  Data → Evidence → Insight → Options → Decision → Execution → Feedback
  ↑                              ↑                   ↑
  Auto-collected                 Human decides        Auto-executed
```

The product does not make decisions for the user. It **structures decision points**:

- Present the right data at the right time.
- Turn vague "what should I do?" into concrete "A or B?".
- Record the reason behind each decision (ADR) so the agent never re-litigates.

### 3. Artifact Pipeline

Each stage's output is the next stage's input:

```
Validate                    Business Model              Build
┌────────────┐             ┌────────────┐             ┌────────────┐
│ pain themes ├────────→   │ pricing     ├────────→   │ CONTEXT.md │
│ user quotes │            │ model type  │            │ contracts/ │
│ competitors │            │ revenue path│            │ deployed URL│
│ demand score│            │ target seg  │            │ analytics  │
└────────────┘             └────────────┘             └────────────┘
       ↓                         ↓                         ↓
  Grow                      Operate
  ┌────────────┐           ┌────────────┐
  │ content cal │          │ weekly rpt  │
  │ UTM links   │          │ retention   │
  │ SEO config  │          │ churn diag  │
  └────────────┘           └────────────┘
```

The product manages this artifact chain. Without it, users manually carry files between tools, repeatedly explain context to agents, and lose track of what was decided and why.

## Solution

A product that:

- **Accepts an idea** as natural language input.
- **Automatically runs validation** (Reddit pain mining, trends, competitor scan) and produces a scored decision report.
- **Flows through five stages** (Validate → Business Model → Build → Grow → Operate), each with auto-execution and a web terminal for agent collaboration.
- **Produces artifacts at each stage** that feed the next stage (validation report → business model config → codebase → growth config → analytics dashboard).
- **Keeps the human in control** — every stage has a decision gate where the founder decides to continue, pivot, or kill.
- **Acts as a Context Provider** for external AI tools (Claude Code, Codex, Cursor) — not replacing them, but making them effective in the startup context.

## Target User

**Solo technical founders / indie hackers** who:

- Can code (or direct a coding agent).
- Are building their first or second product.
- Want to move fast but not skip validation.
- Are comfortable with a terminal-based workflow.

**Not for**: Non-technical founders, enterprise teams, or people who want a no-code builder.

## Core UX: The Pipeline View

```
┌──────────────────────────────────────────────────────────────────┐
│  My Ideas                                                 [+ New] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ● AI Skin Analysis App                                          │
│    Validate ✅ → Business Model ✅ → Build 🔄 → Grow ○ → Operate ○ │
│                                                                  │
│  ● Invoice Tool for Freelancers                                  │
│    Validate ✅ → Business Model 🔄 → Build ○ → Grow ○ → Operate ○ │
│                                                                  │
│  ● Recipe Meal Planner                                           │
│    Validate ❌ (killed — score 22)                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

Clicking a stage opens the **Stage View**:

```
┌──────────────────────────────────────────────────────────────────┐
│  AI Skin Analysis App > Build                                    │
├────────────────────────┬─────────────────────────────────────────┤
│  Auto Tasks            │                                         │
│  ✅ Scaffold project   │   Web Terminal                          │
│  ✅ Set up auth        │   ┌─────────────────────────────────┐  │
│  🔄 Build core flow   │   │ $ help me add Stripe payment    │  │
│  ○ Add analytics       │   │                                 │  │
│  ○ Launch checklist    │   │ I'll integrate Stripe using     │  │
│                        │   │ your existing payment gateway   │  │
│  Artifacts             │   │ at auth.yourdomain.com...       │  │
│  📄 tech-stack.json    │   │                                 │  │
│  📄 CONTEXT.md         │   │ $ _                             │  │
│  📄 SERVICE.md         │   └─────────────────────────────────┘  │
│                        │                                         │
│  [← Back] [Continue →] │   [Full Screen]  [Agent: Claude 4.7]   │
├────────────────────────┴─────────────────────────────────────────┤
│  Decision: [ Continue to Grow → ] [ Back to Business Model ]    │
└──────────────────────────────────────────────────────────────────┘
```

## Core Abstraction: Stage

Every stage follows the same structure. The product is **one UI pattern repeated five times** with different content.

```
Stage = Auto Tasks + Artifacts + Terminal + Decision Gate
```

### Stage Interface

| Field | Type | Description |
|---|---|---|
| `id` | string | `validate`, `business-model`, `build`, `grow`, `operate` |
| `status` | enum | `pending`, `running`, `waiting_decision`, `completed`, `killed` |
| `autoTasks` | AutoTask[] | Tasks that run automatically (can be re-run from terminal) |
| `artifacts` | Artifact[] | Files produced by this stage (reports, configs, code) |
| `terminalSession` | Session | Web terminal connected to the stage's agent |
| `agentContext` | Context | Skills, rules, and previous artifacts loaded into the agent |
| `decision` | Decision? | User's decision: continue / pivot / kill / pause |

### Auto Tasks Per Stage

| Stage | Auto Tasks | Terminal Use Cases |
|---|---|---|
| **Validate** | Reddit pain mining, trends check, competitor scan, decision report | "Search Japanese market too", "Add more subreddits", "Deep dive this pain point" |
| **Business Model** | Recommend model from case patterns, suggest pricing, project revenue | "Compare SaaS vs one-time", "Calculate LTV", "Show me competitors' pricing" |
| **Build** | Scaffold project, configure CI/CD, set up analytics, run launch checklist | Full coding, debugging, deployment, "Add payment integration", "Fix this bug" |
| **Grow** | Generate content calendar, configure UTM, set up SEO tracking, draft launch posts | "Write Product Hunt copy", "Analyze this channel", "Create an ad variant" |
| **Operate** | Pull weekly metrics, run retention decision tree, generate weekly report | "Why did retention drop?", "Design an A/B test", "Diagnose this error" |

### Agent Context Per Stage

Each stage loads specific skills and artifacts into the agent:

| Stage | Skills Loaded | Artifacts From Previous |
|---|---|---|
| **Validate** | `idea-validation`, `reddit-demand-validation` | (none — first stage) |
| **Business Model** | `business-model-design`, `founder-case-patterns` | Validation report, pain themes, competitor list |
| **Build** | `ai-native-development`, `product-development-loop` | Business model config, pricing, target user segment |
| **Grow** | `seo-aso-growth-research`, `ai-distribution` | Deployed product URL, analytics config, target channels |
| **Operate** | `retention-decision-tree`, `weekly-review` | GA4/analytics data, growth metrics, user feedback |

## Decision Gates

Every stage ends with a decision gate. The user sees the evidence and chooses:

| Decision | Effect |
|---|---|
| **Continue** | Move to next stage. Artifacts are passed forward. |
| **Pivot** | Stay in current stage with modified parameters. Re-run auto tasks. |
| **Kill** | Archive the idea. Keep all artifacts for reference. |
| **Pause** | Save state. Can resume later. |
| **Back** | Return to previous stage (e.g., validation data changed the business model). |

## Web Agent Integration: Context Layer Architecture

The product does **not** replace Claude Code, Codex, or Cursor. It is their **Context Provider** — making them effective in the startup context.

### Three Interaction Modes

#### Mode 1: In-App Terminal (Lightweight)

For non-coding interactions — research, analysis, strategy, content generation.

```
Web Terminal → Claude API
  + Auto-injected: idea description, stage artifacts, stage-specific skills
  + Results written back to artifact store
```

**When**: Validate stage follow-ups, business model discussions, growth copy, operational analysis.

#### Mode 2: Context Export (Heavy Development)

For coding — the product generates a context package that users import into their local tool.

```bash
# Product generates a context package for the Build stage:
~/projects/ai-skin-analysis/
├── CONTEXT.md              ← domain language from Validate + Business Model
├── AGENTS.md               ← stability + security rules
├── DESIGN.md               ← chosen design system
├── .claude/skills/         ← ai-native-development, tdd, diagnose, grill-with-docs
├── contracts/              ← API contracts from Business Model
├── docs/
│   ├── validation-report.html
│   ├── business-model.json
│   └── adr/                ← decision records
└── SERVICE.md              ← reusable service definitions
```

The product periodically syncs progress back:

```
Claude Code / Codex (local) ←──sync──→ Product (cloud)
  code progress                         artifact store
  test status                           stage status
  deploy URL                            metrics connection
```

**When**: Build stage — full project development.

#### Mode 3: Hybrid (Most Realistic Usage)

```
1. Open product → see idea pipeline status
2. Click Validate stage → review report, ask follow-ups in web terminal
3. Decision: Continue → enter Business Model
4. Business Model auto-recommends → discuss in terminal → Continue
5. Enter Build → product generates context package
6. Switch to local Claude Code for development → product syncs progress
7. Development done → return to product, enter Grow
8. Grow auto-generates content calendar → refine copy in terminal
9. Enter Operate → product pulls metrics → weekly report → discuss iteration in terminal
```

### Technical Interface

```typescript
// Context Layer — the product's core capability
interface ContextLayer {
  // For the in-app web agent
  getAgentSystemPrompt(projectId: string, stageId: string): string;
  getAgentTools(stageId: string): Tool[];
  getArtifacts(projectId: string, upToStage: string): Artifact[];

  // For external tools (Claude Code / Codex / Cursor)
  exportContextPackage(projectId: string, stageId: string): FileTree;
  syncProgressFromExternal(projectId: string, gitRepoUrl: string): void;

  // Artifact management
  saveArtifact(projectId: string, stageId: string, artifact: Artifact): void;
  getArtifactChain(projectId: string): Artifact[];
}

// Agent Gateway — unified agent interface
interface AgentGateway {
  // Lightweight interaction (in-app terminal)
  chat(message: string, context: ContextLayer): Stream<Response>;

  // Heavy tasks (delegate to external agent)
  delegateToCodex(task: string, context: ContextLayer): Promise<Result>;
  delegateToClaude(task: string, context: ContextLayer): Promise<Result>;

  // Auto tasks (stage auto-run)
  runAutoTask(task: AutoTask, context: ContextLayer): Promise<Artifact>;
}
```

## Key Design Principles

1. **Pipeline, not dashboard** — the primary metaphor is forward progress through stages, not a static view of data.
2. **Auto-first, terminal-always** — every stage starts by running automatically. The terminal is always available but never required.
3. **Artifacts are the API** — stages communicate through structured files (JSON, MD, HTML), not internal state. This makes the system debuggable and portable.
4. **Same UI pattern × 5** — one Stage View component, configured differently per stage. Minimal UI surface area.
5. **Agent remembers everything** — the terminal agent has access to all previous stage artifacts, project CONTEXT.md, and the service registry.
6. **Evidence over vibes** — every decision gate shows the data. No "just trust the AI" moments.
7. **Founder stays in control** — the product proposes, the founder disposes. No auto-advancing past decision gates.
8. **Context Provider, not Agent Host** — the product does not replace Claude/Codex/Cursor; it makes them effective by providing structured startup context.

## Product Positioning Summary

| Dimension | Definition |
|---|---|
| **What it is** | A startup lifecycle **state machine + context layer + decision orchestrator** |
| **What it is not** | Not another AI coding tool, not a no-code builder |
| **Core value** | Turn startup methodology from "knowing" into "executing"; wire scattered AI tools into a coherent flow |
| **Relation to Claude/Codex** | Does not replace them — acts as their **Context Provider**, making them effective in the startup context |
| **User mental model** | "Where is my idea at? What's the next step? What does the data say?" |

## What This Is NOT

- Not a no-code app builder (the Build stage uses real coding agents).
- Not a landing page builder (use any builder, we track the conversion).
- Not an analytics dashboard (we generate reports from your analytics tool).
- Not a replacement for talking to users (the product tells you when to talk to users).
- Not an Agent Host — it's a Context Provider for existing agents.

## Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| Ideas validated per user per month | ≥3 | Count of validation reports generated |
| Time from idea to kill/continue decision | <1 hour | Timestamp of idea creation → decision |
| Ideas that reach Build stage | 20-30% | Continue rate at Validate gate |
| Ideas that reach revenue | 5-10% | Payment event from Operate stage |
| Weekly active users returning to Operate | >60% | D7 retention on users with active products |
