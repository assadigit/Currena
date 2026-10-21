/**
 * EODHD EOD answer parsing — the pure half shared by the markets provider
 * (packages/insights/src/markets/providers.ts) and the crypto adapter
 * (adapters/eodhd.ts). Extracted 2026-10-21 so the ETH leg reuses the exact
 * same row discipline: ISO dates, positive finite closes, ascending, keep
 * the last close per date. An empty array is a rejection (the provider's
 * "no data for this ticker" answer), never an empty series.
 */

import type { SeriesPoint } from '../series';

/** ISO calendar-date shape (YYYY-MM-DD). */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse an EODHD EOD JSON array into ascending SeriesPoints. Throws loudly. */
export function parseEodhdEodRows(json: unknown, symbol: string): SeriesPoint[] {
  if (!Array.isArray(json)) {
    throw new Error(`EODHD ${symbol}: response is not a JSON array`);
  }
  if (json.length === 0) {
    throw new Error(`EODHD ${symbol}: empty answer — no data for this ticker`);
  }
  const points: SeriesPoint[] = [];
  for (const row of json) {
    if (typeof row !== 'object' || row === null) continue;
    const date = (row as { date?: unknown }).date;
    const close = (row as { close?: unknown }).close;
    if (typeof date !== 'string' || !ISO_DATE_RE.test(date)) continue;
    if (typeof close !== 'number' || !Number.isFinite(close) || close <= 0) continue;
    points.push({ date, value: close });
  }
  if (points.length === 0) {
    throw new Error(`EODHD ${symbol}: no row carried a positive close`);
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  // Keep the LAST close per date (a genuine revision wins).
  const byDate = new Map<string, SeriesPoint>();
  for (const p of points) byDate.set(p.date, p);
  return [...byDate.values()];
}
