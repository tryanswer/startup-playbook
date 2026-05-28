# AI-Native Product Security

AI-generated code introduces a distinct class of security risks: the code looks correct, passes casual review, but contains vulnerabilities the agent never considered. This guide covers **what to install, what to enforce, and what to check** to ship secure products when most code is written by agents.

## Why AI-Generated Code Has Different Security Risks

| Risk | Why It Happens | Example |
|---|---|---|
| **Insecure defaults** | Agent picks the fastest path, not the safest | HTTP instead of HTTPS, no CSRF token, open CORS |
| **Hardcoded secrets** | Agent copies example code with placeholder keys | `apiKey: "sk-test-..."` committed to git |
| **Missing input validation** | Agent trusts all input because the spec did not mention validation | SQL injection via unsanitized user query |
| **Over-permissive access** | Agent grants admin access to simplify the happy path | No authorization check on delete endpoint |
| **Outdated dependencies** | Agent uses training-data versions, not latest patched versions | Known CVE in an old package version |
| **Fail-open patterns** | Agent catches errors but falls through to allow access | `catch(e) { return true }` in auth middleware |

## Security Skill Ecosystem (Install These)

Three production-ready security skill sets exist. Choose based on your stack and agent:

### Option 1: ByteHide AI Security Toolkit (Recommended for Most Projects)

9 security skills covering full OWASP Top 10. Works with Claude Code, Cursor, Codex, Windsurf, GitHub Copilot.

```bash
# One-command install — copies all 9 skills + pre-commit hooks
cd your-project
npx @bytehide/ai-security-toolkit
```

| Skill | What It Does | OWASP Coverage |
|---|---|---|
| `secure-code` | Scans code changes for vulnerabilities and secrets | A01, A02, A03, A05, A08 |
| `secure-deps` | Audits dependencies for known CVEs before install | A06 |
| `secure-env` | Audits AI configs for prompt injection and credential leaks | AI-specific |
| `secure-architecture` | STRIDE threat modeling for new components | A01, A04, A07, A08 |
| `secure-web` | XSS, CSRF, CSP, CORS, security headers | A03, A05 |
| `secure-api` | REST/GraphQL auth, rate limiting, input validation | A01, A02, A04, A07 |
| `secure-crypto` | Cryptography validation, key management, TLS | A02 |
| `secure-infra` | Infrastructure security (Docker, cloud, CI/CD) | A05, A06 |
| `secure-data` | Data protection, PII handling, privacy compliance | A01, A04 |

**Why this one first**: One command installs everything. No configuration. Agent automatically scans every code change.

Source: [github.com/bytehide/ai-security-toolkit](https://github.com/bytehide/ai-security-toolkit)

### Option 2: Trail of Bits Skills (For Security-Critical Products)

Professional security research skills from one of the world's top security firms. Best for products handling payments, auth, or sensitive data.

```bash
# Claude Code
/plugin marketplace add trailofbits/skills
/plugin menu  # browse and install specific skills

# Codex
git clone https://github.com/trailofbits/skills.git ~/.codex/trailofbits-skills
~/.codex/trailofbits-skills/.codex/scripts/install-for-codex.sh
```

**Key skills for indie hackers**:

| Skill | What It Does |
|---|---|
| `insecure-defaults` | Detect insecure default configs, hardcoded credentials, fail-open patterns |
| `static-analysis` | CodeQL + Semgrep + SARIF analysis |
| `supply-chain-risk-auditor` | Audit dependency supply chain threats |
| `differential-review` | Security-focused review of code changes with git history |
| `sharp-edges` | Find error-prone APIs, dangerous configs, footgun designs |
| `semgrep-rule-creator` | Create custom Semgrep rules for your codebase |
| `agentic-actions-auditor` | Audit GitHub Actions workflows for AI agent security vulns |

**Why this one for critical products**: Trail of Bits has found real vulnerabilities using these skills (e.g., timing side-channel in ML-DSA signing in RustCrypto). Battle-tested.

Source: [github.com/trailofbits/skills](https://github.com/trailofbits/skills)

### Option 3: OWASP Secure Coding MD (Lightweight Reference)

A markdown-optimized OWASP Secure Coding Practices guide. Drop into project root for passive agent guidance.

```bash
# Copy OWASP rules as agent reference
curl -o SECURITY.md https://raw.githubusercontent.com/vchirrav/owasp-secure-coding-md/main/OWASP-Secure-Coding-Practices.md
```

**Why this one as baseline**: Zero overhead. Just a markdown file agents read. Good complement to the active scanning skills above.

Source: [github.com/vchirrav/owasp-secure-coding-md](https://github.com/vchirrav/owasp-secure-coding-md)

## Recommended Combination

```
Baseline (all projects):
  ByteHide AI Security Toolkit    ← active scanning, OWASP Top 10
  + OWASP Secure Coding MD        ← passive reference

Payment/Auth/PII products, add:
  Trail of Bits skills             ← deep security audit
  + insecure-defaults
  + static-analysis
  + supply-chain-risk-auditor
```

## Security Checklist for AI-Native Products

### Before First Commit

- [ ] Install ByteHide AI Security Toolkit (`npx @bytehide/ai-security-toolkit`).
- [ ] Add `.env` to `.gitignore`. Never commit secrets.
- [ ] Set up a secrets manager (environment variables for MVP, Vault/AWS Secrets Manager for production).
- [ ] Enable git pre-commit hooks for secret detection.

### Every Feature (Agent Instruction)

Add to your AGENTS.md:

```markdown
## Security Rules

### Input
- Validate ALL user input on the server side. Never trust client-side validation alone.
- Use parameterized queries for ALL database operations. No string concatenation in SQL.
- Sanitize HTML output to prevent XSS. Use framework defaults (React auto-escapes, etc.).
- Limit file upload types, sizes, and scan for malware.

### Authentication & Authorization
- Every API endpoint that modifies data MUST check authentication.
- Every API endpoint MUST check authorization (user can only access their own data).
- Use established auth libraries (better-auth, next-auth, supabase auth). Never roll your own.
- Hash passwords with bcrypt/argon2. Never store plaintext.
- Set session tokens as httpOnly, secure, sameSite cookies.

### Secrets
- Never hardcode API keys, database URLs, or credentials in source code.
- Use environment variables for all secrets.
- Never log secrets, tokens, or passwords. Redact in error messages.
- Rotate compromised credentials immediately.

### Dependencies
- Before adding any new dependency, check for known CVEs.
- Pin dependency versions. Use lockfiles.
- Run `npm audit` or equivalent before every release.

### Headers & Transport
- Set security headers: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options.
- Force HTTPS everywhere. No HTTP in production.
- Set CORS to specific origins only. Never use `*` in production.
- Add CSRF protection on all state-changing endpoints.

### Data
- Encrypt sensitive data at rest.
- Minimize PII collection. Do not store what you do not need.
- For GDPR/privacy: implement data export and deletion endpoints.
- Log access to sensitive data for audit trail.

### Error Handling
- Never expose stack traces, database errors, or internal paths to users.
- Return generic error messages to clients. Log detailed errors server-side.
- Never fail open. If auth check throws an error, deny access.
```

### Before Launch

- [ ] Run `npx @bytehide/ai-security-toolkit` scan on the full codebase.
- [ ] Run `npm audit` (or equivalent) and fix all critical/high vulnerabilities.
- [ ] Verify no secrets in git history (`git log --all -p | grep -i "api_key\|secret\|password"`).
- [ ] Test authentication: can unauthenticated users access protected routes?
- [ ] Test authorization: can user A access user B's data?
- [ ] Test input validation: does the API reject malformed input?
- [ ] Verify HTTPS is enforced and security headers are set.
- [ ] Set up Sentry with PII scrubbing enabled.
- [ ] Review CORS settings — no wildcards in production.

### Monthly Maintenance

- [ ] Run dependency audit and update vulnerable packages.
- [ ] Review Sentry for security-related errors.
- [ ] Check if any new OWASP advisories affect your stack.
- [ ] Run Trail of Bits `supply-chain-risk-auditor` on dependencies.
- [ ] Rotate any long-lived API keys or tokens.

## Common AI-Generated Security Vulnerabilities

### 1. SQL Injection

```typescript
// ❌ AI often generates this
const user = await db.query(`SELECT * FROM users WHERE id = '${userId}'`);

// ✅ Parameterized query
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 2. Missing Authorization

```typescript
// ❌ AI checks auth but not authorization
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  await db.posts.delete(req.params.id);  // Any logged-in user can delete any post
});

// ✅ Check ownership
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  const post = await db.posts.findById(req.params.id);
  if (post.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await db.posts.delete(req.params.id);
});
```

### 3. Hardcoded Secrets

```typescript
// ❌ AI copies from example code
const stripe = new Stripe('sk_test_4eC39HqLyjWDarjtT1zdp7dc');

// ✅ Environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

### 4. Fail-Open Error Handling

```typescript
// ❌ AI catches error and falls through
function isAuthorized(user, resource) {
  try {
    return checkPermission(user, resource);
  } catch (error) {
    console.error(error);
    return true;  // FAIL OPEN — anyone gets access if check fails
  }
}

// ✅ Fail closed
function isAuthorized(user, resource) {
  try {
    return checkPermission(user, resource);
  } catch (error) {
    console.error(error);
    return false;  // FAIL CLOSED — deny access on error
  }
}
```

### 5. Open CORS

```typescript
// ❌ AI sets wildcard for convenience
app.use(cors({ origin: '*' }));

// ✅ Specific origins
app.use(cors({
  origin: ['https://yourapp.com', 'https://www.yourapp.com'],
  credentials: true,
}));
```

### 6. Missing Rate Limiting

```typescript
// ❌ AI never adds rate limiting unless asked
app.post('/api/login', loginHandler);

// ✅ Rate limit sensitive endpoints
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts per window
  message: { error: 'Too many login attempts. Try again later.' },
});

app.post('/api/login', loginLimiter, loginHandler);
```

## Privacy Compliance Quick Reference

### GDPR (EU Users)

- [ ] Privacy policy page explaining what data you collect and why.
- [ ] Cookie consent banner (if using analytics cookies).
- [ ] Data export endpoint (`GET /api/user/export`).
- [ ] Data deletion endpoint (`DELETE /api/user`).
- [ ] Do not transfer EU data outside EU without adequate safeguards.

### CCPA (California Users)

- [ ] "Do Not Sell My Personal Information" link.
- [ ] Respond to data access requests within 45 days.
- [ ] Disclose data collection categories.

### China Personal Information Protection Law (个人信息保护法)

- [ ] Separate consent for sensitive personal information.
- [ ] Data stored in China for China users (data localization).
- [ ] Personal information impact assessment for high-risk processing.
- [ ] Designated personal information protection officer if thresholds met.

## Integration With Other Guides

- Security checklist items are included in `mvp-launch-checklist.md` (pre-launch phase).
- Feature Completeness Checklist in `ai-native-stability.md` includes security section.
- `ai-native-development` skill includes security guardrails.
- For analytics privacy, see `ga4-event-tracking.md` (PII scrubbing) and `china-analytics-tracking.md` (个保法 compliance).
