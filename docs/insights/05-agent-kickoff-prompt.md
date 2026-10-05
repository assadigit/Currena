# 05. Agent kickoff prompt

Paste everything below the line into the coding agent's first message.

---

You are working in the Currena repo (pnpm monorepo: Hono API on Cloudflare Workers, Vite + React PWA, shared `packages/core` and `packages/scraper`). The owner wants a new **Insights** page (`#/insights`): a bilingual (Farsi RTL and English) page that explains the state of global and Australian finance through about 30 indicators, in plain language.

**Step 1: read, don't code.** Read these in order:
1. `AGENTS.md` (the non-negotiable rules)
2. `docs/PROGRESS.md`, `docs/BACKLOG.md`, `docs/NEXT_SESSION_PROMPT.md`
3. Everything in `docs/insights/`: `README.md`, `01-indicator-spec.md`, `02-page-design-spec.md`, `03-data-sources.md`, `04-roadmap.md`

**Step 2: work phase by phase, starting with Phase I0 only.** Follow `docs/insights/04-roadmap.md`. Stop at every ✋ gate and wait for the owner's explicit approval. Do not start the next phase without it.

**Phase I0 tasks (this session's first job):**
1. Summarise back to me, in plain language, what you will build and which repo rules constrain it.
2. Ask me, one at a time, the open decisions listed in `docs/insights/README.md` (Cloudflare Free or Paid, substitutes for blocked data, silver and Bitcoin sources, who reviews the disclaimer). Recommend an answer for each with your reasoning.
3. Run the verify-first probe on every source in `03-data-sources.md` using throwaway scripts, and record the date, HTTP status, response shape, cadence and licence terms in that file. Mark each source ✅, ◐ or ☐. Do not use a source whose licence you cannot confirm allows public display.
4. Report what you found, then stop for the Gate I0 approval.

**Rules that apply throughout:**
- Follow `AGENTS.md` exactly: TypeScript strict; zod contracts in `packages/core/src/schemas.ts`; storage behind an interface; RTL-native with logical CSS properties; every string through the i18n dictionary; numbers and dates formatted only at render with `Intl`; tests never hit live sites (use fixtures).
- **Never print, log, store or commit a secret.** If you need a FRED key or a Cloudflare token, ask me to set it as a GitHub Actions secret or `.dev.vars` entry; do not ask me to paste it into chat.
- Never show invented or guessed data. If a source fails, show the stale value with its date or "unavailable".
- No "buy", "sell" or personal-advice wording anywhere in code, UI or copy. Use "has historically tended to mean" framing.
- Commits: `phase(I<n>): summary`. Keep `docs/PROGRESS.md` and `CHANGELOG.md` updated as you go. Typecheck and tests must be green before every commit.
- The Insights route must be lazy-loaded; do not regress the initial bundle size.
- Persian digits in the Farsi UI, Jalali dates in Farsi, chart time axes left-to-right even in Farsi (already decided in `02-page-design-spec.md`).
- If anything in the docs conflicts with `AGENTS.md`, `AGENTS.md` wins; tell me about the conflict.

When Phase I0 is done, tell me exactly what you verified, what you could not verify, and what you recommend, then wait.
