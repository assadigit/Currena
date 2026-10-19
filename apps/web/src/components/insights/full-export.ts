/**
 * full-export.ts — the one-file "download all data" export (owner request,
 * 2026-10-16): every data table the Insights page displays, assembled into
 * ONE document in four formats — Markdown (.md), plain text (.txt),
 * CSV (.csv) and Excel (.xlsx).
 *
 * Scope (what the page lists and displays):
 *   meta        — the page title, subtitle, generated date, prices-as-of,
 *                 the scoring ruleVersion (the About-the-data floor)
 *   verdicts    — the hero's per-region verdicts (the precomputed
 *                 snapshot.summary lines: label word + counts)
 *   prices      — the prices board rows (PRICE_ROWS) with the position band
 *                 word and the board's own context lines (gold A$ · BTC ratios)
 *   markets     — the world-markets table, worst-first (the table's order)
 *   currencies  — the world-currencies pairs in the table's group order
 *   connections — the Together cards (evaluateConnections), card order
 *   signals     — the gold/silver condition checklists (evaluateSignals)
 *   indicators  — all readings in snapshot order (the same columns the
 *                 long-standing CSV export has always used)
 *   calendar    — the upcoming key dates (locale titles, like the page)
 *   changed     — the indicators that changed state this week
 *
 * Structure: every row is stored FLAT (one 26-wide slot list); each
 * section declares which flat columns its on-page table shows. The MD /
 * TXT / CSV renderers reproduce the page's own tables per section (the
 * CSV opens as one dense block per section, UTF-8 with BOM so Excel on
 * every locale decodes the Persian text — the owner's 2026-10-18
 * finding); the XLSX gets one worksheet per section with real number
 * cells (the zero-dependency writer) and an RTL sheet view for fa.
 * Numbers are rendered as ASCII en-US text everywhere else — the same
 * machine-readable discipline as insights-csv.ts / markets-csv.ts /
 * fx-csv.ts (localized NAMES and HEADERS, ASCII digits and period
 * decimals, OWASP formula-injection guard on every free-text CSV cell,
 * CRLF + trailing CRLF for the CSV; MD/TXT use the plain-document LF
 * convention).
 *
 * Pure builders — no DOM. The caller (InsightsHeader's export handlers)
 * dynamically imports this whole module, builds the file for one format via
 * buildInsightsExportFile and hands the Blob to the shared downloadBlob —
 * so the Insights page chunk never carries any of this code.
 */

import { formatNumber } from '@currena/core';
import { csvEscapeField, csvNeutralizeFormula } from '@currena/core';
import type {
  FxSnapshot,
  IndicatorReading,
  InsightsSnapshot,
  MarketEntry,
  MarketsSnapshot,
} from '@currena/core';
import { evaluateConnections, evaluateSignals } from '@currena/insights';
import type { ConnectionReading } from '@currena/insights';
import { FX_GROUP_ORDER, FX_PAIRS } from '@currena/insights/fx/definitions';
import { TREND_BAND_PCT } from '@currena/insights/markets/definitions';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import type { XlsxSheet } from '../../lib/xlsx-writer';
import { fxTrendOf } from '../../lib/fx-presentation';
import { DISPLAY } from './config/display';
import { positionBand } from './config/bands';
import { statusWordKeyOf } from './config/labels';
import { tierOf } from './config/movers';
import { PRICE_ROWS, TOGETHER_CARD_ORDER } from './config';
import { SIGNALS_ENABLED, legPhrase } from './config/signals';
import auditJson from '../../../../../data/indicator-audit.json';

/** Defect E-23 (+v3 2026-10-20): the per-indicator licence + rule + risk facts (generated sidecar). */
interface IndicatorAuditEntry {
  id: string;
  licenceName: string;
  publicDisplayOk: string;
  privateOk: boolean;
  maxAgeDays: number | null;
  ruleVersion: number;
  rule: string;
  /** E-23 v3: the risk-register columns (level, owner_accepts, enabled, method). */
  level?: 'L0' | 'L1' | 'L2' | 'L3';
  ownerAccepts?: boolean | null;
  enabled?: boolean;
  method?: string | null;
}

const AUDIT_BY_ID = new Map<string, IndicatorAuditEntry>(
  (auditJson as unknown as { indicators: IndicatorAuditEntry[] }).indicators.map((a) => [a.id, a]),
);

export type ExportFormat = 'md' | 'txt' | 'csv' | 'xlsx';

/** ASCII-number rendering for export cells (machine-readable, en-US): period
 * decimals, NO thousands separators (a grouping comma inside a CSV field
 * would corrupt the column alignment), matching the documented discipline. */
function asciiNumber(value: number, maximumFractionDigits = 6): string {
  return formatNumber(value, 'en-US', { maximumFractionDigits, useGrouping: false });
}

function csvText(field: string): string {
  return csvEscapeField(csvNeutralizeFormula(field));
}

/** Minimal {placeholder} interpolation for the reviewed templates reused here. */
function interpolateS(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

/** Capitalize a sentence fragment for the meta list (no-op for fa script). */
function sentenceStart(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function insightsExportFilename(generatedAt: string, ext: ExportFormat): string {
  const date = generatedAt.slice(0, 10);
  return `currena-insights-full-${date}.${ext}`;
}

/* ------------------------------------------------------------------ *
 * The flat slot layout (38 slots, section first — the CSV's own order)
 * ------------------------------------------------------------------ */

const FLAT = {
  section: 0,
  id: 1,
  name: 2,
  ticker: 3,
  value: 4,
  unit: 5,
  status: 6,
  change7d: 7,
  change30d: 8,
  chg1d: 9,
  chg1m: 10,
  chg3m: 11,
  chg1y: 12,
  percentile10y: 13,
  position: 14,
  fromHigh: 15,
  trend: 16,
  close: 17,
  high52w: 18,
  low52w: 19,
  rate: 20,
  detail: 21,
  date: 22,
  asOf: 23,
  updatedAt: 24,
  source: 25,
  // Defect E-23 (2026-10-16): the audit columns.
  published: 26,
  stale: 27,
  sourceUrl: 28,
  licence: 29,
  privateOnly: 30,
  publicOk: 31,
  ruleVersion: 32,
  thresholds: 33,
  // E-23 v3 (2026-10-20): the risk-register audit columns.
  level: 34,
  ownerAccepts: 35,
  sourceEnabled: 36,
  fetchMethod: 37,
  // Defect E-24 (2026-10-16): the price table's peak columns.
  peak: 38,
  peakDate: 39,
  peakBasis: 40,
  belowPeak: 41,
} as const;

const FLAT_WIDTH = 42;

interface DocSection {
  /** Stable key (tests) — never rendered. */
  key: string;
  heading: string;
  /** The section's own table: which flat slots it shows, in page order. */
  columns: number[];
  headers: string[];
  rows: (string | number | null)[][];
  /** Free lines rendered under the heading (evidence notes, subtitles). */
  lines: string[];
  /** Fraction digits for number cells in the text renderers. */
  digits: number;
}

interface ExportDoc {
  heading: string;
  metaLines: string[];
  sections: DocSection[];
}

export interface FullExportInput {
  snapshot: InsightsSnapshot;
  copy: InsightsCopy;
  locale: 'en' | 'fa';
  /** The app-level page title (t('insights.title')). */
  title: string;
  markets: MarketsSnapshot | null;
  fx: FxSnapshot | null;
}

function blankRow(): (string | number | null)[] {
  return Array.from({ length: FLAT_WIDTH }, () => null);
}

function put(row: (string | number | null)[], slot: number, value: string | number | null): void {
  row[slot] = value;
}

function unitOf(reading: IndicatorReading, copy: InsightsCopy): string {
  const display = DISPLAY[reading.id];
  // Defensive: a reading id without a display config (TGJU-side gold rows)
  // exports with an empty unit rather than crashing the whole file.
  return display === undefined ? '' : copy.units[display.unit];
}

/**
 * Defect E-10 (2026-10-16): the export cell carries the DISPLAYED value —
 * the display scale (m2-us: billions → trillions) applied, so the value and
 * the unit word never disagree in the export (23342.8 under "trillion" was
 * the audited bug).
 */
function exportValue(reading: IndicatorReading): number | null {
  if (reading.value === null) return null;
  return reading.value * (DISPLAY[reading.id]?.scale ?? 1);
}

/**
 * Defect E-21 (2026-10-16): the export's status word is the PAGE's two-tier
 * word (tierOf) — a normal-status reading parked in the top/bottom 10% of
 * its own 10-year range reads "Unusual", never plain "Normal" (the 15 Oct
 * export's USD/JPY + AUD/JPY at the 95th percentile were the audited loss).
 */
function tierWord(r: IndicatorReading, copy: InsightsCopy): string {
  const tier = tierOf(r);
  const key =
    tier === 'needs-attention'
      ? 'warning'
      : tier === 'unusual'
        ? 'unusual'
        : tier === 'normal'
          ? 'normal'
          : tier === 'context'
            ? 'context'
            : tier === 'unavailable'
              ? 'unavailable'
              : 'stale';
  return copy.status[key];
}

/* ------------------------------ row builders ------------------------------ */

function verdictRows(input: FullExportInput): (string | number | null)[][] {
  const { snapshot, copy } = input;
  const rows: (string | number | null)[][] = [];
  const entries = [
    [copy.sections.global, snapshot.summary.global],
    [copy.sections.australia, snapshot.summary.australia],
  ] as const;
  for (const [region, line] of entries) {
    const row = blankRow();
    put(row, FLAT.name, region);
    put(row, FLAT.status, line.label === null ? copy.signals.verdictNone : copy.label[line.label]);
    put(
      row,
      FLAT.detail,
      interpolateS(copy.ui.exportVerdictCounts, {
        warning: formatNumber(line.warningCount, 'en-US', { maximumFractionDigits: 0 }),
        voting: formatNumber(line.votingCount, 'en-US', { maximumFractionDigits: 0 }),
      }),
    );
    rows.push(row);
  }
  return rows;
}

/** The prices board's own context lines (gold A$ companion, BTC ratios). */
function priceDetail(id: string, byId: Map<string, IndicatorReading>, copy: InsightsCopy): string {
  const parts: string[] = [];
  // Defect E-03 (2026-10-16): Brent/gold/silver read FUTURES quotes (the
  // EIA spot series is extended with the front-month contract; the metals'
  // history is the COMEX futures) — the detail line says so, so a futures
  // price is never mistaken for spot.
  if (id === 'brent' || id === 'gold-usd' || id === 'silver-usd') {
    parts.push(copy.ui.exportFuturesNote);
  }
  const goldAud = byId.get('gold-aud');
  if (id === 'gold-usd' && goldAud && goldAud.value !== null) {
    parts.push(`${copy.indicators['gold-aud'].name}: ${asciiNumber(goldAud.value)}`);
  }
  const gold = byId.get('gold-usd');
  const silver = byId.get('silver-usd');
  const self = byId.get(id);
  // Step 3 L2-02: the 200-day average gap rides the detail line.
  if (self?.ma200GapPct !== undefined) {
    const pct = asciiNumber(Math.abs(self.ma200GapPct), 1);
    parts.push(
      self.ma200GapPct >= 0
        ? interpolateS(copy.ui.ma200Above, { pct })
        : interpolateS(copy.ui.ma200Below, { pct }),
    );
  }
  const btc = byId.get('btc-usd');
  // Defect E-13 (2026-10-16): the bitcoin-buying sentence belongs on the
  // BITCOIN row only (the 15 Oct export repeated it on Brent/gold/silver).
  if (id === 'btc-usd' && btc?.value != null && gold?.value != null && gold.value > 0) {
    parts.push(interpolateS(copy.ui.btcBuysGold, { value: asciiNumber(btc.value / gold.value, 1) }));
  }
  if (id === 'btc-usd' && btc?.value != null && silver?.value != null && silver.value > 0) {
    parts.push(interpolateS(copy.ui.btcBuysSilver, { value: asciiNumber(btc.value / silver.value, 0) }));
  }
  return parts.join(' · ');
}

function priceRows(input: FullExportInput): (string | number | null)[][] {
  const { snapshot, copy } = input;
  const byId = new Map(snapshot.readings.map((r) => [r.id as string, r]));
  const rows: (string | number | null)[][] = [];
  for (const id of PRICE_ROWS) {
    const r = byId.get(id);
    if (r === undefined) continue;
    const band = r.percentile10y !== undefined ? positionBand(r.percentile10y) : null;
    const positionWord =
      band === null
        ? null
        : band === 'low'
          ? copy.ui.pricePositionLow
          : band === 'high'
            ? copy.ui.pricePositionHigh
            : copy.ui.pricePositionTypical;
    const row = blankRow();
    put(row, FLAT.id, r.id);
    put(row, FLAT.name, copy.indicators[r.id]?.name ?? r.id);
    put(row, FLAT.value, exportValue(r));
    put(row, FLAT.unit, unitOf(r, copy));
    put(row, FLAT.status, copy.status[r.status]);
    put(row, FLAT.change7d, r.change7d ?? null);
    put(row, FLAT.change30d, r.change30d ?? null);
    put(row, FLAT.percentile10y, r.percentile10y ?? null);
    put(row, FLAT.position, positionWord);
    // Defect E-24 (2026-10-16): the peak, its date, its basis and the
    // distance below it ride the price table (T-05's floors verify them).
    if (r.peak !== undefined) {
      put(row, FLAT.peak, r.peak.value);
      put(row, FLAT.peakDate, r.peak.date);
      put(
        row,
        FLAT.peakBasis,
        r.peak.basis === 'daily-high' ? copy.ui.peakBasisHigh : copy.ui.peakBasisClose,
      );
    }
    if (r.fromPeak10y !== undefined) put(row, FLAT.belowPeak, r.fromPeak10y);
    put(row, FLAT.detail, priceDetail(id, byId, copy));
    put(row, FLAT.asOf, r.asOf);
    rows.push(row);
  }
  return rows;
}

function marketRow(m: MarketEntry, copy: InsightsCopy): (string | number | null)[] {
  // Defect E-18 (2026-10-16): the Trend word is RECOMPUTED from the same
  // chg3m number the row shows (≥ +1% Up, ≤ −1% Down, else Flat) — the
  // stored field keeps the old basis until the markets worker next writes,
  // so the export derives it exactly like the page does.
  const trendWord =
    m.chg3m >= TREND_BAND_PCT
      ? copy.markets.trendUp
      : m.chg3m <= -TREND_BAND_PCT
        ? copy.markets.trendDown
        : copy.markets.trendFlat;
  // Defect E-22 (2026-10-16): the L2-01 stock-state words, from the
  // distance below the 52-week high (closing basis) — never "Normal".
  const statusWord = copy.markets[statusWordKeyOf(m.fromHigh)];
  const row = blankRow();
  put(row, FLAT.id, m.id);
  put(row, FLAT.name, copy.markets.entries[m.id].name);
  put(row, FLAT.status, statusWord);
  put(row, FLAT.chg1d, m.chg1d);
  put(row, FLAT.chg3m, m.chg3m);
  put(row, FLAT.fromHigh, m.fromHigh);
  put(row, FLAT.trend, trendWord);
  put(row, FLAT.close, m.close);
  put(row, FLAT.high52w, m.high52w);
  put(row, FLAT.low52w, m.low52w);
  put(row, FLAT.asOf, m.asOf);
  put(row, FLAT.source, m.source);
  return row;
}

function fxRowMap(fx: FxSnapshot, copy: InsightsCopy): (string | number | null)[][] {
  const byId = new Map(fx.pairs.map((p) => [p.id as string, p]));
  const rows: (string | number | null)[][] = [];
  for (const group of FX_GROUP_ORDER) {
    for (const def of FX_PAIRS.filter((p) => p.group === group)) {
      const entry = byId.get(def.id);
      if (entry === undefined) continue; // never-populated row: absent, never zero
      const trend = fxTrendOf(entry);
      const row = blankRow();
      put(row, FLAT.id, entry.id);
      put(row, FLAT.name, copy.fx.entries[entry.id].name);
      put(row, FLAT.chg1d, entry.chg.d1);
      put(row, FLAT.chg1m, entry.chg.m1);
      put(row, FLAT.chg3m, entry.chg.m3);
      put(row, FLAT.chg1y, entry.chg.y1);
      put(row, FLAT.trend, trend === 'up' ? copy.fx.trendUp : trend === 'down' ? copy.fx.trendDown : copy.fx.trendFlat);
      put(row, FLAT.rate, entry.rate);
      put(row, FLAT.asOf, entry.asOf);
      put(row, FLAT.source, entry.source);
      rows.push(row);
    }
  }
  return rows;
}

function connectionRowMap(readings: readonly IndicatorReading[], copy: InsightsCopy): (string | number | null)[][] {
  const connections: readonly ConnectionReading[] = evaluateConnections(readings);
  const stateRank = new Map(TOGETHER_CARD_ORDER.map((s, i) => [s, i]));
  const sorted = [...connections].sort(
    (a, b) => (stateRank.get(a.state) ?? 99) - (stateRank.get(b.state) ?? 99),
  );
  return sorted.map((c) => {
    const def = copy.together.connections[c.connection];
    const legs = c.legs
      .map((leg) => {
        // The per-connection leg-name maps are a union keyed by each
        // connection's own leg ids — index them as a plain record (the
        // lookup is guarded by the fallback anyway).
        const shortName = (def.legs as Record<string, string>)[leg.id] ?? copy.indicators[leg.id]?.name ?? leg.id;
        return legPhrase(leg, shortName, copy);
      })
      .join(' · ');
    const row = blankRow();
    put(row, FLAT.id, c.connection);
    put(row, FLAT.name, def.name);
    put(row, FLAT.status, copy.together.state[c.state]);
    put(row, FLAT.detail, `${def.relation} — ${legs}`);
    return row;
  });
}

function signalRowMap(readings: readonly IndicatorReading[], copy: InsightsCopy): (string | number | null)[][] {
  const { gold, silver } = evaluateSignals(readings);
  const rows: (string | number | null)[][] = [];
  for (const s of [gold, silver]) {
    const lean = s.lean === null ? copy.signals.verdictNone : copy.signals.lean[s.lean];
    const conditions = s.conditions
      .map((c) => {
        const def = copy.signals.conditions[c.key];
        return `${def?.name ?? c.key}: ${copy.signals.conditionStateShort[c.state]}`;
      })
      .join(' · ');
    const row = blankRow();
    put(row, FLAT.id, s.metal);
    put(row, FLAT.name, copy.signals.metals[s.metal]);
    put(row, FLAT.status, lean);
    put(
      row,
      FLAT.detail,
      `${interpolateS(copy.signals.conditionsMet, { met: String(s.metCount), total: String(s.conditions.length) })} — ${conditions}`,
    );
    rows.push(row);
  }
  return rows;
}

function readingRow(r: IndicatorReading, copy: InsightsCopy, nowDay: string): (string | number | null)[] {
  const row = blankRow();
  const audit = AUDIT_BY_ID.get(r.id);
  put(row, FLAT.id, r.id);
  put(row, FLAT.name, copy.indicators[r.id]?.name ?? r.id);
  put(row, FLAT.ticker, copy.indicators[r.id]?.ticker ?? null);
  put(row, FLAT.value, exportValue(r));
  put(row, FLAT.unit, unitOf(r, copy));
  put(row, FLAT.status, tierWord(r, copy));
  put(row, FLAT.change7d, r.change7d ?? null);
  put(row, FLAT.change30d, r.change30d ?? null);
  put(row, FLAT.percentile10y, r.percentile10y ?? null);
  put(row, FLAT.asOf, r.asOf);
  put(row, FLAT.updatedAt, r.updatedAt);
  put(row, FLAT.source, r.sourceName);
  // ---- Defect E-23 (2026-10-16): the audit columns. ----
  put(row, FLAT.published, r.releaseDate ?? null);
  const staleDays =
    r.asOf !== null
      ? Math.max(0, Math.round((Date.parse(`${nowDay}T00:00:00Z`) - Date.parse(`${r.asOf}T00:00:00Z`)) / 86_400_000))
      : null;
  const stale =
    r.status === 'stale' || r.status === 'check-pending'
      ? staleDays !== null
        ? interpolateS(copy.ui.exportStaleWithAge, { days: String(staleDays) })
        : copy.ui.exportYes
      : copy.ui.exportNo;
  put(row, FLAT.stale, stale);
  put(row, FLAT.sourceUrl, r.sourceUrl ?? null);
  put(row, FLAT.licence, audit?.licenceName ?? null);
  // Fail closed: an id without an audit entry counts as private-only.
  put(row, FLAT.privateOnly, audit === undefined ? copy.ui.exportYes : audit.publicDisplayOk === 'yes' ? copy.ui.exportNo : copy.ui.exportYes);
  put(row, FLAT.publicOk, audit?.publicDisplayOk ?? 'unknown');
  put(row, FLAT.ruleVersion, audit?.ruleVersion ?? null);
  put(row, FLAT.thresholds, audit?.rule ?? null);
  // E-23 v3 (2026-10-20): the risk-register audit columns — level,
  // owner_accepts, the kill-switch state and the method-ladder slot.
  put(row, FLAT.level, audit?.level ?? 'not recorded');
  put(row, FLAT.ownerAccepts, audit?.ownerAccepts === null || audit?.ownerAccepts === undefined ? 'n/a' : audit.ownerAccepts ? 'yes' : 'no');
  put(row, FLAT.sourceEnabled, audit?.enabled === undefined ? 'not recorded' : audit.enabled ? 'yes' : 'no (kill switch off)');
  put(row, FLAT.fetchMethod, audit?.method ?? 'not recorded');
  return row;
}

function calendarRows(input: FullExportInput): (string | number | null)[][] {
  return input.snapshot.calendar.map((e) => {
    const row = blankRow();
    put(row, FLAT.id, e.kind);
    put(row, FLAT.name, input.locale === 'fa' ? e.titleFa : e.titleEn);
    put(row, FLAT.date, e.date);
    return row;
  });
}

function changedRows(input: FullExportInput): (string | number | null)[][] {
  const { snapshot, copy } = input;
  return snapshot.changedThisWeek.map((c) => {
    const row = blankRow();
    put(row, FLAT.id, c.id);
    put(row, FLAT.name, copy.indicators[c.id]?.name ?? c.id);
    put(row, FLAT.status, `${copy.status[c.from]} → ${copy.status[c.to]}`);
    put(row, FLAT.asOf, c.asOf);
    return row;
  });
}

/* ------------------------------ the document ------------------------------ */

/** Assemble the whole document (shared by all four renderers). */
export function assembleExportDoc(input: FullExportInput): ExportDoc {
  const { snapshot, copy, title, markets, fx } = input;

  // Meta — the same floor the page header and About-the-data show.
  const metaLines: string[] = [copy.ui.subtitle];
  metaLines.push(`${copy.ui.dataAsOf.split('{date}')[0]!.trim()}: ${snapshot.generatedAt.slice(0, 10)}`);
  if (snapshot.pricesAsOf !== undefined) {
    metaLines.push(
      `${sentenceStart(copy.ui.pricesUpdated.split('{time}')[0]!.trim())}: ${snapshot.pricesAsOf.slice(0, 16).replace('T', ' ')} UTC`,
    );
  }
  if (snapshot.ruleVersion !== undefined) {
    metaLines.push(interpolateS(copy.ui.exportRuleVersion, { v: String(snapshot.ruleVersion) }));
  }

  const sections: DocSection[] = [];

  // Verdicts — the precomputed summary lines (the hero's verdict words).
  sections.push({
    key: 'verdicts',
    heading: copy.ui.heroTitle,
    columns: [FLAT.name, FLAT.status, FLAT.detail],
    headers: [copy.ui.csvColName, copy.ui.csvColStatus, copy.ui.exportDetail],
    rows: verdictRows(input),
    lines: [],
    digits: 0,
  });

  // Prices — the board's rows with their position words + context lines
  // + the peak columns (defect E-24).
  sections.push({
    key: 'prices',
    heading: copy.ui.pricesTitle,
    columns: [
      FLAT.name, FLAT.value, FLAT.unit, FLAT.change7d, FLAT.change30d, FLAT.position,
      FLAT.peak, FLAT.peakDate, FLAT.peakBasis, FLAT.belowPeak, FLAT.detail,
    ],
    headers: [
      copy.ui.csvColName,
      copy.ui.csvColValue,
      copy.ui.csvColUnit,
      copy.ui.csvColChange7d,
      copy.ui.csvColChange30d,
      copy.ui.exportPosition,
      copy.ui.exportColPeak,
      copy.ui.exportColPeakDate,
      copy.ui.exportColPeakBasis,
      copy.ui.exportColBelowPeak,
      copy.ui.exportDetail,
    ],
    rows: priceRows(input),
    lines: [],
    digits: 6,
  });

  // World stock markets — the table's worst-first order.
  if (markets !== null) {
    const rows = [...markets.markets].sort((a, b) => a.fromHigh - b.fromHigh).map((m) => marketRow(m, copy));
    sections.push({
      key: 'markets',
      heading: copy.markets.title,
      columns: [FLAT.name, FLAT.chg1d, FLAT.chg3m, FLAT.fromHigh, FLAT.trend, FLAT.status, FLAT.close, FLAT.high52w, FLAT.low52w, FLAT.asOf, FLAT.source],
      headers: [
        copy.markets.csvColMarket,
        copy.markets.csvColToday,
        copy.markets.csvCol3m,
        copy.markets.csvColFromHigh,
        copy.markets.csvColTrend,
        copy.markets.csvColStatus,
        copy.markets.csvColClose,
        copy.markets.csvColHigh52w,
        copy.markets.csvColLow52w,
        copy.markets.csvColAsOf,
        copy.markets.csvColSource,
      ],
      rows,
      lines: [],
      digits: 2,
    });
  }

  // World currencies — the table's group order.
  if (fx !== null) {
    sections.push({
      key: 'fx',
      heading: copy.fx.title,
      columns: [FLAT.name, FLAT.chg1d, FLAT.chg1m, FLAT.chg3m, FLAT.chg1y, FLAT.trend, FLAT.rate, FLAT.asOf, FLAT.source],
      headers: [
        copy.fx.csvColPair,
        copy.fx.csvColToday,
        copy.fx.csvColM1,
        copy.fx.csvColM3,
        copy.fx.csvColY1,
        copy.fx.csvColTrend,
        copy.fx.csvColRate,
        copy.fx.csvColAsOf,
        copy.fx.csvColSource,
      ],
      rows: fxRowMap(fx, copy),
      lines: [],
      digits: 2,
    });
  }

  // Together — the connection cards in the card order.
  const connRows = connectionRowMap(snapshot.readings, copy);
  if (connRows.length > 0) {
    sections.push({
      key: 'connections',
      heading: copy.together.title,
      columns: [FLAT.name, FLAT.status, FLAT.detail],
      headers: [copy.ui.csvColName, copy.ui.csvColStatus, copy.ui.exportDetail],
      rows: connRows,
      lines: [copy.together.evidenceNote],
      digits: 0,
    });
  }

  // Signals — the condition checklists (section exists only when enabled).
  if (SIGNALS_ENABLED) {
    const sigRows = signalRowMap(snapshot.readings, copy);
    if (sigRows.length > 0) {
      sections.push({
        key: 'signals',
        heading: copy.signals.title,
        columns: [FLAT.name, FLAT.status, FLAT.detail],
        headers: [copy.ui.csvColName, copy.signals.verdictTitle, copy.ui.exportDetail],
        rows: sigRows,
        lines: [copy.signals.subtitle],
        digits: 0,
      });
    }
  }

  // Indicators — every reading, snapshot order, plus the E-23 audit
  // columns (published date, stale flag with age, source URL, licence,
  // private-only / public-display verdicts, rule version + thresholds).
  sections.push({
    key: 'indicators',
    heading: copy.ui.navIndicators,
    columns: [
      FLAT.id, FLAT.name, FLAT.ticker, FLAT.value, FLAT.unit, FLAT.status,
      FLAT.change7d, FLAT.change30d, FLAT.percentile10y, FLAT.asOf, FLAT.updatedAt, FLAT.source,
      FLAT.published, FLAT.stale, FLAT.sourceUrl, FLAT.licence, FLAT.privateOnly, FLAT.publicOk,
      FLAT.ruleVersion, FLAT.thresholds,
      FLAT.level, FLAT.ownerAccepts, FLAT.sourceEnabled, FLAT.fetchMethod,
    ],
    headers: [
      copy.ui.csvColId,
      copy.ui.csvColName,
      copy.ui.csvColTicker,
      copy.ui.csvColValue,
      copy.ui.csvColUnit,
      copy.ui.csvColStatus,
      copy.ui.csvColChange7d,
      copy.ui.csvColChange30d,
      copy.ui.csvColPosition10y,
      copy.ui.csvColAsOf,
      copy.ui.csvColUpdated,
      copy.ui.csvColSource,
      copy.ui.exportColPublished,
      copy.ui.exportColStale,
      copy.ui.exportColSourceUrl,
      copy.ui.exportColLicence,
      copy.ui.exportColPrivateOnly,
      copy.ui.exportColPublicOk,
      copy.ui.exportColRuleVersion,
      copy.ui.exportColThresholds,
      copy.ui.exportColLevel,
      copy.ui.exportColOwnerAccepts,
      copy.ui.exportColSourceEnabled,
      copy.ui.exportColFetchMethod,
    ],
    rows: snapshot.readings.map((r) => readingRow(r, copy, snapshot.generatedAt.slice(0, 10))),
    lines: [],
    digits: 6,
  });

  // Upcoming key dates.
  if (snapshot.calendar.length > 0) {
    sections.push({
      key: 'calendar',
      heading: copy.ui.comingUpTitle,
      columns: [FLAT.id, FLAT.name, FLAT.date],
      headers: [copy.ui.csvColId, copy.ui.csvColName, copy.ui.exportColDate],
      rows: calendarRows(input),
      lines: [],
      digits: 0,
    });
  }

  // Changed this week.
  if (snapshot.changedThisWeek.length > 0) {
    sections.push({
      key: 'changed',
      heading: copy.ui.changedThisWeekTitle,
      columns: [FLAT.id, FLAT.name, FLAT.status, FLAT.asOf],
      headers: [copy.ui.csvColId, copy.ui.csvColName, copy.ui.csvColStatus, copy.ui.csvColAsOf],
      rows: changedRows(input),
      lines: [],
      digits: 0,
    });
  }

  return { heading: title, metaLines, sections };
}

/* ------------------------------------------------------------------ *
 * Renderer: Markdown
 * ------------------------------------------------------------------ */

function mdCell(v: string | number | null, digits: number): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'number' ? asciiNumber(v, digits) : v;
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function buildInsightsMarkdown(input: FullExportInput): string {
  const doc = assembleExportDoc(input);
  const out: string[] = [`# ${doc.heading}`, ''];
  for (const line of doc.metaLines) out.push(`- ${line}`);
  out.push('');
  for (const section of doc.sections) {
    out.push(`## ${section.heading}`, '');
    for (const line of section.lines) out.push(line, '');
    if (section.rows.length === 0) continue;
    out.push(`| ${section.headers.map((h) => mdCell(h, 0)).join(' | ')} |`);
    out.push(`| ${section.headers.map(() => '---').join(' | ')} |`);
    for (const row of section.rows) {
      out.push(`| ${section.columns.map((slot) => mdCell(row[slot] ?? null, section.digits)).join(' | ')} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * Renderer: plain text
 * ------------------------------------------------------------------ */

function txtCell(v: string | number | null, digits: number): string {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'number' ? asciiNumber(v, digits) : v;
  return s.replace(/\|/g, '/').replace(/\r?\n/g, ' ');
}

export function buildInsightsTxt(input: FullExportInput): string {
  const doc = assembleExportDoc(input);
  const out: string[] = [];
  const titleRule = '='.repeat(Math.min(64, Math.max(24, doc.heading.length)));
  out.push(titleRule, doc.heading, titleRule, '');
  for (const line of doc.metaLines) out.push(line);
  out.push('');
  for (const section of doc.sections) {
    out.push(section.heading);
    out.push('-'.repeat(Math.min(64, Math.max(24, section.heading.length))));
    for (const line of section.lines) out.push(line);
    if (section.rows.length > 0) {
      out.push(section.headers.map((h) => txtCell(h, 0)).join(' | '));
      for (const row of section.rows) {
        out.push(section.columns.map((slot) => txtCell(row[slot] ?? null, section.digits)).join(' | '));
      }
    }
    out.push('');
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * Renderer: CSV — one dense block per section (the page's own tables),
 * RFC 4180 CRLF, UTF-8 **with BOM**
 *
 * The first cut (2026-10-16) dumped one flat 26-slot table; the owner
 * reported it "incomplete / not working" in Excel: the sparse matrix
 * reads as missing columns, and without a BOM Excel on a fa-Windows
 * machine decodes the Persian text as ANSI-1256 mojibake. The CSV now
 * mirrors the MD/TXT structure the owner approved: title + meta floor,
 * then one block per section — heading line, the section's own header
 * row, its rows. The BOM makes Excel pick UTF-8 on every locale.
 * ------------------------------------------------------------------ */

export function buildInsightsFullCsv(input: FullExportInput): string {
  const doc = assembleExportDoc(input);
  const lines: string[] = [`\uFEFF${csvText(doc.heading)}`];
  for (const line of doc.metaLines) lines.push(csvText(line));
  for (const section of doc.sections) {
    if (section.rows.length === 0) continue;
    lines.push('');
    lines.push(csvText(section.heading));
    for (const line of section.lines) lines.push(csvText(line));
    lines.push(section.headers.map(csvText).join(','));
    for (const row of section.rows) {
      lines.push(
        section.columns
          .map((slot) => {
            const v = row[slot] ?? null;
            if (v === null || v === undefined) return '';
            if (typeof v === 'number') return asciiNumber(v, section.digits);
            return csvText(v);
          })
          .join(','),
      );
    }
  }
  return `${lines.join('\r\n')}\r\n`;
}

/* ------------------------------------------------------------------ *
 * Renderer: XLSX — one worksheet per section, real number cells
 * ------------------------------------------------------------------ */

function sheetName(heading: string): string {
  return heading.slice(0, 31).replace(/[\\/?*[\]:]/g, ' ').trim() || 'Sheet';
}

export function buildInsightsXlsxSheets(input: FullExportInput): XlsxSheet[] {
  const doc = assembleExportDoc(input);
  const sheets: XlsxSheet[] = [];
  sheets.push({
    name: sheetName(doc.heading),
    rows: [[doc.heading], ...doc.metaLines.map((l) => [l])],
  });
  for (const section of doc.sections) {
    if (section.rows.length === 0 && section.lines.length === 0) continue;
    const rows: (string | number | null)[][] = [];
    if (section.lines.length > 0) rows.push(...section.lines.map((l) => [l]));
    if (section.rows.length > 0) {
      rows.push(section.headers);
      rows.push(...section.rows.map((r) => section.columns.map((slot) => r[slot] ?? null)));
    }
    sheets.push({ name: sheetName(section.heading), rows });
  }
  return sheets;
}

/* ------------------------------------------------------------------ *
 * The one entry point: build the downloadable file for a format
 * ------------------------------------------------------------------ */

export interface ExportFile {
  blob: Blob;
  ext: ExportFormat;
}

export async function buildInsightsExportFile(input: FullExportInput, format: ExportFormat): Promise<ExportFile> {
  switch (format) {
    case 'md':
      return { blob: new Blob([buildInsightsMarkdown(input)], { type: 'text/markdown;charset=utf-8' }), ext: 'md' };
    case 'txt':
      return { blob: new Blob([buildInsightsTxt(input)], { type: 'text/plain;charset=utf-8' }), ext: 'txt' };
    case 'csv':
      return { blob: new Blob([buildInsightsFullCsv(input)], { type: 'text/csv;charset=utf-8' }), ext: 'csv' };
    case 'xlsx': {
      const { buildXlsxBlob } = await import('../../lib/xlsx-writer');
      return {
        blob: buildXlsxBlob(buildInsightsXlsxSheets(input), { rtl: input.locale === 'fa' }),
        ext: 'xlsx',
      };
    }
  }
}
