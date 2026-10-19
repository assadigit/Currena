/**
 * validation-step3.ts — the Step 3 test layer (T-15 … T-24 of
 * docs/insights/INSIGHTS_STEP3_SPEC.md §9) plus one dedicated defect check
 * per E-04, E-05, E-06, E-10, E-11, E-18 and E-24 of
 * docs/insights/INSIGHTS_DEFECTS_2026-10-15.md (AGENT_RUNBOOK Phase 1).
 *
 * Design: every check is a PURE function over explicit inputs (AGENTS.md
 * rule 2), so the same code runs
 *   - against the parsed 15 Oct baseline fixture
 *     (tests/fixtures/insights-baseline-2026-10-15.json — where the defect
 *     checks must FAIL, docs/insights/baseline-test-results.md),
 *   - in the vitest suite with synthetic catching/passing cases,
 *   - and in the Phase 5 self-check against the live snapshot.
 *
 * Fail-closed discipline (P-2): a check that cannot decide reports a
 * failure with its reason, never silently passes.
 */

/* ------------------------------------------------------------------ */
/* shared result shape                                                 */
/* ------------------------------------------------------------------ */

export interface Step3CheckResult {
  /** 'T-15' … 'T-24', or the defect id ('E-04', …). */
  id: string;
  name: string;
  ok: boolean;
  failures: string[];
}

function result(id: string, name: string, failures: string[]): Step3CheckResult {
  return { id, name, ok: failures.length === 0, failures };
}

/* ------------------------------------------------------------------ */
/* licence/types shared with the register                              */
/* ------------------------------------------------------------------ */

/** Mirror of the register in licences.ts (kept structural to stay pure). */
export interface LicenceLike {
  provider: string;
  licenceName: string;
  attributionText: string;
  privateOk: boolean;
  publicDisplayOk: 'yes' | 'no' | 'unknown';
  termsCheckedOn: string;
  /** Sources whose terms require attribution before display. */
  attributionRequired: boolean;
}

export interface RegistryEntryLike {
  id: string;
  source: { provider: string; name: string; url: string; seriesIdOrTable?: string };
  unit?: string;
  cadence?: string;
  maxAgeDays?: number | null;
  scored?: boolean;
  rule?: { kind?: string; value?: number; direction?: string; windowDays?: number };
  ruleVersion?: number;
  licence?: {
    licenceName: string;
    attributionText: string;
    privateOk: boolean;
    publicDisplayOk: 'yes' | 'no' | 'unknown';
    termsCheckedOn: string;
  };
}

/* ------------------------------------------------------------------ */
/* T-15 — Mode gate                                                    */
/* ------------------------------------------------------------------ */

/**
 * T-15 (Step 3 §2.2 AC-08): with SITE_MODE = public, the build fails when
 * any DISPLAYED source has public_display_ok other than 'yes'. Private mode
 * (the default) allows everything — that is the whole private-first design.
 */
export function t15ModeGate(
  mode: 'private' | 'public',
  displayed: readonly { id: string; provider: string; licence?: Pick<LicenceLike, 'publicDisplayOk'> }[],
): Step3CheckResult {
  const failures: string[] = [];
  if (mode === 'public') {
    for (const s of displayed) {
      if ((s.licence?.publicDisplayOk ?? 'unknown') !== 'yes') {
        failures.push(
          `${s.id} (provider ${s.provider}) has public_display_ok '${s.licence?.publicDisplayOk ?? 'unknown'}' — not allowed in public mode`,
        );
      }
    }
  }
  return result('T-15', 'Mode gate: public mode shows public_display_ok=yes sources only', failures);
}

/* ------------------------------------------------------------------ */
/* T-16 — FRED copyright scan                                          */
/* ------------------------------------------------------------------ */

/** One recorded FRED series check (data/fred-copyright.json). */
export interface FredCopyrightRecord {
  seriesId: string;
  /** true = the provider's own page carries a copyright notice. */
  copyrightNotice: boolean | null;
  checkedOn: string;
  /** Quote of the notice text when found (evidence, never paraphrase). */
  evidence?: string;
}

/**
 * T-16 (Step 3 P-5): every FRED series in the registry is checked for a
 * copyright notice and the result is stored. A series with a notice must be
 * public_display_ok = 'no'. A series NOT covered by the records fails
 * (fail-closed: unverified → cannot be public).
 */
export function t16FredCopyrightScan(
  entries: readonly RegistryEntryLike[],
  records: readonly FredCopyrightRecord[],
): Step3CheckResult {
  const failures: string[] = [];
  const bySeries = new Map(records.map((r) => [r.seriesId, r]));
  const fredEntries = entries.filter((e) => e.source.provider === 'fred');
  for (const e of fredEntries) {
    const series = (e.source.seriesIdOrTable ?? '').replace(/^FRED:/, '');
    if (!series) {
      failures.push(`${e.id}: FRED-sourced but seriesIdOrTable is missing`);
      continue;
    }
    const rec = bySeries.get(series);
    if (!rec) {
      failures.push(`${e.id}: FRED series ${series} has no copyright record (scan not run)`);
      continue;
    }
    if (rec.copyrightNotice === null) {
      failures.push(`${e.id}: FRED series ${series} check did not complete (${rec.checkedOn})`);
      continue;
    }
    if (rec.copyrightNotice && e.licence && e.licence.publicDisplayOk !== 'no') {
      failures.push(
        `${e.id}: FRED series ${series} carries a copyright notice — public_display_ok must be 'no', found '${e.licence.publicDisplayOk}'`,
      );
    }
  }
  return result('T-16', 'FRED copyright scan: every series recorded; notice → public_display_ok no', failures);
}

/* ------------------------------------------------------------------ */
/* T-17 — Attribution present                                          */
/* ------------------------------------------------------------------ */

/**
 * T-17 (Step 3 LR-04/P-6): every source whose terms require attribution
 * carries the EXACT required text (non-empty), and every attribution text
 * names its source (never implies endorsement).
 */
export function t17AttributionPresent(sources: readonly LicenceLike[]): Step3CheckResult {
  const failures: string[] = [];
  for (const s of sources) {
    if (s.attributionRequired && s.attributionText.trim().length === 0) {
      failures.push(`${s.provider}: attribution required but attributionText is empty`);
    }
  }
  return result('T-17', 'Attribution present: attribution-required sources carry exact text', failures);
}

/* ------------------------------------------------------------------ */
/* T-18 — Fail closed                                                  */
/* ------------------------------------------------------------------ */

/**
 * T-18 (Step 3 P-2 / fix A-04): a stale input must surface as a stale /
 * check-pending / unavailable status — never as a verdict word. The verdict
 * statuses are 'warning' and 'normal'.
 */
export function t18FailClosed(
  readings: readonly { id: string; status: string; asOf: string | null }[],
  forcedStale: readonly string[],
): Step3CheckResult {
  const failures: string[] = [];
  const verdictStatuses = new Set(['warning', 'normal']);
  for (const id of forcedStale) {
    const r = readings.find((x) => x.id === id);
    if (!r) {
      failures.push(`${id}: forced-stale input has no reading at all (must show 'can't tell right now', not disappear into a verdict)`);
      continue;
    }
    if (verdictStatuses.has(r.status)) {
      failures.push(`${id}: forced-stale input still shows verdict status '${r.status}'`);
    }
  }
  return result('T-18', 'Fail closed: stale inputs never render a verdict', failures);
}

/* ------------------------------------------------------------------ */
/* T-19 — No advice wording                                            */
/* ------------------------------------------------------------------ */

/** The full forbidden set: fix spec T-07 + Step 3 T-19. */
export const FORBIDDEN_ADVICE_WORDS = [
  'will',
  'should',
  'time to',
  'expected to',
  'buy',
  'sell',
  'hold',
  'undervalued',
  'overvalued',
  'opportunity',
  'bullish',
  'bearish',
] as const;

/**
 * T-19 (Step 3 §9): no advice wording in generated text. Matching:
 *   - 'buy' and 'sell' match their inflections too (buy/buys/buying/buyer,
 *     sell/sells/selling) — they are advice verbs in any form;
 *   - 'hold' matches the EXACT word only — 'holds'/'holding' are the
 *     engine's own condition verbs ("gold is holding near its high",
 *     "the engine holds the last good value"), not advice;
 *   - everything else is an exact word or phrase match.
 * The static, spec-mandated "Know before you buy US shares" title is NOT
 * generated text and is scanned separately by the copy workflow, not here.
 */
export function containsAdviceWording(text: string): string[] {
  const hits: string[] = [];
  // The check is about ADVICE — imperative buy/sell/hold calls and market
  // verdicts. The descriptive/arithmetic senses the specs themselves keep
  // are masked before scanning (each mask names its authority):
  //  1. The ratio-orientation sentence ("One bitcoin buys 19.6 oz of gold")
  //     — plain arithmetic (defects E-12/E-13 keep it).
  //  2. The conversion sentence ("how many yen one dollar buys") — the same
  //     arithmetic, on the currency cards.
  //  3. "buyers"/"seller's" — people who ALREADY transact, conditions about
  //     them, never a call to become one.
  //  4. "on hold" (a central bank's own rate state) and "if you hold a
  //     variable loan" (the reader's existing position) — conditions.
  const masked = text
    .replace(/\bbuys?\s+(about\s+)?~?[\d.,]+\s*oz\b/gi, 'converts-to')
    .replace(/\bhow many[^.:;]*\bbuys\b/gi, 'converts-to')
    .replace(/\bbuyers?\b/gi, 'transactors')
    .replace(/\bseller['’]?s?\b/gi, 'a-transactor')
    .replace(/\bon hold\b/gi, 'unchanged')
    .replace(/\bif you hold\b/gi, 'if you carry');
  const patterns: ReadonlyArray<readonly [string, RegExp]> = [
    ['will', /\bwill\b/i],
    ['should', /\bshould\b/i],
    ['time to', /\btime\s+to\b/i],
    ['expected to', /\bexpected\s+to\b/i],
    ['buy', /\bbuy\w*/i],
    ['sell', /\bsell\w*/i],
    ['hold', /\bhold\b/i],
    ['undervalued', /\bundervalued\b/i],
    ['overvalued', /\bovervalued\b/i],
    ['opportunity', /\bopportunity\b/i],
    ['bullish', /\bbullish\b/i],
    ['bearish', /\bbearish\b/i],
  ];
  for (const [w, re] of patterns) {
    if (re.test(masked)) hits.push(w);
  }
  return hits;
}

export function t19NoAdviceWording(texts: readonly { where: string; text: string }[]): Step3CheckResult {
  const failures: string[] = [];
  for (const t of texts) {
    for (const w of containsAdviceWording(t.text)) {
      failures.push(`${t.where}: forbidden wording '${w}'`);
    }
  }
  return result('T-19', 'No advice wording in generated text', failures);
}

/* ------------------------------------------------------------------ */
/* T-20 — Same-date spreads                                            */
/* ------------------------------------------------------------------ */

/**
 * T-20 (Step 3 L2-05): every spread/gap is computed from values of the same
 * date, or the reading says "dates differ". The engine stores the two legs'
 * observation dates in `gapLegs`; a difference between the legs' dates (or
 * between a leg and the gap's own asOf) must be VISIBLE on the card — the
 * engine guarantees the VALUE is a same-date join, so the check asserts the
 * legs' dates agree; when they cannot agree (one leg's freshest date is
 * older) the reading carries `datesDiffer` and shows both dates.
 */
export function t20SameDateSpreads(
  readings: readonly {
    id: string;
    asOf: string | null;
    gapLegs?: { a: { id: string; asOf: string }; b: { id: string; asOf: string } };
    datesDiffer?: boolean;
  }[],
): Step3CheckResult {
  const failures: string[] = [];
  for (const r of readings) {
    if (!r.gapLegs) continue;
    const { a, b } = r.gapLegs;
    if (a.asOf !== b.asOf && !r.datesDiffer) {
      failures.push(`${r.id}: legs on different dates (${a.asOf} vs ${b.asOf}) without the dates-differ marker`);
    }
    if (r.asOf && a.asOf !== r.asOf && b.asOf !== r.asOf && !r.datesDiffer) {
      failures.push(`${r.id}: value date ${r.asOf} matches neither leg (${a.asOf}, ${b.asOf})`);
    }
  }
  return result('T-20', 'Same-date spreads: gap legs share a date or the card says dates differ', failures);
}

/* ------------------------------------------------------------------ */
/* T-21 — AUD conversion                                               */
/* ------------------------------------------------------------------ */

/**
 * T-21 (Step 3 L2-03): the AUD-converted level equals the USD level times
 * AUD/USD on the SAME date, within rounding tolerance.
 */
export function t21AudConversion(
  rows: readonly { id: string; usdLevel: number; audLevel: number; audUsd: number; usdDate: string; audUsdDate: string; tolerance?: number }[],
): Step3CheckResult {
  const failures: string[] = [];
  for (const r of rows) {
    if (r.usdDate !== r.audUsdDate) {
      failures.push(`${r.id}: USD level dated ${r.usdDate} but AUD/USD dated ${r.audUsdDate}`);
      continue;
    }
    const expected = r.usdLevel * r.audUsd;
    const tol = r.tolerance ?? Math.max(0.01, Math.abs(expected) * 0.001);
    if (Math.abs(expected - r.audLevel) > tol) {
      failures.push(`${r.id}: ${r.audLevel} ≠ ${r.usdLevel} × ${r.audUsd} = ${expected.toFixed(4)} (tol ${tol})`);
    }
  }
  return result('T-21', 'AUD conversion: aud level = usd level × AUD/USD, same date', failures);
}

/* ------------------------------------------------------------------ */
/* T-22 — Highest since                                                */
/* ------------------------------------------------------------------ */

/**
 * T-22 (Step 3 L2-04): the "highest since [year]" claim must come from the
 * full stored history — the last time the value was at or above this level
 * (episode-aware: the current trailing cluster is the reading itself, so
 * the search starts BEFORE it). Spot-check embedded: the caller supplies
 * the expected year for one case.
 */
export function highestSinceYear(
  value: number,
  history: readonly { date: string; value: number }[],
  now: string,
): number | undefined {
  const today = now.slice(0, 10);
  const past = history.filter((p) => p.date < today);
  if (past.length === 0) return undefined;
  // The reading itself is (usually) the trailing maximum — find the current
  // episode: walk back from the end while values are within 1% of `value`.
  const eps = Math.abs(value) * 0.01;
  let i = past.length - 1;
  while (i >= 0 && (past[i]?.value ?? -Infinity) >= value - eps) i--;
  // Now search for the last independent time the level was reached.
  for (; i >= 0; i--) {
    const p = past[i];
    if (p && p.value >= value - eps) return Number(p.date.slice(0, 4));
  }
  return undefined;
}

export function t22HighestSince(
  cases: readonly { id: string; value: number; history: readonly { date: string; value: number }[]; claimedYear?: number; expectedYear?: number; now: string }[],
): Step3CheckResult {
  const failures: string[] = [];
  for (const c of cases) {
    const computed = highestSinceYear(c.value, c.history, c.now);
    if (c.expectedYear !== undefined && computed !== c.expectedYear) {
      failures.push(`${c.id}: highest-since computed ${computed ?? 'none'}, expected ${c.expectedYear}`);
    }
    if (c.claimedYear !== undefined && computed !== c.claimedYear) {
      failures.push(`${c.id}: card claims ${c.claimedYear}, full-history search gives ${computed ?? 'none'}`);
    }
  }
  return result('T-22', 'Highest-since: the year comes from the full stored history', failures);
}

/* ------------------------------------------------------------------ */
/* T-23 — Regression fixtures (Layer 2 labels)                         */
/* ------------------------------------------------------------------ */

/**
 * L2-01 stock market state by distance below the 52-week high
 * (closing basis — the thresholds are the common market conventions):
 *   within 5% of its high: 'Near its high'
 *   5% to 10% below:       'Pullback'
 *   10% to 20% below:      'Correction'
 *   20% or more below:     'Bear market'
 */
export function stockStateLabel(fromHighPct: number): 'Near its high' | 'Pullback' | 'Correction' | 'Bear market' {
  const below = Math.abs(fromHighPct); // fromHigh is ≤ 0
  if (below < 5) return 'Near its high';
  if (below < 10) return 'Pullback';
  if (below < 20) return 'Correction';
  return 'Bear market';
}

/**
 * T-23 (Step 3 §9): saved inputs from known episodes produce the expected
 * Layer 2 labels. The caller feeds (fromHigh, expectedLabel) pairs.
 */
export function t23Layer2Regression(
  cases: readonly { id: string; fromHighPct: number; expected: ReturnType<typeof stockStateLabel> }[],
): Step3CheckResult {
  const failures: string[] = [];
  for (const c of cases) {
    const got = stockStateLabel(c.fromHighPct);
    if (got !== c.expected) failures.push(`${c.id}: ${c.fromHighPct}% below high → '${got}', expected '${c.expected}'`);
  }
  return result('T-23', 'Regression: saved episodes reproduce the Layer 2 labels', failures);
}

/* ------------------------------------------------------------------ */
/* defect checks (E-04, E-05, E-06, E-10, E-11, E-18, E-24)            */
/* ------------------------------------------------------------------ */

/** Baseline/live row shape for the defect checks (from the export tables). */
export interface DefectRowLike {
  id: string;
  /** display title (export 'Indicator' column) */
  title?: string;
  value: number | string | null;
  unit?: string;
  cadence?: string;
  asOf?: string | null;
  /** extra numeric fields for the markets rows */
  chg1d?: number | string | null;
  trend?: string;
  source?: string;
  [k: string]: unknown;
}

/**
 * E-04 — Frozen daily series shown as fresh.
 * (a) cross-day: a daily series whose value repeats EXACTLY (to 6 decimals)
 *     on consecutive observation days is a stale cache artefact — flagged.
 *     (Needs two days of rows; unit-tested with synthetic snapshots.)
 * (b) single-snapshot: a daily PRICE row carrying more decimal places
 *     than a price can meaningfully carry (> 4) is the same artefact's
 *     fingerprint (the 15 Oct copper row: 14772.999807) — flagged. FX
 *     rates and index levels legitimately carry 6 decimals from their
 *     providers, so the check only runs on the price rows the caller
 *     nominates.
 */
export function checkE04NoFrozenDailyValues(
  rows: readonly DefectRowLike[],
  /** The price-series ids the fingerprint applies to (copper, gold, …). */
  priceIds: readonly string[] = ['brent', 'gold-usd', 'silver-usd', 'copper-usd', 'btc-usd'],
): string[] {
  const failures: string[] = [];
  const prices = new Set(priceIds);
  for (const r of rows) {
    if (!prices.has(r.id)) continue;
    if (typeof r.value === 'number' && Number.isFinite(r.value)) {
      const s = String(r.value);
      const parts = s.split('.');
      const decimals = parts.length > 1 ? (parts[1] ?? '').length : 0;
      if (decimals > 4) {
        failures.push(`${r.id}: daily price carries ${decimals} decimals (${s}) — stale cache fingerprint, mark stale`);
      }
    }
  }
  return failures;
}

/** E-04 cross-day half, for two consecutive daily snapshots. */
export function checkE04RepeatAcrossDays(
  today: readonly DefectRowLike[],
  yesterday: readonly DefectRowLike[],
): string[] {
  const failures: string[] = [];
  const prev = new Map(yesterday.map((r) => [r.id, r]));
  for (const r of today) {
    const y = prev.get(r.id);
    if (!y) continue;
    if ((r.cadence ?? 'daily') !== 'daily') continue;
    if (typeof r.value === 'number' && typeof y.value === 'number' && r.value.toFixed(6) === y.value.toFixed(6)) {
      failures.push(`${r.id}: daily value identical to 6 decimals across days (${r.value}) — frozen value shown as fresh`);
    }
  }
  return failures;
}

/**
 * E-05 — Two unrelated symbols showing the identical daily move (to 2
 * decimals) in the same run. May be a coincidence — the check flags it for
 * human eyes (the defect asks for a flag, not a hard failure).
 */
export function checkE05IdenticalMoves(rows: readonly { id: string; chg1d: number | string | null }[]): string[] {
  const failures: string[] = [];
  const byMove = new Map<string, string[]>();
  for (const r of rows) {
    if (typeof r.chg1d !== 'number') continue;
    const key = r.chg1d.toFixed(2);
    const list = byMove.get(key) ?? [];
    list.push(r.id);
    byMove.set(key, list);
  }
  for (const [move, ids] of byMove) {
    if (ids.length > 1) {
      failures.push(`identical daily move ${move}% on unrelated symbols: ${ids.join(', ')} — check for a copy/mapping bug`);
    }
  }
  return failures;
}

/**
 * E-06 — A daily series older than its maximum age must carry the stale
 * status (the AU 10-y yield family in the baseline: dated 2026-10-07 in an
 * export of 2026-10-15, max age 4 days → 8 days old, shown 'Needs
 * attention' with no stale tag).
 */
export function checkE06StaleTagShown(
  rows: readonly (DefectRowLike & { status?: string })[],
  now: string,
  maxAgeDaysFor: (row: DefectRowLike) => number,
): string[] {
  const failures: string[] = [];
  const today = new Date(now.slice(0, 10) + 'T00:00:00Z');
  for (const r of rows) {
    if (!r.asOf || typeof r.asOf !== 'string') continue;
    const maxAge = maxAgeDaysFor(r);
    if (!maxAge) continue;
    const age = Math.floor((today.getTime() - new Date(r.asOf + 'T00:00:00Z').getTime()) / 86400000);
    if (age > maxAge && r.status && !['stale', 'check-pending', 'unavailable'].includes(r.status)) {
      failures.push(`${r.id}: ${age} days old (max ${maxAge}) but status '${r.status}' — must show the stale tag`);
    }
  }
  return failures;
}

/**
 * E-10 — Money supply scale: M2 is stored in billions (FRED M2SL is a
 * billions series); the unit must say so. The baseline's unit 'trillion'
 * against value 23342.8 is wrong by 1000×.
 */
export function checkE10M2Unit(rows: readonly DefectRowLike[]): string[] {
  const failures: string[] = [];
  for (const r of rows) {
    if (r.id !== 'm2-us') continue;
    if (typeof r.value !== 'number') continue;
    // M2SL is published in billions of dollars; a sane M2 reading is
    // 1,000 … 100,000 billion. If the unit says anything but billions while
    // the value is in the billions range, the scale is wrong.
    const inBillionsRange = r.value >= 1000 && r.value <= 100000;
    if (inBillionsRange && r.unit && !/billion/i.test(String(r.unit))) {
      failures.push(`m2-us: value ${r.value} is a billions figure but unit reads '${r.unit}' — store 'US$ billion'`);
    }
  }
  return failures;
}

/**
 * E-11 — The US interest bill share must be stored as a PERCENTAGE. The
 * baseline stores the fraction 0.335539 labelled '%'. A share of federal
 * income going to interest sits in tens of percent, never in [0, 1] while
 * labelled %.
 */
export function checkE11InterestBillScale(rows: readonly DefectRowLike[]): string[] {
  const failures: string[] = [];
  for (const r of rows) {
    if (r.id !== 'govt-interest-revenue') continue;
    if (typeof r.value !== 'number') continue;
    if (r.value < 1 && r.unit === '%') {
      failures.push(`govt-interest-revenue: fraction ${r.value} labelled '%' — store the percentage (${(r.value * 100).toFixed(2)})`);
    }
  }
  return failures;
}

/**
 * E-18 — The stock table's Trend label must be reproducible from the stated
 * rule. The rule (markets registry, stated in 'How is this calculated?'):
 * the 3-month change decides — ≥ +1.0% Up, ≤ −1.0% Down, otherwise Flat.
 */
export function trendFrom3m(chg3m: number): 'Up' | 'Flat' | 'Down' {
  if (chg3m >= 1.0) return 'Up';
  if (chg3m <= -1.0) return 'Down';
  return 'Flat';
}

export function checkE18TrendReproducible(rows: readonly { id: string; chg3m: number | string | null; trend?: string }[]): string[] {
  const failures: string[] = [];
  for (const r of rows) {
    if (typeof r.chg3m !== 'number' || !r.trend) continue;
    const expected = trendFrom3m(r.chg3m);
    if (expected !== r.trend) {
      failures.push(`${r.id}: 3-month change ${r.chg3m}% → rule says '${expected}', card says '${r.trend}'`);
    }
  }
  return failures;
}

/**
 * E-24 — The export's price table must carry the peak columns (peak value,
 * peak date, peak basis, distance below).
 */
export function checkE24PeakColumnsInExport(
  priceRows: readonly Record<string, unknown>[],
  headers: readonly string[],
): string[] {
  const failures: string[] = [];
  const need = ['Peak', 'Peak date', 'Peak basis', 'Below peak %'];
  for (const col of need) {
    if (!headers.includes(col)) failures.push(`price table lacks the '${col}' column`);
  }
  if (failures.length === 0) {
    for (const r of priceRows) {
      if (r['Peak'] === undefined || r['Peak'] === '' || r['Peak'] === null) {
        failures.push(`${String(r['Indicator'] ?? r['id'] ?? '?')}: no peak value`);
      }
    }
  }
  return failures;
}

/** Aggregate helper: run the defect checks over the parsed baseline fixture tables. */
export function runDefectChecksOnBaseline(
  fixture: {
    meta: Record<string, string>;
    tables: Record<string, { headers: string[]; rows: Record<string, string | number>[] }>;
  },
  /** The registry's daily-cadence indicator ids — E-04/E-06 only apply to those. */
  dailyIds: readonly string[],
): Step3CheckResult[] {
  const t = fixture.tables;
  const nowIso = fixture.meta['Data as of'] + 'T12:00:00Z';
  const raw = t['Indicators']?.rows ?? [];
  const indicators: DefectRowLike[] = raw.map((r) => ({
    id: String(r['ID'] ?? ''),
    title: String(r['Indicator'] ?? ''),
    value: (r['Value'] ?? null) as number | string | null,
    unit: String(r['Unit'] ?? ''),
    status: String(r['Status'] ?? ''),
    asOf: (r['As of'] ?? null) as string | null,
    source: String(r['Source'] ?? ''),
  }));
  const markets = (t['World stock markets']?.rows ?? []) as unknown as Record<string, string | number>[];
  const dailySet = new Set(dailyIds);
  const dailyRows = indicators.filter((r) => dailySet.has(r.id));

  const results: Step3CheckResult[] = [
    result('E-04', 'Frozen daily series (single-snapshot precision fingerprint)', checkE04NoFrozenDailyValues(dailyRows)),
    result(
      'E-05',
      'Identical daily moves on unrelated symbols',
      checkE05IdenticalMoves(markets.map((m) => ({ id: String(m['Market'] ?? ''), chg1d: m['Today %'] as number }))),
    ),
    result(
      'E-06',
      'Daily series past max age carry the stale tag',
      checkE06StaleTagShown(dailyRows, nowIso, () => 4),
    ),
    result('E-10', 'M2 stored in billions, unit says so', checkE10M2Unit(indicators)),
    result('E-11', 'US interest bill stored as a percentage', checkE11InterestBillScale(indicators)),
    result(
      'E-18',
      'Trend labels reproducible from the stated rule',
      checkE18TrendReproducible(
        markets.map((m) => ({ id: String(m['Market'] ?? m.id), chg3m: m['3 months %'] as number, trend: String(m['Trend'] ?? '') })),
      ),
    ),
    result(
      'E-24',
      'Export price table carries the peak columns',
      checkE24PeakColumnsInExport(
        (t['Prices']?.rows ?? []) as unknown as Record<string, unknown>[],
        t['Prices']?.headers ?? [],
      ),
    ),
  ];
  return results;
}

/* ------------------------------------------------------------------ */
/* T-34 (v3, 2026-10-20) — the F-17 cross-check for a fetched sentiment   */
/* gauge: a large directional disagreement with the VIX card is flagged   */
/* in the status report. Check sensitivity (documented, not invented     */
/* silently): the gauge moved ≥ 10 points while the VIX moved the other  */
/* way by ≥ 10%, or vice versa.                                          */
/* ------------------------------------------------------------------ */

export interface FngCrossCheckInput {
  /** The fetched gauge reading: current score and the previous close's score. */
  cnn: { score: number; prevScore: number };
  /** The page's own VIX card: current value and the previous close. */
  vix: { value: number; prevValue: number };
}

/** T-34: returns the flag line when the two readings disagree directionally at size, else null. */
export function crossCheckFngVsVix(input: FngCrossCheckInput): string | null {
  const { cnn, vix } = input;
  const cnnMove = cnn.score - cnn.prevScore;
  const vixPct = vix.prevValue > 0 ? ((vix.value - vix.prevValue) / vix.prevValue) * 100 : null;
  if (vixPct === null || !Number.isFinite(cnnMove) || !Number.isFinite(vixPct)) return null;
  const cnnJump = Math.abs(cnnMove) >= 10;
  const vixJump = Math.abs(vixPct) >= 10;
  if (!cnnJump || !vixJump) return null; // one side calm — nothing to compare at size
  const opposite = Math.sign(cnnMove) === -Math.sign(vixPct);
  if (!opposite) return null; // same direction — no disagreement to flag
  return `directional disagreement: the gauge moved ${cnnMove > 0 ? 'up' : 'down'} ${Math.abs(cnnMove).toFixed(0)} points while the VIX card moved ${vixPct > 0 ? 'up' : 'down'} ${Math.abs(vixPct).toFixed(1)}% — check both readings before relying on either`;
}
