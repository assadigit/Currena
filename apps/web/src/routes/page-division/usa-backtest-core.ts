/**
 * usa-backtest-core — the S9 + S10 §21 diff, PURE (spec §21's
 * verdict-consistency rule applied to the USA page: "the verdicts match
 * Global's engine values byte-for-byte" — the D-30 contract — plus the
 * §21 per-page trio over the tier cards, plus the S10 tier-6 TIC board
 * diff: the page's board ≡ the served snapshot ≡ the arithmetic
 * restated independently, never through the section's own helper).
 *
 * THREE SIDES, ONE TRUTH (the S4/S7/S8 two-path shape, extended by the
 * session gate's own wording):
 *
 *   PAGE side — what /usa renders: `usaGaugeVerdicts` over the USA
 *   projection's readings (the EXACT derivation the strip renders) and
 *   the 26 tier cards' readings straight off the same projection.
 *
 *   GLOBAL side — what the landing page renders for the SAME gauges:
 *   `globalGaugeTiles` over the GLOBAL projection's readings (the S3
 *   module the USA derivation re-exports; D-30 says the strip's verdicts
 *   are "the same computed verdicts as Global", so this side is pinned
 *   literally, not assumed).
 *
 *   ENGINE side — the engine's own arithmetic spelled out directly over
 *   the SERVED SNAPSHOT (GET /api/insights — the same stored document both
 *   projections derive from): `gaugeReading` + `labelForVerdictStep`,
 *   NEVER through a page module. Deriving this side without the page
 *   modules is the point: a drift in either page surfaces as a red check
 *   here, never as two copies of the same bug agreeing.
 *
 * The tier cards are pinned two ways: each card's reading over the USA
 * projection must be byte-identical (stableStringify, key-order-immune)
 * to the served snapshot's own reading on the §21 trio inputs — value,
 * range bounds, percentile10y, asOf, status. An id absent from BOTH
 * sides stays green (the public-mode twin, the §16 note); an id absent
 * from only one side is RED (a licence-hidden id must be reported in
 * absentIds, never silently dropped).
 *
 * The `drop*Input` / `mutate*` seams exist ONLY for the offline suite's
 * fail-closed proofs — they simulate a corrupted feed and must turn the
 * affected checks red (never silently green).
 *
 * Pure + platform-free so the offline suite (usa-backtest.test.ts)
 * drives it on fixtures with the fail-closed proofs, and the LIVE script
 * (apps/web/scripts/pd-s9-backtest.ts) drives it over the wire. Nothing
 * here ships in the app bundle — no route imports it (test/script seams
 * only).
 */

import type { IndicatorId, IndicatorReading, TicHolder, TicSnapshot } from '@currena/core';
import { GAUGES, gaugeReading, labelForVerdictStep } from '@currena/insights';
import { TIC_CUSTODY_HUBS, ticHolderDerived, ticIsStale } from '@currena/insights/tic';
import { THEMATIC_GAUGE_IDS, THEMATIC_GAUGE_MEMBER_IDS } from '@currena/insights/page-division';
import { globalGaugeTiles, type GlobalGaugeTile } from './global-tiles';
import { USA_CARD_IDS, usaGaugeVerdicts } from './usa-tiles';

/** One comparison's verdict — `ok` false is a RED finding (§21: zero tolerance). */
export interface UsaBacktestCheck {
  label: string;
  ok: boolean;
  /** The rendered values, one per side (stable, JSON-ish). */
  detail: string;
  /** A designed divergence or context note — reported, never a failure. */
  note?: string;
}

/** stableStringify — the key-order-immune comparison basis (the S4
 * discipline; a re-ordered JSON must never read as a diff). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

/** Render a strip entry's verdict for the check table. */
function showVerdict(tile: GlobalGaugeTile | undefined): string {
  if (tile === undefined) return 'absent';
  return stableStringify({ step: tile.reading.step, voting: tile.reading.votingCount, warnings: tile.reading.warningCount, stale: tile.reading.staleCount, word: tile.word });
}

/** The §21 trio inputs a tier card renders — the picked-fields basis. */
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

/** A deep-enough copy of a strip entry for the proof seams. */
function copyVerdict(tile: GlobalGaugeTile): GlobalGaugeTile {
  return { gauge: tile.gauge, word: tile.word, reading: { ...tile.reading } };
}

export interface UsaBacktestOverrides {
  /** Drop a voter/input from the PAGE side (a missing mirror would silently change a verdict). */
  dropPageInput?: string;
  /** Drop a voter/input from the GLOBAL side. */
  dropGlobalInput?: string;
  /** Drop an id from the ENGINE side (the snapshot). */
  dropEngineInput?: string;
  /** Flip/mutate a PAGE-side strip entry AFTER the derivation (the fail-closed proof). */
  mutatePageVerdict?: (tile: GlobalGaugeTile) => void;
  /** Mutate a PAGE-side card reading's trio inputs AFTER the join (the proof). */
  mutatePageCard?: (id: IndicatorId, reading: IndicatorReading) => void;
}

const minusId = (readings: readonly IndicatorReading[], drop: string | undefined): readonly IndicatorReading[] =>
  drop === undefined ? readings : readings.filter((r) => (r.id as string) !== drop);

/**
 * The S9 §21 diff. Returns one check per comparable value; any
 * `ok: false` is a §21 red finding. The drop/mutate seams simulate
 * corrupted feeds for the offline fail-closed proofs.
 */
export function backtestUsaPage(
  pageReadings: readonly IndicatorReading[],
  globalReadings: readonly IndicatorReading[],
  engineReadings: readonly IndicatorReading[],
  overrides: UsaBacktestOverrides = {},
): { checks: UsaBacktestCheck[]; green: number; red: number } {
  const checks: UsaBacktestCheck[] = [];

  // The effective feeds (the proof seams act HERE, before any derivation).
  const pageFeed = minusId(pageReadings, overrides.dropPageInput);
  const globalFeed = minusId(globalReadings, overrides.dropGlobalInput);
  const engineFeed = minusId(engineReadings, overrides.dropEngineInput);
  const pageById = new Map(pageFeed.map((r) => [r.id as string, r]));
  const engineById = new Map(engineFeed.map((r) => [r.id as string, r]));

  /* ---- 0. Input completeness: every gauge voter rides all three feeds ---- */
  for (const id of THEMATIC_GAUGE_MEMBER_IDS) {
    const pageHas = pageById.has(id);
    const globalHas = globalFeed.some((r) => (r.id as string) === id);
    const engineHas = engineById.has(id);
    checks.push({
      label: `input ${id} rides the USA projection, the Global projection and the snapshot`,
      ok: pageHas && globalHas && engineHas,
      detail: `page ${pageHas ? 'present' : 'MISSING'} · global ${globalHas ? 'present' : 'MISSING'} · engine ${engineHas ? 'present' : 'MISSING'}`,
    });
  }

  /* ---- 1. The D-30 strip: page ≡ Global's board ≡ the engine ---- */
  const pageStrip = usaGaugeVerdicts(pageFeed).map(copyVerdict);
  for (const tile of pageStrip) overrides.mutatePageVerdict?.(tile);
  const globalStrip = globalGaugeTiles(globalFeed);
  for (const gauge of GAUGES.filter((g) => (THEMATIC_GAUGE_IDS as readonly string[]).includes(g.id))) {
    // ENGINE SIDE — the ingest's own call, spelled out.
    const engineReading = gaugeReading(gauge, engineFeed);
    const engineWord = labelForVerdictStep(engineReading.step);
    // PAGE SIDE — what /usa renders (mutations applied).
    const pageTile = pageStrip.find((t) => t.gauge === gauge.id);
    // GLOBAL SIDE — what the landing page renders for the same gauge.
    const globalTile = globalStrip.find((t) => t.gauge === gauge.id);
    const pageJson = showVerdict(pageTile);
    const globalJson = showVerdict(globalTile);
    const engineJson = stableStringify({ step: engineReading.step, voting: engineReading.votingCount, warnings: engineReading.warningCount, stale: engineReading.staleCount, word: engineWord });
    checks.push({
      label: `gauge ${gauge.id}: the USA strip ≡ the Global board ≡ the engine (byte-for-byte)`,
      ok: pageJson === globalJson && pageJson === engineJson,
      detail: `page ${pageJson} · global ${globalJson} · engine ${engineJson}`,
    });
  }

  /* ---- 2. The tier cards: the projection ≡ the served snapshot ---- */
  for (const id of USA_CARD_IDS) {
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
 * The tier-6 TIC board diff (S10, spec §7 item 7 / §21): the REUSED
 * section renders ticHolderDerived (the insights package's own helper)
 * over the snapshot GET /api/insights/tic serves. THREE truths, one
 * board:
 *
 *   PAGE side — the payload the page fetched, joined through the SAME
 *   helper the drawing renders (ticHolderDerived over an INDEPENDENT
 *   copy — a page-side mutation can never leak into the engine side).
 *
 *   PAYLOAD equality — the page's copy and the engine's copy (two HTTP
 *   payloads of the one stored document) agree on every rendered field.
 *
 *   ENGINE side — the derived numbers RESTATED HERE, spelled out from
 *   the raw months (share, the 1/6/12-month changes, the 12-month
 *   transactions sum, the 12-month price effect) — never through
 *   ticHolderDerived. A drift in the helper surfaces as a red check,
 *   never as two copies of the same bug agreeing.
 * ------------------------------------------------------------------ */

/** The TIC board's expected holder count (spec §7 item 7: 21 foreign
 *  holders — the Table 5 top-20 + Australia). */
export const TIC_EXPECTED_HOLDERS = 21;

export interface TicBacktestOverrides {
  /** Drop a holder from the PAGE copy (a truncated payload). */
  dropPageHolder?: string;
  /** Mutate a PAGE-side holder's latest holdings after the fetch (a
   *  corrupted copy — the diff must go red, never silently green). */
  mutatePageHolder?: (holder: TicHolder) => void;
  /** Mutate the PAGE copy's grand total. */
  mutatePageTotal?: (snapshot: TicSnapshot) => void;
}

/** The restated engine-side arithmetic for ONE holder (the compute.ts
 *  contract, spelled out — never imported): the changes round to 3dp,
 * the 12-month sums accumulate RAW then round once to 3dp, sharePct is
 * 1dp with the non-positive-total guard, the pcts 1dp). */
function restatedDerived(holder: TicHolder, dataMonth: string, totalBn: number): string {
  const at = (nBack: number): number | null => {
    const y = Number(dataMonth.slice(0, 4));
    const m = Number(dataMonth.slice(5, 7));
    const target = nBack >= m ? `${String(y - 1).padStart(4, '0')}-${String(12 + m - nBack).padStart(2, '0')}` : `${String(y).padStart(4, '0')}-${String(m - nBack).padStart(2, '0')}`;
    return holder.months.find((x) => x.ym === target)?.v ?? null;
  };
  const latest = holder.months.at(-1)!.v;
  const round3 = (v: number): number => Math.round(v * 1000) / 1000;
  const chg = (n: number): number | null => {
    const base = at(n);
    return base === null ? null : round3(latest - base);
  };
  const pct = (delta: number | null, base: number | null): number | null =>
    delta === null || base === null || base <= 0 ? null : Math.round((delta / base) * 1000) / 10;
  const inWindow = (ym: string): boolean => {
    const y = Number(ym.slice(0, 4));
    const m = Number(ym.slice(5, 7));
    const dy = Number(dataMonth.slice(0, 4));
    const dm = Number(dataMonth.slice(5, 7));
    return y * 12 + m > dy * 12 + dm - 12 && y * 12 + m <= dy * 12 + dm;
  };
  let net12m: number | null = null;
  let netMonths = 0;
  for (const m of holder.netSalesBn ?? []) {
    if (inWindow(m.ym)) {
      net12m = (net12m ?? 0) + m.v; // raw accumulation, rounded once below
      netMonths += 1;
    }
  }
  let val12m: number | null = null;
  for (const m of holder.valuationChangeBn ?? []) {
    if (inWindow(m.ym)) val12m = (val12m ?? 0) + m.v;
  }
  const chg12m = chg(12);
  return stableStringify({
    sharePct: totalBn > 0 ? Math.round((holder.holdingsBn / totalBn) * 1000) / 10 : 0,
    chg1mBn: chg(1),
    chg6mBn: chg(6),
    chg12mBn: chg12m,
    chg12mPct: pct(chg12m, at(12)),
    net12mBn: net12m === null ? null : round3(net12m),
    netMonths,
    val12mBn: val12m === null ? null : round3(val12m),
  });
}

/** The page-side derivation through the package's own helper (what the
 *  drawing renders), over the page's INDEPENDENT copy. */
function pageDerived(holder: TicHolder, snapshot: TicSnapshot): string {
  const d = ticHolderDerived(holder, snapshot);
  return stableStringify({
    sharePct: d.sharePct,
    chg1mBn: d.chg1mBn,
    chg6mBn: d.chg6mBn,
    chg12mBn: d.chg12mBn,
    chg12mPct: d.chg12mPct,
    net12mBn: d.net12mBn,
    netMonths: d.netMonths,
    val12mBn: d.val12mBn,
  });
}

/** The rendered-fields payload fingerprint (fetchedAt excluded — the
 *  rung's own stamp; the two copies may be served from one document). */
function ticPayloadFingerprint(s: TicSnapshot): string {
  return stableStringify({
    v: s.v,
    dataMonth: s.dataMonth,
    releasedAt: s.releasedAt,
    totalBn: s.totalBn,
    officialBn: s.officialBn,
    privateBn: s.privateBn,
    holders: [...s.holders]
      .map((h) => ({ id: h.id, name: h.name, holdingsBn: h.holdingsBn, months: h.months, netSalesBn: h.netSalesBn ?? null, valuationChangeBn: h.valuationChangeBn ?? null, isCustodyHub: h.isCustodyHub, flaggedMonths: h.flaggedMonths ?? null }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  });
}

/** A deep-enough copy of the page's snapshot for the proof seams — the
 *  nested series arrays are copied too, so a mutation on the page side
 *  can never leak into the engine side through a shared object (the
 *  offline suite passes the SAME board object as both feeds; the live
 *  script passes two HTTP payloads — both must behave identically). */
function copyTic(s: TicSnapshot): TicSnapshot {
  return {
    ...s,
    holders: s.holders.map((h) => ({
      ...h,
      months: h.months.map((m) => ({ ...m })),
      netSalesBn: h.netSalesBn?.map((m) => ({ ...m })),
      valuationChangeBn: h.valuationChangeBn?.map((m) => ({ ...m })),
      flaggedMonths: h.flaggedMonths?.slice(),
    })),
  } as TicSnapshot;
}

/**
 * The S10 §21 TIC diff: page payload ≡ engine payload, and every derived
 * number the drawing renders ≡ the arithmetic restated independently.
 * Any `ok: false` is a §21 red finding.
 */
export function backtestUsaTicBoard(
  pageTic: TicSnapshot,
  engineTic: TicSnapshot,
  overrides: TicBacktestOverrides = {},
): { checks: UsaBacktestCheck[]; green: number; red: number } {
  const checks: UsaBacktestCheck[] = [];
  // The PAGE copy is a MUTABLE copy exactly like a second HTTP payload —
  // the proof seams act here, never on the engine side.
  const page = copyTic(pageTic);
  if (overrides.dropPageHolder !== undefined) {
    (page as { holders: TicHolder[] }).holders = page.holders.filter((h) => h.id !== overrides.dropPageHolder);
  }
  for (const h of page.holders) overrides.mutatePageHolder?.(h);
  overrides.mutatePageTotal?.(page);

  /* ---- 0. Structure: the spec's own board shape, both sides ---- */
  for (const [side, s] of [['page', page], ['engine', engineTic]] as const) {
    const ids = s.holders.map((h) => h.id);
    const unique = new Set(ids).size === ids.length;
    const count = ids.length === TIC_EXPECTED_HOLDERS;
    const monthsOk = s.holders.every((h) => h.months.length >= 2 && h.months.at(-1)!.ym === s.dataMonth);
    const holdingsOk = s.holders.every((h) => Math.abs(h.months.at(-1)!.v - h.holdingsBn) < 0.0005);
    checks.push({
      label: `tic structure (${side}): 21 unique holders, every latest month = dataMonth, holdingsBn = latest value`,
      ok: unique && count && monthsOk && holdingsOk,
      detail: `holders ${ids.length}/${TIC_EXPECTED_HOLDERS} · unique ${unique} · months ${monthsOk} · holdings ${holdingsOk}`,
    });
  }

  /* ---- 1. Payload equality: the page's copy ≡ the engine's copy ---- */
  const pageFp = ticPayloadFingerprint(page);
  const engineFp = ticPayloadFingerprint(engineTic);
  checks.push({
    label: 'tic payload: the page copy ≡ the served snapshot, every rendered field',
    ok: pageFp === engineFp,
    detail: `page ${pageFp.slice(0, 120)}… · engine ${engineFp.slice(0, 120)}…`,
  });

  /* ---- 2. The aggregates: the split bar's own arithmetic ---- */
  for (const [side, s] of [['page', page], ['engine', engineTic]] as const) {
    if (s.officialBn === undefined || s.privateBn === undefined) {
      checks.push({ label: `tic aggregates (${side}): official + private = total`, ok: false, detail: 'official/private absent' });
      continue;
    }
    const sums = Math.abs(s.officialBn + s.privateBn - s.totalBn) < 0.011;
    checks.push({
      label: `tic aggregates (${side}): official + private = total (the split bar's own basis)`,
      ok: sums,
      detail: `official ${s.officialBn} + private ${s.privateBn} vs total ${s.totalBn}`,
    });
  }

  /* ---- 3. Every holder: the drawing's derivation ≡ the restated
   *          arithmetic, and the custody-hub set ≡ Treasury's own ---- */
  const engineById = new Map(engineTic.holders.map((h) => [h.id, h]));
  for (const pageHolder of page.holders) {
    const engineHolder = engineById.get(pageHolder.id);
    if (engineHolder === undefined) {
      checks.push({ label: `tic holder ${pageHolder.id}: present on the engine side`, ok: false, detail: 'MISSING on the engine side' });
      continue;
    }
    const pageJson = pageDerived(pageHolder, page);
    const engineJson = restatedDerived(engineHolder, engineTic.dataMonth, engineTic.totalBn);
    checks.push({
      label: `tic holder ${pageHolder.id}: the drawing's derived row ≡ the restated arithmetic`,
      ok: pageJson === engineJson,
      detail: `page ${pageJson} · engine ${engineJson}`,
    });
    const custodyOk = pageHolder.isCustodyHub === engineHolder.isCustodyHub && pageHolder.isCustodyHub === TIC_CUSTODY_HUBS.has(pageHolder.name);
    checks.push({
      label: `tic holder ${pageHolder.id}: the custody-hub marker ≡ Treasury's own set`,
      ok: custodyOk,
      detail: `page ${pageHolder.isCustodyHub} · engine ${engineHolder.isCustodyHub} · treasury ${TIC_CUSTODY_HUBS.has(pageHolder.name)}`,
    });
  }
  // A holder on the engine side but not the page side is RED (a truncated
  // page payload must never pass silently).
  const pageIds = new Set(page.holders.map((h) => h.id));
  for (const engineHolder of engineTic.holders) {
    if (!pageIds.has(engineHolder.id)) {
      checks.push({ label: `tic holder ${engineHolder.id}: present on the page side`, ok: false, detail: 'MISSING on the page side' });
    }
  }

  /* ---- 4. The staleness verdict: both copies, the same clock ---- */
  const NOW = new Date('2026-11-09T12:00:00Z');
  const pageStale = ticIsStale(page, NOW);
  const engineStale = ticIsStale(engineTic, NOW);
  checks.push({
    label: 'tic staleness: the >70-day badge verdict identical on both copies (the same clock)',
    ok: pageStale === engineStale,
    detail: `page ${pageStale} · engine ${engineStale} (dataMonth ${page.dataMonth} at ${NOW.toISOString().slice(0, 10)})`,
  });

  return { checks, green: checks.filter((c) => c.ok).length, red: checks.filter((c) => !c.ok).length };
}

/**
 * The LIVE script's card-membership sanity basis: the 72 S9+S10-scope
 * card ids, in placement order (re-exported from usa-tiles — never
 * hand-copied).
 */
export { USA_CARD_IDS as USA_BACKTEST_CARD_IDS };
