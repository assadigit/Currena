# Final Screenshot Set — Session 9 (2026-11-2x)

The S1 baseline matrix **repeated at the same sizes, locales and themes**, captured LIVE over the deployed S8 close (`https://currena.ir/gold` — currena-api `2f101b25`, the tree of `origin/main` `45f89c19`; the local build byte-verified identical at session start). Captured with the committed harness `apps/web/visual/gux-s9-screenshots.plw.ts` (config `gux-s9-live.config.ts` — no webServer: live navigation; read-only visitor GETs; the S8 real-key theme discipline, S8-D3). **34/34 green in one pass; zero page errors; zero unexpected console errors.**

Live state at capture time (recorded in `fetch-audit.json`, the S1 README's discipline): verdict **"Gold: conditions lean against it"** · outlook `bearish` → five-state **"moderately pressure gold"** · stack verdict `against` · lanes **1 for · 3 against · 1 not leaning** (stress for; borrowing/dollar/inflation against; flows neutral — **the identical lane shape to the S1 baseline**) · price **US$3,539 −3.98% 1d** · data as of Nov 20, 2026.

| File | Locale | Width | Theme | Content / state |
|---|---|---|---|---|
| `01-en-desktop-1440-full.png` | en | 1440 | light | Full page (17,479 px tall — the S1 twin was 13,027; the explorer + the expanded lane cards) |
| `02-en-desktop-hero.png` | en | 1440 | light | The hero: price + BriefingCard + CompositionStack |
| `03-en-desktop-zoneD.png` | en | 1440 | light | The explanation band (narrative + yield decomposition + on-ramp + expectations) |
| `04-en-desktop-zoneF.png` | en | 1440 | light | The Iran bridge band (board + premium history) |
| `05-en-desktop-signals.png` | en | 1440 | light | The Signals section (gold + silver, the lane drill links, the measured note) |
| `06-en-desktop-seats.png` | en | 1440 | light | The 37 seats, five lanes (LaneBar summaries + closed member cards) |
| `07-en-desktop-ta.png` | en | 1440 | light | The TA reference band |
| `08-en-desktop-context.png` | en | 1440 | light | RATIOS + FLOWS context cards |
| `09-en-desktop-zoneK.png` | en | 1440 | light | CB demand tracker + London vault + correlation |
| `10-en-desktop-tail-positions-zoneO-pubnotes.png` | en | 1440 | light | Page tail: positions + Zone O + publication notes (collapsed) |
| `13-en-desktop-onramp-expanded.png` | en | 1440 | light | Education on-ramp expanded |
| `14-en-desktop-expectations-expanded.png` | en | 1440 | light | Expectations strip expanded (probabilities + calendar) |
| `15-en-desktop-hero-timemachine-open.png` | en | 1440 | light | Time machine open (Zone C) |
| `16-en-desktop-episodes-expanded.png` | en | 1440 | light | Episode Explorer band expanded (the DESIGNED waiting state renders) |
| `17-en-desktop-ifbought-expanded.png` | en | 1440 | light | If-you'd-bought calculator expanded |
| `18-en-desktop-pubnotes-expanded.png` | en | 1440 | light | Publication notes expanded (the §16 licence wall) |
| `19-fa-desktop-1440-full.png` | fa (RTL) | 1440 | light | Full page |
| `20-fa-desktop-hero.png` | fa (RTL) | 1440 | light | Hero (fa copy) |
| `21-fa-desktop-zoneF-bridge.png` | fa (RTL) | 1440 | light | Iran bridge (fa, Tehran board) |
| `22-fa-desktop-seats.png` | fa (RTL) | 1440 | light | The seats (fa) |
| `23-fa-desktop-context.png` | fa (RTL) | 1440 | light | Context cards (fa) |
| `24-en-mobile-390-full.png` | en | 390 | light | Full page (27,099 px tall) — the deliberate mobile layout |
| `25-en-mobile-hero.png` | en | 390 | light | Mobile hero (the briefing hierarchy) |
| `26-en-mobile-seats.png` | en | 390 | light | Mobile seats (the lane stack) |
| `27-en-mobile-context.png` | en | 390 | light | Mobile context |
| `28-fa-mobile-390-full.png` | fa (RTL) | 390 | light | Full page (fa) |
| `29-fa-mobile-hero.png` | fa (RTL) | 390 | light | Mobile hero (fa) |
| `30-en-desktop-dark-hero.png` | en | 1440 | **dark** | Dark hero — genuinely dark (avg RGB ≈ 32; the S1 twin ≈ 34 — both real dark renders; S8-D3's finding was the S5–S7 harness, not S1) |
| `31-en-desktop-dark-seats.png` | en | 1440 | **dark** | Dark seats (avg RGB ≈ 36) |
| `32-en-desktop-nav-docked.png` | en | 1440 | light | The docked section nav stuck UNDER the fixed header (active chip + edge fade) |
| `33-en-desktop-explorer.png` | en | 1440 | light | The relationship explorer (list + M/C/X/K classes) |
| `34-en-desktop-sheet.png` | en | 1440 | light | The record sheet (desktop inline-end geometry) |
| `35-en-desktop-inspector.png` | en | 1440 | light | The chart inspector — the crosshair parked on a point with the spoken readout |

**The S1-name mapping:** every `NN-…` file above is the S1 baseline's own name (the S1 set lives at `../` — `../01-en-desktop-1440-full.png` etc.); the before/after comparison pairs them 1:1. Files `32–35` are the program's own post-S5 surfaces (their fixture-based evidence lives in the `s5–s8` sets; these are the live twins).

**The artifacts (not PNGs):**
- `fetch-audit.json` — the no-unapproved-fetch evidence: **18 requests** on one complete read (the document + the CF RUM beacon + 16 first-party `/api/*` routes — every route the page's own fetch surface names); `consoleErrors` = the one designed 503 (`gold-episodes`, the WGC-workbook waiting state) firing across the matrix's loads; `pageErrors` = 0; the live-state record.
- `canonical-census.json` — the indicator-inventory + canonical-rendering census (the `probe-s9-census.mjs` output over the fixture-built page).
- `keyboard-walk.json` — the page-wide Tab-order walk over the LIVE page (the S8-deferred evidence): 198 focusables mapped, 80 real Tab stops walked, zero ring-invisible stops, the sheet's Escape + focus-return verified live.

Not captured (declared, as at S1): tablet width (768) — never in the program's matrix (390/360/1440 throughout, the S8 checks' sanctity widths); a real screen-reader session — needs an interactive desktop, outside this headless sandbox (the spoken equivalents ride the S8 suites' live-region/aria contracts, all re-run green this session).
