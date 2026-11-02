/**
 * @currena/insights/markets-au/compute — the Australian markets board's
 * calculation, status and signal rules (gap-closure S5-M5.4).
 *
 * Everything here is PURE: dates and previous entries go in, a snapshot
 * comes out. The fetch orchestration lives in ./job; this module decides
 * what to TRUST once Yahoo's answer is on the table.
 *
 * The pure helpers (trendOf, yearAgoAnchor, fiveYearAgoAnchor, weeklySeries,
 * statusOf) are REUSED from ../markets/compute — none of them depend on
 * MarketId (they operate on points/numbers), so the AU board shares the
 * world board's exact derivation logic. Only the AU-specific glue is here:
 * the ASX session-finality check, the AU entry builder, the Yahoo-only
 * resolution (no second provider → no R3 cross-check), the AU summary
 * (no US override) and the write-only-if-changed content hash.
 *
 * Rules mirrored from the world board:
 *   R2  a series whose last date is older than the stored one is rejected;
 *   R3  a ≥15% one-day move WITHOUT a second voice holds the stored row
 *       (Yahoo is the AU board's only provider — no cross-check is possible;
 *       on the first-ever fetch a suspicious move is accepted with a note);
 *   R5  same-date stability: a re-fetch within 0.5% of the stored close is
 *       "the same data" — keep the stored row (keeps the write gate closed
 *       between same-day runs);
 *   R6  asOf older than STALE_DAYS calendar days marks the row stale;
 *   R7  a failed market keeps its stored row verbatim — the UI never sees
 *       a zero, blank or NaN.
 */

import type {
  AuMarketEntry,
  AuMarketGroupId,
  AuMarketId,
  AuMarketsSnapshot,
  AuMarketsSummary,
} from '@currena/core';
import { AuMarketsSnapshotSchema } from '@currena/core';
import { addDays, daysBetween, pointAtOrBefore } from '../series';
import type { AuMarketSeries } from './providers';
// The pure helpers (trendOf, yearAgoAnchor, fiveYearAgoAnchor, weeklySeries,
// statusOf) are REUSED from the world board — none depend on MarketId. They
// are imported for local use in buildAuEntry AND re-exported so the AU
// module is self-contained.
import {
  trendOf,
  yearAgoAnchor,
  fiveYearAgoAnchor,
  weeklySeries,
  statusOf,
} from '../markets/compute';
export { trendOf, yearAgoAnchor, fiveYearAgoAnchor, weeklySeries, statusOf };

import {
  ATTENTION_COUNT,
  CHG_WINDOW_DAYS,
  MAX_DAY_MOVE_PCT,
  OPEN_MAX_AGE_MIN,
  PROVIDER_AGREEMENT_PCT,
  STALE_DAYS,
  TREND_BAND_PCT,
  UNUSUAL_COUNT,
  auMarketDefinition,
  AU_MARKET_IDS,
} from './definitions';

/* ------------------------------------------------------------------ *
 * Per-market derived numbers (the world board's private helpers, cloned
 * verbatim — they are not exported from ../markets/compute)
 * ------------------------------------------------------------------ */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Percent change of the last close vs the close `target` (null when unequal bases). */
function pctChange(last: number, base: number | undefined | null): number | null {
  if (base === undefined || base === null || !Number.isFinite(base) || base <= 0) return null;
  return ((last - base) / base) * 100;
}

/* ------------------------------------------------------------------ *
 * AU session state (the ASX, shared by all 18 symbols)
 * ------------------------------------------------------------------ */

/**
 * F1 (session-finality, the world board's fix): true when the ASX session
 * for the run's own UTC day has fully closed by the run's clock. A winning
 * series whose latest close is dated TODAY (the run's UTC date) is only an
 * honest FINAL close when this returns true — before it, the point is an
 * intraday snapshot, and writing it would freeze a mid-session level as
 * the day's close. Pure: the run's clock is passed in, never read here.
 */
export function sessionClosedForAuWrite(id: AuMarketId, runTimeIso: string): boolean {
  const t = new Date(runTimeIso);
  const minuteOfDay = t.getUTCHours() * 60 + t.getUTCMinutes();
  return minuteOfDay >= auMarketDefinition(id).closeUtcMinute;
}

/**
 * The Open/Closed answer for one winning AU series (the world board's
 * marketOpenAt, AU-typed). Yahoo's 'REGULAR' is the only open phase; the
 * fallback is the quote's age (open only when ≤ OPEN_MAX_AGE_MIN minutes
 * old). Pure: the run's clock is passed in, never read here.
 */
export function marketOpenAtAu(
  series: Pick<AuMarketSeries, 'quoteMeta'>,
  runTimeIso: string,
): boolean | undefined {
  const meta = series.quoteMeta;
  if (meta === undefined) return undefined;
  if (meta.marketState !== undefined) return meta.marketState === 'REGULAR';
  if (meta.quoteTime === undefined) return undefined;
  const ageMin = (Date.parse(runTimeIso) - Date.parse(meta.quoteTime)) / 60_000;
  if (!Number.isFinite(ageMin)) return undefined;
  return ageMin >= -1 && ageMin <= OPEN_MAX_AGE_MIN;
}

/* ------------------------------------------------------------------ *
 * Entry construction
 * ------------------------------------------------------------------ */

/** Build the AU entry from a validated Yahoo series; pure derivation. */
export function buildAuEntry(
  id: AuMarketId,
  series: AuMarketSeries,
  prev: AuMarketEntry | undefined,
  runDate: string,
  runTimeIso: string = `${runDate}T00:00:00Z`,
): AuMarketEntry {
  const points = series.points;
  const last = points[points.length - 1]!;
  const prevPoint = points.length >= 2 ? points[points.length - 2] : undefined;

  const chg1d = pctChange(last.value, prevPoint?.value);
  if (chg1d === null) throw new Error(`[markets-au] ${id}: series too short for chg1d`);

  const windowAgo = pointAtOrBefore(points, addDays(last.date, -CHG_WINDOW_DAYS));
  const chg3m = pctChange(last.value, windowAgo?.value);
  if (chg3m === null) throw new Error(`[markets-au] ${id}: no close on/before three months back for chg3m`);

  const weekAgo = pointAtOrBefore(points, addDays(last.date, -7));
  const chg1w = pctChange(last.value, weekAgo?.value);

  const monthAgo = pointAtOrBefore(points, addDays(last.date, -30));
  const chg1m = pctChange(last.value, monthAgo?.value);

  const chg1y = pctChange(last.value, yearAgoAnchor(points)?.value);
  const chg5y = pctChange(last.value, fiveYearAgoAnchor(points)?.value);

  const windowStart = addDays(last.date, -365);
  const window = points.filter((p) => p.date >= windowStart);
  let high = -Infinity;
  let low = Infinity;
  for (const p of window) {
    if (p.value > high) high = p.value;
    if (p.value < low) low = p.value;
  }
  const fromHigh = Math.min(0, ((last.value - high) / high) * 100);

  const open = marketOpenAtAu(series, runTimeIso);

  return {
    id,
    asOf: last.date,
    close: round2(last.value),
    chg1d: round2(chg1d),
    ...(chg1w !== null ? { chg1w: round2(chg1w) } : {}),
    ...(chg1m !== null ? { chg1m: round2(chg1m) } : {}),
    chg3m: round2(chg3m),
    ...(chg1y !== null ? { chg1y: round2(chg1y) } : {}),
    ...(chg5y !== null ? { chg5y: round2(chg5y) } : {}),
    high52w: round2(high),
    low52w: round2(low),
    fromHigh: round2(Math.min(0, ((last.value - high) / high) * 100)),
    rangePos: high > low ? Math.round(((last.value - low) / (high - low)) * 1000) / 10 : 50,
    trend: trendOf(points),
    status: statusOf(fromHigh, prev?.status),
    source: series.source,
    stale: daysBetween(last.date, runDate) > STALE_DAYS,
    ...(series.quoteMeta?.quoteTime !== undefined ? { quoteTime: series.quoteMeta.quoteTime } : {}),
    ...(open !== undefined ? { open } : {}),
    weekly: weeklySeries(points),
  };
}

/* ------------------------------------------------------------------ *
 * Validation + resolution (R2, R3, R5, R6) — Yahoo-only (no second voice)
 * ------------------------------------------------------------------ */

/** What one AU market's run produced, before validation decides. */
export interface AuMarketCandidate {
  id: AuMarketId;
  primary: AuMarketSeries;
}

export interface AuMarketResolution {
  id: AuMarketId;
  entry?: AuMarketEntry;
  held: boolean;
  notes: string[];
}

/**
 * Decide one AU market's row. Yahoo is the only provider, so the R3
 * cross-check cannot run: a ≥15% one-day move is HELD against a stored row
 * (no second voice to confirm it) and ACCEPTED on the first-ever fetch
 * (no stored row to hold). R2 (newer-or-equal date) and R5 (same-date
 * ≤0.5% stability) are identical to the world board.
 */
export function resolveAuMarket(
  candidate: AuMarketCandidate,
  prev: AuMarketEntry | undefined,
  runDate: string,
  runTimeIso?: string,
): AuMarketResolution {
  const notes: string[] = [];
  const { id, primary } = candidate;

  const newDate = primary.points[primary.points.length - 1]!.date;
  if (prev !== undefined && newDate < prev.asOf) {
    notes.push(`R2: series date ${newDate} older than stored ${prev.asOf} — held`);
    return { id, held: true, notes };
  }

  if (newDate === runDate && !sessionClosedForAuWrite(id, runTimeIso ?? `${runDate}T00:00:00Z`)) {
    notes.push(
      `F1: today's close (${newDate}) is an intraday snapshot — the ASX session has not closed yet — held`,
    );
    return { id, held: true, notes };
  }

  const last = primary.points[primary.points.length - 1]!;
  if (prev !== undefined && newDate === prev.asOf) {
    const diff = Math.abs(pctChange(last.value, prev.close) ?? Infinity);
    if (diff <= PROVIDER_AGREEMENT_PCT) {
      notes.push(`R5: same-date re-fetch agrees within ${diff.toFixed(3)}% — stored row kept`);
      return { id, held: true, notes };
    }
    notes.push(`R5: same-date revision of ${diff.toFixed(2)}% — accepting the new close`);
  }

  const before = primary.points[primary.points.length - 2];
  const dayMove = before ? pctChange(last.value, before.value) : null;
  const suspicious = dayMove !== null && Math.abs(dayMove) >= MAX_DAY_MOVE_PCT;
  if (suspicious && prev !== undefined) {
    notes.push(
      `R3: ${dayMove!.toFixed(1)}% day move without a confirming second provider — held`,
    );
    return { id, held: true, notes };
  } else if (suspicious) {
    notes.push(`R3: ${dayMove!.toFixed(1)}% day move on first-ever fetch (no stored row) — accepted`);
  }

  return { id, entry: buildAuEntry(id, primary, prev, runDate, runTimeIso), held: false, notes };
}

/* ------------------------------------------------------------------ *
 * Snapshot assembly + the section signal
 * ------------------------------------------------------------------ */

export interface BuildAuMarketsInput {
  resolutions: readonly AuMarketResolution[];
  prev?: AuMarketsSnapshot;
  runDate: string;
  generatedAt: string;
}

/**
 * Merge resolutions into the ONE stored object: a held or failed AU market
 * keeps its previous row VERBATIM (R7), with only the stale flag
 * re-evaluated. Returns undefined when the run produced NO rows (a first
 * run where every fetch failed): nothing honest to store.
 */
export function buildAuMarketsSnapshot(input: BuildAuMarketsInput): AuMarketsSnapshot | undefined {
  const { resolutions, prev, runDate, generatedAt } = input;
  const prevById = new Map((prev?.markets ?? []).map((m) => [m.id as string, m]));

  const markets: AuMarketEntry[] = [];
  for (const id of AU_MARKET_IDS) {
    const resolution = resolutions.find((r) => r.id === id);
    if (resolution?.entry !== undefined) {
      markets.push(resolution.entry);
      continue;
    }
    const stored = prevById.get(id);
    if (stored === undefined) continue;
    const staleNow = daysBetween(stored.asOf, runDate) > STALE_DAYS;
    markets.push(staleNow === stored.stale ? stored : { ...stored, stale: staleNow });
  }
  if (markets.length === 0) return undefined;

  const snapshot: AuMarketsSnapshot = {
    v: 1,
    generatedAt,
    markets,
    summary: summarizeAuMarkets(markets),
  };
  return AuMarketsSnapshotSchema.parse(snapshot);
}

/**
 * Serve-time staleness re-evaluation (the world board's A-8/D-21 twin):
 * the stored `stale` flag freezes at WRITE time, so if the cron fails for
 * days the KV row keeps `stale:false` while `asOf` ages. The serve path
 * re-evaluates every row against today's UTC date. Fresh snapshots come
 * back as the SAME object; only genuinely aged rows are rebuilt.
 */
export function reStaleAuMarketsSnapshot(snapshot: AuMarketsSnapshot, todayIso: string): AuMarketsSnapshot {
  let changed = false;
  const markets = snapshot.markets.map((m) => {
    const staleNow = daysBetween(m.asOf, todayIso) > STALE_DAYS;
    if (staleNow === m.stale) return m;
    changed = true;
    return { ...m, stale: staleNow };
  });
  return changed ? { ...snapshot, markets } : snapshot;
}

/**
 * The AU rollup: counts, the descriptive signal, the worst group. NO US
 * override (the AU board is context-only per G-5; the signal is descriptive,
 * never fed to the hero verdict). The thresholds reuse the world board's
 * (ATTENTION_COUNT = 4, UNUSUAL_COUNT = 8 — tuned for a ~16–18-row board).
 */
export function summarizeAuMarkets(markets: readonly AuMarketEntry[]): AuMarketsSummary {
  const nAttention = markets.filter((m) => m.status === 'correction').length;
  const nUnusual = markets.filter((m) => m.status === 'bear').length;
  const stressed = nAttention + nUnusual;

  let signal: AuMarketsSummary['signal'];
  if (stressed >= UNUSUAL_COUNT) {
    signal = 'unusual';
  } else if (stressed >= ATTENTION_COUNT) {
    signal = 'attention';
  } else {
    signal = 'normal';
  }

  const perGroup = new Map<AuMarketGroupId, number>();
  for (const m of markets) {
    if (m.status === 'normal') continue;
    const group = auMarketDefinition(m.id).group;
    perGroup.set(group, (perGroup.get(group) ?? 0) + 1);
  }
  let worstGroup: AuMarketGroupId | null = null;
  let worstCount = 0;
  for (const [group, count] of perGroup) {
    if (count > worstCount) {
      worstGroup = group;
      worstCount = count;
    }
  }

  return {
    count: markets.length,
    roseToday: markets.filter((m) => m.chg1d > TREND_BAND_PCT).length,
    nAttention,
    nUnusual,
    signal,
    worstGroup: worstCount > 0 ? worstGroup : null,
  };
}

/* ------------------------------------------------------------------ *
 * Write-only-if-changed (§4 rule 2)
 * ------------------------------------------------------------------ */

/** Stable content hash over markets + summary — EXCLUDING generatedAt. */
export function auMarketsContentHash(snapshot: Pick<AuMarketsSnapshot, 'markets' | 'summary'>): string {
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
export function auMarketsContentEqual(
  a: Pick<AuMarketsSnapshot, 'markets' | 'summary'> | undefined,
  b: Pick<AuMarketsSnapshot, 'markets' | 'summary'>,
): boolean {
  if (a === undefined) return false;
  return auMarketsContentHash(a) === auMarketsContentHash(b);
}
