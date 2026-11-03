# AGENT_HANDOFF — Currena: the gold balance consolidation program (GB-S4 DELIVERED)

> The ACTIVE program is the owner's **gold balance consolidation**
> (`docs/specs/gold-balance-consolidation/`, session plan GB-S1..GB-S7 in
> its `PROMPTS.md`; PROGRESS.md is the authoritative log). The gap-closure
> program is CLOSED (2026-11-03d; its record: `docs/gap-closure/`).
> Never record credentials here.

## A. The delivered state

1. **GB-S4 (P2b — the visual redesign) is COMPLETE** on branch
   `gold-balance/p2b-visual`: the lane view behind
   **https://currena.ir/insights?balance=lanes** now renders the owner's
   05-VISUAL-DESIGN-SPEC, implemented from the approved reference
   prototype — the brass stage (tapered beam, the 11-tick ±35° dial
   with the 3× needle, the column + base, the bowl pans with side tint
   + brass rim + captions inside), the lane WEIGHTS with segmented
   rims (NEW signals/BalanceWeight.tsx), the verdict word as the
   30-44px hero with the lane strip + the always-stated counts line +
   the context pill, the recessed "Not leaning" tray (neutral AND
   unread weights), and the four-row inline LEDGER (one row open at a
   time; the same member content contract — AC-2 held). The mechanics
   are unchanged: ONE animated angle, pans translate only, the beam
   formula untouched, 650ms ease-out quartic, reduced-motion jumps.
2. **The DEFAULT view is still byte-for-byte today's page** — the
   legacy-markup vitest snapshot is untouched and green;
   balance.test.tsx's 46 pure-geometry tests are untouched and green.
3. **V-1..V-10 all hold**, each with its evidence line in
   `docs/specs/gold-balance-consolidation/evidence/gb-s4/README.md`
   (the measured AA contrast table for BOTH themes; 70 screenshots;
   the loading-state deviation honestly recorded — the merged card only
   mounts with data, so the route's skeleton is the real loading look).
4. Gates at delivery: **ALL 9 GREEN — 14,598 tests** (web 12,623 →
   12,639); copy:audit clean (fa **round-77**, 14 keys + the
   list-joiner precedent); Insights lazy 1550.46/358.81 (ceiling
   1560/360, justified in scripts/check-bundle-budget.mjs); CHANGELOG
   [2026-11-03j] (heading count 192 verified).
5. DQ-1..4 defaults held and recorded (brass; the segmented rim; the
   ledger closed by default; the prototype's own lane icons — the
   ConditionIcon set names states, not lanes).

## B. What is deliberately left open (the owner's decisions — not tasks)

- **V-11: the owner's live read of the redesigned preview** before the
  P5/GB-S6 flip (plus the standing items: the Split badge OI-2, the
  calm-stress semantic 02 §4.1, the calibration confirmation).
- OI-1 (the Outlook sentences) — GB-S5 (P3+P4), fa round-78.
- The credential rotation (the session-supplied tokens were pasted in
  chat — rotate per the standing owner action item).

## C. The standing constraints (unchanged)

D-GB-9 (the frozen files), no edge claimed ever, full `pnpm gates`
before every push, the byte-stable default until the owner-gated flip,
fa copy-audit flow (next: round-78), the parallel-session protocol
(pull --rebase before committing).

## D. Git + deployment state

- **PR #17 merged as `bc566e9d`** (code + records; CI green on the
  branch and on main). **Deployed: currena-api `d0eab36c` @ 100%**
  (deployment `0fc7870c`, 2026-11-03T21:13:17Z — the deploy-lock check
  passed first; the record in docs/DEPLOY.md's [2026-11-03j] note).
  Browser-verified on production: the flag view AND the default view,
  EN + fa, 360 + 1280, fresh contexts, zero console errors; today's
  live data reads Balanced · "0 for · 0 against · 4 not leaning" with
  the split lane in the tray.
- The next session is **GB-S5 (P3 + P4 — the Outlook derivation +
  the copy close)**: the rewritten prompt is in PROMPTS.md (the exact
  component state, the fa round, the bundle numbers, the harness
  patterns, the outlook derivation contract in engine terms).

## E. Next action (a new session)

Read PROMPTS.md's GB-S5 prompt + PROGRESS.md's GB-S4 session log;
branch `gold-balance/p3-outlook`; the primary contract is 01 §5.2 +
04 §4.2. Remember the GB-S4 lessons (PROMPTS.md's lessons log): the
interception must clear unspecified eval fields, the fixture file must
be restored by a finally that wraps everything, hooks stay above every
early return, and the prototype's copy is placeholder — the frozen
contracts win.
