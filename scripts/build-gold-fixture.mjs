/**
 * build-gold-fixture.mjs — the S5 screenshot fixture (GUX-S5 M6): derives
 * the gold page-projection fixture (`visual/fixtures/gold-projection.json`)
 * from the visual harness's own snapshot.json — the SAME synthetic corpus
 * the component tests render (never a live capture; the harness rule).
 *
 * The projection follows @currena/core's PageProjectionSchema: the page's
 * own readings (every snapshot id whose home is gold + the engine's mirror
 * inputs — here: every reading the snapshot carries, the superset a real
 * projection filters by placement) with each id at most once. The absent
 * list stays EMPTY (the synthetic corpus is complete — the honest-gap
 * states are the component tests' subject, not the screenshot set's).
 *
 * Also emits gold-ohlc.json (the XAUUSD daily-bars fixture, the same
 * generator shape GoldPage.test.tsx uses — 300 bars ending 2026-11-17) so
 * the hero spark, the interactive chart, and the TA band render.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, '../apps/web/visual/fixtures');
const snap = JSON.parse(readFileSync(resolve(FIXTURES, 'snapshot.json'), 'utf8'));

const projection = {
  page: 'gold',
  generatedAt: snap.generatedAt,
  pricesAsOf: snap.pricesAsOf,
  readings: snap.readings,
  absentIds: [],
  boards: [],
};
mkdirSync(FIXTURES, { recursive: true });
writeFileSync(resolve(FIXTURES, 'gold-projection.json'), JSON.stringify(projection, null, 1) + '\n');

/* The XAUUSD daily bars — GoldPage.test.tsx's ohlcFixture(300), verbatim. */
const n = 300;
const endDate = Date.parse('2026-11-17T00:00:00Z');
const closes = [];
for (let i = 0; i < n; i++) {
  const back = n - 1 - i;
  closes.push(3792.59 - 150 * Math.sin(back / 25) - 60 * Math.sin(back / 6.5) + back * 0.15);
}
let ms = endDate;
const dates = [];
for (let i = 0; i < n; ) {
  const weekday = new Date(ms).getUTCDay();
  if (weekday !== 6 && weekday !== 0) {
    dates.push(new Date(ms).toISOString().slice(0, 10));
    i += 1;
  }
  ms -= 86_400_000;
}
dates.reverse();
const series = [];
for (let i = 0; i < n; i++) {
  const close = closes[i];
  series.push({ date: dates[i], open: close - 6, high: close + 9, low: close - 11, close });
}
const ohlc = {
  v: 1,
  asOf: dates[dates.length - 1],
  fetchedAt: '2026-11-18T00:05:00.000Z',
  series,
  sourceUrl: 'https://eodhd.com/',
};
writeFileSync(resolve(FIXTURES, 'gold-ohlc.json'), JSON.stringify(ohlc, null, 1) + '\n');

console.log(`gold-projection.json: ${projection.readings.length} readings · gold-ohlc.json: ${n} bars`);
