# Compound Wealth — Phase 1 build report

**Spec:** `COMPOUND-WEALTH-SPEC.md` (v5) · **Branch:** `compound-wealth` · **Built:** 2026-11-25/26 (Asia/Tehran)

## 1. The plan (decided up front, per instruction 2)

1. Read the spec, `AGENTS.md`, the gold page, the content module, the tokens, the
   routing and deployment notes. **Gates baseline:** `bun run lint` green on
   `main` before any change (exit 0, no findings).
2. Build the pure maths module (`src/lib/compound/maths.ts`) with its config
   block, then the maths tests (spec §12, tests 1–11) as a `bun test` file, and
   make them pass — before any UI.
3. Research every figure on the web from published sources only; write
   `src/lib/compound/figures.ts` (the figures file) with value, period, basis,
   source name and URL, derivation working, and a "checked on" date.
4. Build the routing: real `/tools` and `/tools/compound-wealth` pages served by
   the Worker (Next.js App Router routes + a middleware that maps the public
   `/tools/*` URLs onto the basePath-mounted app in production and issues the
   301 trailing-slash redirects), plus the two zone routes in `wrangler.jsonc`,
   the nav item, the breadcrumb, and the meta/OG tags.
5. Build the page exactly as §5: quiet default, what-if cards, the four
   collapsed More-options groups, English + Farsi (RTL, Persian digits, Jalali
   dates), sticky mobile bar.
6. Build the two cards behind one "Save as card" button: the A4 print-to-PDF
   card and the phone card.
7. Prove "store nothing" with a test; run the simplicity and routing checks with
   a headless browser; print sample A4 PDFs; screenshot the phone card at the
   three sizes; save samples in `docs/compound-samples/`.
8. Re-run the gates; confirm the gold page (Insights-era sections, converter
   links, narrator legs) is untouched and still passes.
9. Write this report fully; commit in small commits; push; open a PR.

## 2. Where the spec was silent — the simplest option chosen

Recorded as the build proceeds; see §7 (decisions log).

## 3. The figures (every number, its source and its working)

See §5 below and the heavily-commented `src/lib/compound/figures.ts`.

## 4. What was built

(filled at the end of the build)

## 5. Figures table

(filled at the end of the build)

## 6. Verification record

(filled at the end of the build)

## 7. Decisions log

(filled at the end of the build)

## 8. What is unfinished / needs the owner

(filled at the end of the build)

## 9. How to roll back

(filled at the end of the build)
