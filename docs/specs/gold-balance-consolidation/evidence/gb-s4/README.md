# GB-S4 evidence — the visual redesign's V-1..V-10 acceptance set

**Session:** GB-S4 (P2b, 2026-11-03) — the visual redesign of the
consolidated gold balance behind `?balance=lanes`
(`docs/specs/gold-balance-consolidation/05-VISUAL-DESIGN-SPEC.md` §12).
**Harness:** the `gb-s4` Playwright project
(`apps/web/visual/gb-s4-visual.plw.ts` + the config entry) over the
fixture server (never a live site): **61 tests, all green**. The six
scenarios ride an in-memory `/api/insights` interception (the GB-S3
overlay pattern without touching the fixture file; the interception
clears unspecified eval fields so the fixture's own 30-day moves can
never leak into a scenario — that leak was caught and fixed during the
session — and appends the voter ids the fixture lacks, so the engine
sees the full 21-voter table in every scenario).

## The scenario set (every reading verified against `goldBalance` before pinning)

| Scenario | Engine reading (measured) | Renders |
|---|---|---|
| `balanced` | the recorded 2026-10-31 corpus archive: level · 4 neutral · borrowing-costs split 2v2 (readable 8, firing 4) · dollar 1 firing · stress readable-5/firing-0 · inflation 1 firing | level beam, "Balanced", the Split badge, 4 stone weights in the tray |
| `for` | 3 for · 0 against · 1 neutral, net +3 | the full 10° tip for, 3 brass weights on the supporting pan, "Leaning for gold" |
| `against` | 1 for · 2 against · 1 neutral, net −1 | the 3.33° tip against, 2 weights on the pressuring pan, "Leaning against gold" |
| `split` | 1 for · 1 against · 2 neutral (borrowing-costs split 2v2), net 0 | level, one weight per pan, «دوپاره» beside the contested weight |
| `unread` | 4 unread, readable 0 | level, both pans' nothing-read sentence, NO needle, 4 dotted-rim stone weights |
| `loading` | the snapshot request never resolves | the route's own loading skeleton (see the note below) |

## V-1..V-10, each with its evidence

- **V-1 (the squint test):** programmatic — the verdict word's computed
  size (44px desktop) is the maximum in the balance, above every other
  text (the title is 28px); the blur(8px) capture
  (`squint-blur-8px-en-1280.png`) still reads the hero first. ✅
- **V-2 (the instrument fills the card):** measured — the stage fills
  100% of the balance root at 360 (≥92%) and 68% at 1280 (≥60%; the
  stage caps at 720px inside the wider card, the reference's own
  air-by-design). ✅
- **V-3 (no overflow):** 360/390/768/1280/1920 × EN/fa — zero
  horizontal scroll and zero pan clipping everywhere (the pans gained
  tuned height for the measured worst case: s 236→256, m/l 268→280 —
  05's header allows tuning; the comment in `balanceVisualMetrics`
  records the measured 244/268 readings that motivated it). ✅
- **V-4 (the rim matches the ledger):** for every scenario, every lane —
  the weight's segment counts per impact EQUAL the open ledger row's
  member counts (the test opens each row in turn: one row at a time). ✅
- **V-5 (the formula):** data-tilt per scenario: balanced/split 0 ·
  against +3.33 · for −10 · unread 0; the verdict words match; the
  needle renders exactly when a reading exists (hidden for none). The
  pure functions are pinned by the jsdom suite (46 + 35 tests). ✅
- **V-6 (no wind words):** the gold card's text scans clean of
  wind/tailwind/headwind (and «باد») in the browser, EN + fa — beside
  the jsdom DOM scan. ✅
- **V-7 (contrast, BOTH themes — computed from the rendered styles):**

  | Surface | Light | Dark | Requirement |
  |---|---|---|---|
  | Verdict word (against, red) | 5.00 | 4.77 | ≥3.0 (large text) |
  | Verdict word (for, green — computed) | 3.35 | 4.78 | ≥3.0 (large text) |
  | Verdict eyebrow | 7.03 | 7.10 | ≥4.5 |
  | Balance eyebrow (brass) | 5.92 | 9.06 | ≥4.5 |
  | Counts line | 7.98 | 7.70 | ≥4.5 |
  | Pan caption (for) | 7.72 | 7.10 | ≥4.5 |
  | Pan caption (against) | 6.47 | 5.56 | ≥4.5 |
  | Weight label | 10.98 | 13.60 | ≥4.5 |
  | Ledger tally | 7.03 | 7.10 | ≥4.5 |
  | Tray note | 6.44 | 7.68 | ≥4.5 |
  | Context pill | 7.30 | 8.33 | ≥4.5 |
  | Footnote | 7.03 | 7.10 | ≥4.5 |

  The dark captions needed 05 §5's anticipated lightening (the site's
  dark chip inks read 4.28/4.35 on the 9%-tinted pans — a hair under
  4.5): the balance's dark captions and ledger state words wear the
  reference prototype's own dark side hues (#4bc27d / #f07078),
  measured 7.10/5.56 (captions) and 7.10/5.56+ (state words on the
  recess). ✅
- **V-8 (keyboard):** a weight's Enter opens its ledger row, focus lands
  on the row button, the row button's Enter closes it with focus held;
  the jsdom suite pins the full walk (open/swap/close + aria-expanded). ✅
- **V-9 (reduced motion):** under `reducedMotion: 'reduce'` the beam
  jumps to the final angle — the data-tilt, both pan transforms and the
  rendered layout are IDENTICAL to the animated run after its 650ms
  settle (`reduced-motion-against-en-1280.png`). ✅
- **V-10 (the screenshots):** 5 data scenarios × EN/fa × 360/1280 ×
  light/dark (40 captures) + the loading skeleton × EN/fa × 360/1280 (4)
  + the default view × EN/fa × 360/1280 (4) + the two detail-open
  interaction shots + the squint/blur and reduced-motion captures — 70
  files in this directory. ✅

## The loading scenario — the honest deviation, stated

05 §8's loading row describes the BALANCE's own skeleton (a static beam
outline + four grey discs). The app's architecture renders the merged
card ONLY with a ready snapshot — during the fetch the Insights route
shows its own loading skeletons and the balance never half-renders. The
implemented loading state is therefore the page's honest skeleton (no
dead in-card skeleton code was added); the captures
(`loading-{en,fa}-{360,1280}.png`) record what a visitor actually sees.

## The visual QA passes (VLM)

- The side-by-side against the owner-approved reference prototype
  (`reference/balance-reference.html`, served locally): the beam, dial,
  hub, column, base, hangers, pan bowls, verdict block, tray and ledger
  read as a faithful match; the deliberate copy deviations are the
  program's own frozen contracts (the full evidence-based empty-pan
  sentences from R9-08, the pan captions and lane names from GB-S3, the
  context pill and measured note from round-76 — the prototype's
  shorter strings were placeholders, never owner-approved copy).
- The dotted unread rims verified at 3× zoom (distinct dashes, the
  reference's own subtlety at 46px); the "needle" visible in the
  unread scenario is the dial's centre tick — the dial itself stays
  (the reference keeps it), the NEEDLE is hidden.
- DQ-1..4 defaults held: brass beam (DQ-1), the segmented rim kept
  (DQ-2), the ledger closed by default (DQ-3), and the lane icons are
  the reference prototype's own lucide-style set (DQ-4's "reuse first"
  resolves to the approved prototype's icons — the existing
  ConditionIcon glyphs name STATES, not lanes, and cannot label a
  weight; recorded in the PR).
