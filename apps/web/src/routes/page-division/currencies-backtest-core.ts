/**
 * currencies-backtest-core — the S18 §21 diff, PURE (spec §21's
 * verdict-consistency rule applied to the Currencies page: "page-rendered
 * values must match engine values byte-for-byte").
 *
 * THREE SIDES, ONE TRUTH (the S9/S10/S12/S16/S17 shape + the S18 fx legs):
 *
 *   PAGE side — what /currencies renders: the 14 registry cards'
 *   readings straight off the Currencies projection (GET
 *   /api/insights/pages/currencies) + the rule lights / pair board
 *   straight off the fx board (GET /api/insights/fx — the page renders
 *   BOTH feeds without re-derivation).
 *
 *   ENGINE sides — the served snapshot (GET /api/insights — the same
 *   stored document the projection derives from) + the fx board's own
 *   stored document (the KV value behind GET /api/insights/fx).
 *
 * The gates (the session prompt's S18 scope, the roadmap's own words):
 *
 *   1. THE CARDS (the S17 pattern): each of the 14 registry cards' §21
 *      trio inputs byte-identical (stableStringify, key-order-immune)
 *      between the projection and the served snapshot — value, range
 *      bounds, percentile10y, asOf, status. Absent-on-both stays green
 *      (the public-mode twin); absent-on-one is RED.
 *
 *   2. THE RULES ("the rules match the FX board KV logic exactly"):
 *      the page renders the KV's stored rule states through the SAME
 *      pure mappings the legacy page reads — `fxRuleView` (§9.3 status
 *      + chip) + `currenciesRuleHeadlineKey` (the headline sentence)
 *      + the engine's own `summarizeFxRules` recomputed over the KV's
 *      rules must equal the KV's stored summary (the rollup is the
 *      engine's logic, re-derived here — zero tolerance). Plus the
 *      display-domain invariant: every rule state the KV carries must
 *      be renderable (a non-nodata rule that is neither quiet-R7 nor
 *      downgraded-watch must carry a headline; r3/r4's watch shape only
 *      exists through the downgrade — an undowngraded watch there is a
 *      display hole, RED).
 *
 *   3. THE BOARD ("11 pairs complete"): the fx document's pairs cover
 *      all 11 FX_PAIR_IDS (D-42 — AUDNZD the 11th), each row's bigMove
 *      flag ≡ moveRank ≥ 90 (the §6.2 derivation, recomputed), and the
 *      rows' stored `stale` flags honest against their asOf age (the
 *      FX_STALE_DAYS ladder — the freshness audit's board leg).
 *
 *   4. THE FRESHNESS AUDIT (spec §21's "Data audit" leg) rides the S11
 *      pure `auditUsaFreshness` over the 14 registry cards (the same
 *      function the USA/Europe/Asia/Australia/Commodities gates speak —
 *      no logic drift, one audit function).
 *
 * The `drop*Input` / `mutate*` seams exist ONLY for the offline suite's
 * fail-closed proofs — they simulate a corrupted feed and must turn the
 * affected checks red (never silently green).
 *
 * Pure + platform-free so the offline suite (currencies-backtest.test.ts)
 * drives it on fixtures with the fail-closed proofs, and the LIVE script
 * (apps/web/scripts/pd-s18-backtest.ts) drives it over the wire. Nothing
 * here ships in the app bundle — no route imports it (test/script seams
 * only).
 */

import type { FxSnapshot, IndicatorId, IndicatorReading } from '@currena/core';
import { summarizeFxRules } from '@currena/insights/fx';
import { BIG_MOVE_PERCENTILE, FX_PAIR_IDS, FX_STALE_DAYS } from '@currena/insights/fx/definitions';
import { fxRuleView } from '../../lib/fx-presentation/rules';
import { stableStringify, auditUsaFreshness, type UsaBacktestCheck, type FreshnessRegistryEntry } from './usa-backtest-core';
import { CURRENCIES_CARD_IDS } from './currencies-tiles';
import { currenciesRuleHeadlineKey } from './currencies-tiles';

// Re-exports for the live script + the offline suite (the S9–S17 pattern:
// the backtest's own name for the card list, never hand-copied).
export { stableStringify, auditUsaFreshness, type UsaBacktestCheck, type FreshnessRegistryEntry };
export { CURRENCIES_CARD_IDS as CURRENCIES_BACKTEST_CARD_IDS };
export { FX_PAIR_IDS as CURRENCIES_BACKTEST_PAIR_IDS };

/** The §21 trio inputs a Currencies registry card renders — the
 *  picked-fields basis (the S9–S17 cardTrioInputs, restated lean so this
 *  backtest stays self-contained — same fields, same shape). */
function cardTrioInputs(reading: IndicatorReading | undefined): string {
  if (reading === undefined) return 'absent';
  return stableStringify({
    value: reading.value,
    rangeLow: reading.rangeLow,
    rangeHigh: reading.rangeHigh,
    percentile10y: reading.percentile10y,
    asOf: reading.asOf,
    status: reading.status,
  });
}

export interface CurrenciesBacktestOverrides {
  /** Drop an id from the PAGE side (a missing projection reading would
   *  silently drop a card). */
  dropPageInput?: string;
  /** Drop an id from the ENGINE side (the snapshot). */
  dropEngineInput?: string;
  /** Mutate a PAGE-side card reading's trio inputs AFTER the join (the
   *  fail-closed proof — the diff must go red, never silently green). */
  mutatePageCard?: (id: IndicatorId, reading: IndicatorReading) => void;
}

const minusId = (readings: readonly IndicatorReading[], drop: string | undefined): readonly IndicatorReading[] =>
  drop === undefined ? readings : readings.filter((r) => (r.id as string) !== drop);

/* ------------------------------------------------------------------ *
 * Gate 1 — the 14 registry cards: the projection ≡ the served snapshot
 * ------------------------------------------------------------------ */

/**
 * The S18 §21 card diff. Returns one check per comparable value; any
 * `ok: false` is a §21 red finding. The drop/mutate seams simulate
 * corrupted feeds for the offline fail-closed proofs.
 */
export function backtestCurrenciesCards(
  pageReadings: readonly IndicatorReading[],
  engineReadings: readonly IndicatorReading[],
  overrides: CurrenciesBacktestOverrides = {},
): { checks: UsaBacktestCheck[]; green: number; red: number } {
  const checks: UsaBacktestCheck[] = [];

  // The effective feeds (the proof seams act HERE, before any derivation).
  const pageFeed = minusId(pageReadings, overrides.dropPageInput);
  const engineFeed = minusId(engineReadings, overrides.dropEngineInput);
  const pageById = new Map(pageFeed.map((r) => [r.id as string, r]));
  const engineById = new Map(engineFeed.map((r) => [r.id as string, r]));

  for (const id of CURRENCIES_CARD_IDS) {
    const pageReading = pageById.get(id);
    const engineReading = engineById.get(id);
    if (pageReading !== undefined && overrides.mutatePageCard !== undefined) {
      overrides.mutatePageCard(id, pageReading);
    }
    const pageTrio = cardTrioInputs(pageReading);
    const engineTrio = cardTrioInputs(engineReading);
    // Absent on BOTH sides stays green (the public-mode twin, §16);
    // absent on ONE side is red (silently dropped, never reported).
    const bothAbsent = pageReading === undefined && engineReading === undefined;
    checks.push({
      label: `card ${id}: the §21 trio inputs ≡ the snapshot's own reading`,
      ok: bothAbsent || pageTrio === engineTrio,
      detail: `page ${pageTrio} · engine ${engineTrio}`,
      note: bothAbsent ? 'absent on both sides — the honest public-mode twin' : undefined,
    });
  }

  return { checks, green: checks.filter((c) => c.ok).length, red: checks.filter((c) => !c.ok).length };
}

/* ------------------------------------------------------------------ *
 * Gate 2 — the rules: the display mapping covers the KV's states exactly
 * ------------------------------------------------------------------ */

/** The §9.3 display-domain invariant: an outcome that would render NO
 *  headline and NO nodata word (a bare unexplained watch) is a display
 *  hole — the engine's rules only produce those through the downgrade. */
function ruleRenderableHole(rule: FxSnapshot['rules'][number]): boolean {
  const headline = currenciesRuleHeadlineKey(rule);
  if (rule.outcome === 'nodata') return false; // the noData word speaks
  if (headline !== null) return false;
  // A quiet R7 legitimately carries no sentence (the legacy card stays
  // away below the trigger); anything else without a headline is a hole.
  return !(rule.id === 'r7_dollar_or_euro' && rule.outcome === 'quiet');
}

/**
 * The S18 rules gate — "the rules match the FX board KV logic exactly".
 * The page renders the KV's stored rules through the SAME pure mappings
 * the legacy surface reads (fxRuleView + currenciesRuleHeadlineKey); this
 * check proves the KV's own states round-trip: 7 rules, each id once,
 * every state renderable, and the stored summary ≡ the engine's own
 * `summarizeFxRules` recomputed over the stored rules (zero tolerance —
 * a drifted rollup would make the page's chips lie).
 *
 * The `mutateRule` seam (offline proofs) mutates ONE rule state after
 * the join — a changed outcome must turn the summary check red.
 */
export function backtestCurrenciesRules(
  fx: FxSnapshot,
  overrides: { mutateRule?: (rule: FxSnapshot['rules'][number]) => void } = {},
): { checks: UsaBacktestCheck[]; green: number; red: number } {
  const checks: UsaBacktestCheck[] = [];

  // 7 rules, each id exactly once (the KV's own contract).
  const ids = fx.rules.map((r) => r.id as string);
  checks.push({
    label: 'the fx board carries the 7 rules, each id exactly once',
    ok: ids.length === 7 && new Set(ids).size === 7,
    detail: `${ids.length} rules · ${new Set(ids).size} distinct`,
  });

  // Every stored state renders through the SAME mappings the page reads —
  // the §9.3 status table itself, row by row (warning → Active with the
  // attention/unusual chip; watch → Watching; supportive → Active with
  // the Normal chip; context → Active, no chip; quiet/nodata → Quiet).
  const EXPECTED_STATUS: Record<string, { status: 'active' | 'watching' | 'quiet'; chip: 'normal' | 'attention' | 'unusual' | null }> = {
    warning: { status: 'active', chip: 'attention' },
    watch: { status: 'watching', chip: null },
    supportive: { status: 'active', chip: 'normal' },
    context: { status: 'active', chip: null },
    quiet: { status: 'quiet', chip: null },
    nodata: { status: 'quiet', chip: null },
  };
  for (const rule of fx.rules) {
    if (overrides.mutateRule !== undefined) overrides.mutateRule(rule);
    const view = fxRuleView(rule);
    const expected = EXPECTED_STATUS[rule.outcome]!;
    // The R4 wobble variant wears the Unusual chip (§9.3 row 2).
    const expectedChip = rule.variant === 'wobble' && rule.outcome === 'warning' ? 'unusual' : expected.chip;
    checks.push({
      label: `rule ${rule.id}: the §9.3 status table reads the KV state exactly`,
      ok: view.status === expected.status && view.chip === expectedChip,
      detail: `outcome ${rule.outcome}${rule.downgraded === true ? ' (downgraded)' : ''} → ${view.status} · chip ${view.chip ?? 'none'} (expected ${expected.status} · ${expectedChip ?? 'none'})`,
    });
    checks.push({
      label: `rule ${rule.id}: the stored state is renderable (a headline, the noData word, or a legitimately silent R7)`,
      ok: !ruleRenderableHole(rule),
      detail: `outcome ${rule.outcome} → headline ${currenciesRuleHeadlineKey(rule) ?? '(none)'}`,
    });
  }

  // The stored summary ≡ the engine's own rollup recomputed over the
  // stored rules (the KV logic itself — zero tolerance).
  const recomputed = summarizeFxRules(fx.rules);
  checks.push({
    label: 'the stored section summary ≡ the engine’s own summarizeFxRules over the stored rules',
    ok: stableStringify(fx.summary) === stableStringify(recomputed),
    detail: `stored ${stableStringify(fx.summary)} · recomputed ${stableStringify(recomputed)}`,
  });

  return { checks, green: checks.filter((c) => c.ok).length, red: checks.filter((c) => !c.ok).length };
}

/* ------------------------------------------------------------------ *
 * Gate 3 — the board: 11 pairs complete, the flags honest
 * ------------------------------------------------------------------ */

/**
 * The S18 board gate — "11 pairs complete" (D-42). Every one of the 11
 * FX_PAIR_IDS carries a row; every row's bigMove flag ≡ moveRank ≥ 90
 * (the §6.2 derivation recomputed); every row's stored stale flag is
 * honest against its asOf age (the FX_STALE_DAYS ladder).
 *
 * The `dropPair` / `mutatePair` seams (offline proofs) drop or corrupt
 * ONE row — the coverage or the flag check must go red.
 */
export function backtestCurrenciesBoard(
  fx: FxSnapshot,
  todayIso: string,
  overrides: { dropPair?: string; mutatePair?: (pair: FxSnapshot['pairs'][number]) => void } = {},
): { checks: UsaBacktestCheck[]; green: number; red: number } {
  const checks: UsaBacktestCheck[] = [];

  const rows = fx.pairs.filter((p) => (overrides.dropPair === undefined ? true : (p.id as string) !== overrides.dropPair));
  const byId = new Map(rows.map((p) => [p.id as string, p]));

  // D-42: 11 pairs complete, in the engine table's own order.
  const missing = FX_PAIR_IDS.filter((id) => !byId.has(id));
  checks.push({
    label: 'the board is 11 pairs complete (D-42 — AUDNZD the 11th)',
    ok: missing.length === 0,
    detail: missing.length === 0 ? `${FX_PAIR_IDS.length}/${FX_PAIR_IDS.length} present` : `missing: ${missing.join(', ')}`,
  });

  for (const pair of rows) {
    if (overrides.mutatePair !== undefined) overrides.mutatePair(pair);
    // §6.2: the tag rides only at moveRank ≥ BIG_MOVE_PERCENTILE.
    checks.push({
      label: `pair ${pair.id}: bigMove ≡ moveRank ≥ ${BIG_MOVE_PERCENTILE} (the §6.2 derivation)`,
      ok: pair.bigMove === (pair.moveRank >= BIG_MOVE_PERCENTILE),
      detail: `moveRank ${pair.moveRank} · bigMove ${pair.bigMove}`,
    });
    // The stale flag honest against the age (the job's own ladder).
    const days = Math.round(
      (Date.parse(`${todayIso}T00:00:00Z`) - Date.parse(`${pair.asOf}T00:00:00Z`)) / 86_400_000,
    );
    checks.push({
      label: `pair ${pair.id}: the stored stale flag is honest against its asOf age`,
      ok: pair.stale === (days > FX_STALE_DAYS),
      detail: `asOf ${pair.asOf} · ${days} day(s) old · stale ${pair.stale} (ladder ${FX_STALE_DAYS})`,
    });
  }

  return { checks, green: checks.filter((c) => c.ok).length, red: checks.filter((c) => !c.ok).length };
}
