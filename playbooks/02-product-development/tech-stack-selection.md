# Tech Stack Selection for Indie Hackers

Choose tools that let you ship in days, not weeks. The best stack is the one you already know — do not learn a new framework while validating an idea.

## Decision Framework

Answer three questions before choosing:

| Question | Implications |
|---|---|
| **What is the product surface?** | Web app / Mobile app / API / Chrome extension / CLI / Desktop |
| **What do you already know?** | Use your strongest language and framework |
| **How fast do you need to ship?** | MVP in 1-2 weeks = use highest-abstraction tools |

## Recommended Stacks by Product Type

### Web App (Most common for indie hackers)

| Tier | Stack | When to use | Ship speed |
|---|---|---|---|
| **Fastest** | No-code (Bubble, Softr, Webflow + Memberstack) | Non-technical founder or pure validation | Days |
| **Fast** | Next.js / Nuxt + Supabase + Vercel | Full-stack JS developer | 1-2 weeks |
| **Fast** | Rails / Django / Laravel + managed hosting | Backend-strong developer | 1-2 weeks |
| **Standard** | React/Vue + Node/Python API + PostgreSQL | Team with frontend + backend | 2-4 weeks |

### Mobile App

| Tier | Stack | When to use | Ship speed |
|---|---|---|---|
| **Fastest** | PWA (Progressive Web App) | Web-first, test mobile demand | Days |
| **Fast** | React Native / Flutter | Cross-platform with one codebase | 2-4 weeks |
| **Standard** | Swift (iOS) / Kotlin (Android) | Platform-specific features needed | 4-8 weeks |

### AI Tool (49% of recent indie hacker cases)

| Tier | Stack | When to use | Ship speed |
|---|---|---|---|
| **Fastest** | OpenAI API + simple frontend | Wrapper/workflow around LLM | Days |
| **Fast** | LLM API + vector DB (Pinecone/Supabase pgvector) + Next.js | RAG or search-powered tool | 1-2 weeks |
| **Standard** | Custom model fine-tuning + API + frontend | Differentiated AI capability | 4-8 weeks |

### Chrome Extension / Browser Tool

| Stack | Ship speed |
|---|---|
| Plasmo or WXT + TypeScript | 3-7 days |
| Vanilla JS + Chrome APIs | 3-7 days |

## Infrastructure Defaults

Use managed services. Do not self-host anything during MVP.

| Need | Recommended | Cost |
|---|---|---|
| **Hosting** | Vercel / Netlify / Railway / Render | Free tier → $5-20/mo |
| **Database** | Supabase / PlanetScale / Neon | Free tier → $25/mo |
| **Auth** | Supabase Auth / Clerk / NextAuth | Free tier → $25/mo |
| **Payments** | Stripe / LemonSqueezy / Paddle | Transaction-based |
| **Email** | Resend / Postmark / SendGrid | Free tier → $20/mo |
| **File storage** | Cloudflare R2 / Supabase Storage / S3 | Near-free |
| **Analytics** | GA4 (see `ga4-event-tracking.md`) | Free |
| **Error monitoring** | Sentry free tier | Free |
| **Domain** | Namecheap / Cloudflare Registrar | $10-15/yr |

**Total MVP cost: $0-50/month** until you have paying users.

## Payment Integration

Set up payments on day one, not after launch. Revenue validates demand faster than signups.

| Provider | Best for | Handles tax? | MoR? |
|---|---|---|---|
| **Stripe** | Global SaaS, most flexibility | No (use Stripe Tax add-on) | No |
| **LemonSqueezy** | Solo founders, simplest setup | Yes | Yes |
| **Paddle** | International tax compliance | Yes | Yes (Merchant of Record) |

MoR (Merchant of Record) = the provider handles tax, invoicing, and compliance. Solo founders should prefer MoR providers to avoid tax headaches.

### China Market Payments

| Provider | Best for |
|---|---|
| WeChat Pay + Alipay (via Stripe or Ping++) | Chinese consumer users |
| Stripe (with Chinese entity) | Global + China |

## Tech Stack Anti-Patterns

| Anti-Pattern | Why it fails | Better move |
|---|---|---|
| Learning a new framework for the MVP | Doubles build time, introduces unknown bugs | Use what you know |
| Microservices for a solo project | Operational overhead kills velocity | Monolith until 10K users |
| Self-hosting databases | Maintenance time > saved cost | Use managed services |
| Building auth from scratch | Security risk, wasted time | Use Supabase Auth / Clerk |
| Premature optimization | No users to optimize for yet | Ship first, optimize after PMF |
| Over-engineering data model | Requirements change weekly in early stage | Start simple, migrate later |
| Building a mobile app first | App stores add review delays and friction | PWA or web first, app later |

## Decision Tree

```
Do you need a mobile app?
├── No → Web app
│   ├── Can you code? → Next.js/Rails/Django + Supabase + Vercel
│   └── Cannot code → Bubble/Softr/Webflow
└── Yes
    ├── Can it work as PWA? → Build PWA first, native later
    └── Needs native features → React Native / Flutter

Is it an AI product?
├── Wrapper around LLM → OpenAI API + simple frontend
├── Needs custom data → RAG stack (LLM + vector DB)
└── Needs custom model → Fine-tune, but validate demand first with API wrapper

Payment provider?
├── Solo founder, want simplicity → LemonSqueezy or Paddle
└── Need flexibility / enterprise → Stripe
```

## Common Mistakes

- Spending 2 weeks choosing between React and Vue when either works fine.
- Building a CI/CD pipeline before having a single user.
- Adding TypeScript strict mode to an MVP that might be killed in 2 weeks.
- Choosing a database based on HackerNews hype instead of your familiarity.
- Building an admin panel before knowing what metrics matter.
