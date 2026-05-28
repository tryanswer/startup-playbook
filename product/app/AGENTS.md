# Agent Rules — Startup Playbook App

## Code Style

- TypeScript strict mode. No `any` types. No `@ts-ignore`.
- All interactive elements must have `data-testid` following `{page}-{component}-{action}` naming.
- All icon-only buttons must have `aria-label`.
- Use CSS custom properties from `globals.css` for all colors — never hardcode hex values.
- Use Tailwind utility classes — no custom CSS unless absolutely necessary.
- Import order: React/Next → third-party → local libs → local components → types.

## Component Rules

- Every component that fetches data must handle three states: loading, error, empty.
- Every form must validate inputs before submission.
- All text visible to users must go through the i18n system (`useI18n` hook + `t()` function). No hardcoded strings.
- Use `lucide-react` for icons. Do not add other icon libraries.

## API Route Rules

- Every API route must validate input with explicit checks at the top.
- Every API route must return structured errors: `{ error: string, code?: string }`.
- Every API response must include `x-trace-id` header.
- Log errors with context (route, input summary, error message). Never swallow errors silently.

## Testing Rules

- Every new feature must have at least one test covering the happy path.
- Use `data-testid` attributes for test selectors — never select by CSS class or DOM structure.
- Test file naming: `{component}.test.tsx` or `{route}.test.ts`.

## Security Rules

- Never expose API keys in client-side code.
- Validate and sanitize all user inputs in API routes.
- Limit request body size (max 10KB for chat, max 5KB for idea submission).
- localStorage must not store sensitive data (tokens, keys, PII).

## Architecture Boundaries

- `src/lib/` — shared utilities, types, store, i18n. No React components here.
- `src/components/` — reusable UI components. No data fetching, no API calls.
- `src/app/` — pages and API routes. Data fetching happens here.
- `bridge/` — standalone Node.js server. No shared code with the Next.js app except message types.

## Do Not

- Do not add dependencies without checking if the functionality exists in Next.js or Node.js built-ins.
- Do not create components larger than 200 lines. Split into subcomponents.
- Do not use `useEffect` for data that can be fetched in a Server Component.
- Do not commit `.env.local` or any file containing API keys.
