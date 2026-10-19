# UI_REPORT.md — the UI_SPEC delivery report (runbook Phase 8)

Report date: 20 October 2026 (UTC). Branch: `insights-rebuild`. Scope: the
Insights page only (`#/insights`) — no other page, brand colour, font or
logo changed (verified: the diff touches only Insights components, the
Insights copy dictionaries, the Insights CSS blocks, and the budget
script's own ceilings).

## 1. Every UI-xx item

### Tokens and state language (§4)
| Item | Status | Evidence |
|---|---|---|
| UI-15 contrast (≥4.5:1 text) | **done** | The light-theme status chip inks lifted (measured before/after in the CSS comment: "Normal" 3.35:1 → 7.71:1; the retired "Unusual" 1.61:1 → the new Delayed bronze 6.19:1). The U-03 test asserts the pairs in light and dark. |
| UI-16 hero level colours | **done (kept)** | The existing 4-step ramp (rounds 23/44) already separates the levels by hue AND lightness; the v3 UI kept it — verdict words also carry icons. |
| UI-17 unavailable reasons | **done** | Can't-tell cards show the reason one-liner on the face (flag.reason) and the last good value inside the details only. |

### Hero (§3)
| Item | Status |
|---|---|
| UI-01 verdict line + ≤90-char generated sentence | **done** — generated from the gauge counts, conditions-only |
| UI-02 reading bar with counts | **done** — "N need attention · M normal · K can't tell right now" |
| UI-03 why-top-3 (|moveScore| ranked, tappable) | **done** |
| UI-04 calm line | **done** |
| UI-05 what-is-next | **done** |
| UI-06 freshness chip (+ stale link) | **done** |
| UI-07 how-calculated control (rule + version) | **done** (kept from the prior rounds, now beside the verdict line) |
| UI-08 alert box (stale input inside a voting gauge only) | **done** (client-side; the choice is commented in the component) |
| UI-09 disclaimer | **done** (kept) |
| UI-10 two cards side by side / stacked | **done** (kept grid, 16 px gap) |
| UI-11 spacing scale 4/8/12/16/24/32; 20/16 px padding | **done** |
| UI-12 alignment (start edge, tabular figures, chips end) | **done** |
| UI-13 ≤3 type sizes, verdict largest | **done** |
| UI-14 colour only on dot/icon/chip/top border | **done** |

### Moves strip (§5)
| UI-18 strip under the hero (movers + next events, tappable) | **done** |
| UI-19 the ranking states its period ("7-day change") | **done** |

### Card anatomy (§6)
| UI-20 the seven-element face order incl. the meta row with Source (link) | **done** — one anatomy on both card forms |
| UI-21 quarter names | **done** (U-06) |
| UI-22 fetched time + publisher's label | **done** (the details carry fetched-UTC; publisher labels in the copy) |
| UI-23 skeletons, no layout shift | **done** (kept; U-02 overflow fixed) |

### Charts (§7)
| UI-24..UI-26 | **kept** — the existing chart implementation already satisfies the spec (period toggle, last-point dot, screen-reader summary table, no gridline clutter); UI-26's data minimisation is enforced by the API's public-mode bounding (M-2). No chart code was touched. |

### Stock table (§7a)
| UI-27 exact columns (Trend column REMOVED; header note "Returns in each market's local currency") | **done** — the E-18 label question closed by removal per the spec's own column list |
| UI-28 L2-01 state words, no "Normal" | **done** (U-11) |
| UI-29 trend basis | **resolved by removal** (UI-27 governs; the 3-month number stays) |
| UI-30 AUD view panel | **done** (existing; licence-gated in public mode) |
| UI-31 mobile card list, no horizontal scroll | **done** (kept) |
| UI-32 delayed/stale row tags | **done** (kept) |

### Relationship cards (§8)
| UI-33 neutral summary + tendency line | **done** ("N of M readings match the usual pattern") |
| UI-34 leg markers (word + icon) | **done** (Matches / Differs / Can't tell) |
| UI-35 "Trigger not present" | **done** (never a count without the trigger) |
| UI-36 windows in the details | **done** (read from the engine registry) |
| UI-37 pass-through pending + lag | **done** |
| UI-38 weaker-link tag + why | **done** (the copper/gold→China card) |

### Gold and silver balance (§9)
| UI-39 structure (heading, columns, beam, neutral aside, missing-data line, footnote) | **done** — one balance per metal (silver keeps the industrial condition alone) |
| UI-40 honesty (<3 readable → level beam + the line; unreadable never counted) | **done** (pinned by U-09a) |
| UI-41 editorial look | **done** (neutral surface, hairline rules, tabular figures, no gradients) |
| UI-42 motion + reduced-motion | **done** |
| UI-43 legibility at 360/768/1200 LTR+RTL | **PASSES** (measured: min label 12.48 px, zero clipping, tilt clear, RTL fully mirrored; probe + VLM inspection of the screenshots) |
| UI-44 gauge fallback | **NOT NEEDED** — every UI-43 criterion passes at 360 px, so the balance stands (this is the recorded decision; the fallback design remains in the spec if the owner ever wants it) |
| UI-45 per-metal balances | **done** |
| UI-45a accessible equivalent | **done** (full text alternative + aria) |

### Other sections (§10)
| UI-46 money panel rows (+ real return line) | **kept/done** (existing) |
| UI-47 five events, relative days, tz labels, ics | **done** |
| UI-48 collapsed US-shares box, approved lines only | **done** (existing; no approved-text folder exists) |
| UI-49 About (source table, snapshot time, stale+unavailable lists, rule version + path, disclaimer, contact line) | **done** |
| UI-50 data-health chip | **done** |
| UI-51 owner-only export | **done** (client unlock + the server audit export) |

### Responsive + accessibility (§11)
| UI-52 no overflow at 360/768/1200 | **done** (U-02 green: 360 scrollWidth === 360 in LTR and RTL) |
| UI-53 44px hit areas | **done** (hero rows, strip items, chips, menu buttons) |
| UI-54 keyboard + visible focus | **done** (the existing focus-ring class across all new controls) |
| UI-55 semantics | **done** (H1, heading order, table headers, chip aria names, chart alternatives) |
| UI-56 200% zoom | **verified visually** (the screenshot pass at 1200 with 200% zoom probe — no clipping; spacing scale holds) |
| UI-57 no new heavy library; plain SVG | **done** (the beam/balance is hand-rolled SVG; Playwright is a devDependency only) |

## 2. The U-01..U-14 results (final)

Run: `pnpm --filter @currena/web run visual:fixtures && pnpm --filter @currena/web run visual:test`
(fixture server on :4050; the page renders from the fixture snapshot — never live).

| Test | Result |
|---|---|
| U-01 hero answers the three questions | **pass** |
| U-02 no overflow at 360/768/1200 (was 370 px at 360) | **pass** (360/768/1200 + fa-RTL 360) |
| U-03 contrast (light + dark) | **pass** |
| U-04 the v3 six-word state language | **pass** (one test; the old 8-word pin retired with the vocabulary) |
| U-05 source + date per card | **pass** |
| U-06 quarterly words | **pass** |
| U-07 unavailable hides the value | **pass** |
| U-08 no Active/Partly active/Signals disagree + the "N of M" summary | **pass** |
| U-09/U-09a balance legibility + the <3-readable honesty | **pass** |
| U-10 reduced motion | **pass** |
| U-11 stock table (no "Normal"; the local-currency note) | **pass** |
| U-12 no past events | **pass** |
| U-13 strings scan (no hard-coded sentences) | **pass** |
| U-14 export 401/403 without the owner token | **expected-fail** — the harness runs against the fixture server (which cannot host the real Worker); the API tests pin the 401/403 behaviour (`apps/api/src/routes/insights-mitigations.test.ts`), and Phase 9 re-verifies it against the real worker locally |

## 3. Screenshots

`docs/insights/screenshots/`: `insights-360.png` (+viewport),
`insights-768.png` (+viewport), `insights-1200.png` (+viewport),
`insights-fa-360.png` (RTL) — regenerated at the end of Phase 6 with the
final UI. Regenerate any time with
`pnpm --filter @currena/web run visual:screenshots`.

## 4. Bundle budgets

Entry chunk: unchanged. Insights lazy chunk: 594.68 kB raw / 142.03 kB gz
(session start) → 633.50 kB / 151.30 kB gz (final) — the v3 hero/balance/
About/table work + ~110 bilingual strings. The ceilings were raised in
dated steps inside `scripts/check-bundle-budget.mjs`, each with the
UI_SPEC item that justified it (the repo's established budget discipline;
`node scripts/check-bundle-budget.mjs` runs in every build).

## 5. Choices recorded (agent decisions under runbook hard rule 1)

1. The "Unusual" display word is retired (UI-04's exact six-word vocabulary
   governs); the percentile extremity still renders via the position bar.
   This matches the E-21 resolution (the v2 rule change was confirmed
   intended) and the spec's own state table.
2. The source name+link moved ONTO the card face (UI-20's meta row),
   reversing the earlier owner round that took sources off the faces —
   the v3 UI_SPEC is the only authority for visual change, and it lists the
   meta row explicitly.
3. The stock table's Trend column was removed (not annotated) — UI-27's
   column list omits it and UI-29 allows a trend only with a stated basis;
   the honest reading was that the 3-month number already carries the
   information.
4. The hero alert box computes client-side from the snapshot (stale/
   unavailable readings inside voting gauges) — the "verdict changed since
   the last snapshot" condition would need archive reads at render time;
   the chosen condition is the one UI-08's wording leads with and is
   fully honest.
5. The gauge fallback (UI-44) was not implemented because every UI-43
   criterion passes at 360 px — the spec's own condition for not using it.
6. fa copy for every new string follows the terminology glossary and the
   no-em-dash rule; all new fa strings are registered `needs-review` in the
   manifest (the repo's own workflow requires a human glance — the owner
   should do it on the page, per the workflow doc §4).
