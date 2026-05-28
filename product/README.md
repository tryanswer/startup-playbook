# Startup Playbook — Product

This directory contains the product design, requirements, and implementation plans for the productized version of Startup Playbook.

## Vision

Turn the startup methodology from "read docs and follow manually" into an **executable pipeline with AI agent collaboration** — submit an idea, watch it flow through validation → business model → build → grow → operate, with a web terminal available at every stage for human-agent interaction.

## Directory Structure

```
product/
├── README.md                    ← this file
├── prd/
│   ├── overview.md              ← product overview, positioning, and core UX
│   ├── stage-runner.md          ← Stage Runner engine design
│   ├── web-terminal.md          ← Web Terminal + Agent integration
│   ├── stages/
│   │   ├── 01-validate.md       ← Validate stage spec
│   │   ├── 02-business-model.md ← Business Model stage spec
│   │   ├── 03-build.md          ← Build stage spec
│   │   ├── 04-grow.md           ← Grow stage spec
│   │   └── 05-operate.md        ← Operate stage spec
│   └── data-model.md            ← data model and API contracts
├── design/
│   ├── DESIGN.md                ← design system reference
│   ├── wireframes/              ← key screen wireframes
│   └── user-flows/              ← user flow diagrams
├── architecture/
│   ├── system-architecture.md   ← technical architecture
│   ├── deployment.md            ← deployment and infrastructure
│   └── decisions/               ← ADRs (Architecture Decision Records)
└── roadmap/
    └── milestones.md            ← versioned milestones (V0.1 → V1.0)
```

## Status

- [x] PRD: Product Overview (what the product carries, positioning, core UX, agent integration)
- [x] PRD: Interaction Flow (navigation, idea pipeline, product management, agent multi-tab)
- [ ] PRD: Stage Runner
- [ ] PRD: Web Terminal + Context Layer Architecture
- [ ] PRD: Stage Specs (5 stages)
- [ ] Design: DESIGN.md + Wireframes
- [ ] Architecture: System Design
- [x] Roadmap: Milestones (V0.1 → V1.0)
