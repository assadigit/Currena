# Economic Indicators — the Australia signals round (2026-10-20): verification notes

Owner round 4 on the hero's closing modules: "Just like World Signals, I
want the same Box with proper data for Australia." The world-section
signals stay Global-scope (markets / currencies); Australia's proper data
is its OWN areas — so its box raises the gauges themselves, computed from
the same snapshot the category rows read. Never free text, never
hardcoded values.

Local harness: `wrangler dev` (port 8787) serving the BUILT SPA with the
seeded local KV (the real production snapshot, 2026-10-18, plus the live
markets snapshot — signal `attention` — so the Global panel renders
exactly as production). The PWA service worker was unregistered +
caches cleared before the pass (the SW serves the last precached build
otherwise — D-29's lesson).

## What the round changed

| Directive | Change | Where |
|---|---|---|
| the same box, proper AU data | the Australia card closes with the SAME signals construction as World Signals (always open, never behind the toggle; 15px bold heading + bullets; state mark 18/20; the region's own pale tint + step ink on the heading; `ei-panel-accent` 3px inline-start edge). Its bullets are the AREAS: one per AU gauge, worst first — the raised ones (step 2+) are buttons in their OWN step ink, "{area} · {word}: {warnings} of {voting} indicators need attention.", jumping to the Australia section; the calm (step 1) ones are quiet spans "{area} · Stable"; the unreadable (step 0) ones honestly "{area} · not enough data to read" | `VerdictMeter.tsx` |
| the rule toggle → fallback | the round-3 low-key rule toggle now appears only when a region has nothing to raise (no feeds on Global / no readable gauge on Australia); the word-choice rule stays reachable on BOTH cards through the "?" GlossaryTip beside the gauges heading | `VerdictMeter.tsx` |
| copy | 2 new keys en+fa (`australiaSignalsTitle` "Australia signals" / «سیگنال‌های استرالیا»; `australiaSignalArea` the raised-bullet template) — Persian copy manifest round `australia-signals-2026-10-20`; the quiet rows compose existing keys only | `insights-copy-en/fa.ts`, manifest |
| hooks | the AU box keeps `data-ei-panel` + `data-ei-panel-kind="signals"` + `data-ei-panel-heading`; its content carries new scoped hooks: `data-ei-area-bullets` (ul), `data-ei-area-signal="raised|calm|no-reading"` + `data-ei-area-step` (each row) | `VerdictMeter.tsx` |

Budget: Insights lazy chunk 659.00/158.00 → **661.00/158.50** (measured
660.14/157.86; entry untouched 295.29/88.81) — D-39 in
`docs/DECISIONS_FOR_ALI.md`, CHANGELOG §2026-10-20 (australia signals).
The panel guards in `hero-editorial.test.tsx` grow 3 → 6 (20 total;
1,606 workspace-wide).

## Measured results (agent-browser on the built SPA, EN + fa)

- **EN light desktop 1600**: exactly TWO `[data-ei-panel]` — Global
  `kind=signals` "World signals" (markets bullet with its numbers) and
  Australia `kind=signals` "Australia signals". The AU box renders the
  REAL snapshot data: "Inflation & rates · Stressed: 3 of 5 indicators
  need attention." (button, step 3), "Households · Stressed: 3 of 6
  indicators need attention." (button, step 3), "Trade & currency ·
  Stable" (calm span, step 1) — worst first. No rule toggle anywhere
  (both regions have signals to raise).
- **Computed styles (EN)**: AU heading + raised bullets **15px/700** in
  the stressed amber `rgb(255,131,43)` (each bullet's OWN step ink);
  the calm row 15px/600 in the tertiary grey `rgb(79,90,102)`; panel
  surface `oklab(… / 0.06)` amber (the same tint ladder the fidelity
  round approved) + the 3px inline-start accent.
- **The jump (real click)**: clicking a raised AU bullet scrolled the
  page 0 → 6867px and the Australia section (its lanes) entered the
  viewport — the signal continues below, exactly like the markets
  bullet.
- **fa RTL desktop 1600**: heading «سیگنال‌های استرالیا» 15px/700 amber;
  raised bullets «تورم و نرخ بهره · پرتنش: ۳ شاخص از ۵ شاخص نیازمند
  توجه‌اند.» and «وضعیت خانوارها · پرتنش: ۳ شاخص از ۶ شاخص نیازمند
  توجه‌اند.» — **fa digits through num()** (۳/۵/۶, no ASCII leakage);
  calm row «تجارت و ارز · پایدار»; the 3px accent on the RIGHT edge
  (physical left 0); zero horizontal overflow.
- **fa dark desktop 1600**: the amber heading + the token-alpha panel
  tint (`oklab(… / 0.06)`) hold on the dark surface — no dark-mode
  regression.
- **fa mobile 390 (carousel)**: opens on جهانی (Global first) with the
  World signals panel; the AU box stays mounted on the off-screen card;
  real «بعدی» click → Australia rests at x:16 (the verified snap
  position); dots + cue flip («برای دیدن جهانی بکشید»); the box fits
  in-card (panel 326px inside the card bounds); EN mobile matches
  (Australia x:16, "Australia signals", zero overflow).
- **Zero page/console errors on every capture.**

## VLM acceptance (glm-5v)

- **EN desktop hero** — 6/6 checks PASS: both cards close with the same
  emphasized signals construction; the AU box carries real per-area
  counts (no placeholders); its type matches the World signals box; the
  amber-vs-red inks are distinct yet restrained; no clipping/
  misalignment/broken bottoms; the old collapsed rule pill is gone from
  the AU card's bottom.
- **fa dark desktop hero** — 5/5 PASS: correct Persian letter shaping +
  RTL flow; a coherent emphasized box with Persian digits; the accent
  edge on the RIGHT and the bullet dots at the line START; legible amber
  on dark; no layout defects.
- **fa mobile pair (Global screen + Australia screen)** — 4/4 PASS: the
  box fits the card width with no clipping; the area lines wrap cleanly;
  the box matches the World signals panel's construction; no horizontal
  overflow, carousel intact.

## Screenshots

`docs/insights/screenshots/economic-indicators-au-signals/`:
`en-desktop-hero.png`, `fa-desktop-hero.png`, `fa-dark-desktop-hero.png`,
`fa-mobile-global-first.png`, `fa-mobile-au-signals.png`,
`en-mobile-au-signals.png`.

## Delivery state — DEPLOYED

Merged to `main` (feature commit **a073c18** fast-forwarded from 84ff783,
+ the docs-only delivery-state record 2880573); CI on main: **completed /
success** (typecheck, lint, 1,606 tests, build, budgets 661.00/158.50
after D-39, copy audit). Feature branch
`feature/economic-indicators-au-signals` @ a073c18.

Deployed through the established pipeline per `docs/DEPLOY.md`
(`pnpm --filter @currena/web build` + `wrangler deploy` with the
owner-provided Cloudflare token/account) → worker currena-api version
**`b1067b0a-9b74-45f7-a52e-d555dbac21ad`** (currena.ir + workers.dev).

## Production results (currena.ir, fresh profile, SW cleared)

- **EN desktop 1600**: served chunks exactly the `a073c18` build
  (`index-DV6LyMkN.js`, `Insights-DcNs64O3.js`); TWO signals panels —
  World signals (the production markets bullet) + **Australia signals**
  carrying the real production data ("Inflation & rates · Stressed: 3 of
  5 indicators need attention.", "Households · Stressed: 3 of 6…",
  "Trade & currency · Stable"), no rule toggle on either card; heading +
  raised bullets measured **15px/700 `rgb(255,131,43)`** on the
  `oklab(… / 0.06)` pale amber; a real click on a raised AU bullet
  scrolled 0 → 7321px with the Australia section in the viewport; zero
  overflow.
- **EN mobile 390**: carousel opens on Global at the origin (card
  16..374, dots `true,false`, cue "Swipe to view Australia"); real Next
  → Australia at x:16, dots flip; zero overflow.
- **fa RTL desktop 1600**: «سیگنال‌های استرالیا» with «تورم و نرخ بهره ·
  پرتنش: ۳ شاخص از ۵ شاخص نیازمند توجه‌اند.» (fa digits), the 3px
  accent on the RIGHT edge; zero overflow.
- **fa mobile 390**: opens on جهانی («برای دیدن استرالیا بکشید»); real
  «بعدی» → Australia at x:16 with «سیگنال‌های استرالیا»; zero overflow.
- **Zero page/console errors on every capture.** Production
  screenshots: `prod-en-mobile-global-first.png`, `prod-en-mobile-au.png`,
  `prod-fa-desktop.png`, `prod-fa-mobile-au.png` (same folder).
- The deployment is recorded in `docs/DEPLOY.md` (CURRENT DEPLOYMENT —
  worker b1067b0a, rollback = `wrangler rollback` to 0230f09b).

