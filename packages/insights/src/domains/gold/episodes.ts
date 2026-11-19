/**
 * episodes.ts — GPE R25 / F6 (2026-11-19): the gold Episode Explorer's
 * data plane — the pure windows/returns engine + the ONE-key store +
 * the snapshot builder (docs/specs/gold-page-elevation: s8/01 R25 ·
 * s7/03 §3 the episode data model · the s15 M1 §7 S15-D4/D6 records).
 *
 * THE SPINE IS DROP-GATED: the WGC currency-averages prices workbook
 * (monthly US$/oz averages since 1978) lands as the owner's data drop
 * (`data/wgc/<date>-<file-as-published>.xlsx` — the login-walled
 * publisher, a human is the authenticator, s4/01 §5 Pattern A); the
 * `gold-episodes-run` runner parses it (the adapters/wgc-prices
 * deterministic parse, fail-closed on shape) and writes this ONE KV key
 * through the KV REST API. Until the drop lands the key stays absent
 * and the card renders the honest waiting state — NO interim spine is
 * invented (S15-D4).
 *
 * The comparison legs (S15-D6): silver + BTC from the stored insights
 * histories, S&P from the markets board's stored series resampled
 * monthly — each leg OPTIONAL, each named for what it is, every window
 * a leg's depth cannot support renders the honest not-enough-history
 * state (the hasData grammar extended to the table).
 *
 * The engine halves are PURE (the SPA-facing root barrel exports them;
 * the store halves ride the "./episodes" subpath for the Worker/runner
 * — the lbma split, AGENTS.md rule 2).
 */

import type { GoldEpisodesSnapshot, EpisodePoint, EpisodeLeg } from '@currena/core';
import { GoldEpisodesSnapshotSchema } from '@currena/core';

/* ------------------------------------------------------------------ *
 * The month arithmetic (the workbook's own monthly-average axis)
 * ------------------------------------------------------------------ */

export function monthAdd(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${String(ny).padStart(4, '0')}-${String(nm).padStart(2, '0')}`;
}

/** a − b, in months (positive when a is later). */
export function monthDiff(a: string, b: string): number {
  const ay = Number(a.slice(0, 4));
  const am = Number(a.slice(5, 7));
  const by = Number(b.slice(0, 4));
  const bm = Number(b.slice(5, 7));
  return (ay - by) * 12 + (am - bm);
}

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key)
 * ------------------------------------------------------------------ */

export const GOLD_EPISODES_KV_KEY = 'insights:gold-episodes:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldEpisodesKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldEpisodes(raw: string | null | undefined): GoldEpisodesSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldEpisodesSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-episodes-store] ${GOLD_EPISODES_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldEpisodesReader {
  getGoldEpisodes(): Promise<GoldEpisodesSnapshot | undefined>;
}

export interface GoldEpisodesStore extends GoldEpisodesReader {
  writeGoldEpisodes(snapshot: GoldEpisodesSnapshot): Promise<void>;
}

export class KvGoldEpisodesStore implements GoldEpisodesStore {
  constructor(private readonly kv: GoldEpisodesKv) {}

  async getGoldEpisodes(): Promise<GoldEpisodesSnapshot | undefined> {
    return parseStoredGoldEpisodes(await this.kv.get(GOLD_EPISODES_KV_KEY));
  }

  async writeGoldEpisodes(snapshot: GoldEpisodesSnapshot): Promise<void> {
    await this.kv.put(GOLD_EPISODES_KV_KEY, JSON.stringify(snapshot));
  }
}

/** The REST adapter (the manual runner's landing lever — the
 *  RestGoldLbmaStore twin: writes through the Cloudflare KV REST API). */
export interface RestGoldEpisodesOptions {
  apiToken: string;
  accountId: string;
  namespaceId: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class RestGoldEpisodesStore implements GoldEpisodesStore {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: RestGoldEpisodesOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private url(): string {
    return (
      `${CLOUDFLARE_API_BASE}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(GOLD_EPISODES_KV_KEY)}`
    );
  }

  async getGoldEpisodes(): Promise<GoldEpisodesSnapshot | undefined> {
    const response = await this.fetchImpl(this.url(), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`KV REST read failed: HTTP ${response.status}`);
    }
    return parseStoredGoldEpisodes(await response.text());
  }

  async writeGoldEpisodes(snapshot: GoldEpisodesSnapshot): Promise<void> {
    const response = await this.fetchImpl(this.url(), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.opts.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`KV REST write failed: HTTP ${response.status}: ${body.slice(0, 160)}`);
    }
  }
}

/** Build the snapshot over the parsed spine + legs (the wire contract
 *  validates the ascending months + the asOf cross-checks). */
export function buildGoldEpisodesSnapshot(
  spineRows: readonly EpisodePoint[],
  legs: readonly EpisodeLeg[],
  provenance: { sourceUrl: string; fileName: string },
  now: Date,
): GoldEpisodesSnapshot {
  return GoldEpisodesSnapshotSchema.parse({
    v: 1,
    asOf: spineRows[spineRows.length - 1]!.month,
    fetchedAt: now.toISOString(),
    spine: {
      rows: [...spineRows],
      sourceUrl: provenance.sourceUrl,
      fileName: provenance.fileName,
    },
    legs: [...legs],
  });
}

/* ------------------------------------------------------------------ *
 * The pure engine (the display derivations the SPA computes
 * client-side over the served snapshot — never a second arithmetic)
 * ------------------------------------------------------------------ */

/** The comparison window lengths (the s7/03 §3.3 set, in years). */
export const EPISODE_WINDOW_YEARS = [1, 5, 10, 20] as const;

/** One leg's own view over the snapshot (the spine models the gold leg). */
export interface EpisodeSeriesView {
  /** The C1 point-of-use series name. */
  seriesNamed: string;
  /** The monthly rows, ascending (the spine or a leg). */
  rows: readonly EpisodePoint[];
}

/** The gold leg (the spine) as a view. */
export function goldSeriesView(snapshot: GoldEpisodesSnapshot): EpisodeSeriesView {
  return { seriesNamed: 'Gold (troy ounce, US$, monthly averages) — World Gold Council workbook', rows: snapshot.spine.rows };
}

/** Every leg including gold (the comparison table's own row set). */
export function episodeSeriesViews(snapshot: GoldEpisodesSnapshot): EpisodeSeriesView[] {
  return [goldSeriesView(snapshot), ...snapshot.legs.map((l) => ({ seriesNamed: l.seriesNamed, rows: l.rows }))];
}

/** The value at the LAST row whose month is at or before `from` (the
 *  honest window anchor: a window is only computed when the series
 *  actually covers it — an anchored-at-or-before row makes the window
 *  at least as long as nominal, never SHORTER in disguise; null when
 *  the series starts later than the window start). */
function anchorAtOrBefore(
  rows: readonly EpisodePoint[],
  from: string,
): { month: string; value: number } | null {
  let anchor: { month: string; value: number } | null = null;
  for (const r of rows) {
    if (r.month <= from) anchor = { month: r.month, value: r.value };
    else break;
  }
  return anchor;
}

/** One window's total return over one series: (last / anchor) − 1.
 *  The anchor is the LAST row at-or-before the nominal window start
 *  (a complete monthly series carries the exact month; the anchor's
 *  own month is named at point of use, C1) — null when the series
 *  starts AFTER the window start (not enough history: never a
 *  shorter window in disguise). */
export function windowReturn(
  view: EpisodeSeriesView,
  lastMonth: string,
  years: number,
): { pct: number; fromMonth: string; toMonth: string } | null {
  const from = monthAdd(lastMonth, -years * 12);
  const anchor = anchorAtOrBefore(view.rows, from);
  if (anchor === null) return null;
  const last = view.rows[view.rows.length - 1]!;
  if (last.month <= anchor.month) return null; // degenerate: zero span
  return {
    pct: (last.value / anchor.value - 1) * 100,
    fromMonth: anchor.month,
    toMonth: last.month,
  };
}

/** The since-episode return over one series: (latest / value at the
 *  episode's end month) − 1 — null when the series starts AFTER the
 *  episode's end (the honest "series starts after this episode"). */
export function sinceReturn(
  view: EpisodeSeriesView,
  episodeEndMonth: string,
): { pct: number; fromMonth: string; toMonth: string } | null {
  // The anchor is the LAST row at-or-before the episode end (the price
  // an investor exiting at the episode's close could realize); when the
  // series starts after it, there is nothing to anchor to.
  let anchor: { month: string; value: number } | null = null;
  for (const r of view.rows) {
    if (r.month <= episodeEndMonth) anchor = { month: r.month, value: r.value };
    else break;
  }
  if (anchor === null) return null;
  const last = view.rows[view.rows.length - 1]!;
  if (last.month <= anchor.month) return null;
  return {
    pct: (last.value / anchor.value - 1) * 100,
    fromMonth: anchor.month,
    toMonth: last.month,
  };
}

/** Slice the spine into an episode's price-path window (the record's
 *  own period; a small pad on both sides so the eye sees the path
 *  entering and leaving the episode). */
export function episodePath(
  snapshot: GoldEpisodesSnapshot,
  fromMonth: string,
  toMonth: string,
  padMonths = 0,
): EpisodePoint[] {
  const lo = monthAdd(fromMonth, -padMonths);
  const hi = monthAdd(toMonth, padMonths);
  return snapshot.spine.rows.filter((r) => r.month >= lo && r.month <= hi);
}

/** The path's honest extremes (the chart's own annotations). */
export function pathExtremes(
  path: readonly EpisodePoint[],
): { min: EpisodePoint; max: EpisodePoint } | null {
  if (path.length === 0) return null;
  let min = path[0]!;
  let max = path[0]!;
  for (const p of path) {
    if (p.value < min.value) min = p;
    if (p.value > max.value) max = p;
  }
  return { min, max };
}
