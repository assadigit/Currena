/**
 * World stock markets — calculation, status and signal rules (spec §3.5, §5).
 *
 * Everything here is PURE: dates and previous entries go in, a snapshot
 * comes out. The fetch orchestration (which provider to call, in what
 * order) lives in job.ts; this module decides what to TRUST once the
 * answers are on the table:
 *
 *   R2  a series whose last date is older than the stored one is rejected;
 *   R3  a ≥15% one-day move is only believed when the second provider
 *       agrees within 0.5% — otherwise the stored row is held;
 *   R5  when both providers answered, a >0.5% disagreement is logged as a
 *       warning note (the data-check file collects them);
 *   R6  asOf older than STALE_DAYS calendar days marks the row stale;
 *   R7  by construction: a failed market keeps its stored row verbatim —
 *       the UI never sees a zero, blank or NaN.
 *
 * Status bands (§5.2) carry a 2-point EXIT BUFFER: a market drops back to
 * a milder band only after recovering above the line plus the buffer, so a
 * tile hovering at −10% cannot flip every day. The previous status rides
 * inside the stored snapshot — no extra KV keys (spec §5.2).
 */

import type {
  MarketEntry,
  MarketId,
  MarketStatus,
  MarketsSnapshot,
  MarketsSummary,
  MarketGroupId,
} from '@currena/core';
import { MarketsSnapshotSchema } from '@currena/core';
import { addDays, daysBetween, epochDay, pointAtOrBefore } from '../series';
import type { SeriesPoint } from '../series';
import type { MarketSeries } from './providers';
import {
  ATTENTION_COUNT,
  BEAR_PCT,
  CHG_WINDOW_DAYS,
  CORRECTION_PCT,
  EXIT_BUFFER_PTS,
  MAX_DAY_MOVE_PCT,
  PROVIDER_AGREEMENT_PCT,
  STALE_DAYS,
  TREND_BAND_PCT,
  TREND_MA_DAYS,
  UNUSUAL_COUNT,
  US_OVERRIDE_IDS,
  WEEKLY_POINTS,
  WEEKLY_EPOCH_BASE_DAY,
  MARKET_IDS,
  marketDefinition,
} from './definitions';

/* ------------------------------------------------------------------ *
 * Per-market derived numbers (§5.1)
 * ------------------------------------------------------------------ */

/** Trading-day moving average of the last `n` closes. */
function movingAverage(points: readonly SeriesPoint[], n: number): number | null {
  if (points.length < n) return null;
  let sum = 0;
  for (let i = points.length - n; i < points.length; i++) sum += points[i]!.value;
  return sum / n;
}

/**
 * Storage precision: indices are quoted to two decimals and the UI never
 * renders more, so the stored object rounds closes/changes to 2 decimals
 * and rangePos to one — that is what keeps the whole 16-market payload
 * (weekly series included) comfortably under the route's 12 KB budget
 * (spec §4). Status/trend are computed from the raw values BEFORE rounding
 * so band edges stay deterministic.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Percent change of the last close vs the close `target` (null when unequal bases). */
function pctChange(last: number, base: number | undefined | null): number | null {
  if (base === undefined || base === null || !Number.isFinite(base) || base <= 0) return null;
  return ((last - base) / base) * 100;
}

/** Trend vs the 50-day average (§5.1): up > +1%, down < −1%, else flat. */
export function trendOf(points: readonly SeriesPoint[]): 'up' | 'flat' | 'down' {
  const last = points[points.length - 1]!;
  const ma = movingAverage(points, TREND_MA_DAYS);
  if (ma === null || ma <= 0) return 'flat';
  const delta = ((last.value - ma) / ma) * 100;
  if (delta > TREND_BAND_PCT) return 'up';
  if (delta < -TREND_BAND_PCT) return 'down';
  return 'flat';
}

/**
 * Status band with the 2-point exit buffer (§5.2). Entering a harsher
 * band is immediate; softening needs the line PLUS the buffer (a bear
 * market relaxes to correction only above −18%, a correction to normal
 * only above −8%).
 */
export function statusOf(fromHigh: number, prevStatus: MarketStatus | undefined): MarketStatus {
  if (fromHigh <= BEAR_PCT) return 'bear';
  // Held harsher band: still inside the buffer zone below the exit line.
  if (prevStatus === 'bear' && fromHigh <= BEAR_PCT + EXIT_BUFFER_PTS) return 'bear';
  if (fromHigh <= CORRECTION_PCT) return 'correction';
  if (prevStatus === 'correction' && fromHigh <= CORRECTION_PCT + EXIT_BUFFER_PTS) return 'correction';
  return 'normal';
}

/**
 * The ≤52-point weekly series (§4 rule 7), DELTA-ENCODED to keep the one
 * stored object under the route's 12 KB budget: the LAST close of each
 * calendar week (Monday-start), oldest first, as [dayDelta, close] pairs.
 * dayDelta counts days from the previous entry (the first from
 * WEEKLY_EPOCH_BASE — 2020-01-01); close is integer chart precision.
 * Decode with {@link decodeWeeklySeries}.
 */
export function weeklySeries(points: readonly SeriesPoint[]): [number, number][] {
  const byWeek = new Map<number, SeriesPoint>();
  for (const p of points) {
    const day = epochDay(p.date);
    // Epoch day 0 = Thursday 1970-01-01 → (day + 3) % 7 gives Monday = 0.
    const weekStart = day - ((day + 3) % 7);
    byWeek.set(weekStart, p); // ascending input → the last write is the week's last close
  }
  const weeks = [...byWeek.values()].slice(-WEEKLY_POINTS);
  const out: [number, number][] = [];
  let prevDay = WEEKLY_EPOCH_BASE_DAY;
  for (const p of weeks) {
    const day = epochDay(p.date);
    out.push([day - prevDay, Math.round(p.value)]);
    prevDay = day;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Validation + entry construction (R2, R3, R5, R6)
 * ------------------------------------------------------------------ */

/** What one market's run produced, before validation decides. */
export interface MarketCandidate {
  id: MarketId;
  /** The provider answer the chain settled on (primary order's winner). */
  primary: MarketSeries;
  /** Present when the chain also asked the second provider (R3 cross-check or fallback). */
  secondary?: MarketSeries;
}

export interface MarketResolution {
  id: MarketId;
  /** The winning entry — absent when every answer was rejected (row held). */
  entry?: MarketEntry;
  /** True when the stored row is kept verbatim (R2/R3 rejection or total failure). */
  held: boolean;
  /** Human-readable notes (rule ids) for the run report / data-check file. */
  notes: string[];
}

/** Build the entry from a validated series; pure derivation, no rejection. */
export function buildEntry(
  id: MarketId,
  series: MarketSeries,
  prev: MarketEntry | undefined,
  runDate: string,
): MarketEntry {
  const points = series.points;
  const last = points[points.length - 1]!;
  const prevPoint = points.length >= 2 ? points[points.length - 2] : undefined;

  // chg1d: vs the previous close. A series that passed R4 always has one;
  // if it somehow does not, fail loudly — never fabricate a zero (R7).
  const chg1d = pctChange(last.value, prevPoint?.value);
  if (chg1d === null) throw new Error(`[markets] ${id}: series too short for chg1d`);

  // chg3m: vs the last close on or before the same date three months
  // earlier (§5.1 as amended by owner round 44 — the normal timeframe).
  const windowAgo = pointAtOrBefore(points, addDays(last.date, -CHG_WINDOW_DAYS));
  const chg3m = pctChange(last.value, windowAgo?.value);
  if (chg3m === null) throw new Error(`[markets] ${id}: no close on/before three months back for chg3m`);

  // chg1m: vs the last close on or before the same date one month earlier —
  // the leg the currency section's rules read (currencies spec §6.3). A
  // ~400-day provider window always carries an anchor; if it somehow does
  // not, the row simply omits the field (the fx engine treats it as a
  // missing input, never a guess).
  const monthAgo = pointAtOrBefore(points, addDays(last.date, -30));
  const chg1m = pctChange(last.value, monthAgo?.value);

  // 52-week window: closes within the last 365 calendar days.
  const windowStart = addDays(last.date, -365);
  const window = points.filter((p) => p.date >= windowStart);
  let high = -Infinity;
  let low = Infinity;
  for (const p of window) {
    if (p.value > high) high = p.value;
    if (p.value < low) low = p.value;
  }
  const fromHigh = Math.min(0, ((last.value - high) / high) * 100);

  return {
    id,
    asOf: last.date,
    close: round2(last.value),
    chg1d: round2(chg1d),
    ...(chg1m !== null ? { chg1m: round2(chg1m) } : {}),
    chg3m: round2(chg3m),
    high52w: round2(high),
    low52w: round2(low),
    fromHigh: round2(Math.min(0, ((last.value - high) / high) * 100)),
    rangePos: round1(high > low ? ((last.value - low) / (high - low)) * 100 : 50),
    trend: trendOf(points),
    status: statusOf(fromHigh, prev?.status),
    source: series.source,
    stale: daysBetween(last.date, runDate) > STALE_DAYS,
    weekly: weeklySeries(points),
  };
}

/**
 * Decide one market's row: R2 (newer-or-equal date), the same-date
 * stability rule, R3 (the ≥15% day-move guard with the 0.5% cross-check),
 * R5 (agreement note), R6 (stale flag).
 */
export function resolveMarket(
  candidate: MarketCandidate,
  prev: MarketEntry | undefined,
  runDate: string,
): MarketResolution {
  const notes: string[] = [];
  const { id, primary, secondary } = candidate;

  // R2: the new last date must not be older than the stored one.
  const newDate = primary.points[primary.points.length - 1]!.date;
  if (prev !== undefined && newDate < prev.asOf) {
    notes.push(`R2: series date ${newDate} older than stored ${prev.asOf} — held`);
    return { id, held: true, notes };
  }

  // Same-date stability (R5's agreement band applied ACROSS runs): a
  // re-fetch that lands on the stored date with a ≤0.5% different close is
  // "the same data" — keep the stored row. This is what keeps the write
  // gate closed between the 23:30 and 01:30 runs (identical final closes)
  // and stops the source label flapping between providers.
  const last = primary.points[primary.points.length - 1]!;
  if (prev !== undefined && newDate === prev.asOf) {
    const diff = Math.abs(pctChange(last.value, prev.close) ?? Infinity);
    if (diff <= PROVIDER_AGREEMENT_PCT) {
      notes.push(`R5: same-date re-fetch agrees within ${diff.toFixed(3)}% — stored row kept`);
      return { id, held: true, notes };
    }
    notes.push(`R5: same-date revision of ${diff.toFixed(2)}% — accepting the new close`);
  }

  // R3: a suspicious one-day move inside the series needs the second voice.
  const before = primary.points[primary.points.length - 2];
  const dayMove = before ? pctChange(last.value, before.value) : null;
  const suspicious = dayMove !== null && Math.abs(dayMove) >= MAX_DAY_MOVE_PCT;

  if (suspicious && secondary !== undefined) {
    const secondaryLast = secondary.points[secondary.points.length - 1]!;
    const agree = Math.abs(pctChange(last.value, secondaryLast.value) ?? Infinity) <= PROVIDER_AGREEMENT_PCT;
    if (!agree) {
      notes.push(
        `R3: ${dayMove!.toFixed(1)}% day move, providers disagree by ` +
          `${Math.abs(pctChange(last.value, secondaryLast.value) ?? 0).toFixed(2)}% — held`,
      );
      return { id, held: true, notes };
    }
    notes.push(`R3: ${dayMove!.toFixed(1)}% day move confirmed by both providers — accepted`);
  } else if (suspicious && prev !== undefined) {
    // No second voice available: hold the old value (spec R3's "ask the other
    // provider" failed to produce one).
    notes.push(`R3: ${dayMove!.toFixed(1)}% day move without a confirming second provider — held`);
    return { id, held: true, notes };
  } else if (suspicious) {
    notes.push(`R3: ${dayMove!.toFixed(1)}% day move on first-ever fetch (no stored row) — accepted`);
  }

  // R5: when both providers answered, note any disagreement (warning only).
  if (secondary !== undefined) {
    const secondaryLast = secondary.points[secondary.points.length - 1]!;
    const diff = Math.abs(pctChange(last.value, secondaryLast.value) ?? 0);
    if (diff > PROVIDER_AGREEMENT_PCT) {
      notes.push(`R5: providers disagree by ${diff.toFixed(2)}% — showing ${primary.source}`);
    }
  }

  return { id, entry: buildEntry(id, primary, prev, runDate), held: false, notes };
}

/* ------------------------------------------------------------------ *
 * Snapshot assembly + the section signal (§5.3)
 * ------------------------------------------------------------------ */

export interface BuildMarketsInput {
  /** Resolutions for every market that produced a candidate this run. */
  resolutions: readonly MarketResolution[];
  /** The stored snapshot (undefined on the first-ever run). */
  prev?: MarketsSnapshot;
  /** The run's UTC date, YYYY-MM-DD — R6's clock. */
  runDate: string;
  /** The run's finish time (ISO 8601 UTC) — the snapshot identity. */
  generatedAt: string;
}

/**
 * Merge resolutions into the ONE stored object: a held or failed market
 * keeps its previous row VERBATIM (R7 — the last good value with its date),
 * with only the stale flag re-evaluated against the run date. Returns
 * undefined when the run produced NO rows at all (a first run where every
 * provider failed): there is nothing honest to store — the page keeps its
 * "being prepared" state and no KV write is spent.
 */
export function buildMarketsSnapshot(input: BuildMarketsInput): MarketsSnapshot | undefined {
  const { resolutions, prev, runDate, generatedAt } = input;
  const prevById = new Map((prev?.markets ?? []).map((m) => [m.id as string, m]));

  const markets: MarketEntry[] = [];
  for (const id of MARKET_IDS) {
    const resolution = resolutions.find((r) => r.id === id);
    if (resolution?.entry !== undefined) {
      markets.push(resolution.entry);
      continue;
    }
    const stored = prevById.get(id);
    if (stored === undefined) continue; // never populated — the row is absent, never zero
    // Held/failed: keep the last good row, but re-evaluate staleness honestly.
    const staleNow = daysBetween(stored.asOf, runDate) > STALE_DAYS;
    markets.push(staleNow === stored.stale ? stored : { ...stored, stale: staleNow });
  }
  if (markets.length === 0) return undefined;

  const snapshot: MarketsSnapshot = {
    v: 1,
    generatedAt,
    markets,
    summary: summarizeMarkets(markets),
  };
  return MarketsSnapshotSchema.parse(snapshot);
}

/** The §5.3 rollup: counts, the highest matching signal row, worst group. */
export function summarizeMarkets(markets: readonly MarketEntry[]): MarketsSummary {
  const nAttention = markets.filter((m) => m.status === 'correction').length;
  const nUnusual = markets.filter((m) => m.status === 'bear').length;
  const stressed = nAttention + nUnusual;

  const usStatus = (id: MarketId): MarketStatus | undefined =>
    markets.find((m) => m.id === id && US_OVERRIDE_IDS.includes(id))?.status;

  let signal: MarketsSummary['signal'];
  if (stressed >= UNUSUAL_COUNT || usStatus('sp500') === 'bear' || usStatus('ndx') === 'bear') {
    signal = 'unusual';
  } else if (
    stressed >= ATTENTION_COUNT ||
    usStatus('sp500') === 'correction' ||
    usStatus('ndx') === 'correction'
  ) {
    signal = 'attention';
  } else {
    signal = 'normal';
  }

  const perGroup = new Map<MarketGroupId, number>();
  for (const m of markets) {
    if (m.status === 'normal') continue;
    const group = marketDefinition(m.id).group;
    perGroup.set(group, (perGroup.get(group) ?? 0) + 1);
  }
  let worstGroup: MarketGroupId | null = null;
  let worstCount = 0;
  for (const [group, count] of perGroup) {
    if (count > worstCount) {
      worstGroup = group;
      worstCount = count;
    }
  }

  return {
    count: markets.length,
    roseToday: markets.filter((m) => m.chg1d > 0).length,
    nAttention,
    nUnusual,
    signal,
    worstGroup: worstCount > 0 ? worstGroup : null,
  };
}

/* ------------------------------------------------------------------ *
 * Write-only-if-changed (§4 rule 2)
 * ------------------------------------------------------------------ */

/**
 * Stable content hash over markets + summary — deliberately EXCLUDING
 * generatedAt: a run that computes identical numbers must hash identically,
 * so weekends and holidays cost zero KV writes. djb2 over the JSON
 * serialization (the builder emits a fixed key order, so the hash is
 * reproducible across runs and stores).
 */
export function marketsContentHash(snapshot: Pick<MarketsSnapshot, 'markets' | 'summary'>): string {
  const text = JSON.stringify({ markets: snapshot.markets, summary: snapshot.summary });
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = ((h2 << 5) + h2 + c) >>> 0;
  }
  return `${h1.toString(16)}-${h2.toString(16)}`;
}

/** Semantic "did anything the UI shows change" — the write gate. */
export function marketsContentEqual(
  a: Pick<MarketsSnapshot, 'markets' | 'summary'> | undefined,
  b: Pick<MarketsSnapshot, 'markets' | 'summary'>,
): boolean {
  if (a === undefined) return false;
  return marketsContentHash(a) === marketsContentHash(b);
}
