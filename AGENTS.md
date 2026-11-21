# AGENTS.md — AURUM Desk (the Gold Intelligence & Visual Explanation programme, sandbox implementation)

This repository is the sandbox implementation of the **Gold Intelligence & Visual
Explanation (GIE)** programme: a 15-session plan building a daily gold-market
intelligence desk. The upstream programme records live in the owner's main
`Currena` repository; this repo is the standalone Next.js build that mirrors the
session arc:

- **S8 — Briefing layer (done, live):** six LLM-written narrative sections
  (exec / macro / price-action / positioning / news / outlook), the market
  strip, the bias meter, the scenario set, and the news tape. Served by
  `/api/desk` with SQLite caching per date.
- **S9 — Supporting-Visuals layer (done, live):** eight explainable visuals
  (V1 price 180d · V2 driver attribution · V3 correlation matrix · V4
  volatility regime · V5 positioning & flows · V6 sentiment timeline · V7
  scenario fan · V8 seasonality), each shipping an insight-first title, a
  data-driven current reading, and a collapsible how-to-read guide.
- **S10 — Roots layer (next):** the live-data foundation — real market series
  via the owner-supplied EODHD API, honest provenance, synthetic fallback.

## Architecture (the one page a session must know)

```
src/lib/gold/engine.ts     deterministic market engine (seeded per date) → EngineFacts
src/lib/gold/builder.ts    facts → BriefingPayload + VisualsPayload (S8 + S9)
src/lib/gold/narrative.ts  z-ai-web-dev-sdk strategist model rewrites the six
                            sections; deterministic template fallback
src/app/api/desk/route.ts  GET ?date= (cache-first) · POST {date} (regenerate)
db/custom.db (Prisma)      DeskDay rows: briefingJson / visualsJson / narrativeSource
src/app/page.tsx            the desk page — sections paired with their visuals
src/components/gold/        header · market-strip · section-nav · briefing-card ·
                            bias-meter · footer · visuals/* (the eight V-cards)
```

Rules that bind every session:

1. **The engine is deterministic per date** — the same date always produces the
   same facts. Regeneration re-runs only the strategist narrative.
2. **The narrative is model-written, template-fallback** — `narrativeSource`
   records which one served. The desk must never render without a narrative.
3. **The LLM runs server-side only** (`z-ai-web-dev-sdk` in
   `/api/desk`-reachable modules; never in client components).
4. **Every visual explains itself** — insight-first title, current reading,
   reading guide. Charts are Recharts via the shadcn `ChartContainer` (the
   correlation matrix is hand-built CSS grid).
5. **No secrets in the repo.** Session credentials (GitHub push token, EODHD
   key, Cloudflare tokens) arrive in chat at session start/close, are used
   env-only or inline, and are never stored or printed.
6. **Stack discipline:** Next.js 16 App Router · TypeScript · Tailwind 4 ·
   shadcn/ui (New York) · Prisma/SQLite · TanStack Query · Recharts. Use the
   existing components; no new charting/UI dependency without cause.
7. **Accessibility floor:** semantic landmarks, ARIA labels, 44px touch
   targets, the sticky-footer layout (`min-h-screen flex flex-col` +
   `mt-auto`), light/dark mode via next-themes.

## The session close-out protocol (what every session ends with)

1. `bun run lint` green; the dev server (port 3000) healthy — check the tail
   of `dev.log`.
2. Browser-verify the golden path with agent-browser (render, the eight
   visuals, date navigation, regenerate + toast, collapsible guides, dark
   mode, mobile 375px) — "it compiles" is never sufficient.
3. Commit the session's work (the harness auto-commits too; commit messages
   name the session and the change).
4. Push to the Currena repository on a **session branch** (never force
   `main` — it carries the upstream programme history):
   `git push https://<token>@github.com/assadigit/Currena.git HEAD:refs/heads/feat/<name>`
5. Hand the owner the TLDR + the next session's copy-paste prompt.

## Owner preview

The desk is previewed through the sandbox **Preview Panel** (the "Open in New
Tab" button), never via local URLs. The sandbox port is fixed at 3000.
