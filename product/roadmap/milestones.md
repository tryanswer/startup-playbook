# Roadmap & Milestones

## V0.1 — Validate Only (2 weeks)

**Goal**: Users can submit an idea and get an automated validation report.

### Scope

- [ ] Landing page with idea input form
- [ ] Backend: call idea-validator (Reddit + Trends + Competitors)
- [ ] Report viewer: render HTML decision report in-browser
- [ ] Web Terminal: basic agent chat for follow-up questions ("search more subreddits", "try Japanese market")
- [ ] Decision gate: user marks kill / pivot / continue
- [ ] Idea list view: see all submitted ideas and their status
- [ ] Auth: email/password via Supabase

### Not in V0.1

- No stages beyond Validate
- No persistent terminal sessions
- No artifact storage (reports stored locally)

### Tech

- Next.js + Tailwind + shadcn/ui
- Supabase (auth + DB)
- Vercel (hosting)
- idea-validator scripts (ported to API routes)
- xterm.js + WebSocket for terminal
- Claude API for agent

---

## V0.2 — Business Model Stage (1 week)

**Goal**: Validated ideas flow into business model selection.

### Scope

- [ ] Business Model stage with auto-recommendation based on validation data
- [ ] Agent loaded with `business-model-design` skill + validation artifacts
- [ ] Pricing calculator (SaaS / one-time / usage-based)
- [ ] Competitor pricing research via terminal
- [ ] Artifact: `business-model.json` passed to next stage

---

## V0.3 — Build Stage + Full Terminal (2 weeks)

**Goal**: Users can scaffold and develop their product with agent collaboration.

### Scope

- [ ] Build stage with project scaffolding (tech stack selection → generate project)
- [ ] Full web terminal with coding agent (Claude Code / Codex integration)
- [ ] Agent auto-loads: CONTEXT.md, DESIGN.md, stability rules, security rules
- [ ] Service registry check (reuse existing services)
- [ ] Launch checklist auto-tracking
- [ ] Artifact: Git repo URL + deployed preview URL

---

## V0.4 — Grow + Operate Stages (2 weeks)

**Goal**: Complete the full pipeline.

### Scope

- [ ] Grow stage: content calendar, UTM config, SEO tracking, launch copy generation
- [ ] Operate stage: pull metrics, retention analysis, weekly report
- [ ] Stage-to-stage artifact passing (full pipeline)
- [ ] Pipeline overview with all 5 stages

---

## V0.5 — Polish + Launch (1 week)

**Goal**: Ship to real users.

### Scope

- [ ] Onboarding flow
- [ ] Pricing page (free tier: 1 idea, pro: unlimited)
- [ ] Error handling + edge cases
- [ ] Mobile-responsive Stage View
- [ ] Documentation / help
- [ ] Product Hunt launch prep

---

## V1.0 — Multi-Project + Team (Future)

- Multiple concurrent projects
- Team collaboration (shared terminal sessions)
- Custom stage templates
- Plugin system for additional data sources
- Self-hosted option
