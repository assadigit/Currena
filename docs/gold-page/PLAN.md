# PLAN — additive phases for the Currena gold page

The one hard rule: ADD ONLY. Every phase = new files + the smallest possible
mount insertions into `src/app/page.tsx` (import lines, JSX mount lines, nav
chip lines). No existing line is ever changed or removed. Placement law: the
relationship map is "the page's closing view" and HistoryBand is "the page's
very last section" (documented owner asks) — so every new band mounts
**between PhysicalBand and RelationshipsBand** unless a phase says otherwise.

Each phase is one session. Order: Must first, quick high-value wins first.

---

## Phase 1 — Beginner FAQ + mini glossary + sources & honesty band (this file set's first build)

**Goal**: the average buyer can find plain answers to beginner questions, learn
the page's own vocabulary in both languages, and see every data source named
with one honest page-level disclaimer.

**New things**:
- `src/components/gold-page/faq.tsx` — `FaqBand` (section id `gold-faq`):
  - ~10 Q&As as native `<details>` rows (house collapsible pattern), each
    bilingual `[en, fa]`; every answer cross-links the page section that proves it.
  - Mini glossary: a two-column grid of ~12 terms the page itself uses
    (اونس تروا، مثقال، عیار، ۱۸/۲۴ عیار، حباب، اسپات/نرخ جهانی، نرخ آزاد، اجرت،
    سود فروشنده، مالیات بر ارزش افزوده، صندوق طلا، شمش/سکه). Numbers come from
    the repo's own engines (coin-premium.ts constants, tools invoice convention)
    — nothing invented.
  - "Last reviewed" date stamp on the band (facts can go out of date).
- `src/components/gold-page/sources.tsx` — `SourcesBand` (section id
  `gold-sources`): every data source (EODHD, FRED, Yahoo Finance, TGJU,
  Trading Economics, WGC, LBMA, IMF-IFS via WGC, CFTC, US Federal Reserve
  calendar, currena.ir legs) with what it feeds and how often; the honesty
  rules in plain words (fail-closed, stamps, never silently stale); the
  page-level not-financial-advice disclaimer; a share row (navigator.share +
  clipboard copy fallback).
- Copy lives inside the two new files as typed bilingual bundles (content.ts
  is existing code and stays untouched).

**Plug-in (page.tsx only)**: 2 import lines + 2 mount lines (after
`<PhysicalBand …/>`, before `<RelationshipsBand …/>`), 2 nav chip lines
(`FAQ`/«پرسش‌ها», `Sources`/«منابع» in `NAV_SECTIONS` between `gold-other`
and `gold-relationships` so chips match page order). All insertions, zero
changes.

**Data**: none (static, every dated fact stamped). **Test**: browser EN+fa,
mobile 375px + desktop, dark mode, keyboard-open details, share fallback,
`bun run lint`, additive diff vs the checkpoint.

---

## Phase 2 — The buying guide (راهنمای خرید طلا)

**Goal**: the missing checklist-7 education — how an average Iranian actually
buys gold safely.

**New things**: `src/components/gold-page/buying-guide.tsx` — `BuyingGuideBand`
(id `gold-buying-guide`):
- Ways to own, each a card with pros/cons in plain words: سکه و شمش (physical
  coins/bars), زیورآلات (jewelry — اجرت/سود/مالیات mechanics per the site's
  own invoice engine), صندوق‌های طلا (exchange-traded gold funds — general
  description only), حساب‌های طلای بانکی/دیجیتال if framed generically and
  honestly (state the general shape, avoid specific product claims).
- How to check purity/authenticity (stamps عیار, hallmark, reputable sellers,
  the touchstone/acid convention, scale + volume sanity checks for bars).
- The buyer's fee picture: اجرت + سود + مالیات بر ارزش افزوده (on اجرت+سود,
  the market convention the site's own tool implements) vs the coin's حباب —
  one honest comparison.
- Storage & safety (home safe, bank safe deposit, insurance realities — generic
  education).
- Common scams (counterfeit coins/tungsten bars, under-karat metal, «طلای
  نو با اجرت نو» tricks, online sellers demanding prepayment) — generic
  education, no legal or tax claims beyond the invoice convention already on
  the site.
- Cross-links: bridge board (live حباب), tools calculator, FAQ band.

**Plug-in**: 1 import + 1 mount line (same slot: before RelationshipsBand) +
1 nav chip. **Data**: static. **Tax rule**: only the VAT-on-اجرت+سود convention
the site itself already documents; everything else explicitly general.

## Phase 3 — "Gold in 30 seconds" + record watch + why hold gold

**Goal**: checklist 5, 6 (ATH gap), 8 in one pass, riding live data.
**New things**:
- `src/components/gold-page/beginner-brief.tsx` — a dated, plain-language
  trend read composed from the page's own live numbers (trend windows table +
  store series): is gold up/down/sideways over day/week/month/year, one line
  why (the biggest mover among the drivers the page already shows), the
  all-time high within the stored year + distance from it, honestly labeled
  "the highest level in our stored price history (from {date})" — no invented
  ATH, and the disclaimer in the box itself.
- "Why people hold gold" education cards (role in a portfolio, inflation
  protection, crisis behavior — each pointing at the page's own evidence
  sections; common allocations stated as a widely-cited convention, education
  not advice).
**Plug-in**: same slot; data rides existing `/api/gold` + `/api/gold/trend`
responses already fetched by the page (no new fetch if possible; if needed, a
new tiny read-only API route — additive).

## Phase 4 — Tools strip (in-content discoverability) + final polish

**Goal**: checklist 3, 14 leftovers.
**New things**: a compact "gold toolbox" strip (links to /tools/gold-calculators,
/tools/live-rates, /tools/currency-converter, /tools/compound-wealth) mounted
near the calculator band; any share/UX polish that phases 1–3 surfaced.
**Plug-in**: 1 import + 1 mount; pure links to existing routes (the tools pages
already handle both locales).

## Needs-approval items (never auto-done)

- Buy/sell spread on the Tehran board (edits existing bridge board).
- Unifying the hero spot with the Tehran board's live ounce (changes existing
  price card).
- Any nav reordering (existing chips stay in their order; new chips insert).
- ETF holdings driver (blocked by licensing — needs a data source decision).

## Final review (after Phase 4)

Re-run the checklist against the live page, re-verify the additive proof across
all sessions (every commit: additions-only diff), write the final report in
PROGRESS.md.
