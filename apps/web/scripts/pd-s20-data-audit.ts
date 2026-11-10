/**
 * pd-s20-data-audit.ts — the S20 §21 data audit, LIVE (Rule 5:
 * "spot-check N=20 random ids against their upstream sources; 100% match
 * or a recorded, explained difference").
 *
 * A MANUAL script, never part of the test suite (tests never hit live
 * sites — AGENTS.md rule 7; the pd-s4..pd-s18 backtest pattern). Every
 * number below comes from THIS run. Writes NOTHING (no KV, no repo
 * file). Read-only against production AND the upstream publishers.
 *
 * THE SAMPLE (the spec's N=20, drawn once and frozen for the record):
 *   seeded uniform random over the 184 registry ids —
 *   `random.Random(20261112).sample(ids, 20)` — seed 20261112, sorted:
 *
 *     au-wage-growth          (ABS WPI 12-month % change, quarterly)
 *     chokepoint-malacca      (IMF PortWatch daily transits, MA7)
 *     copper-gold             (World Bank Pink Sheet copper ÷ gold)
 *     ebp                     (Fed Board EBP file, monthly)
 *     fed-target              (FRED DFEDTARL lower bound, daily)
 *     gpr-acts                (Iacoviello GPR acts sub-index, monthly)
 *     gpr-australia           (Iacoviello GPRC_AUS, monthly)
 *     gpr-saudi               (Iacoviello GPRC_SAU, monthly)
 *     initial-jobless-claims  (FRED ICSA, weekly)
 *     michigan-sentiment      (FRED UMCSENT, monthly)
 *     platinum                (gold-api.com XPT live spot)
 *     retail-sales            (FRED RSAFS, monthly)
 *     sge-gold-withdrawals    (SGE monthly Data Highlights, tonnes)
 *     stress-stlfsi           (FRED STLFSI4, weekly)
 *     swiss-gold-flow         (BAZG gold imports 7108, monthly tonnes)
 *     treasury-auction-10y    (Treasury FiscalData bid-to-cover, 10y)
 *     us-crude-production     (EIA WCRFPUS2, weekly)
 *     us-japan-10y-gap        (FRED DGS10 − MOF jgbcme 10Y, derived)
 *     us-pce-core-yoy         (FRED PCEPILFE 12-month % change)
 *     us-spr                  (EIA WCSSTUS1, weekly)
 *
 *   11 distinct providers (fred 6 · gpr 3 · eia 2 · derived 2 · abs 1 ·
 *   portwatch 1 · frb 1 · gold-api 1 · sge 1 · bazg 1 · fiscaldata 1) —
 *   a fair provider spread for a financial-data audit (Rule 5).
 *
 * THE METHOD (never assume — Rule 5):
 *   1. Fetch the LIVE public snapshot (GET /api/insights) and read each
 *      sampled id's stored (value, asOf).
 *   2. For each id, fetch the value from ITS OWN upstream publisher —
 *      through the repo's own adapter functions (the same parsers the
 *      ingest uses; imported verbatim, never re-implemented) — from THIS
 *      machine's venue, independently of the Worker.
 *   3. Derive the id's series exactly as the ingest does (yoyPctSeries,
 *      combineSeries ratios, the 4dp gap quantization, the MA7 window).
 *   4. Compare the upstream-derived value AT THE STORED asOf against the
 *      stored value. A newer upstream point than the stored asOf is a
 *      freshness NOTE (the §21 freshness gate is the backtests' own
 *      check), never a silent mismatch.
 *
 *   The live-spot exception (platinum): the stored value is the :13
 *   hourly rung's own snapshot of a market that moves continuously; the
 *   check records the intraday move as the designed, explained
 *   difference (the §21 "recorded, explained difference" arm).
 *
 * Usage (from the repo root):
 *   pnpm --filter @currena/web exec tsx ../../apps/web/scripts/pd-s20-data-audit.ts \
 *     [--base https://currena.ir]
 */

import { InsightsSnapshotSchema } from '@currena/core';
import {
  ABS_SERIES,
  collectPortwatch,
  collectTreasuryAuctions,
  combineSeries,
  EBP_CSV_URL,
  fetchAbsSeries,
  fetchBazgGoldImports,
  fetchEbpCsv,
  fetchEiaCrudeProduction,
  fetchEiaSprLevel,
  fetchFredSeries,
  fetchGoldApiSpot,
  fetchGprExportAll,
  fetchMofJgb10y,
  fetchWorldBankMonthly,
  GOLDAPI_SYMBOLS,
  insightsFetch,
  parseSgeMonthlyReportIndex,
  parseSgeWithdrawal,
  extractPdfText,
  SGE_MONTHLY_REPORT_URL,
} from '@currena/insights/adapters';
import { yoyPctSeries, type SeriesPoint } from '@currena/insights';

const BASE = (() => {
  const i = process.argv.indexOf('--base');
  return i >= 0 ? (process.argv[i + 1] ?? 'https://currena.ir') : 'https://currena.ir';
})();

let failures = 0;
const notes: string[] = [];

function check(label: string, ok: boolean, detail: string): void {
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${detail}`);
  if (!ok) failures++;
}

/** The stored reading shape the audit compares against. */
interface Stored {
  id: string;
  value: number;
  asOf: string;
}

/** One verifier's outcome. */
interface Verdict {
  ok: boolean;
  detail: string;
  note?: string;
}

/** Compare at the stored asOf; note upstream freshness beyond it. */
function compareAtAsOf(id: string, stored: Stored, upstream: SeriesPoint[]): Verdict {
  const point = upstream.find((p) => p.date === stored.asOf);
  if (point === undefined) {
    const last = upstream.at(-1);
    return {
      ok: false,
      detail: `no upstream point at the stored asOf ${stored.asOf} (upstream spans ${upstream[0]?.date}…${last?.date}, ${upstream.length} pts)`,
      note: last !== undefined && last.date > stored.asOf ? `${id}: upstream has MOVED PAST the stored asOf (latest ${last.date}) but carries no point at ${stored.asOf} — investigate before deploy` : `${id}: upstream does not yet carry the stored asOf ${stored.asOf}`,
    };
  }
  const diff = Math.abs(point.value - stored.value);
  const ok = diff <= 1e-9 * Math.max(1, Math.abs(stored.value));
  const last = upstream.at(-1);
  const freshness = last !== undefined && last.date > stored.asOf ? ` · upstream fresher (${last.date})` : '';
  return {
    ok,
    detail: `stored ${stored.value} vs upstream ${point.value} @ ${stored.asOf}${freshness}`,
    note: last !== undefined && last.date > stored.asOf ? `${id}: upstream carries newer points past the stored asOf (latest ${last.date}) — the next scheduled rung lands them (the freshness gate owns this)` : undefined,
  };
}

async function main(): Promise<void> {
  console.log(`# PD-S20 data audit — ${new Date().toISOString()}`);
  console.log(`# base: ${BASE} · N=20 (seed 20261112, frozen sample)\n`);

  /* ---------- 1. The live stored readings ---------- */
  const res = await fetch(`${BASE}/api/insights`, { headers: { accept: 'application/json', 'user-agent': 'CurrenaDashboard/1.0 (pd-s20-data-audit)' } });
  if (!res.ok) throw new Error(`the snapshot: HTTP ${res.status}`);
  const parsed = InsightsSnapshotSchema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`the snapshot: contract violation — ${parsed.error.message.slice(0, 200)}`);
  const snapshot = parsed.data;
  const byId = new Map<string, (typeof snapshot.readings)[number]>(
    snapshot.readings.map((r) => [r.id as string, r] as const),
  );
  console.log(`## 1. The stored snapshot — generated ${snapshot.generatedAt} · ${snapshot.readings.length} readings\n`);

  const storedOf = (id: string): Stored => {
    const r = byId.get(id);
    if (r === undefined || r.value === null || r.asOf === null) throw new Error(`${id}: absent or valueless in the live snapshot (fail closed — never audited blind)`);
    return { id, value: r.value, asOf: r.asOf };
  };

  /* ---------- 2. The per-id upstream verifiers ---------- */
  console.log('## 2. The upstream cross-checks (Rule 5 — fetched from THIS venue, the repo\'s own parsers)\n');

  // 2.1 au-wage-growth — ABS WPI index → 12-month % change (yoyPctSeries)
  {
    const id = 'au-wage-growth';
    const stored = storedOf(id);
    try {
      const wageIndex = await fetchAbsSeries(ABS_SERIES.wageIndex);
      const yoy = yoyPctSeries(wageIndex);
      const v = compareAtAsOf(id, stored, yoy);
      check(id, v.ok, `${v.detail} — ${ABS_SERIES.wageIndex} (quarterly index → YoY %)`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the ABS fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.2 chokepoint-malacca — IMF PortWatch daily transits → the 7-day MA
  {
    const id = 'chokepoint-malacca';
    const stored = storedOf(id);
    try {
      const { series, reports } = await collectPortwatch();
      const malacca = series[id];
      if (malacca === undefined) throw new Error('the PortWatch collection carried no chokepoint-malacca series');
      const v = compareAtAsOf(id, stored, malacca);
      check(id, v.ok, `${v.detail} — the ArcGIS n_total MA7 (report: ${reports.at(-1)?.detail ?? '—'})`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the PortWatch fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.3 copper-gold — the World Bank Pink Sheet copper ÷ gold (monthly)
  {
    const id = 'copper-gold';
    const stored = storedOf(id);
    try {
      const wb = await fetchWorldBankMonthly();
      const ratio = combineSeries(wb.copper, wb.gold, (c, g) => c / g);
      const v = compareAtAsOf(id, stored, ratio);
      check(id, v.ok, `${v.detail} — Pink Sheet copper ÷ gold ($/mt ÷ $/toz)`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the World Bank fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.4 ebp — the Fed Board's own EBP file (monthly, % points)
  {
    const id = 'ebp';
    const stored = storedOf(id);
    try {
      const ebp = await fetchEbpCsv();
      const v = compareAtAsOf(id, stored, ebp);
      check(id, v.ok, `${v.detail} — ${EBP_CSV_URL}`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the EBP fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.5 fed-target — FRED DFEDTARL (the range's lower bound IS the series)
  {
    const id = 'fed-target';
    const stored = storedOf(id);
    try {
      const lower = await fetchFredSeries('DFEDTARL');
      const v = compareAtAsOf(id, stored, lower);
      check(id, v.ok, `${v.detail} — FRED DFEDTARL (the stored series is the lower bound; the upper rides the reading's own range block)`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the FRED fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.6–2.8 gpr-acts / gpr-australia / gpr-saudi — ONE GPR export fetch
  {
    const ids: [string, keyof Awaited<ReturnType<typeof fetchGprExportAll>>][] = [
      ['gpr-acts', 'acts'],
      ['gpr-australia', 'australia'],
      ['gpr-saudi', 'saudi'],
    ];
    let gpr: Awaited<ReturnType<typeof fetchGprExportAll>> | undefined;
    try {
      gpr = await fetchGprExportAll();
    } catch (err) {
      for (const [id] of ids) check(id, false, `the GPR export fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
    if (gpr !== undefined) {
      for (const [id, key] of ids) {
        const stored = storedOf(id);
        const series = gpr[key];
        const v = compareAtAsOf(id, stored, series);
        check(id, v.ok, `${v.detail} — the monthly GPR export's ${String(key)} column`);
        if (v.note !== undefined) notes.push(v.note);
      }
    }
  }

  // 2.9 initial-jobless-claims — FRED ICSA (weekly, level)
  {
    const id = 'initial-jobless-claims';
    const stored = storedOf(id);
    try {
      const icsa = await fetchFredSeries('ICSA');
      const v = compareAtAsOf(id, stored, icsa);
      check(id, v.ok, `${v.detail} — FRED ICSA`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the FRED fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.10 michigan-sentiment — FRED UMCSENT (monthly, level)
  {
    const id = 'michigan-sentiment';
    const stored = storedOf(id);
    try {
      const umcsent = await fetchFredSeries('UMCSENT');
      const v = compareAtAsOf(id, stored, umcsent);
      check(id, v.ok, `${v.detail} — FRED UMCSENT`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the FRED fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.11 platinum — the gold-api.com XPT live spot (the designed,
  // explained-difference arm: the market moves between rungs)
  {
    const id = 'platinum';
    const stored = storedOf(id);
    try {
      const spot = await fetchGoldApiSpot(GOLDAPI_SYMBOLS.platinum);
      const move = Math.abs(spot.price - stored.value);
      const movePct = (100 * move) / stored.value;
      // An intraday move under 2% is the market being a market; anything
      // larger is recorded for the owner's eye but still explained by the
      // spot's own continuous motion (the stored point is the :13 rung's).
      const ok = movePct < 2;
      check(
        id,
        ok,
        `stored ${stored.value} @ ${stored.asOf} vs live XPT spot ${spot.price} — the intraday move ${move.toFixed(2)} (${movePct.toFixed(2)}%) — the live-price arm's designed difference`,
      );
      if (movePct >= 0.5) notes.push(`${id}: the live spot moved ${movePct.toFixed(2)}% since the stored rung — within the designed live-price behavior; the next :13 rung re-lands it`);
    } catch (err) {
      check(id, false, `the gold-api fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.12 retail-sales — FRED RSAFS (monthly, $ millions)
  {
    const id = 'retail-sales';
    const stored = storedOf(id);
    try {
      const rsafs = await fetchFredSeries('RSAFS');
      const v = compareAtAsOf(id, stored, rsafs);
      check(id, v.ok, `${v.detail} — FRED RSAFS`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the FRED fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.13 sge-gold-withdrawals — the SGE monthly Data Highlights PDF
  {
    const id = 'sge-gold-withdrawals';
    const stored = storedOf(id);
    const wantMonth = stored.asOf.slice(0, 7); // YYYY-MM
    try {
      // The index page lists every month's PDF; fetch the STORED month's
      // own file (never only the newest — the audit reads the same month
      // the snapshot read). Through insightsFetch — the repo's own honest
      // UA + single-attempt policy (a custom UA drew a 403; the venue
      // knows the house UA).
      const indexRes = await insightsFetch(SGE_MONTHLY_REPORT_URL, {}, { timeoutMs: 30_000 });
      const indexHtml = await indexRes.text();
      const links = parseSgeMonthlyReportIndex(indexHtml);
      const link = links.find((l) => l.month === wantMonth);
      if (link === undefined) throw new Error(`the index lists no ${wantMonth} report (newest ${links.at(-1)?.month ?? '—'})`);
      const pdfRes = await insightsFetch(link.url, {}, { timeoutMs: 30_000 });
      const text = await extractPdfText(new Uint8Array(await pdfRes.arrayBuffer()));
      const reading = parseSgeWithdrawal(text, wantMonth);
      const diff = Math.abs(reading.goldTonnes - stored.value);
      check(id, diff <= 0.005, `stored ${stored.value} vs the ${wantMonth} PDF's ${reading.goldTonnes} tonnes @ ${stored.asOf}`);
    } catch (err) {
      check(id, false, `the SGE fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.14 stress-stlfsi — FRED STLFSI4 (weekly, level)
  {
    const id = 'stress-stlfsi';
    const stored = storedOf(id);
    try {
      const stlfsi = await fetchFredSeries('STLFSI4');
      const v = compareAtAsOf(id, stored, stlfsi);
      check(id, v.ok, `${v.detail} — FRED STLFSI4`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the FRED fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.15 swiss-gold-flow — BAZG gold imports (7108 rows, monthly tonnes)
  {
    const id = 'swiss-gold-flow';
    const stored = storedOf(id);
    try {
      const bazg = await fetchBazgGoldImports();
      const v = compareAtAsOf(id, stored, bazg);
      check(id, v.ok, `${v.detail} — the 7108 rows' monthly kg→tonnes sum`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the BAZG fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.16 treasury-auction-10y — FiscalData auctions_query (bid-to-cover)
  {
    const id = 'treasury-auction-10y';
    const stored = storedOf(id);
    try {
      const { series } = await collectTreasuryAuctions();
      const btc10y = series.btc10y;
      if (btc10y === undefined) throw new Error('the auctions collect carried no 10y bid-to-cover series');
      const v = compareAtAsOf(id, stored, btc10y);
      check(id, v.ok, `${v.detail} — the 10-Year family ex-TIPS bid-to-cover at the auction date`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the FiscalData fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.17 us-crude-production — EIA WCRFPUS2 (weekly, thousand bpd)
  {
    const id = 'us-crude-production';
    const stored = storedOf(id);
    try {
      const production = await fetchEiaCrudeProduction();
      const v = compareAtAsOf(id, stored, production);
      check(id, v.ok, `${v.detail} — the EIA weekly LeafHandler page`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the EIA fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.18 us-japan-10y-gap — FRED DGS10 − MOF jgbcme 10Y (inner join,
  // 4dp quantized — the ingest's own quantizedGap discipline)
  {
    const id = 'us-japan-10y-gap';
    const stored = storedOf(id);
    try {
      const [dgs10, jgb10y] = await Promise.all([fetchFredSeries('DGS10'), fetchMofJgb10y({ includeHistory: false })]);
      const f = 10_000;
      const gap = combineSeries(dgs10, jgb10y, (us, jp) => us - jp).map((p) => ({ date: p.date, value: Math.round(p.value * f) / f }));
      const v = compareAtAsOf(id, stored, gap);
      const usPoint = dgs10.find((p) => p.date === stored.asOf);
      const jpPoint = jgb10y.find((p) => p.date === stored.asOf);
      check(id, v.ok, `${v.detail} — DGS10 ${usPoint?.value} − jgbcme 10Y ${jpPoint?.value} @ ${stored.asOf} (4dp)`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the gap legs failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.19 us-pce-core-yoy — FRED PCEPILFE index → 12-month % change
  {
    const id = 'us-pce-core-yoy';
    const stored = storedOf(id);
    try {
      const pce = await fetchFredSeries('PCEPILFE');
      const yoy = yoyPctSeries(pce);
      const v = compareAtAsOf(id, stored, yoy);
      check(id, v.ok, `${v.detail} — PCEPILFE index → YoY %`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the FRED fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2.20 us-spr — EIA WCSSTUS1 (weekly, thousand barrels)
  {
    const id = 'us-spr';
    const stored = storedOf(id);
    try {
      const spr = await fetchEiaSprLevel();
      const v = compareAtAsOf(id, stored, spr);
      check(id, v.ok, `${v.detail} — the EIA weekly LeafHandler page`);
      if (v.note !== undefined) notes.push(v.note);
    } catch (err) {
      check(id, false, `the EIA fetch failed — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /* ---------- the one-screen summary ---------- */
  console.log(`\n# ${failures === 0 ? 'ALL 20 CROSS-CHECKS GREEN (100% match, or the recorded live-spot arm)' : `${failures} FAILURE(S) — RED, fix or roll back (never pass forward)`}`);
  if (notes.length > 0) {
    console.log('# notes (designed divergences + honest observations, none failing):');
    for (const n of notes) console.log(`  · ${n}`);
  }
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
